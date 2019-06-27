#!/bin/bash -e
cd "$(dirname "$0")"

./build.js -O

echo "testing figplug by building examples"
./bin/figplug build examples/basic
./bin/figplug build examples/ui
./bin/figplug build examples/ui-html

echo "npm pack"
pushd build >/dev/null
rm -rf figplug-*.tgz package
npm pack ..
TAR_FILE=$(echo figplug-*.tgz)
tar xzf "$TAR_FILE"

pushd package >/dev/null
ZIP_FILE=$(echo "$TAR_FILE" | sed 's/.tgz//g').zip
zip -q -X -r "../$ZIP_FILE" *
popd >/dev/null

popd >/dev/null

echo "created build/$ZIP_FILE"

if [ -f "docs/dist/$ZIP_FILE" ]; then
  echo "docs/dist/$ZIP_FILE already exists -- cowardly refusing to overwrite" >&2
  exit 1
fi

cp -a "build/$ZIP_FILE" "docs/dist/$ZIP_FILE"

echo ""
echo "Remember to update the download link in docs/index.html"
echo ""
