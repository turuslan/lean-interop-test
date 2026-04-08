import * as ZEAM from "../clients/zeam.ts";
import * as REAM from "../clients/ream.ts";
import * as ETHLAMBDA from "../clients/ethlambda.ts";
import * as GEAN from "../clients/gean.ts";
import * as GRANDINE from "../clients/grandine.ts";
import * as LANTERN from "../clients/lantern.ts";
import * as NLEAN from "../clients/nlean.ts";
import * as PEAM from "../clients/peam.ts";
import * as LIGHTHOUSE from "../clients/lighthouse.ts";
import * as QLEAN from "../clients/qlean.ts";
import { addTest, Checks, Test } from "../src/test.ts";

const slots = 5;

// Test blocks are produced and 3 slot finality happens when all clients are running.
async function test_production_and_finality(test: Test) {
  test.start(test.clients);
  const checks = new Checks();
  for (let slot = 1; slot <= slots; ++slot) {
    await test.waitSlot(slot, 1);
    const chains = new Set(
      await test.metrics(test.clients, (client, metrics, chain) => {
        checks.expectHeadAndFinality(client, chain, slot);
        return `${chain.finalized} ${chain.justified} ${chain.head}`;
      }),
    );
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

    [ETHLAMBDA, ETHLAMBDA],

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

    [QLEAN, QLEAN],
    [QLEAN, QLEAN, QLEAN],
    [QLEAN, QLEAN, QLEAN, QLEAN],
    [ZEAM, QLEAN],
    [QLEAN, ZEAM],
    [ZEAM, ZEAM, QLEAN],
    [QLEAN, ZEAM, ZEAM],
    [ZEAM, QLEAN, QLEAN],
    [QLEAN, QLEAN, ZEAM],
  ]
) {
  addTest(test_production_and_finality, {
    clients,
    timeout_slots: slots + 1,
  });
}
