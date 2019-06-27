#!/bin/bash -e
cd "$(dirname "$0")"

for p in \
  basic \
  ui \
  ui-html \
  ui-react \
;do
  ../bin/figplug -v "$p" &
done

wait
