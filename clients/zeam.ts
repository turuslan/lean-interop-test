import { ClientArgs } from "../src/genesis.ts";

export const NAME = "zeam";

export const DOCKER_IMAGE =
  "docker.io/blockblaz/zeam:devnet4@sha256:0524538dcea87b2ee11e9e48c2c3d872a85176aca7152bc6b1cf16caee60d632";

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
