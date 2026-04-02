import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 640; // matches Tailwind `sm:`

function subscribe(cb: () => void) {
  const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
