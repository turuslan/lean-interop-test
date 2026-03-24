import { join } from "jsr:@std/path/join";
import { delay } from "jsr:@std/async/delay";
import {
  docker_pull_many,
  docker_run,
  dockerName,
  ROOT_DIR,
} from "./docker.ts";
import { on, removePath } from "./reuse.ts";
import { ClientArgs, genesis_generate } from "./genesis.ts";
import { logFile } from "./log.ts";
import { fetchMetrics, Metrics } from "./metrics.ts";

const SLOT_DURATION = 4000;
const PHASES = 5;

interface TestClient {
  name: string;
  process_promise: Promise<void> | null;
  start(): void;
  metrics(): Promise<Metrics>;
}

export interface ChainMetrics {
  head: number;
  justified: number;
  finalized: number;
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

  async metrics(
    clients: TestClient[],
    on_metrics: (
      client: TestClient,
      metrics: Metrics,
      chain: ChainMetrics,
    ) => void,
  ) {
    await Promise.all(
      clients.map(async (client) => {
        const metrics = await client.metrics();
        return on_metrics(client, metrics, {
          head: metrics.lean_head_slot,
          justified: metrics.lean_latest_justified_slot,
          finalized: metrics.lean_latest_finalized_slot,
        });
      }),
    );
  }
}

export interface TestClientArg {
  NAME: string;
  DOCKER_IMAGE: string;
  dockerCmd(args: ClientArgs): string[];
}
interface TestArg {
  test_fn(test: Test): Promise<void>;
  args: { clients: TestClientArg[]; timeout_slots: number };
  label: string;
}
const tests: TestArg[] = [];
export function addTest(
  test_fn: TestArg["test_fn"],
  args: TestArg["args"],
) {
  const label = `${test_fn.name} [${
    args.clients.map((client) => client.NAME)
  }]`;
  tests.push({ test_fn, args, label });
}
async function runTest({ test_fn, args }: TestArg, parent_signal: AbortSignal) {
  const abort = new AbortController(), { signal } = abort;
  const off_abort = on(parent_signal, "abort", () => abort.abort());
  try {
    const root_dir = join(ROOT_DIR, "data");
    removePath(root_dir, true);
    const genesis_dir = join(root_dir, "genesis");
    const names = args.clients.map((client, i) => `${client.NAME}_${i}`);
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
      config_yaml_path: genesis.config_yaml_path,
      nodes_yaml_path: genesis.nodes_yaml_path,
      validators_yaml_path: genesis.validators_yaml_path,
      validator_keys_manifest_yaml_path:
        genesis.validator_keys_manifest_yaml_path,
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
      async metrics() {
        return await fetchMetrics(
          `http://127.0.0.1:${genesis.ports[i].metrics}/metrics`,
          signal,
        );
      },
    }));
    const test = new Test(genesis.genesis_time, clients, signal);
    try {
      await test_fn(test);
      result = "ok";
    } catch (e) {
      if (!signal.aborted) {
        console.warn("runTest", e);
      }
    } finally {
      abort.abort();
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
  } finally {
    off_abort();
  }
}

export async function runTests(signal: AbortSignal) {
  for (const test of tests) {
    if (!signal.aborted) {
      console.info(`RUN TEST ${test.label}`);
      await runTest(test, signal);
    } else {
      console.info(`CANCEL TEST ${test.label}`);
    }
  }
}

export class Checks {
  names = new Set<string>();

  report(client: TestClient, message: string) {
    this.names.add(client.name);
    console.error(`${client.name}: ${message}`);
  }

  throwIfAny() {
    if (this.names.size === 0) return;
    throw new Error(
      `reported clients ${this.names.size} [${[...this.names].join(" ")}]`,
    );
  }

  expectChainAt(
    client: TestClient,
    chain: ChainMetrics,
    key: keyof ChainMetrics,
    expected: number,
  ) {
    if (chain[key] >= expected) return;
    this.report(client, `${key} ${chain[key]} < ${expected}`);
  }
}
