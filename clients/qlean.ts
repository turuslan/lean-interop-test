import { ClientArgs } from "../src/genesis.ts";

export const NAME = "qlean";

export const DOCKER_IMAGE =
  "docker.io/qdrvm/qlean-mini:devnet-3@sha256:6b84236b641c078b9ee2518c3b3c4354d27102e732287296cad92d7372fa507c";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "qlean",
    ...["--modules-dir", "/opt/qlean/modules"],
    ...["--genesis", args.config_yaml_path],
    ...["--validator-registry-path", args.validators_yaml_path],
    ...["--bootnodes", args.nodes_yaml_path],
    ...["--validator-keys-manifest", args.validator_keys_manifest_yaml_path],
    ...["--node-id", args.name],
    ...["--data-dir", args.data_dir],
    ...["--listen-addr", `/ip4/0.0.0.0/udp/${args.ports.quic}/quic-v1`],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--api-port", `${args.ports.api}`],
    ...["--node-key", args.node_key_path],
    ...["--xmss-sk", args.xmss_sk_path],
    ...["--xmss-pk", args.xmss_pk_path],
  ];
}
