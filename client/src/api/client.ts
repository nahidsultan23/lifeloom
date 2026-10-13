import { t } from '../strings';
import type { Envelope, ErrorEnvelope, TokenPair } from './types';

export type ApiErrorKind = 'network' | 'timeout' | 'cancelled' | 'http';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** The device could not reach the server, so the user can simply retry. */
  get isOffline(): boolean {
    return this.kind === 'network' || this.kind === 'timeout';
  }
}

export interface ClientDeps {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  getTokens(): Promise<{ accessToken: string; refreshToken: string } | null>;
  saveTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void>;
  /** Called once when the refresh token is rejected. */
  onSessionExpired(): void;
  /** Called when a protected route answers APP_UPDATE_REQUIRED. */
  onUpdateRequired(): void;
  appHeaders(): Record<string, string>;
  timeoutMs?: number;
  retryDelayMs?: number;
}

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
  /** Set false for sign-in, refresh, and the public update check. */
  auth?: boolean;
  timeoutMs?: number;
  /** Set true for reads that have side effects, such as the data export. */
  noRetry?: boolean;
}

const DEFAULT_TIMEOUT = 20000;
const GET_ATTEMPTS = 3;

function statusMessage(status: number): string {
  if (status === 401) return t.errors.unauthenticated;
  if (status === 403) return t.errors.forbidden;
  if (status === 404) return t.errors.notFound;
  if (status === 409) return t.errors.conflict;
  if (status === 422) return t.errors.validation;
  if (status === 429) return t.errors.rateLimited;
  if (status === 503) return t.errors.unavailable;
  if (status >= 500) return t.errors.server;
  return t.errors.generic;
}

function toApiError(status: number, payload: unknown): ApiError {
  const body = payload as Partial<ErrorEnvelope> | undefined;
  const error = body && body.success === false ? body.error : undefined;
  // Server errors never show their own text: it could carry internals.
  const message =
    status >= 500 || !error?.message ? statusMessage(status) : error.message;
  return new ApiError(
    'http',
    status,
    error?.code ?? `HTTP_${status}`,
    message,
    error?.fieldErrors ?? {},
    error?.requestId,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const parts = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export function createApiClient(deps: ClientDeps) {
  const doFetch = deps.fetchImpl ?? fetch;
  let refreshing: Promise<boolean> | null = null;

  async function rawFetch(
    method: string,
    path: string,
    options: RequestOptions,
    accessToken: string | null,
  ): Promise<Response> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, options.timeoutMs ?? deps.timeoutMs ?? DEFAULT_TIMEOUT);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onAbort);
    try {
      return await doFetch(`${deps.baseUrl}${path}${buildQuery(options.query)}`, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...deps.appHeaders(),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
    } catch {
      if (options.signal?.aborted) {
        throw new ApiError('cancelled', 0, 'CANCELLED', t.errors.cancelled);
      }
      if (timedOut) throw new ApiError('timeout', 0, 'TIMEOUT', t.errors.timeout);
      throw new ApiError('network', 0, 'NETWORK', t.errors.network);
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
    }
  }

  /** Single flight: concurrent 401s share one refresh, so there is no loop. */
  function refreshOnce(): Promise<boolean> {
    if (!refreshing) {
      refreshing = (async () => {
        const tokens = await deps.getTokens();
        if (!tokens) return false;
        try {
          const response = await rawFetch(
            'POST',
            '/auth/refresh',
            { body: { refreshToken: tokens.refreshToken } },
            null,
          );
          const payload = await readJson(response);
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              deps.onSessionExpired();
            }
            return false;
          }
          const next = (payload as Envelope<TokenPair>).data;
          await deps.saveTokens({
            accessToken: next.accessToken,
            refreshToken: next.refreshToken,
          });
          return true;
        } catch {
          // Offline during refresh keeps the session. The caller sees a
          // network error and can retry later.
          return false;
        } finally {
          refreshing = null;
        }
      })();
    }
    return refreshing;
  }

  async function readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  async function once<T>(method: string, path: string, options: RequestOptions): Promise<T> {
    const useAuth = options.auth !== false;
    let token = useAuth ? ((await deps.getTokens())?.accessToken ?? null) : null;
    let response = await rawFetch(method, path, options, token);
    if (response.status === 401 && useAuth) {
      if (await refreshOnce()) {
        token = (await deps.getTokens())?.accessToken ?? null;
        response = await rawFetch(method, path, options, token);
      }
    }
    const payload = await readJson(response);
    if (!response.ok) {
      const error = toApiError(response.status, payload);
      if (error.code === 'APP_UPDATE_REQUIRED') deps.onUpdateRequired();
      throw error;
    }
    return ((payload as Envelope<T> | undefined)?.data ?? null) as T;
  }

  async function request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    // Only reads are retried. The API documents no idempotency for writes.
    const attempts = method === 'GET' && !options.noRetry ? GET_ATTEMPTS : 1;
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await once<T>(method, path, options);
      } catch (error) {
        const retryable =
          error instanceof ApiError &&
          (error.isOffline || error.status === 503 || error.status === 429);
        if (!retryable || attempt >= attempts) throw error;
        await sleep((deps.retryDelayMs ?? 400) * attempt);
      }
    }
  }

  /** Multipart upload with progress. Uploads are never auto-retried. */
  function upload<T>(
    path: string,
    form: FormData,
    handlers: { onProgress?: (fraction: number) => void; signal?: AbortSignal },
    query?: RequestOptions['query'],
  ): Promise<T> {
    const send = (accessToken: string | null) =>
      new Promise<{ status: number; payload: unknown }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${deps.baseUrl}${path}${buildQuery(query)}`);
        xhr.timeout = 120000;
        xhr.setRequestHeader('Accept', 'application/json');
        for (const [key, value] of Object.entries(deps.appHeaders())) {
          xhr.setRequestHeader(key, value);
        }
        if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            handlers.onProgress?.(event.loaded / event.total);
          }
        };
        xhr.onload = () => {
          let payload: unknown;
          try {
            payload = JSON.parse(xhr.responseText);
          } catch {
            payload = undefined;
          }
          resolve({ status: xhr.status, payload });
        };
        xhr.onerror = () => reject(new ApiError('network', 0, 'NETWORK', t.errors.network));
        xhr.ontimeout = () => reject(new ApiError('timeout', 0, 'TIMEOUT', t.errors.timeout));
        xhr.onabort = () => reject(new ApiError('cancelled', 0, 'CANCELLED', t.errors.cancelled));
        handlers.signal?.addEventListener('abort', () => xhr.abort());
        xhr.send(form);
      });

    return (async () => {
      let token = (await deps.getTokens())?.accessToken ?? null;
      let result = await send(token);
      if (result.status === 401 && (await refreshOnce())) {
        token = (await deps.getTokens())?.accessToken ?? null;
        result = await send(token);
      }
      if (result.status < 200 || result.status >= 300) {
        const error = toApiError(result.status, result.payload);
        if (error.code === 'APP_UPDATE_REQUIRED') deps.onUpdateRequired();
        throw error;
      }
      return ((result.payload as Envelope<T> | undefined)?.data ?? null) as T;
    })();
  }

  return {
    get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
    post: <T>(path: string, options?: RequestOptions) => request<T>('POST', path, options),
    patch: <T>(path: string, options?: RequestOptions) => request<T>('PATCH', path, options),
    delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
    upload,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
