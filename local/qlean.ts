import { LOCAL_DIR, run } from "./local.ts";
import { CMAKE_EXE } from "./cmake.ts";
import { existsSync } from "jsr:@std/fs/exists";
import { join } from "jsr:@std/path/join";

const QLEAN_DIR = join(LOCAL_DIR, "qlean");
const BUILD_DIR = join(QLEAN_DIR, "build");
const VCPKG_DIR = join(LOCAL_DIR, "qlean-vcpkg");
const env_gcc_14: Record<string, string> = Deno.build.os === "linux"
  ? { CXX: "g++-14" }
  : {};

if (!existsSync(join(VCPKG_DIR, "vcpkg"))) {
  run([join(VCPKG_DIR, "bootstrap-vcpkg.sh"), "-disableMetrics"]);
}
if (!existsSync(BUILD_DIR)) {
  run([CMAKE_EXE, "--preset=default"], {
    env: { ...env_gcc_14, VCPKG_ROOT: VCPKG_DIR },
    cwd: QLEAN_DIR,
  });
}
run(["ninja", "-C", BUILD_DIR, "qlean"], { env: { ...env_gcc_14 } });
