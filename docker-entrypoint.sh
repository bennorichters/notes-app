#!/bin/sh
set -eu

# Required environment variables
: "${GITHUB_REPO_URL:?}"
: "${SSH_PRIVATE_KEY:?}"
: "${GPG_PRIVATE_KEY:?}"
: "${NOTES_DIR:?}"

# Temp SSH key
SSH_KEY_FILE="$(mktemp)"
cleanup() {
  rm -f "$SSH_KEY_FILE"
}
trap cleanup EXIT

# Setup SSH key
printf '%s\n' "$SSH_PRIVATE_KEY" > "$SSH_KEY_FILE"
chmod 600 "$SSH_KEY_FILE"
export GIT_SSH_COMMAND="ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no"

# Import GPG private key (base64-encoded)
printf '%s' "$GPG_PRIVATE_KEY" | base64 -d | gpg --batch --import

# Clone using git-remote-gcrypt
git clone "gcrypt::$GITHUB_REPO_URL" "$NOTES_DIR"

