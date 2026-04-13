import { ClientArgs } from "../src/genesis.ts";

export const NAME = "gean";

export const DOCKER_IMAGE =
  "ghcr.io/geanlabs/gean:devnet3@sha256:6ef87770d116c4d7520a9fb5790edc109883db75e692617378a577c9ea09b077";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "gean",
    ...["--data-dir", args.data_dir],
    ...["--genesis", args.config_yaml_path],
    ...["--bootnodes", args.nodes_yaml_path],
    ...["--validator-registry-path", args.validators_yaml_path],
    ...["--node-id", args.name],
    ...["--node-key", args.node_key_path],
    ...["--validator-keys", args.hash_sig_keys_dir],
    ...["--listen-addr", `/ip4/0.0.0.0/udp/${args.ports.quic}/quic-v1`],
    ...["--discovery-port", `${args.ports.quic}`],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--api-port", `${args.ports.api}`],
  ];
}

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_GEAN");
