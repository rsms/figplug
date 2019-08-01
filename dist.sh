#!/bin/bash -e
cd "$(dirname "$0")"

rm -rf build/*
rm bin/figplug bin/figplug.map

echo "building bin/figplug"
./build.js -O

echo "testing figplug"
./test.sh


# # Create package that can be installed with `npm install url`
# pushd build >/dev/null
# rm -rf figplug-*.tgz package
# echo "npm pack"
# if ! (npm pack .. > /dev/null 2>&1); then  # very noisy
#   # repeat to print errors
#   npm pack ..
#   exit 1
# fi
# TAR_FILE=$(echo figplug-*.tgz)
# popd >/dev/null  # back to .
# DIST_FILE=fp-$(echo "$TAR_FILE" | sed 's/^figplug-//g')
# if [ -f "docs/$DIST_FILE" ]; then
#   echo "Package docs/$DIST_FILE already exists. You can manually replace it:" >&2
#   echo "  cp -va 'build/$TAR_FILE' 'docs/$DIST_FILE'" >&2
#   exit 1
# fi
# cp -va "build/$TAR_FILE" "docs/$DIST_FILE"


echo ""
echo "Finally, run npm publish when ready:"
echo ""
echo "npm publish ."
echo ""
