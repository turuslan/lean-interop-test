import { ClientArgs } from "../src/genesis.ts";

export const NAME = "qlean";

export const DOCKER_IMAGE =
  "docker.io/qdrvm/qlean-mini:devnet-4@sha256:677144187b37f9ff59683302b47b56f8dcee2dcdfddcb91a5206f8e0bdcaf8ed";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/opt/qlean/bin/qlean",
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

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_QLEAN");
