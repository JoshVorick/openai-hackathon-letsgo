import assert from "node:assert/strict";
import test from "node:test";

import { runTool } from "../../lib/tools";

test("get_occupancy returns stable payload", async () => {
  const result = await runTool("get_occupancy", { date: "2024-06-01" });
  assert.deepEqual(result, {
    date: "2024-06-01",
    byRoomType: [
      { roomType: "King", occupied: 28, total: 40, pct: 0.7 },
      { roomType: "Queen", occupied: 18, total: 30, pct: 0.6 },
    ],
  });
});

test("get_competitor_prices returns example data", async () => {
  const result = await runTool("get_competitor_prices", {
    location: "Downtown",
    start: "2024-06-01",
    end: "2024-06-03",
  });
  assert.deepEqual(result, {
    location: "Downtown",
    start: "2024-06-01",
    end: "2024-06-03",
    competitors: [
      { name: "Hotel A", avgNightly: 219 },
      { name: "Hotel B", avgNightly: 205 },
    ],
  });
});

test("update_prices acknowledges adjustment", async () => {
  const result = await runTool("update_prices", {
    roomType: "Suite",
    pct: 5,
    start: "2024-06-01",
    end: "2024-06-07",
  });
  assert.deepEqual(result, {
    status: "ok",
    note: "Applied 5% to Suite from 2024-06-01 to 2024-06-07",
  });
});

test("update_settings echoes update", async () => {
  const result = await runTool("update_settings", {
    key: "minStay",
    value: 2,
  });
  assert.deepEqual(result, { status: "ok", key: "minStay", value: 2 });
});

test("unknown tool returns error", async () => {
  const result = await runTool("missing", {});
  assert.deepEqual(result, { error: "Unknown tool: missing" });
});
