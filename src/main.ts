import * as ZEAM from "../clients/zeam.ts";
import { runTest, Test } from "./test.ts";

const slots = 10;

async function test1(test: Test) {
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

await runTest(test1, {
  clients: [ZEAM, ZEAM],
  timeout_slots: slots + 1,
});
