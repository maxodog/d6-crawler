#!/bin/bash
# corre todas las pruebas; muestra las que fallan
cd /home/claude/d6-crawler/test
FAIL=0
for f in *_test.py *_test.js; do
  case $f in end_shots.py|ui_test.py) continue;; esac
  if [[ $f == *.py ]]; then out=$(timeout 300 python3 $f 2>&1); else out=$(timeout 300 node $f 2>&1); fi
  rc=$?
  if [ $rc -ne 0 ] || echo "$out" | grep -qiE "\bFAIL|Traceback|AssertionError|Error:"; then FAIL=1; echo "== $f (rc=$rc)"; echo "$out" | tail -6; fi
done
echo "FAIL=$FAIL"
