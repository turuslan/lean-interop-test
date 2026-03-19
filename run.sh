#!/bin/bash -e

script_dir=$(readlink -f $(dirname "$0"))

# Project directory inside docker.
docker_dir=/lean-interop-test

# "lean-interop-test-" prefix to detect running tests.
# Random id to allow running tests in parallel.
name=lean-interop-test-$RANDOM

# Mount "/var/run/docker.sock" to start client containers.
# Mount project directory to share genesis and logs across tests and clients.
# Test uses "CONTAINER_NAME" as prefix for child containers.
docker run \
  --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $script_dir:$docker_dir \
  --name $name \
  -e CONTAINER_NAME=$name \
  denoland/deno \
  run -A $docker_dir/src/main.ts
