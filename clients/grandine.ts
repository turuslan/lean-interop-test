import { ClientArgs } from "../src/genesis.ts";

export const NAME = "grandine";

export const DOCKER_IMAGE =
  "docker.io/sifrai/lean:devnet-3@sha256:1b2597141a5cacd7d5f1fe629ce44128a9e3058f420f397c4ac723c21d065780";

export function dockerCmd(args: ClientArgs): string[] {
  return [
    "lean_client",
    "--metrics",
    "--disable-discovery",
    ...["--port", `${args.ports.quic}`],
    ...["--genesis", args.config_yaml_path],
    ...["--bootnodes", args.nodes_yaml_path],
    ...["--validator-registry-path", args.validators_yaml_path],
    ...["--hash-sig-key-dir", args.hash_sig_keys_dir],
    ...["--node-id", args.name],
    ...["--node-key", args.node_key_path],
    ...["--metrics-port", `${args.ports.metrics}`],
    ...["--http-port", `${args.ports.api}`],
  ];
}

export const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_GRANDINE");
