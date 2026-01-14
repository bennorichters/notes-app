#!/bin/bash
set -euo pipefail

# SSH setup (required for GitHub auth)
if [ -n "${SSH_PRIVATE_KEY:-}" ]; then
  mkdir -p /root/.ssh
  echo "$SSH_PRIVATE_KEY" | base64 -d > /root/.ssh/id_ed25519
  chmod 600 /root/.ssh/id_ed25519
  ssh-keyscan -t ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null
fi

# GPG setup (required for gcrypt)
export GNUPGHOME="${GNUPGHOME:-/root/.gnupg}"
mkdir -p "$GNUPGHOME"
chmod 700 "$GNUPGHOME"

cat > "$GNUPGHOME/gpg.conf" <<EOF
batch
no-tty
pinentry-mode loopback
EOF

echo "$GPG_PRIVATE_KEY" | base64 -d | gpg --batch --import
echo "$GPG_KEY_ID:6:" | gpg --import-ownertrust

# Repo setup
NOTES_DIR="${NOTES_DIR:-/app/notes}"
mkdir -p "$NOTES_DIR"
git config --global --add safe.directory "$NOTES_DIR"

if [ -d "$NOTES_DIR/.git" ]; then
  git -C "$NOTES_DIR" pull --ff-only || true
else
  timeout 120 git clone "gcrypt::${GITHUB_REPO_URL}" "$NOTES_DIR"
fi

# Configure
git -C "$NOTES_DIR" config user.email "${GIT_USER_EMAIL:-notes@app.local}"
git -C "$NOTES_DIR" config user.name "${GIT_USER_NAME:-Notes App}"
git -C "$NOTES_DIR" config remote.origin.gcrypt-participants "$GPG_KEY_ID"

exec "$@"
