#!/bin/bash -e
cd "$(dirname "$0")/.."
SRCDIR=$PWD

./build.js -O

rm -rf build/npm-package
mkdir -p build/npm-package
pushd build/npm-package > /dev/null

if ! (npm pack "$SRCDIR" > /dev/null 2>&1); then  # very noisy
  # repeat to print errors
  npm pack "$SRCDIR"
  exit 1
fi
TAR_FILE=$(echo figplug-*.tgz)
npm uninstall -g figplug
npm install -g "$TAR_FILE"

echo "Installed local version globally as figplug."
echo "To uninstall:  npm uninstall -g figplug"

popd > /dev/null
