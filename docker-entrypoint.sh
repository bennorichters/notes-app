#!/bin/sh
set -eu

: "${GITHUB_REPO_URL:?}"
: "${SSH_PRIVATE_KEY:?}"
: "${GPG_PRIVATE_KEY:?}"
: "${NOTES_DIR:?}"

SSH_KEY_FILE="$(mktemp)"
cleanup() {
  rm -f "$SSH_KEY_FILE"
}
trap cleanup EXIT

# Create target directory parent
mkdir -p "$(dirname "$NOTES_DIR")"

# SSH setup
printf '%s\n' "$SSH_PRIVATE_KEY" > "$SSH_KEY_FILE"
chmod 600 "$SSH_KEY_FILE"
export GIT_SSH_COMMAND="ssh -i $SSH_KEY_FILE -o StrictHostKeyChecking=no"

# Import GPG key (base64)
printf '%s' "$GPG_PRIVATE_KEY" | base64 -d | gpg --batch --import

# Clone via gcrypt
git clone "gcrypt::$GITHUB_REPO_URL" "$NOTES_DIR"

