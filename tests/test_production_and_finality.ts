import * as ZEAM from "../clients/zeam.ts";
import { addTest, Test } from "../src/test.ts";

const slots = 10;

async function test_production_and_finality(test: Test) {
  test.start(test.clients);
  for (let slot = 1; slot <= slots; ++slot) {
    await test.waitSlot(slot, 0);
    console.info(`slot ${slot}`);
    await test.waitSlot(slot, 1);

    await test.metrics(test.clients, (client, metrics, chain) => {
      console.info(
        `  ${client.name} ${chain.finalized} ${chain.justified} ${chain.head}`,
      );
    });
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
