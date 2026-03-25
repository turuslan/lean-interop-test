## Lean interop test

- Add tests to ["tests"](./tests) directory.
- Add client commands to ["clients"](./clients) directory like
  [lean-quickstart](https://github.com/blockblaz/lean-quickstart).
- Generates genesis.
- Caches and hardlinks hashsig keys.

### Scripts

- `./run.sh`\
  Starts "src/main.ts" inside docker.\
  Runs tests from ["tests"](./tests) directory.
- `./cleanup.sh`\
  `./run.sh` test runner container starts client containers.\
  Test runner attempts to handle SIGINT/SIGTERM properly and stop these
  containers.\
  Use this script to stop unused client containers if something goes wrong.
- `./inspect-image.sh`\
  Prints sha256 for specified docker image.\
  Useful when editing client commands in ["clients"](./clients) directory.

### Reference

- `addTest(async test_fn(test), { clients: [...], timeout_slots })`\
  Add test to test list.\
  Doesn't run test.\
  Accepts timeout in slots after genesis.
- `test.clients`\
  List of test clients.\
  Clients are not started.
- `test.start(clients)`\
  Start specified clients.\
  Throws if some clients are already/still started.
- `async test.waitSlot(slot, phase)`\
  Wait until specified phase/interval of specified slot.
- `async test.metrics(clients, on_metric(client, metrics, chain))`\
  Request metrics from specified clients.\
  Returns list of results of `on_metric` for each client.\
  `metric.name` or `metrics["name"]` to get metric value.\
  `chain` contains `{ finalized, justified, heads }` slots.
- `client.name`\
  Client name like "zeam_0".\
  Consists of client type and client/validator index.
- `client.start()`\
  Start client.\
  Throws if client is already/still started.
- `client.start({ sync: true })`\
  Starts client for sync.\
  Removes data directory.\
  Throws if client is already/still started.
- `client.start({ sync: true, checkpoint: from_client })`\
  Starts client for checkpoint sync from specified client.\
  Removes data directory.\
  Throws if client is already/still started.
- `async client.stop()`\
  Stop client.\
  May re-start client after stop.
- `checks.report(client, message)`\
  Report client with specified message.\
  Doesn't stop test.
- `checks.throwIfAny()`\
  Does nothing if no clients were reported.\
  Prints reported clients and stops test.
- `checks.expectChainAt(client, chain, key, expected)`\
  Expect finalized/justified/head to be not less than expected slot.
- `checks.expectHeadAndFinality(client, chain, slot)`\
  Expect 3 slot finality behind head.
