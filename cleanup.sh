#!/bin/bash -e

# "run.sh" starts parent "lean-interop-test-PARENT" container,
# which starts child "lean-interop-test-PARENT-CHILD" containers.
# Usually parent container should stops all children containers.
# Use this script to cleanup lost child containers.

# get all "lean-interop-test-*" containers
containers=$(docker ps -a --format '{{.Names}}' | grep -P '^lean-interop-test-' || true)

# get all running "lean-interop-test-PARENT" parent containers
parents=$(docker ps --format '{{.Names}}' | grep -P '^lean-interop-test-\d+$' || true)

# assume all containers without parent lost
lost=$containers

# for each active parent
for parent in $parents; do
  # remove parent and its children from lost list
  lost=$(echo "$lost" | grep -v -e "^$parent$" -e "^$parent-" || true)
done

# stop lost child containers
if [[ "$lost" != "" ]]; then
  docker rm -f $lost
fi
