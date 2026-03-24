import * as ZEAM from "../clients/zeam.ts";
import { addTest, Checks, StartArgs, Test } from "../src/test.ts";

const slot1 = 5;
const slot2 = 12;

async function test_restart_args(test: Test, args: StartArgs) {
  test.start(test.clients);
  const checks = new Checks();
  await test.waitSlot(slot1, 1);
  await test.metrics(test.clients.slice(0, 2), (client, metrics, chain) => {
    checks.expectHeadAndFinality(client, chain, slot1);
  });
  await test.clients[2].stop();
  test.clients[2].start(args);
  await test.waitSlot(slot2, 1);
  await test.metrics(test.clients, (client, metrics, chain) => {
    checks.expectHeadAndFinality(client, chain, slot2);
  });
  checks.throwIfAny();
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
