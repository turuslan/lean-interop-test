import { ClientArgs } from "../src/genesis.ts";

export const NAME = "ream";

export const DOCKER_IMAGE =
  "ghcr.io/reamlabs/ream:latest-devnet3@sha256:74c08eec2a5a0fd3c255f02e2f2d4f5d1f4cba9d434705a084ff0dd0bfb6feeb";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/usr/local/bin/ream",
    ...["--data-dir", args.data_dir],
    "lean_node",
    "--metrics",
    ...["--network", args.config_yaml_path],
    ...["--validator-registry-path", args.validators_yaml_path],
    ...["--bootnodes", args.nodes_yaml_path],
    ...["--node-id", args.name],
    ...["--node-key", args.node_key_path],
    ...["--socket-port", `${args.ports.quic}`],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--http-port", `${args.ports.api}`],
  ];
}

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_REAM");
