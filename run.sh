#!/bin/bash -e

script_dir=$(readlink -f $(dirname "$0"))

# Project directory outside docker.
host_dir=$script_dir

# Project directory inside docker.
docker_dir=/lean-interop-test

# "lean-interop-test-" prefix to detect running tests.
# Random id to allow running tests in parallel.
name=lean-interop-test-$RANDOM

# "--use-api-socket" to start client containers.
# Mount project directory to share genesis and logs across tests and clients.
# Test uses "CONTAINER_NAME" as prefix for child containers.
# Test uses "CONTAINER_DIR" to mount directory for child containers.
docker run \
  --rm \
  --use-api-socket \
  -v $script_dir:$docker_dir \
  --name $name \
  -e DENO_DIR=$docker_dir/cache/deno-cache \
  -e CONTAINER_NAME=$name \
  -e CONTAINER_DIR=$host_dir \
  denoland/deno \
  run -A $docker_dir/src/main.ts
