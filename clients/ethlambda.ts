import { ClientArgs } from "../src/genesis.ts";

export const NAME = "ethlambda";

export const DOCKER_IMAGE =
  "ghcr.io/lambdaclass/ethlambda:devnet3@sha256:f02eff591e971820f6c41ddfe5cac1321c0eb135275ac064a904938a41f15f9b";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/usr/local/bin/ethlambda",
    ...["--data-dir", args.data_dir],
    ...["--custom-network-config-dir", args.genesis_dir],
    ...["--node-id", args.name],
    ...["--node-key", args.node_key_path],
    ...["--gossipsub-port", `${args.ports.quic}`],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--api-port", `${args.ports.api}`],
  ];
}
