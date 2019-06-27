#!/bin/bash -e
cd "$(dirname "$0")"

./build.js -O

ZD=
pushd "$ZD" >/dev/null
zip -q -X -r "../../../$@" *
popd >/dev/null
