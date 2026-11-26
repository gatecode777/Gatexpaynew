// Visibility-aware poller for the admin dashboard.
// - never overlaps requests (skips a tick while one is in flight)
// - skips ticks while the tab is hidden
// - refreshes immediately when the tab becomes visible again if data is stale
export const ADMIN_POLL_INTERVAL_MS = 60_000;

export function createPoller(task, opts = {}) {
  const {
    intervalMs = ADMIN_POLL_INTERVAL_MS,
    isHidden = () => typeof document !== "undefined" && document.hidden,
    now = () => Date.now(),
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
  } = opts;
  let inFlight = false;
  let lastRun = now();

  const run = async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      await task();
    } finally {
      inFlight = false;
      lastRun = now();
    }
  };

  const tick = () => {
    if (isHidden()) return;
    return run();
  };

  const onVisible = () => {
    if (!isHidden() && now() - lastRun >= intervalMs) run();
  };

  const id = setIntervalFn(tick, intervalMs);
  return {
    tick,
    onVisible,
    stop: () => clearIntervalFn(id),
  };
}
