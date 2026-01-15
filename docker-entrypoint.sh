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

# Create target directory parent
mkdir -p "$(dirname "$NOTES_DIR")"

# Setup SSH key (base64-decoded)
printf '%s' "$SSH_PRIVATE_KEY" | base64 -d > "$SSH_KEY_FILE"
chmod 600 "$SSH_KEY_FILE"
export GIT_SSH_COMMAND="ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no"

# Import GPG private key (base64-decoded)
printf '%s' "$GPG_PRIVATE_KEY" | base64 -d | gpg --batch --import

# Clone repository using git-remote-gcrypt
git clone "gcrypt::$GITHUB_REPO_URL" "$NOTES_DIR"

exec "$@"
