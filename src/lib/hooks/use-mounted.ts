import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns true only once the component has hydrated on the client.
 * Used to gate portal-based UI (modals, drawers) that must render into
 * `document.body`, which doesn't exist during SSR.
 */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
