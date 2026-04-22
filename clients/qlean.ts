import { ClientArgs } from "../src/genesis.ts";

export const NAME = "qlean";

export const DOCKER_IMAGE =
  "docker.io/qdrvm/qlean-mini:devnet-4@sha256:ea80728155c91c698a980703657e86f48dd43c4a821bcf513aeb493b39e8f8e5";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "/opt/qlean/bin/qlean",
    ...["--genesis-dir", args.genesis_dir],
    ...["--node-id", args.name],
    ...["--data-dir", args.data_dir],
    ...["--listen-addr", `/ip4/0.0.0.0/udp/${args.ports.quic}/quic-v1`],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--api-port", `${args.ports.api}`],
    ...["--node-key", args.node_key_path],
  ];
}

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_QLEAN");
