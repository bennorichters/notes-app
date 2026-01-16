#!/bin/sh
set -eu

: "${GITHUB_REPO_URL:?}"
: "${SSH_PRIVATE_KEY:?}"
: "${GPG_PRIVATE_KEY:?}"
: "${NOTES_DIR:?}"

# Setup SSH
mkdir -p ~/.ssh
printf '%s' "$SSH_PRIVATE_KEY" | base64 -d > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

export GIT_SSH_COMMAND="ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no"

# Import GPG key
printf '%s' "$GPG_PRIVATE_KEY" | base64 -d | gpg --batch --import

# Configure git-remote-gcrypt
git config --global remote.gcrypt.helper /usr/local/bin/git-remote-gcrypt

# Predeploy phase: clone and exit
if [ "${1:-}" = "clone" ]; then
  git clone "gcrypt::$GITHUB_REPO_URL" "$NOTES_DIR"
  exit 0
fi

# Runtime: pull latest changes
cd "$NOTES_DIR"
git pull origin master || true
cd /app

exec "$@"
