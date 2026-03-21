import { join } from "jsr:@std/path/join";
import { hashsig_generate, HashsigInfo } from "./hashsig.ts";
import { joinLines, range } from "./reuse.ts";
import { enr_generate, LOCALHOST, nodeKey } from "./enr.ts";
import { dirname } from "jsr:@std/path/dirname";

function nodeKeyPath(dir: string, i: number) {
  return join(dir, `node-key/${i}`);
}

export interface Ports {
  quic: number;
  metrics: number;
  api: number;
}
function getPorts(i: number): Ports {
  const base = 10000 + i * 3;
  return {
    quic: base,
    metrics: base + 1,
    api: base + 2,
  };
}

export interface GenesisLayout {
  validators: number;
  names: string[];
}
export interface GenesisInfo {
  hashsig: HashsigInfo;
  genesis_time: number;
  config_yaml_path: string;
  nodes_yaml_path: string;
  annotated_validators_yaml_path: string;
  nodeKeyPath(i: number): string;
  ports: Ports[];
}
export async function genesis_generate(
  dir: string,
  layout: GenesisLayout,
  signal: AbortSignal,
): Promise<GenesisInfo> {
  const aggregators = 1;
  const epochs_log = 18;
  const genesis_time_offset_s = 2;

  if (layout.names.length !== layout.validators) throw new Error();

  const node_keys = range(layout.validators).map((i) => nodeKey(i));
  const ports = range(layout.validators).map((i) => getPorts(i));

  Deno.mkdirSync(dir, { recursive: true });

  const hashsig = await hashsig_generate(
    join(dir, "hash-sig-keys"),
    epochs_log,
    layout.validators,
    signal,
  );

  const genesis_time_s = Math.floor(Date.now() / 1000) + genesis_time_offset_s;

  const config_yaml_path = join(dir, "config.yaml");
  Deno.writeTextFileSync(
    config_yaml_path,
    joinLines([
      `GENESIS_TIME: ${genesis_time_s}`,
      `ACTIVE_EPOCH: ${epochs_log}`,
      `VALIDATOR_COUNT: ${layout.validators}`,
      "GENESIS_VALIDATORS:",
      ...hashsig.pks.map((pk) => `    - "${pk}"`),
    ]),
  );

  const nodes_yaml_path = join(
    dir,
    "nodes.yaml",
  );
  Deno.writeTextFileSync(
    nodes_yaml_path,
    joinLines(
      node_keys.map((node_key, i) =>
        `- ${enr_generate(node_key, LOCALHOST, ports[i].quic)}`
      ),
    ),
  );

  const annotated_validators_yaml_path = join(
    dir,
    "annotated_validators.yaml",
  );
  Deno.writeTextFileSync(
    annotated_validators_yaml_path,
    joinLines(hashsig.pks.flatMap((pk, i) => [
      `${layout.names[i]}:`,
      `  - index: ${i}`,
      `    pubkey_hex: ${pk}`,
      `    privkey_file: ${hashsig.sk_name(i)}`,
    ])),
  );

  const validator_config_yaml_path = join(
    dir,
    "validator-config.yaml",
  );
  Deno.writeTextFileSync(
    validator_config_yaml_path,
    joinLines([
      "validators:",
      ...layout.names.flatMap((name, i) => [
        `  - name: "${name}"`,
        `    privkey: "${node_keys[i]}"`,
        "    enrFields:",
        `      ip: "127.0.0.1"`,
        `      quic: ${ports[i].quic}`,
        `    metricsPort: ${ports[i].metrics}`,
        `    apiPort: ${ports[i].api}`,
      ]),
    ]),
  );

  for (const [i, node_key] of node_keys.entries()) {
    const path = nodeKeyPath(dir, i);
    Deno.mkdirSync(dirname(path), { recursive: true });
    Deno.writeTextFileSync(path, node_key);
  }

  return {
    hashsig,
    genesis_time: genesis_time_s * 1000,
    config_yaml_path,
    nodes_yaml_path,
    annotated_validators_yaml_path,
    nodeKeyPath(i: number) {
      return nodeKeyPath(dir, i);
    },
    ports,
  };
}

export interface ClientArgs {
  genesis_dir: string;
  name: string;
  data_dir: string;
  ports: Ports;
  node_key_path: string;
}
