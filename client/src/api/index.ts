import { appIdentity, config } from '../config';
import { sessionExpired, updateRequired } from '../session/events';
import { clearTokens, loadTokens, saveTokens } from '../session/tokenStore';
import { createApiClient } from './client';
import { createEndpoints } from './endpoints';

export * from './client';
export * from './types';

const client = createApiClient({
  baseUrl: config.apiBaseUrl,
  getTokens: loadTokens,
  saveTokens,
  onSessionExpired: () => {
    void clearTokens().then(() => sessionExpired.emit());
  },
  onUpdateRequired: () => updateRequired.emit(),
  appHeaders: () => {
    const id = appIdentity();
    return {
      'x-app-platform': id.platform,
      'x-app-version': id.version,
      'x-app-build': String(id.build),
      'x-app-identifier': id.appIdentifier,
    };
  },
});

export const api = createEndpoints(client);
