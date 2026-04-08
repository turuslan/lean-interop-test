import { walkSync } from "jsr:@std/fs/walk";
import { join } from "jsr:@std/path/join";
import { ROOT_DIR } from "./docker.ts";
import { withSignal } from "./reuse.ts";
import { runTests } from "./test.ts";

const paths = Array.from(
  walkSync(join(ROOT_DIR, "tests"), { exts: [".ts"] }),
  (e) => e.path,
).sort();

for (const path of paths) {
  await import(path);
}
withSignal(async (abort, signal) => {
  await runTests(signal);
});
