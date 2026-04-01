import { ClientArgs } from "../src/genesis.ts";

export const NAME = "nlean";

export const DOCKER_IMAGE =
  "ghcr.io/nleaneth/nlean@sha256:019172da3727f33cb74de77becc9cea7c87e5f91dd3c0808c923a5417e7be3fa";

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
