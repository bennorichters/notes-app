#!/bin/sh
set -eu

: "${GITHUB_REPO_URL:?}"
: "${SSH_PRIVATE_KEY:?}"
: "${GPG_PRIVATE_KEY:?}"
: "${NOTES_DIR:?}"

mkdir -p "$(dirname "$NOTES_DIR")"

mkdir -p ~/.ssh
printf '%s' "$SSH_PRIVATE_KEY" | base64 -d > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

export GIT_SSH_COMMAND="ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no"

printf '%s' "$GPG_PRIVATE_KEY" | base64 -d | gpg --batch --import

git config --global remote.gcrypt.helper /usr/local/bin/git-remote-gcrypt

git clone "gcrypt::$GITHUB_REPO_URL" "$NOTES_DIR"
