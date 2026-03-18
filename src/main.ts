const CONTAINER_NAME = Deno.env.get("CONTAINER_NAME");
if (CONTAINER_NAME === undefined) {
  console.info("CONTAINER_NAME env is missing");
  Deno.exit();
}

console.info("TODO");
