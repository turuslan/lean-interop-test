import { LOCAL_DIR, run } from "./local.ts";
import { join } from "jsr:@std/path/join";

const GRANDINE_DIR = join(LOCAL_DIR, "grandine");

run(["cargo", "build", "--release"], {
  cwd: join(GRANDINE_DIR, "lean_client"),
});
