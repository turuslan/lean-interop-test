export const LOCAL_DIR = import.meta.dirname!;

export function run(
  cmd: string[],
  opt?: { cwd?: string; env?: Record<string, string> },
) {
  const result = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd: opt?.cwd,
    stdout: "inherit",
    stderr: "inherit",
    env: opt?.env,
  }).outputSync();
  if (!result.success) {
    throw new Error(
      `${JSON.stringify(cmd)}: ${
        JSON.stringify({ code: result.code, signal: result.signal })
      }`,
    );
  }
}
