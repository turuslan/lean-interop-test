import { ClientArgs } from "../src/genesis.ts";

export const NAME = "ethlambda";

export const DOCKER_IMAGE =
  "ghcr.io/lambdaclass/ethlambda:devnet3@sha256:859865ad878cd901653eb1737fb6398ff8dab76cb0ec2896fc67dcf5cd87ceb2";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/usr/local/bin/ethlambda",
    ...["--custom-network-config-dir", args.genesis_dir],
    ...["--node-id", args.name],
    ...["--node-key", args.node_key_path],
    ...["--gossipsub-port", `${args.ports.quic}`],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--api-port", `${args.ports.api}`],
  ];
}
