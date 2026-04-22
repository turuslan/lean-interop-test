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

// TODO: qlean fix git submodule
if (!existsSync(QLEAN_DIR)) {
  console.info(`${QLEAN_DIR} doesn't exist`);
  console.info(`clone repository`);
  // deno-fmt-ignore
  console.info(`  git clone https://github.com/qdrvm/qlean-mini.git ${QLEAN_DIR}`);
  console.info(`or link existing directory`);
  console.info(`  ln -snf QLEAN_DIR ${QLEAN_DIR}`);
  Deno.exit();
}
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
