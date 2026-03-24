import * as ZEAM from "../clients/zeam.ts";
import * as REAM from "../clients/ream.ts";
import * as ETHLAMBDA from "../clients/ethlambda.ts";
import * as GEAN from "../clients/gean.ts";
import * as GRANDINE from "../clients/grandine.ts";
import * as LANTERN from "../clients/lantern.ts";
import * as NLEAN from "../clients/nlean.ts";
import * as PEAM from "../clients/peam.ts";
import * as LIGHTHOUSE from "../clients/lighthouse.ts";
import { addTest, Checks, Test } from "../src/test.ts";

const slots = 5;

async function test_production_and_finality(test: Test) {
  test.start(test.clients);
  const checks = new Checks();
  for (let slot = 1; slot <= slots; ++slot) {
    await test.waitSlot(slot, 1);
    const chains = new Set<string>();
    await test.metrics(test.clients, (client, metrics, chain) => {
      chains.add(`${chain.finalized} ${chain.justified} ${chain.head}`);
      checks.expectHeadAndFinality(client, chain, slot);
    });
    console.info(`slot ${slot}: ${[...chains].join(", ")}`);
  }
  checks.throwIfAny();
}

for (
  const clients of [
    [ZEAM, ZEAM],
    [ZEAM, ZEAM, ZEAM],
    [ZEAM, ZEAM, ZEAM, ZEAM],

    [REAM, REAM],
    [ZEAM, ZEAM, REAM],

    // TODO: Failed to create RocksDB directory
    // [ETHLAMBDA, ETHLAMBDA],

    [GEAN, GEAN],
    [ZEAM, ZEAM, GEAN],

    [GRANDINE, GRANDINE],
    [ZEAM, ZEAM, GRANDINE],

    [LANTERN, LANTERN],
    [ZEAM, ZEAM, LANTERN],

    [NLEAN, NLEAN],
    [ZEAM, ZEAM, NLEAN],

    [PEAM, PEAM],
    [ZEAM, ZEAM, PEAM],

    // TODO: command
    // [LIGHTHOUSE, LIGHTHOUSE],
  ]
) {
  addTest(test_production_and_finality, {
    clients,
    timeout_slots: slots + 1,
  });
}
