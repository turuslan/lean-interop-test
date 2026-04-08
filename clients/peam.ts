import { ClientArgs } from "../src/genesis.ts";

export const NAME = "peam";

export const DOCKER_IMAGE =
  "ghcr.io/malik672/peam:latest@sha256:474be3806380d399ff8a7b32b00f474167e8f74fbf0fa11d7813040df94c70eb";

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
