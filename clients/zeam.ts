import { ClientArgs } from "../src/genesis.ts";

export const NAME = "zeam";

export const DOCKER_IMAGE =
  "docker.io/blockblaz/zeam:devnet3@sha256:c483416224675a5ef4f1d9cf3517ff6f1d6e12f99bb74cd4a1cb4c0224feb118";

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
