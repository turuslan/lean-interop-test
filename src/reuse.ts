export function removePath(path: string, recursive: boolean) {
  try {
    Deno.removeSync(path, { recursive });
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) throw e;
  }
}

export function joinLines(lines: string[]) {
  return lines.join("\n") + "\n";
}

export function range(count: number) {
  const a = new Array(count);
  for (const i of a.keys()) a[i] = i;
  return a;
}

export function tmpDir(dir: string) {
  Deno.mkdirSync(dir, { recursive: true });
  return Deno.makeTempDirSync({ dir });
}

export function hardlinkOverwrite(oldpath: string, newpath: string) {
  removePath(newpath, false);
  Deno.linkSync(oldpath, newpath);
}
