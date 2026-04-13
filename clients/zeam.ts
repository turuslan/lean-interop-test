import { ClientArgs } from "../src/genesis.ts";

export const NAME = "zeam";

export const DOCKER_IMAGE =
  "docker.io/blockblaz/zeam:devnet4@sha256:8d98b65df7df8faf5d73300a96e207fddcc7fbd01dc39f1d4cf4460ecfcff408";

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
