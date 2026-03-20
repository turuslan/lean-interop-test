import { join } from "jsr:@std/path/join";
import { hardlinkOverwrite, joinLines, range, tmpDir } from "./reuse.ts";
import { docker_run, dockerName, pathInDocker, ROOT_DIR } from "./docker.ts";
import { existsSync } from "jsr:@std/fs/exists";
import { encodeHex } from "jsr:@std/encoding/hex";

const DOCKER_IMAGE =
  "docker.io/blockblaz/hash-sig-cli:devnet2@sha256:defb9b28094e408932b7a71634dd3ab15634a804ed24264395115ce3911f40b8";

function pk_name(i: number) {
  return `validator_${i}_pk.ssz`;
}
function sk_name(i: number) {
  return `validator_${i}_sk.ssz`;
}

function manifest(epochs_log: number, pks: string[]) {
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
      `    pubkey_hex: 0x${pk}`,
      `    privkey_file: ${sk_name(i)}`,
    ]),
  ]);
}

interface CacheItem {
  dir: string;
  exists: boolean;
  sk_name: string;
  sk_path: string;
  pk_name: string;
  pk_path: string;
}
class Cache {
  dir: string;
  constructor(public epochs_log: number) {
    this.dir = join(ROOT_DIR, `cache/hashsig-keys/${epochs_log}`);
    Deno.mkdirSync(this.dir, { recursive: true });
  }
  cacheItem(i: number): CacheItem {
    const dir = join(this.dir, `${i}`);
    const sk_name = "sk.ssz", pk_name = "pk.ssz";
    return {
      dir,
      exists: existsSync(dir),
      sk_name,
      sk_path: join(dir, sk_name),
      pk_name,
      pk_path: join(dir, pk_name),
    };
  }
  async generate(count: number, signal: AbortSignal) {
    const missing = range(count).map((i) => this.cacheItem(i))
      .filter((item) => !item.exists);
    if (missing.length === 0) return;
    console.info(`generating ${missing.length} more hashsig keys`);
    const tmp_dir = tmpDir(join(ROOT_DIR, "cache/hashsig-tmp"));
    try {
      await docker_run(dockerName(), DOCKER_IMAGE, [
        "/usr/local/bin/hashsig",
        "generate",
        ...["--num-validators", `${missing.length}`],
        ...["--log-num-active-epochs", `${this.epochs_log}`],
        ...[
          "--output-dir",
          pathInDocker(tmp_dir),
        ],
        ...["--export-format", "ssz"],
      ], signal);
      for (const [i, item] of missing.entries()) {
        const tmp_item = join(tmp_dir, "item");
        Deno.mkdirSync(tmp_item, { recursive: true });
        Deno.renameSync(
          join(tmp_dir, sk_name(i)),
          join(tmp_item, item.sk_name),
        );
        Deno.renameSync(
          join(tmp_dir, pk_name(i)),
          join(tmp_item, item.pk_name),
        );
        Deno.renameSync(tmp_item, item.dir);
      }
    } finally {
      Deno.removeSync(tmp_dir, { recursive: true });
    }
  }
  link(dir: string, i: number) {
    const item = this.cacheItem(i);
    hardlinkOverwrite(item.sk_path, join(dir, sk_name(i)));
    hardlinkOverwrite(item.pk_path, join(dir, pk_name(i)));
    const pk = encodeHex(Deno.readFileSync(item.pk_path));
    return pk;
  }
}

export async function hashsig_generate(
  dir: string,
  epochs_log: number,
  count: number,
  signal: AbortSignal,
) {
  const cache = new Cache(epochs_log);
  await cache.generate(count, signal);
  Deno.mkdirSync(dir, { recursive: true });
  const pks = range(count).map((i) => cache.link(dir, i));
  const manifest_path = join(dir, "validator-keys-manifest.yaml");
  Deno.writeTextFileSync(manifest_path, manifest(epochs_log, pks));
  return {
    pks,
    manifest_path,
    sk_path(i: number) {
      return join(dir, sk_name(i));
    },
    pk_path(i: number) {
      return join(dir, pk_name(i));
    },
  };
}
