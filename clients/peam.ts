import { ClientArgs } from "../src/genesis.ts";

export const NAME = "peam";

export const DOCKER_IMAGE =
  "ghcr.io/malik672/peam:latest@sha256:a22dd96dfe2e7a1455a55834b8b6f4683594dee63f1ea3fed075b58e68b11a46";

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
