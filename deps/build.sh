#!/bin/bash -e
cd "$(dirname "$0")"
NMDIR=../node_modules
OUTDIR=.

mkdir -p "$OUTDIR"

function optimize {
  echo "optimizing $1"
  "$NMDIR/.bin/uglifyjs" \
    --compress \
    --toplevel \
    --ecma 7 \
    "--beautify=beautify=true,preserve_line=false,comments=false" \
    -o "$1" \
    -- "$1"
}

# ----------------------------------------------------------------------------
# source-map

SOURCEMAP_NMDIR=$NMDIR
if [ -d "$NMDIR/uglify-es/node_modules/source-map" ]; then
  # uglify-es depends on specific version of source map
  SOURCEMAP_NMDIR=$NMDIR/uglify-es/node_modules
fi
VERSION=$(node -p "require('$SOURCEMAP_NMDIR/source-map/package.json').version")
OUTFILE=$OUTDIR/source-map.js
cat <<_JS_ > "$OUTFILE"
const exports = {}, module = {exports};(function(){
$(cat "$SOURCEMAP_NMDIR/source-map/dist/source-map.js")
}).apply({});
export const SourceMapGenerator = module.exports.SourceMapGenerator;
export const SourceMapConsumer = module.exports.SourceMapConsumer;
export const SourceNode = module.exports.SourceNode;
export default {
  SourceMapGenerator: module.exports.SourceMapGenerator,
  SourceMapConsumer: module.exports.SourceMapConsumer,
  SourceNode: module.exports.SourceNode,
  VERSION: "$VERSION"
}
_JS_
optimize "$OUTFILE" &


# # ----------------------------------------------------------------------------
# # rollup

# VERSION=$(node -p "require('$NMDIR/rollup/package.json').version")
# OUTFILE=$OUTDIR/rollup.js
# cat <<_JS_ > "$OUTFILE"
# const exports = {};
# $(cat "$NMDIR/rollup/dist/rollup.js")
# export default {
#   rollup: exports.rollup,
#   watch: exports.watch,
#   VERSION: "$VERSION"
# }
# _JS_
# optimize "$OUTFILE" &

# ----------------------------------------------------------------------------
# uglify-es

VERSION=$(node -p "require('$NMDIR/uglify-es/package.json').version")
OUTFILE=$OUTDIR/uglify-es.js
# file list extracted from uglify-es/tools/node.js
uglify_src_files=( \
  utils.js \
  ast.js \
  parse.js \
  transform.js \
  scope.js \
  output.js \
  compress.js \
  sourcemap.js \
  mozilla-ast.js \
  propmangle.js \
  minify.js \
)
echo 'import MOZ_SourceMap from "./source-map.js"' > "$OUTFILE"
for f in ${uglify_src_files[@]}; do
  cat "$NMDIR/uglify-es/lib/$f" >> "$OUTFILE"
done
cat <<_JS_ >> "$OUTFILE"
export default {
  TreeWalker,
  parse,
  TreeTransformer,
  Dictionary,
  push_uniq,
  minify,
  ast: {
    $(grep -E 'var AST_.+' "$NMDIR/uglify-es/lib/ast.js" \
      | sort -u \
      | sed -E 's/var AST_([a-zA-Z0-9_]+).+/    \1: AST_\1,/g')
  },
};
_JS_
optimize "$OUTFILE" &

# ----------------------------------------------------------------------------
# wait for all processes to finish
wait

# ----------------------------------------------------------------------------
# remove embedded source code from sourcemap

# echo "patching sourcemaps"
# node <<_JS_
# const fs = require('fs')
# for (let file of [
#   'uglify-es.js.map',
#   'uglify-es.umd.js.map',
# ]) {
#   const map = JSON.parse(fs.readFileSync(file, 'utf8'))
#   if (map.sourcesContent) {
#     delete map.sourcesContent
#     fs.writeFileSync(file, JSON.stringify(map), 'utf8')
#   }
# }
# _JS_
