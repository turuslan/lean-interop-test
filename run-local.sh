#!/bin/bash -e

script_dir=$(readlink -f $(dirname "$0"))

export CONTAINER_NAME=local
export LOCAL_BINARY_ETHLAMBDA=${LOCAL_BINARY_ETHLAMBDA:-$script_dir/local/ethlambda/target/release/ethlambda}
export LOCAL_BINARY_QLEAN=${LOCAL_BINARY_QLEAN:-$script_dir/local/qlean/build/out/bin/qlean}
deno run -A src/main.ts
