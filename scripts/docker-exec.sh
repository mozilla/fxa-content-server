#!/usr/bin/env bash

if [ "$1" == "test" ]; then
  exec npm test
elif [ "$1" == "web" ]; then
  exec node server/bin/fxa-content-server.js
else
  echo "unknown mode: $1"
  exit 1
fi
