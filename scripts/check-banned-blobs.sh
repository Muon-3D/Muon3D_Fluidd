#!/bin/sh
# Fail if any blob listed in the banned list is reachable from the given
# rev-list arguments (KAN-2048).
#
# usage: check-banned-blobs.sh <rev-list args...>
#   e.g. check-banned-blobs.sh origin/develop..HEAD
#        check-banned-blobs.sh HEAD --not --remotes
# env:   BANNED_BLOBS_FILE  list of banned ids (default: banned-blobs.txt
#                           next to this script)
# exit:  0 clean, 1 a banned blob was found, 2 usage or setup error
set -eu

here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
banned=${BANNED_BLOBS_FILE:-$here/banned-blobs.txt}

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <rev-list args...>" >&2
  exit 2
fi
if [ ! -f "$banned" ]; then
  echo "check-banned-blobs: list not found: $banned" >&2
  exit 2
fi

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT HUP INT TERM

# Normalised ids: 40 hex characters, lower case, comments and blanks dropped.
grep -E '^[0-9a-fA-F]{40}[[:space:]]*$' "$banned" | tr 'A-F' 'a-f' | tr -d ' \t\r' > "$tmp" || true
if [ ! -s "$tmp" ]; then
  echo "check-banned-blobs: no ids in $banned" >&2
  exit 2
fi

# Blob ids reachable in the range; a failing git command must fail the check.
objs=$(git rev-list --objects "$@")
hits=$(printf '%s\n' "$objs" \
  | awk 'NF { print $1 }' \
  | git cat-file --batch-check='%(objecttype) %(objectname)' \
  | awk '$1 == "blob" { print $2 }' \
  | sort -u \
  | grep -F -x -f "$tmp" || true)

if [ -n "$hits" ]; then
  echo "check-banned-blobs: banned blob(s) in the pushed history:" >&2
  printf '%s\n' "$hits" | sed 's/^/  /' >&2
  echo "Rebase onto the rewritten origin/develop; do not push the old history." >&2
  exit 1
fi
exit 0
