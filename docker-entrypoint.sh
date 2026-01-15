#!/bin/sh
set -eu

# Required environment variables
: "${GITHUB_REPO_URL:?}"
: "${SSH_PRIVATE_KEY:?}"
: "${GPG_PRIVATE_KEY:?}"
: "${NOTES_DIR:?}"

# Create target directory parent
mkdir -p "$(dirname "$NOTES_DIR")"

# Setup persistent SSH key
mkdir -p ~/.ssh
printf '%s' "$SSH_PRIVATE_KEY" | base64 -d > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
# Add GitHub to known_hosts to avoid host verification prompts
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

export GIT_SSH_COMMAND="ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no"

# Import GPG private key (base64-decoded)
printf '%s' "$GPG_PRIVATE_KEY" | base64 -d | gpg --batch --import

# Ensure git-remote-gcrypt helper is registered
git config --global remote.gcrypt.helper /usr/local/bin/git-remote-gcrypt

# Clone repository using git-remote-gcrypt
git clone "gcrypt::$GITHUB_REPO_URL" "$NOTES_DIR"

if [ $# -eq 0 ]; then
  exec npm start
else
  exec "$@"
fi
