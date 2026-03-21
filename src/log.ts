import { TextLineStream } from "jsr:@std/streams/text-line-stream";
import { BufWriterSync } from "https://deno.land/std@0.224.0/io/buf_writer.ts";
import ansiRegex from "./chalk/ansi-regex.ts";

const BUFFER_SIZE = 1 << 20; // 1MB
const FLUSH_INTERVAL = 5 * 1000; // 5s

const ansi_regex = ansiRegex();
function removeAnsi(s: string) {
  return s.replaceAll(ansi_regex, "");
}

export type LogFn = (line: string) => void;

const text_encoder = new TextEncoder();

interface LogFile {
  log: LogFn;
  close(): void;
}
export function logFile(path: string): LogFile {
  const file = Deno.openSync(path, {
    write: true,
    create: true,
    truncate: true,
  });
  const buf = new BufWriterSync(file, BUFFER_SIZE);
  function log(line: string) {
    buf.writeSync(text_encoder.encode(removeAnsi(line) + "\n"));
  }
  const flush_timer = setInterval(() => buf.flush(), FLUSH_INTERVAL);
  return {
    log,
    close() {
      clearInterval(flush_timer);
      buf.flush();
      file.close();
    },
  };
}

export async function logProcess(
  process: Deno.ChildProcess,
  log: LogFn,
) {
  await Promise.all([process.stdout, process.stderr].map(async (stream) => {
    for await (
      const line of stream
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream())
        .values()
    ) {
      log(line);
    }
  }));
}
