type Listener = () => void;

function createSignal() {
  const listeners = new Set<Listener>();
  return {
    emit: () => listeners.forEach((listener) => listener()),
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Fired when the refresh token is rejected and the user must sign in again. */
export const sessionExpired = createSignal();

/** Fired when a protected API answers APP_UPDATE_REQUIRED. */
export const updateRequired = createSignal();
