#!/bin/bash -e
cd "$(dirname "$0")"

# test project definitions
test_projects=( \
  # dir             : init args
  "simple           :           " \
  "ui               : -ui       " \
  "ui-html          : -html     " \
  "ui-react         : -react    " \
)

# examples (in the "examples" directory) to build in addition to test_projects
build_examples=( \
  basic          \
  ui             \
  ui-html        \
)

# ----------------------------------------------------------------------------
# parse CLI options

KEEP_WORKING_DIRS=false
if [[ "$1" == "-h"* ]] || [[ "$1" == "--h"* ]]; then
  echo "usage: $0  [-h | --keep-working-dirs]  [bin/figplug.g | bin/figplug]"
  exit 1
elif [[ "$1" == "--keep-working-dirs" ]]; then
  KEEP_WORKING_DIRS=true
  shift
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


# ----------------------------------------------------------------------------
# parse test_projects into two tandem arrays
pdirs=()
pargs=()
for e in "${test_projects[@]}"; do
  pdirs+=( "$(echo "${e%%:*}" | xargs)" )
  args=""; for arg in $(echo "${e#*:}" | xargs); do args+=" $arg"; done
  pargs+=( "$args" )
done
# We can now iterate over the projects like this:
# for (( i=0; i<=$(( ${#pdirs[*]} -1 )); i++ )); do
#   echo "${pdirs[$i]} :${pargs[$i]};"
# done


# ----------------------------------------------------------------------------
# we need two temporary directories:
# 1. for the package installation
# 2. for test projects
tmpdir1=$(mktemp -d -t figplug-test-pkg)
tmpdir2=$(mktemp -d -t figplug-test-proj)

# remove temporary directories on exit
function atexit {
  if $KEEP_WORKING_DIRS; then
    echo "working directories left intact:"
    echo "package:  $tmpdir1/figplug"
    echo "projects: $tmpdir2"
  else
    # echo "cleaning up"
    rm -rf "$tmpdir1" "$tmpdir2"
  fi
}
trap atexit EXIT


# install package in isolated temporary directory tmpdir1
echo "using package working directory ${tmpdir1}"
cd "$tmpdir1"
if ! (npm pack "$SRCDIR" > /dev/null 2>&1); then  # very noisy
  # repeat to print errors
  npm pack "$SRCDIR"
  exit 1
fi
TAR_FILE=$(echo figplug-*.tgz)
tar xzf "$TAR_FILE"
mv package figplug
cd figplug
npm install --only=prod --no-package-lock --no-optional --no-shrinkwrap --no-audit
if [[ "$PROG" == "bin/figplug.g" ]]; then
  cp -a "$SRCDIR/bin/figplug.g" bin/figplug.g
fi
FIGPLUG_NAME=$(basename "$PROG")
FIGPLUG=$PWD/bin/$FIGPLUG_NAME


# create test projects in tmpdir2
echo "using project working directory ${tmpdir2}"
echo "using figplug installed at $FIGPLUG"
cd "$tmpdir2" ; echo cd "$tmpdir2"
for (( i=0; i<=$(( ${#pdirs[*]} -1 )); i++ )); do
  args="init -v ${pargs[$i]} ${pdirs[$i]}"
  echo ">> $FIGPLUG_NAME $args"
  "$FIGPLUG" $args
done

# build test projects
for dir in ${pdirs[@]}; do
  args="build -v $dir"
  echo ">> $FIGPLUG_NAME $args"
  "$FIGPLUG" $args
done

# build examples
cd "$tmpdir1/figplug" ; echo cd "$tmpdir1/figplug"
for dir in ${build_examples[@]}; do
  args="build -v examples/$dir"
  echo ">> $FIGPLUG_NAME $args"
  "$FIGPLUG" $args
done


echo "————————————————————————————————————————"
echo "tests OK"
echo "————————————————————————————————————————"

#popd >/dev/null  # back to ./build
#popd >/dev/null  # back to .
