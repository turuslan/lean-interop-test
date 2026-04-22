import { LOCAL_DIR, run } from "./local.ts";
import { join } from "jsr:@std/path/join";

const ETHLAMBDA_DIR = join(LOCAL_DIR, "ethlambda");

run(["cargo", "build", "--release"], { cwd: ETHLAMBDA_DIR });
