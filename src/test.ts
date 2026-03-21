import { join } from "jsr:@std/path/join";
import { delay } from "jsr:@std/async/delay";
import {
  docker_pull_many,
  docker_run,
  dockerName,
  ROOT_DIR,
} from "./docker.ts";
import { withSignal } from "./reuse.ts";
import { ClientArgs, genesis_generate } from "./genesis.ts";
import { logFile } from "./log.ts";

const SLOT_DURATION = 4000;
const PHASES = 5;

interface TestClient {
  name: string;
  process_promise: Promise<void> | null;
  start(): void;
}

export class Test {
  constructor(
    public genesis_time: number,
    public clients: TestClient[],
    public signal: AbortSignal,
  ) {}

  start(clients: TestClient[]) {
    for (const client of clients) {
      client.start();
    }
  }

  async waitSlot(slot: number, phase: number) {
    if (phase < 0 || phase >= PHASES) throw new Error();
    const now = Date.now();
    const slot_time = this.genesis_time + slot * SLOT_DURATION;
    const time = slot_time + phase * SLOT_DURATION / PHASES;
    if (time <= now) {
      return;
    }
    await delay(time - now, { signal: this.signal });
  }
}

export interface TestClientArg {
  NAME: string;
  DOCKER_IMAGE: string;
  dockerCmd(args: ClientArgs): string[];
}
export async function runTest(
  test_fn: (test: Test) => Promise<void>,
  args: { clients: TestClientArg[]; timeout_slots: number },
) {
  const root_dir = join(ROOT_DIR, "data");
  const genesis_dir = join(root_dir, "genesis");
  const names = args.clients.map((client, i) => `${client.NAME}_${i}`);
  await withSignal(async (abort, signal) => {
    await docker_pull_many(
      args.clients.map((client) => client.DOCKER_IMAGE),
      signal,
    );
    const genesis = await genesis_generate(genesis_dir, {
      validators: names.length,
      names,
    }, signal);
    const client_args = names.map<ClientArgs>((name, i) => ({
      genesis_dir,
      name,
      data_dir: join(root_dir, name),
      ports: genesis.ports[i],
      node_key_path: genesis.nodeKeyPath(i),
    }));
    const logs = names.map((name) => logFile(join(root_dir, `${name}.log`)));
    let result = "error";
    const timeout_timer = setTimeout(
      () => {
        result = "timeout";
        abort.abort();
      },
      (genesis.genesis_time - Date.now()) + args.timeout_slots * SLOT_DURATION,
    );
    const clients = args.clients.map<TestClient>((client, i) => ({
      name: names[i],
      process_promise: null,
      start() {
        const cmd = client.dockerCmd(client_args[i]);
        if (genesis.isAggregator(i)) {
          cmd.push("--is-aggregator");
        }
        if (this.process_promise !== null) {
          throw new Error(`${names[i]} already/still started`);
        }
        this.process_promise = docker_run(
          dockerName(),
          client.DOCKER_IMAGE,
          cmd,
          logs[i].log,
          signal,
        )
          .catch(() => {})
          .then(() => {
            this.process_promise = null;
            if (signal.aborted) return;
            console.info(`${names[i]} was not expected to stop`);
            abort.abort();
          });
      },
    }));
    const test = new Test(genesis.genesis_time, clients, signal);
    try {
      await test_fn(test);
      result = "ok";
      abort.abort();
    } catch (e) {
      if (!signal.aborted) {
        console.warn("runTest", e);
      }
    } finally {
      clearTimeout(timeout_timer);
      await Promise.all(
        clients
          .map((client) => client.process_promise)
          .filter((promise) => promise !== null),
      );
      for (const log of logs) {
        log.close();
      }
      console.info(`RESULT ${result}`);
    }
  });
}
