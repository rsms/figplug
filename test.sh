#!/bin/bash -e
cd "$(dirname "$0")"

if [[ "$1" == "-h"* ]] || [[ "$1" == "--h"* ]]; then
  echo "usage: $0 [-h | bin/figplug.g | bin/figplug]"
  exit 1
fi

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

pushd build >/dev/null
# >>> at ./build

# cleanup from previous builds
rm -rf figplug-*.tgz package

# package
if ! (npm pack .. > /dev/null 2>&1); then  # very noisy
  # repeat to print errors
  npm pack ..
  exit 1
fi

# extract
TAR_FILE=$(echo figplug-*.tgz)
tar xzf "$TAR_FILE"

rm -rf package-test
cp -a package package-test

pushd package-test >/dev/null
# >>> at ./build/package-test

if [[ "$PROG" == "bin/figplug.g" ]]; then
  cp -a ../../bin/figplug.g bin/figplug.g
fi

# test program in package
echo ">> $PROG init -v build/simple";                 ./$PROG init -v build/simple
echo ">> $PROG init -v -ui build/ui";                 ./$PROG init -v -ui build/ui
echo ">> $PROG init -v -html build/ui-html";          ./$PROG init -v -html build/ui-html
echo ">> $PROG init -v -react build/ui-react";        ./$PROG init -v -react build/ui-react
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

echo "————————————————————————————————————————"
echo "tests OK"
echo "————————————————————————————————————————"

#popd >/dev/null  # back to ./build
#popd >/dev/null  # back to .
