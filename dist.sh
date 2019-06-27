#!/bin/bash -e
cd "$(dirname "$0")"

echo "building bin/figplug"
./build.js -O

echo "testing figplug"
./test.sh

pushd build >/dev/null
rm -rf figplug-*.tgz package
echo "npm pack"
if ! (npm pack .. > /dev/null 2>&1); then  # very noisy
  # repeat to print errors
  npm pack ..
  exit 1
fi
TAR_FILE=$(echo figplug-*.tgz)

# tar xzf "$TAR_FILE"
# pushd package >/dev/null
# ZIP_FILE=$(echo "$TAR_FILE" | sed 's/.tgz//g').zip
# echo "write build/${ZIP_FILE}"
# zip -q -X -r "../$ZIP_FILE" *
# popd >/dev/null  # back to ./build

popd >/dev/null  # back to .

# cp -a "build/$ZIP_FILE" "docs/dist/figplug.zip"

DIST_FILE=fp-$(echo "$TAR_FILE" | sed 's/^figplug-//g')

if [ -f "docs/$DIST_FILE" ]; then
  echo "Package docs/$DIST_FILE already exists. You can manually replace it:" >&2
  echo "  cp -va 'build/$TAR_FILE' 'docs/$DIST_FILE'" >&2
  exit 1
fi

cp -va "build/$TAR_FILE" "docs/$DIST_FILE"

echo ""
echo "Remember to update the download link in docs/index.html"
echo ""
