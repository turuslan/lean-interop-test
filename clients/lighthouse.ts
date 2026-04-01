import { ClientArgs } from "../src/genesis.ts";

export const NAME = "lighthouse";

export const DOCKER_IMAGE =
  "docker.io/hopinheimer/lighthouse:latest@sha256:4a23faedda290134a3f474cb32c84c3c6c03b95080a9122dc481e67a4cdebf50";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/usr/local/bin/lighthouse",
    "lean_node",
    "--metrics",
    ...["--datadir", args.data_dir],
    ...["--config", args.config_yaml_path],
    ...["--validators", args.validator_config_yaml_path],
    ...["--nodes", args.nodes_yaml_path],
    ...["--node-id", args.name],
    ...["--private-key", args.node_key_path],
    ...["--socket-port", `${args.ports.quic}`],
    ...["--metrics-port", `${args.ports.metrics}`],
  ];
}

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_LIGHTHOUSE");
