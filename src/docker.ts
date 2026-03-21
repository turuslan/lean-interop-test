import { dirname } from "jsr:@std/path/dirname";
import { common } from "jsr:@std/path/common";
import { join } from "jsr:@std/path/join";
import { relative } from "jsr:@std/path/relative";
import { logFile, LogFn } from "./log.ts";
import { Buffer } from "jsr:@std/io/buffer";
import { TextLineStream } from "jsr:@std/streams/text-line-stream";

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
    expect_raw,
    signal,
  }: {
    query?: any;
    json?: any;
    expect_ok?: boolean;
    expect_json?: boolean;
    expect_raw?: boolean;
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
  if (expect_raw) {
    return res;
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

export async function docker_pull_many(images: string[], signal: AbortSignal) {
  for (const image of new Set(images)) {
    await docker_pull(image, signal);
  }
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

async function demux(
  readable: ReadableStream<Uint8Array>,
  log: LogFn,
) {
  const buffer = new Buffer();
  const stdout = new TransformStream();
  const stdout_writer = stdout.writable.getWriter();
  const stderr = new TransformStream();
  const stderr_writer = stderr.writable.getWriter();
  await Promise.all([
    readable.pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          buffer.writeSync(chunk);
          while (true) {
            const buffered = buffer.bytes({ copy: false });
            if (buffered.length < 8) break;
            const stream_id = buffered[0];
            if (stream_id < 1 || stream_id > 3) {
              return controller.error(
                new Error(`demux unexpected stream id ${stream_id}`),
              );
            }
            const size = new DataView(
              buffered.buffer,
              buffered.byteOffset,
              buffered.byteLength,
            ).getUint32(4);
            const row_size = 8 + size;
            if (buffered.length < row_size) break;
            await (stream_id === 1 ? stdout_writer : stderr_writer)
              .write(buffered.slice(8, row_size));
            buffer.readSync({
              byteLength: row_size,
              set(src: any, offset: any) {},
            } as any);
          }
        },
        async close() {
          await Promise.all([stdout_writer.close(), stderr_writer.close()]);
        },
      }),
    ),
    ...[stdout, stderr].map((s) =>
      s.readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .pipeTo(
          new WritableStream({
            write(line) {
              log(line);
            },
          }),
        )
    ),
  ]);
}

async function dockerLog(
  name: string,
  log: LogFn,
) {
  const res: Response = await http("GET", `/containers/${name}/logs`, {
    query: { follow: 1, stdout: 1, stderr: 1 },
    expect_raw: true,
  });
  await demux(res.body!, log);
}

export async function docker_run(
  name: string,
  image: string,
  cmd: string[],
  log: LogFn,
  signal: AbortSignal,
) {
  const CONTAINER_DIR = Deno.env.get("CONTAINER_DIR");
  if (CONTAINER_DIR === undefined) {
    throw new Error("CONTAINER_DIR env is missing");
  }
  let logs_promise = Promise.resolve();
  let exit_msg = "start error";
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
          NetworkMode: "host",
          SecurityOpt: ["seccomp=unconfined"],
        },
      },
      signal,
    });
    log(`START ${JSON.stringify(cmd)}`);
    await http("POST", `/containers/${name}/start`, {
      expect_json: false,
      signal,
    });
    logs_promise = dockerLog(name, log);
    const status = await http("POST", `/containers/${name}/wait`, {
      query: { condition: "removed" },
      signal,
    });
    exit_msg = JSON.stringify(status);
  } finally {
    await docker_stop(name);
    await logs_promise;
    log(`EXIT ${exit_msg}`);
    signal.throwIfAborted();
  }
}
