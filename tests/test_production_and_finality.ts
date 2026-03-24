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
  for (let slot = 1; slot <= slots; ++slot) {
    await test.waitSlot(slot, 1);
    const checks = new Checks();
    await test.metrics(test.clients, (client, metrics, chain) => {
      checks.expectChainAt(client, chain, "head", slot);
      checks.expectChainAt(client, chain, "justified", chain.head - 2);
      checks.expectChainAt(client, chain, "finalized", chain.justified - 1);
    });
    checks.throwIfAny();
  }
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

    [GRANDINE, GRANDINE],

    [LANTERN, LANTERN],

    [NLEAN, NLEAN],

    [PEAM, PEAM],

    [LIGHTHOUSE, LIGHTHOUSE],
  ]
) {
  addTest(test_production_and_finality, {
    clients,
    timeout_slots: slots + 1,
  });
}
