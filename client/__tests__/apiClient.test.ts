import { ApiError, createApiClient, type ClientDeps } from '../src/api/client';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function setup(responses: (Response | Error)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const queue = [...responses];
  const fetchImpl = jest.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = queue.shift();
    if (!next) throw new Error('no more responses');
    if (next instanceof Error) throw next;
    return next;
  });
  let tokens: { accessToken: string; refreshToken: string } | null = {
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
  };
  const deps: ClientDeps = {
    baseUrl: 'https://api.test/api/v1',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    getTokens: async () => tokens,
    saveTokens: async (next) => {
      tokens = next;
    },
    onSessionExpired: jest.fn(),
    onUpdateRequired: jest.fn(),
    appHeaders: () => ({ 'x-app-platform': 'android', 'x-app-version': '1.2.3' }),
    retryDelayMs: 1,
  };
  return { client: createApiClient(deps), deps, calls, fetchImpl, getTokens: () => tokens };
}

const ok = (data: unknown) => jsonResponse(200, { success: true, data });
const fail = (status: number, error: Record<string, unknown>) =>
  jsonResponse(status, { success: false, error: { fieldErrors: {}, ...error } });

describe('api client', () => {
  it('unwraps the success envelope and sends auth and app headers', async () => {
    const { client, calls } = setup([ok({ hello: 'world' })]);
    await expect(client.get('/profile')).resolves.toEqual({ hello: 'world' });
    const headers = calls[0].init.headers as Record<string, string>;
    expect(calls[0].url).toBe('https://api.test/api/v1/profile');
    expect(headers.Authorization).toBe('Bearer access-1');
    expect(headers['x-app-platform']).toBe('android');
  });

  it('skips auth when asked', async () => {
    const { client, calls } = setup([ok({})]);
    await client.get('/app-updates/check', { auth: false, query: { platform: 'android', build: 1 } });
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(calls[0].url).toContain('?platform=android&build=1');
  });

  it('maps field errors from the server onto the error object', async () => {
    const { client } = setup([
      fail(422, {
        code: 'VALIDATION_ERROR',
        message: 'One or more fields are invalid',
        fieldErrors: { deadlineDate: 'must match a date', 'milestones.0.title': 'must be shorter' },
        requestId: 'req-1',
      }),
    ]);
    const error = (await client.post('/goals', { body: {} }).catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.fieldErrors['milestones.0.title']).toBe('must be shorter');
    expect(error.requestId).toBe('req-1');
  });

  it.each([403, 404, 409, 429, 503])('keeps a readable message for %s', async (status) => {
    const { client } = setup([fail(status, { code: 'X', message: 'Readable message' }), fail(status, { code: 'X', message: 'Readable message' })]);
    const error = (await client.post('/x').catch((e) => e)) as ApiError;
    expect(error.status).toBe(status);
    expect(error.message).toBeTruthy();
  });

  it('never shows server text for 500 errors', async () => {
    const { client } = setup([fail(500, { code: 'INTERNAL_ERROR', message: 'MongoServerError: duplicate key at /srv/app.js' })]);
    const error = (await client.post('/x').catch((e) => e)) as ApiError;
    expect(error.status).toBe(500);
    expect(error.message).not.toMatch(/mongo|\/srv/i);
  });

  it('refreshes once on 401 and retries the request', async () => {
    const { client, calls, getTokens, deps } = setup([
      fail(401, { code: 'UNAUTHENTICATED', message: 'x' }),
      ok({ accessToken: 'access-2', refreshToken: 'refresh-2', accessTokenExpiresIn: '15m' }),
      ok({ id: 1 }),
    ]);
    await expect(client.get('/profile')).resolves.toEqual({ id: 1 });
    expect(calls.map((c) => c.url.replace('https://api.test/api/v1', ''))).toEqual(['/profile', '/auth/refresh', '/profile']);
    expect(getTokens()?.refreshToken).toBe('refresh-2');
    expect((calls[2].init.headers as Record<string, string>).Authorization).toBe('Bearer access-2');
    expect(deps.onSessionExpired).not.toHaveBeenCalled();
  });

  it('shares one refresh between concurrent 401s', async () => {
    const { client, calls } = setup([
      fail(401, { code: 'UNAUTHENTICATED' }),
      fail(401, { code: 'UNAUTHENTICATED' }),
      ok({ accessToken: 'a2', refreshToken: 'r2', accessTokenExpiresIn: '15m' }),
      ok({ n: 1 }),
      ok({ n: 2 }),
    ]);
    const [a, b] = await Promise.all([client.get('/goals'), client.get('/letters')]);
    expect([a, b]).toEqual(expect.arrayContaining([{ n: 1 }, { n: 2 }]));
    expect(calls.filter((c) => c.url.endsWith('/auth/refresh'))).toHaveLength(1);
  });

  it('signs out when the refresh token is rejected, and does not loop', async () => {
    const { client, calls, deps } = setup([
      fail(401, { code: 'UNAUTHENTICATED' }),
      fail(401, { code: 'REFRESH_REPLAY_DETECTED', message: 'Session has been revoked' }),
    ]);
    const error = (await client.get('/profile').catch((e) => e)) as ApiError;
    expect(error.status).toBe(401);
    expect(deps.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(2);
  });

  it('keeps the session when the refresh fails because the device is offline', async () => {
    const { client, deps } = setup([fail(401, { code: 'UNAUTHENTICATED' }), new Error('offline')]);
    await client.get('/profile').catch(() => undefined);
    expect(deps.onSessionExpired).not.toHaveBeenCalled();
  });

  it('retries reads after a network failure', async () => {
    const { client, fetchImpl } = setup([new Error('down'), new Error('down'), ok({ fine: true })]);
    await expect(client.get('/goals')).resolves.toEqual({ fine: true });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('gives up on reads after three attempts with an offline error', async () => {
    const { client, fetchImpl } = setup([new Error('1'), new Error('2'), new Error('3')]);
    const error = (await client.get('/goals').catch((e) => e)) as ApiError;
    expect(error.isOffline).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('does not retry writes', async () => {
    const { client, fetchImpl } = setup([new Error('down'), ok({})]);
    const error = (await client.post('/goals', { body: {} }).catch((e) => e)) as ApiError;
    expect(error.kind).toBe('network');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not retry reads marked as having side effects', async () => {
    const { client, fetchImpl } = setup([new Error('down'), ok({})]);
    await client.get('/privacy/export', { noRetry: true }).catch(() => undefined);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports cancellation separately from network failure', async () => {
    const controller = new AbortController();
    const { client } = setup([new Error('aborted')]);
    controller.abort();
    const error = (await client.get('/goals', { signal: controller.signal }).catch((e) => e)) as ApiError;
    expect(error.kind).toBe('cancelled');
  });

  it('tells the app when a protected API says an update is required', async () => {
    const { client, deps } = setup([fail(422, { code: 'APP_UPDATE_REQUIRED', message: 'A required app update is available' })]);
    await client.get('/profile').catch(() => undefined);
    expect(deps.onUpdateRequired).toHaveBeenCalledTimes(1);
  });
});
