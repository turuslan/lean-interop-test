import * as ZEAM from "../clients/zeam.ts";
import { runTest, Test } from "./test.ts";

const slots = 10;

async function test1(test: Test) {
  test.start(test.clients);
  for (let slot = 1; slot <= slots; ++slot) {
    await test.waitSlot(slot, 0);
    console.info(`slot ${slot}`);
    await test.waitSlot(slot, 1);
  }
}

await runTest(test1, {
  clients: [ZEAM, ZEAM],
  timeout_slots: slots + 1,
});
