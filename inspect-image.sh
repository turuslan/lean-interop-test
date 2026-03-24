#!/bin/bash -e

docker buildx imagetools inspect --raw $1
