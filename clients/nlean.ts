import { ClientArgs } from "../src/genesis.ts";

export const NAME = "nlean";

export const DOCKER_IMAGE =
  "ghcr.io/nleaneth/nlean:latest@sha256:a1a26062e56c0bcf2a066fa11a03bab48ea2521d3812551ec44026b9474e8de1";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/app/Lean.Client",
    ...["--data-dir", args.data_dir],
    ...["--metrics", "true"],
    ...["--socket-port", `${args.ports.quic}`],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--api-port", `${args.ports.api}`],
    ...["--validator-config", args.validator_config_yaml_path],
    ...["--node-id", args.name],
    ...["--node-key", args.node_key_path],
    ...["--log", "Trace"],
  ];
}

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_NLEAN");
