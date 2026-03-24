import { ClientArgs } from "../src/genesis.ts";

export const NAME = "lantern";

export const DOCKER_IMAGE =
  "docker.io/piertwo/lantern:v0.0.3@sha256:bc17c7ce89be67d283bebd34d7cf46b25fb70f1f538153133571e7f0da205670";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/opt/lantern/bin/lantern",
    ...["--data-dir", args.data_dir],
    ...["--genesis-config", args.config_yaml_path],
    ...["--validator-registry-path", args.validators_yaml_path],
    ...["--validator-config", args.validator_config_yaml_path],
    ...["--nodes-path", args.nodes_yaml_path],
    ...["--node-id", args.name],
    ...["--node-key-path", args.node_key_path],
    ...["--listen-address", `/ip4/0.0.0.0/udp/${args.ports.quic}/quic-v1`],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--http-port", `${args.ports.api}`],
    ...["--hash-sig-key-dir", args.hash_sig_keys_dir],
    ...["--xmss-secret-template", args.xmss_sk_path],
    ...["--xmss-public-template", args.xmss_pk_path],
  ];
}
