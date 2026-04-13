import { ClientArgs } from "../src/genesis.ts";

export const NAME = "ethlambda";

export const DOCKER_IMAGE =
  "ghcr.io/lambdaclass/ethlambda:devnet4@sha256:6a655e271f4dd63b4beda6439946c1c3c75b9ecb52d98db737e071c72e9f6bec";

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
