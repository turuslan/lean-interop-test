import * as ZEAM from "../clients/zeam.ts";
import { addTest, Checks, Test } from "../src/test.ts";

const slots = 5;

async function test_production_and_finality(test: Test) {
  test.start(test.clients);
  for (let slot = 1; slot <= slots; ++slot) {
    await test.waitSlot(slot, 1);
    const checks = new Checks();
    await test.metrics(test.clients, (client, metrics, chain) => {
      checks.expectChainAt(client, chain, "head", slot);
      checks.expectChainAt(client, chain, "justified", slot - 2);
      checks.expectChainAt(client, chain, "finalized", slot - 3);
    });
    checks.throwIfAny();
  }
}

for (
  const clients of [
    [ZEAM, ZEAM],
    [ZEAM, ZEAM, ZEAM],
  ]
) {
  addTest(test_production_and_finality, {
    clients,
    timeout_slots: slots + 1,
  });
}
