import { LOCAL_DIR, run } from "./local.ts";
import { existsSync } from "jsr:@std/fs/exists";
import { join } from "jsr:@std/path/join";

const VENV_DIR = join(LOCAL_DIR, "qlean-venv");
export const CMAKE_EXE = join(VENV_DIR, "bin/cmake");

if (!existsSync(VENV_DIR)) {
  run(["python3", "-m", "venv", VENV_DIR]);
}
if (!existsSync(CMAKE_EXE)) {
  run([join(VENV_DIR, "bin/pip3"), "install", "cmake"]);
}
