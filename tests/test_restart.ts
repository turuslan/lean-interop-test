import * as ZEAM from "../clients/zeam.ts";
import { addTest, Checks, StartArgs, Test } from "../src/test.ts";

const slot1 = 5;
const slot2 = 12;

// Test blocks are produced and 3 slot finality happens after 1 of 3 clients is restarted.
async function test_restart_args(test: Test, args: StartArgs) {
  test.start(test.clients);
  const log = (async () => {
    for (let slot = 1; slot <= slot2; ++slot) {
      await test.waitSlot(slot, 1);
      const chains = new Set(
        await test.metrics(
          test.clients.slice(0, slot === slot1 ? 2 : 3),
          (client, metrics, chain) => {
            return `${chain.finalized} ${chain.justified} ${chain.head}`;
          },
        ),
      );
      console.info(`slot ${slot}: ${[...chains].join(", ")}`);
    }
  })();
  try {
    const checks = new Checks();
    await test.waitSlot(slot1, 1);
    await test.metrics(test.clients.slice(0, 2), (client, metrics, chain) => {
      checks.expectHeadAndFinality(client, chain, slot1);
    });
    console.info("stop");
    await test.clients[2].stop();
    console.info("start");
    test.clients[2].start(args);
    await test.waitSlot(slot2, 1);
    await test.metrics(test.clients, (client, metrics, chain) => {
      checks.expectHeadAndFinality(client, chain, slot2);
    });
    checks.throwIfAny();
  } finally {
    await log;
  }
}

async function test_restart(test: Test) {
  await test_restart_args(test, {});
}

async function test_restart_sync(test: Test) {
  await test_restart_args(test, { sync: true });
}

async function test_restart_checkpoint_sync(test: Test) {
  await test_restart_args(test, { sync: true, checkpoint: test.clients[0] });
}

for (
  const test_fn of [
    test_restart,
    test_restart_sync,
    test_restart_checkpoint_sync,
  ]
) {
  addTest(test_fn, { clients: [ZEAM, ZEAM, ZEAM], timeout_slots: slot2 + 1 });
}
