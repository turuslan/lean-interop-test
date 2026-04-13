import { join } from "jsr:@std/path/join";
import { hardlinkOverwrite, joinLines, range, tmpDir } from "./reuse.ts";
import { docker_pull, docker_run, dockerName, ROOT_DIR } from "./docker.ts";
import { existsSync } from "jsr:@std/fs/exists";
import { encodeHex } from "jsr:@std/encoding/hex";

const DOCKER_IMAGE =
  "docker.io/blockblaz/hash-sig-cli:devnet2@sha256:defb9b28094e408932b7a71634dd3ab15634a804ed24264395115ce3911f40b8";

const LOCAL_BINARY = Deno.env.get("LOCAL_BINARY_HASHSIG");

function pk_attester_name(i: number) {
  return `validator_${i}_attester_key_pk.ssz`;
}
function sk_attester_name(i: number) {
  return `validator_${i}_attester_key_sk.ssz`;
}
function pk_proposer_name(i: number) {
  return `validator_${i}_proposer_key_pk.ssz`;
}
function sk_proposer_name(i: number) {
  return `validator_${i}_proposer_key_sk.ssz`;
}

function manifest(epochs_log: number, pks: Pubkey[]) {
  return joinLines([
    `key_scheme: SIGTopLevelTargetSumLifetime32Dim64Base8`,
    `hash_function: Poseidon2`,
    `encoding: TargetSum`,
    `lifetime: 4294967296`,
    `log_num_active_epochs: ${epochs_log}`,
    `num_active_epochs: ${Math.pow(2, epochs_log)}`,
    `num_validators: ${pks.length}`,
    `validators:`,
    ...pks.flatMap((pk, i) => [
      `  - index: ${i}`,
      `    attester_key_pubkey_hex: ${pk.attester}`,
      `    attester_key_privkey_file: ${sk_attester_name(i)}`,
      `    proposer_key_pubkey_hex: ${pk.proposer}`,
      `    proposer_key_privkey_file: ${sk_proposer_name(i)}`,
    ]),
  ]);
}

interface Pubkey {
  attester: string;
  proposer: string;
}
interface CacheItem {
  dir: string;
  exists: boolean;
  sk_attester_name: string;
  sk_attester_path: string;
  pk_attester_name: string;
  pk_attester_path: string;
  sk_proposer_name: string;
  sk_proposer_path: string;
  pk_proposer_name: string;
  pk_proposer_path: string;
}
class Cache {
  dir: string;
  constructor(public epochs_log: number) {
    this.dir = join(ROOT_DIR, `cache/hashsig-keys/${epochs_log}`);
    Deno.mkdirSync(this.dir, { recursive: true });
  }
  cacheItem(i: number): CacheItem {
    const dir = join(this.dir, `${i}`);
    const sk_attester_name = "sk_attester.ssz",
      pk_attester_name = "pk_attester.ssz";
    const sk_proposer_name = "sk_proposer.ssz",
      pk_proposer_name = "pk_proposer.ssz";
    return {
      dir,
      exists: existsSync(dir),
      sk_attester_name,
      sk_attester_path: join(dir, sk_attester_name),
      pk_attester_name,
      pk_attester_path: join(dir, pk_attester_name),
      sk_proposer_name,
      sk_proposer_path: join(dir, sk_proposer_name),
      pk_proposer_name,
      pk_proposer_path: join(dir, pk_proposer_name),
    };
  }
  async generate(count: number, signal: AbortSignal) {
    const missing = range(count).map((i) => this.cacheItem(i))
      .filter((item) => !item.exists);
    if (missing.length === 0) return;
    console.info(`generating ${missing.length} more hashsig keys`);
    const tmp_dir = tmpDir(join(ROOT_DIR, "cache/hashsig-tmp"));
    try {
      if (!LOCAL_BINARY) {
        await docker_pull(DOCKER_IMAGE, signal);
      }
      await docker_run(
        dockerName(),
        DOCKER_IMAGE,
        [
          "/usr/local/bin/hashsig",
          "generate",
          ...["--num-validators", `${missing.length}`],
          ...["--log-num-active-epochs", `${this.epochs_log}`],
          ...["--output-dir", tmp_dir],
          ...["--export-format", "ssz"],
        ],
        (line) => console.info(`hashsig: ${line}`),
        LOCAL_BINARY,
        signal,
      );
      for (const [i, item] of missing.entries()) {
        const tmp_item = join(tmp_dir, "item");
        Deno.mkdirSync(tmp_item, { recursive: true });
        Deno.renameSync(
          join(tmp_dir, sk_attester_name(i)),
          join(tmp_item, item.sk_attester_name),
        );
        Deno.renameSync(
          join(tmp_dir, pk_attester_name(i)),
          join(tmp_item, item.pk_attester_name),
        );
        Deno.renameSync(
          join(tmp_dir, sk_proposer_name(i)),
          join(tmp_item, item.sk_proposer_name),
        );
        Deno.renameSync(
          join(tmp_dir, pk_proposer_name(i)),
          join(tmp_item, item.pk_proposer_name),
        );
        Deno.renameSync(tmp_item, item.dir);
      }
    } finally {
      Deno.removeSync(tmp_dir, { recursive: true });
    }
  }
  link(dir: string, i: number): Pubkey {
    let item = this.cacheItem(i);
    // TODO: zeam
    item = {
      ...item,
      sk_proposer_name: item.sk_attester_name,
      sk_proposer_path: item.sk_attester_path,
      pk_proposer_name: item.pk_attester_name,
      pk_proposer_path: item.pk_attester_path,
    };
    hardlinkOverwrite(item.sk_attester_path, join(dir, sk_attester_name(i)));
    hardlinkOverwrite(item.pk_attester_path, join(dir, pk_attester_name(i)));
    hardlinkOverwrite(item.sk_proposer_path, join(dir, sk_proposer_name(i)));
    hardlinkOverwrite(item.pk_proposer_path, join(dir, pk_proposer_name(i)));
    return {
      attester: encodeHex(Deno.readFileSync(item.pk_attester_path)),
      proposer: encodeHex(Deno.readFileSync(item.pk_proposer_path)),
    };
  }
}

export interface HashsigInfo {
  pks: Pubkey[];
  manifest_path: string;
  sk_attester_path(i: number): string;
  pk_attester_path(i: number): string;
  sk_proposer_path(i: number): string;
  pk_proposer_path(i: number): string;
  sk_attester_name(i: number): string;
  sk_proposer_name(i: number): string;
}
export async function hashsig_generate(
  dir: string,
  epochs_log: number,
  count: number,
  signal: AbortSignal,
): Promise<HashsigInfo> {
  const cache = new Cache(epochs_log);
  await cache.generate(count, signal);
  Deno.mkdirSync(dir, { recursive: true });
  const pks = range(count).map((i) => cache.link(dir, i));
  const manifest_path = join(dir, "validator-keys-manifest.yaml");
  Deno.writeTextFileSync(manifest_path, manifest(epochs_log, pks));
  return {
    pks,
    manifest_path,
    sk_attester_path(i: number) {
      return join(dir, sk_attester_name(i));
    },
    pk_attester_path(i: number) {
      return join(dir, pk_attester_name(i));
    },
    sk_proposer_path(i: number) {
      return join(dir, sk_proposer_name(i));
    },
    pk_proposer_path(i: number) {
      return join(dir, pk_proposer_name(i));
    },
    sk_attester_name,
    sk_proposer_name,
  };
}
