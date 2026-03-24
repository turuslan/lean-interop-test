import * as ZEAM from "../clients/zeam.ts";
import { runTest, Test } from "../src/test.ts";

const slots = 10;

async function test_production_and_finality(test: Test) {
  test.start(test.clients);
  for (let slot = 1; slot <= slots; ++slot) {
    await test.waitSlot(slot, 0);
    console.info(`slot ${slot}`);
    await test.waitSlot(slot, 1);

    await test.metrics(test.clients, (client, metrics) => {
      const head = metrics.lean_head_slot;
      const justified = metrics.lean_latest_justified_slot;
      const finalized = metrics.lean_latest_finalized_slot;
      console.info(`  ${client.name} ${finalized} ${justified} ${head}`);
    });
  }
}

for (
  const clients of [
    [ZEAM, ZEAM],
    [ZEAM, ZEAM, ZEAM],
  ]
) {
  await runTest(test_production_and_finality, {
    clients,
    timeout_slots: slots + 1,
  });
}
