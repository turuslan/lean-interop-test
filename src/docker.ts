import { dirname } from "jsr:@std/path/dirname";
import { common } from "jsr:@std/path/common";
import { join } from "jsr:@std/path/join";
import { relative } from "jsr:@std/path/relative";

export const ROOT_DIR_IN_DOCKER = "/lean-interop-test";
export const ROOT_DIR = dirname(import.meta.dirname!);

export function pathInDocker(path: string) {
  if (common([path, ROOT_DIR_IN_DOCKER]) === ROOT_DIR_IN_DOCKER) return path;
  if (common([path, ROOT_DIR]) !== ROOT_DIR) throw new Error(path);
  return join(ROOT_DIR_IN_DOCKER, relative(ROOT_DIR, path));
}

const http_client = Deno.createHttpClient({
  proxy: { transport: "unix", path: "/var/run/docker.sock" },
});

async function http(
  method: "GET" | "POST" | "DELETE",
  path: string,
  {
    query,
    json,
    expect_ok = true,
    expect_json = true,
    signal,
  }: {
    query?: any;
    json?: any;
    expect_ok?: boolean;
    expect_json?: boolean;
    signal?: AbortSignal;
  } = {},
) {
  const url = new URL(path, "http://localhost/");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v as any);
    }
  }
  const res = await fetch(url, {
    client: http_client,
    method,
    ...json
      ? {
        body: JSON.stringify(json),
        headers: { "Content-Type": "application/json" },
      }
      : {},
    ...signal ? { signal } : {},
  });
  if (expect_ok && !res.ok) {
    console.warn(`${method} ${url.pathname}${url.search} = ${res.status}`);
    console.warn(await res.text());
    throw new Error();
  }
  if (expect_json) {
    return await res.json();
  }
  return await res.text();
}

function parse_ref(image: string) {
  const m_hash = image.match(/^([^@]+)(?:@(sha256:.+))?$/);
  if (!m_hash) throw new Error(image);
  const m_tag = m_hash[1].match(/^(.+?)(?::([^:]+))?$/);
  if (!m_tag) throw new Error(image);
  const parts = m_tag[1].split("/");
  if (parts.length > 3) throw new Error(image);
  if (parts.some((x) => x.length === 0)) throw new Error(image);
  if (parts.length === 1) parts.unshift("library");
  if (parts.length === 2) parts.unshift("docker.io");
  return {
    full: parts.join("/"),
    tag: m_tag[2] ?? "latest",
    hash: m_hash[2] ?? null,
  };
}

export async function docker_pull(image: string, signal: AbortSignal) {
  const ref = parse_ref(image);
  await http("POST", "/images/create", {
    query: { fromImage: ref.full, tag: ref.hash ?? ref.tag },
    expect_json: false,
    signal,
  });
}

let docker_next_id = 0;
export function dockerName() {
  const CONTAINER_NAME = Deno.env.get("CONTAINER_NAME");
  if (CONTAINER_NAME === undefined) {
    throw new Error("CONTAINER_NAME env is missing");
  }
  return `${CONTAINER_NAME}-${docker_next_id++}`;
}

export async function docker_stop(name: string) {
  try {
    await http("DELETE", `/containers/${name}`, {
      query: { force: 1 },
      expect_ok: false,
      expect_json: false,
    });
  } catch {
  }
}

export async function docker_run(
  name: string,
  image: string,
  cmd: string[],
  signal: AbortSignal,
) {
  const CONTAINER_DIR = Deno.env.get("CONTAINER_DIR");
  if (CONTAINER_DIR === undefined) {
    throw new Error("CONTAINER_DIR env is missing");
  }
  try {
    await http("POST", "/containers/create", {
      query: { name },
      json: {
        ...{
          User: `${Deno.uid()}:${Deno.gid()}`,
          Image: image,
          Entrypoint: cmd,
        },
        HostConfig: {
          AutoRemove: true,
          Binds: [`${CONTAINER_DIR}:${ROOT_DIR_IN_DOCKER}`],
        },
      },
    });
    await http("POST", `/containers/${name}/start`, { expect_json: false });
    await http("POST", `/containers/${name}/wait`, {
      query: { condition: "removed" },
      signal,
    });
  } finally {
    await docker_stop(name);
    signal.throwIfAborted();
  }
}
