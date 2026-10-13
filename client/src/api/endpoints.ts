import type { ApiClient } from './client';
import type {
  DeleteAccountResult,
  ExportResult,
  Goal,
  GoalInput,
  GoalStatus,
  Letter,
  LetterInput,
  MemoryInput,
  Page,
  Profile,
  ProfileUpdate,
  SignInResult,
  TimelineEvent,
  TokenPair,
  UpdateCheckResult,
  UploadAccess,
  UploadKind,
  UploadRecord,
  WhatIfInput,
  WhatIfPath,
} from './types';

export interface UpdateCheckParams {
  platform: 'android' | 'ios';
  version: string;
  build: number;
  appIdentifier: string;
}

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

type Signal = { signal?: AbortSignal };
type PageParams = Signal & { page?: number; limit?: number };

export function createEndpoints(http: ApiClient) {
  return {
    auth: {
      google: (idToken: string) =>
        http.post<SignInResult>('/auth/google', { body: { idToken }, auth: false }),
      refresh: (refreshToken: string) =>
        http.post<TokenPair>('/auth/refresh', { body: { refreshToken }, auth: false }),
      logout: () => http.post<{ loggedOut: boolean }>('/auth/logout'),
    },
    profile: {
      get: (o?: Signal) => http.get<Profile>('/profile', o),
      update: (body: ProfileUpdate) => http.patch<Profile>('/profile', { body }),
    },
    goals: {
      list: (o: PageParams = {}) =>
        http.get<Page<Goal>>('/goals', {
          signal: o.signal,
          query: { page: o.page, limit: o.limit },
        }),
      get: (id: string, o?: Signal) => http.get<Goal>(`/goals/${id}`, o),
      create: (body: GoalInput) => http.post<Goal>('/goals', { body }),
      update: (id: string, body: GoalInput) => http.patch<Goal>(`/goals/${id}`, { body }),
      setStatus: (id: string, status: GoalStatus) =>
        http.post<Goal>(`/goals/${id}/status`, { body: { status } }),
      remove: (id: string) => http.delete<{ deleted: boolean }>(`/goals/${id}`),
    },
    timeline: {
      list: (o: PageParams = {}) =>
        http.get<Page<TimelineEvent>>('/timeline', {
          signal: o.signal,
          query: { page: o.page, limit: o.limit },
        }),
      createMemory: (body: MemoryInput) =>
        http.post<TimelineEvent>('/timeline/memories', { body }),
      removeMemory: (id: string) =>
        http.delete<{ deleted: boolean }>(`/timeline/memories/${id}`),
    },
    whatIf: {
      list: (o: PageParams = {}) =>
        http.get<Page<WhatIfPath>>('/what-if-paths', {
          signal: o.signal,
          query: { page: o.page, limit: o.limit },
        }),
      create: (body: WhatIfInput) => http.post<WhatIfPath>('/what-if-paths', { body }),
      update: (id: string, body: WhatIfInput) =>
        http.patch<WhatIfPath>(`/what-if-paths/${id}`, { body }),
      remove: (id: string) => http.delete<{ deleted: boolean }>(`/what-if-paths/${id}`),
    },
    letters: {
      list: (o?: Signal) => http.get<Letter[]>('/letters', o),
      get: (id: string, o?: Signal) => http.get<Letter>(`/letters/${id}`, o),
      create: (body: LetterInput) => http.post<Letter>('/letters', { body }),
      update: (id: string, body: LetterInput) =>
        http.patch<Letter>(`/letters/${id}`, { body }),
      cancel: (id: string) => http.delete<Letter>(`/letters/${id}`),
    },
    devices: {
      register: (token: string, platform: 'android' | 'ios') =>
        http.post<unknown>('/devices', { body: { token, platform } }),
      remove: (token: string) =>
        http.delete<unknown>(`/devices/${encodeURIComponent(token)}`),
    },
    uploads: {
      create: (
        purpose: UploadKind,
        file: PickedFile,
        handlers: { onProgress?: (fraction: number) => void; signal?: AbortSignal },
      ) => {
        const form = new FormData();
        // React Native reads the file from its uri when it sends the form.
        form.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as unknown as Blob);
        return http.upload<UploadRecord>('/uploads', form, handlers, { purpose });
      },
      access: (id: string, o?: Signal) => http.get<UploadAccess>(`/uploads/${id}/access`, o),
      attach: (id: string, parentType: UploadKind, parentId: string) =>
        http.post<UploadRecord>(`/uploads/${id}/attach/${parentType}/${parentId}`),
      remove: (id: string) => http.delete<{ deleted: boolean }>(`/uploads/${id}`),
    },
    privacy: {
      export: () => http.get<ExportResult>('/privacy/export', { timeoutMs: 120000, noRetry: true }),
      deleteAccount: (confirmation: string) =>
        http.delete<DeleteAccountResult>('/privacy/account', { body: { confirmation } }),
    },
    updates: {
      check: (params: UpdateCheckParams, o?: Signal) =>
        http.get<UpdateCheckResult>('/app-updates/check', {
          signal: o?.signal,
          auth: false,
          query: { ...params },
        }),
    },
  };
}

export type Api = ReturnType<typeof createEndpoints>;
