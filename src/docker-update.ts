import { walkSync } from "jsr:@std/fs/walk";
import { join } from "jsr:@std/path/join";
import { parse_ref, ROOT_DIR } from "./docker.ts";
import { TestClientArg } from "./test.ts";

const paths = Array.from(
  walkSync(join(ROOT_DIR, "clients"), { exts: [".ts"] }),
  (e) => e.path,
).sort();

function inspect(ref: { full: string; tag: string }) {
  const r = new Deno.Command("docker", {
    args: [
      "buildx",
      "imagetools",
      "inspect",
      "--raw",
      `${ref.full}:${ref.tag}`,
    ],
  }).outputSync();
  const json = JSON.parse(new TextDecoder().decode(r.stdout));
  if (
    json.mediaType === "application/vnd.oci.image.index.v1+json" ||
    json.mediaType ===
      "application/vnd.docker.distribution.manifest.list.v2+json"
  ) {
    const manifests = json.manifests.filter((x: any) =>
      (x.mediaType === "application/vnd.oci.image.manifest.v1+json" ||
        x.mediaType ===
          "application/vnd.docker.distribution.manifest.v2+json") &&
      x.platform?.architecture === "amd64"
    );
    if (manifests.length === 1) {
      return `${ref.full}:${ref.tag}@${manifests[0].digest}`;
    }
  }
  console.info("TODO", ref);
  console.info(json);
}

for (const path of paths) {
  const client: TestClientArg = await import(path);
  const ref = parse_ref(client.DOCKER_IMAGE);
  const latest = inspect(ref);
  if (latest !== client.DOCKER_IMAGE) {
    console.info(`${path}`);
    console.info(`export const DOCKER_IMAGE = "${latest}";`);
    console.info();
  }
}
