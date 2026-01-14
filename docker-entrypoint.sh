#!/bin/bash
set -euo pipefail

# GPG setup
echo "$GPG_PRIVATE_KEY" | base64 -d | gpg --batch --import
echo "$GPG_KEY_ID:6:" | gpg --import-ownertrust

# Clone or pull
if [ -d "$NOTES_DIR/.git" ]; then
  git -C "$NOTES_DIR" pull --ff-only || true
else
  timeout 120 git clone "gcrypt::${GITHUB_REPO_URL}" "$NOTES_DIR"
fi

# Configure
git -C "$NOTES_DIR" config user.email "${GIT_USER_EMAIL:-notes@app.local}"
git -C "$NOTES_DIR" config remote.origin.gcrypt-participants "$GPG_KEY_ID"

exec "$@"
