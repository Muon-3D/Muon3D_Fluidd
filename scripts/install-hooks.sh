#!/bin/sh
# Install a pre-push hook that refuses banned blobs (KAN-2048).
#
# usage: scripts/install-hooks.sh [repo-dir]   (default: current directory)
#
# The script and the banned list are copied into the hooks directory, so the
# guard also works on old branches that lack scripts/. Worktrees share the
# hooks of their main repository. An existing pre-push hook is kept as
# pre-push.local and still runs.
set -eu

src=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo=${1:-.}

hooks=$(git -C "$repo" rev-parse --git-path hooks)
case $hooks in
  /* | [A-Za-z]:*) ;;
  *) hooks=$(CDPATH= cd -- "$repo" && pwd)/$hooks ;;
esac
mkdir -p "$hooks"

cp "$src/check-banned-blobs.sh" "$hooks/check-banned-blobs.sh"
cp "$src/banned-blobs.txt" "$hooks/banned-blobs.txt"
chmod +x "$hooks/check-banned-blobs.sh"

if [ -f "$hooks/pre-push" ] && ! grep -q 'KAN-2048 banned-blob guard' "$hooks/pre-push"; then
  mv "$hooks/pre-push" "$hooks/pre-push.local"
fi

cat > "$hooks/pre-push" <<'HOOK'
#!/bin/sh
# KAN-2048 banned-blob guard (installed by scripts/install-hooks.sh)
hooks=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
zero=0000000000000000000000000000000000000000
remote_name=${1:-}
remote_url=${2:-}
status=0
input=$(cat)
while read -r local_ref local_sha remote_ref remote_sha; do
  [ "$local_sha" = "$zero" ] && continue
  if [ "$remote_sha" = "$zero" ]; then
    set -- "$local_sha" --not --remotes
  else
    set -- "$remote_sha..$local_sha"
  fi
  sh "$hooks/check-banned-blobs.sh" "$@" || status=1
done <<EOF_IN
$input
EOF_IN
if [ "$status" -ne 0 ]; then
  echo "pre-push: refusing to push (KAN-2048)." >&2
  exit 1
fi
if [ -x "$hooks/pre-push.local" ]; then
  printf '%s\n' "$input" | "$hooks/pre-push.local" "$remote_name" "$remote_url"
  exit $?
fi
exit 0
HOOK
chmod +x "$hooks/pre-push"
echo "installed pre-push guard in $hooks"
