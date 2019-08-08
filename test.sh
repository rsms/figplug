#!/bin/bash -e
cd "$(dirname "$0")"

if [[ "$1" == "-h"* ]] || [[ "$1" == "--h"* ]]; then
  echo "usage: $0 [-h | bin/figplug.g | bin/figplug]"
  exit 1
fi

SRCDIR=$PWD

PROG=bin/figplug
if [ "$1" != "" ]; then
  PROG=$1
fi
if ! [ -f "$PROG" ]; then
  if [[ "$PROG" == "bin/figplug.g" ]]; then
    ./build.js
  elif [[ "$PROG" == "bin/figplug" ]]; then
    ./build.js -O
  else
    echo "unknown program $PROG" >&2
    exit 1
  fi
fi

tmpdir=$(mktemp -d -t figplug-test)
echo "using working directory ${tmpdir}"
rm -f test-dir
ln -s test-dir "${tmpdir}"

pushd "$tmpdir" >/dev/null

# package
if ! (npm pack "$SRCDIR" > /dev/null 2>&1); then  # very noisy
  # repeat to print errors
  npm pack "$SRCDIR"
  exit 1
fi
TAR_FILE=$(echo figplug-*.tgz)
tar xzf "$TAR_FILE"

pushd package >/dev/null
# >>> at tmpdir/package

npm install --only=prod

if [[ "$PROG" == "bin/figplug.g" ]]; then
  cp -a "$SRCDIR/bin/figplug.g" bin/figplug.g
fi

# test program in package
echo ">> $PROG init -v build/simple";                 ./$PROG init -v               build/simple
echo ">> $PROG init -v -ui build/ui";                 ./$PROG init -v -ui           build/ui
echo ">> $PROG init -v -html build/ui-html";          ./$PROG init -v -html         build/ui-html
echo ">> $PROG init -v -react build/ui-react";        ./$PROG init -v -react        build/ui-react
echo ">> $PROG init -v -react -force build/ui-react"; ./$PROG init -v -react -force build/ui-react

for d in \
  build/simple \
  build/ui \
  build/ui-html \
  build/ui-react \
  examples/basic \
  examples/ui \
  examples/ui-html \
; do
  echo ">> $PROG build $d"
  ./$PROG build -v $d
done

echo "cleaning up working directory $tmpdir"
rm -rf "$tmpdir"

echo "————————————————————————————————————————"
echo "tests OK"
echo "————————————————————————————————————————"

#popd >/dev/null  # back to ./build
#popd >/dev/null  # back to .
