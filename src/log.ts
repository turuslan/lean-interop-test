import { TextLineStream } from "jsr:@std/streams/text-line-stream";
import ansiRegex from "./chalk/ansi-regex.ts";

const ansi_regex = ansiRegex();
function removeAnsi(s: string) {
  return s.replaceAll(ansi_regex, "");
}

interface LogFile {
  log(line: string): void;
  close(): Promise<void>;
}
export function logFile(path: string): LogFile {
  const file = Deno.openSync(path, {
    write: true,
    create: true,
    truncate: true,
  });
  const text_stream = new TextEncoderStream();
  const text_writer = text_stream.writable.getWriter();
  const pipe_promise = text_stream.readable.pipeTo(file.writable);
  function log(line: string) {
    text_writer.write(removeAnsi(line) + "\n");
  }
  return {
    log,
    async close() {
      await text_writer.close();
      await pipe_promise;
    },
  };
}

export async function logProcess(
  process: Deno.ChildProcess,
  log: (line: string) => void,
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
