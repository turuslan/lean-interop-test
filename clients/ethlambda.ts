import { ClientArgs } from "../src/genesis.ts";

export const NAME = "ethlambda";

export const DOCKER_IMAGE =
  "ghcr.io/lambdaclass/ethlambda:devnet3@sha256:03231d0ed88e94922d1e4d512ea86b233f5ea38e5b9212a15c8e3eb735d4c9d5";

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
