#!/bin/sh
# Unit test for check-banned-blobs.sh and the pre-push hook, using a temporary
# repository and a fake banned blob (not the real list).
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
t=$(mktemp -d)
trap 'rm -rf "$t"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }

cd "$t"
git init -q repo && cd repo
git config user.email t@example.com && git config user.name t
git config commit.gpgsign false && git config core.autocrlf false
echo base > a.txt && git add a.txt && git commit -qm base
base=$(git rev-parse HEAD)
echo "fake-banned-content" > bad.bin && git add bad.bin && git commit -qm bad
bad=$(git hash-object bad.bin)
echo fine > ok.txt && git add ok.txt && git commit -qm after
tip=$(git rev-parse HEAD)

printf '# test list\n%s\n' "$bad" > "$t/banned.txt"
printf '%s\n' 0123456789abcdef0123456789abcdef01234567 > "$t/other.txt"

chk2() { f=$1; shift; BANNED_BLOBS_FILE=$f sh "$here/check-banned-blobs.sh" "$@" >/dev/null 2>&1; }

# 1. range containing the bad commit fails
chk2 "$t/banned.txt" "$base..$tip" && fail "range with banned blob passed"
# 2. clean range passes
chk2 "$t/banned.txt" "$base" || fail "clean history rejected"
# 3. an unrelated banned id passes
chk2 "$t/other.txt" "$base..$tip" || fail "unrelated id rejected"
# 4. bad commit buried (blob deleted later) still fails
git rm -q bad.bin && git commit -qm drop
chk2 "$t/banned.txt" "$base..HEAD" && fail "deleted-but-in-history blob passed"
# 5. bad revision fails (not silently clean)
chk2 "$t/banned.txt" nosuchrev && fail "bad revision passed"
# 6. no args / missing list are errors
sh "$here/check-banned-blobs.sh" >/dev/null 2>&1 && fail "no args passed"
chk2 "$t/missing.txt" "$base" && fail "missing list passed"

# 7. installed hook blocks a push and allows a clean one
git init -q --bare "$t/remote.git"
git remote add origin "$t/remote.git"
mkdir "$t/inst" && cp "$here/install-hooks.sh" "$here/check-banned-blobs.sh" "$t/inst/"
cp "$t/banned.txt" "$t/inst/banned-blobs.txt"
sh "$t/inst/install-hooks.sh" "$t/repo" >/dev/null
git push -q origin "$base:refs/heads/clean" 2>/dev/null || fail "clean push blocked"
git push -q origin "HEAD:refs/heads/dirty" 2>/dev/null && fail "push with banned blob allowed"
git ls-remote origin dirty | grep -q . && fail "dirty ref reached the remote"
echo "all check-banned-blobs tests passed"
