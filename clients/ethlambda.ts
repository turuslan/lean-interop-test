import { ClientArgs } from "../src/genesis.ts";

export const NAME = "ethlambda";

export const DOCKER_IMAGE =
  "ghcr.io/lambdaclass/ethlambda:devnet4@sha256:6b783f2d71b29e7c016499b8d5d74c61e2b06c6869769d535a1fcb65c88212e4";

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

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_ETHLAMBDA");
