import { ClientArgs } from "../src/genesis.ts";

export const NAME = "zeam";

export const DOCKER_IMAGE =
  "docker.io/blockblaz/zeam:devnet3@sha256:5289c958eff95de67455f12613ae658bebcd37b07cc88d2a7e49e4e26fb17b1e";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/app/zig-out/bin/zeam",
    "node",
    "--metrics_enable",
    ...["--custom_genesis", args.genesis_dir],
    ...["--validator_config", "genesis_bootnode"],
    ...["--node-id", args.name],
    ...["--data-dir", args.data_dir],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--api-port", `${args.ports.api}`],
    ...["--node-key", args.node_key_path],
  ];
}

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_ZEAM");
