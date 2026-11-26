import test from "node:test";
import assert from "node:assert/strict";
import { createPoller, ADMIN_POLL_INTERVAL_MS } from "../lib/admin-polling.js";

const noTimers = { setIntervalFn: () => 1, clearIntervalFn: () => {} };

test("default interval is at least 60s", () => {
  assert.ok(ADMIN_POLL_INTERVAL_MS >= 60_000);
});

test("skips ticks while the tab is hidden", async () => {
  let calls = 0;
  const p = createPoller(async () => { calls++; }, { ...noTimers, isHidden: () => true });
  await p.tick();
  assert.equal(calls, 0);
});

test("does not overlap in-flight requests", async () => {
  let calls = 0, release;
  const p = createPoller(() => { calls++; return new Promise((r) => (release = r)); },
    { ...noTimers, isHidden: () => false });
  const first = p.tick();
  await p.tick();
  assert.equal(calls, 1);
  release(); await first;
  const second = p.tick();
  assert.equal(calls, 2);
  release(); await second;
});

test("refreshes on becoming visible only when stale", async () => {
  let t = 0, calls = 0;
  const p = createPoller(async () => { calls++; },
    { ...noTimers, isHidden: () => false, now: () => t, intervalMs: 1000 });
  t = 500; p.onVisible(); await Promise.resolve();
  assert.equal(calls, 0);
  t = 1500; p.onVisible(); await Promise.resolve();
  assert.equal(calls, 1);
});
