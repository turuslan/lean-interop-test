import { ClientArgs } from "../src/genesis.ts";

export const NAME = "peam";

export const DOCKER_IMAGE =
  "ghcr.io/malik672/peam:latest@sha256:ad83389c5e9dac1f03003fbd15869a0863095d774a4d58ba47035e4c9bf91f90";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/usr/local/bin/peam",
    "--run",
    ...["--config", args.config_yaml_path],
    ...["--bootnodes", args.nodes_yaml_path],
    ...["--data-dir", args.data_dir],
    ...["--node-id", args.name],
    ...["--node-key", args.node_key_path],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--api-port", `${args.ports.api}`],
    ...["--listen", `/ip4/0.0.0.0/udp/${args.ports.quic}/quic-v1`],
  ];
}

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_PEAM");
