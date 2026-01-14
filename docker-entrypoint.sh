#!/bin/bash
set -e

echo "=== Starting container initialization ==="

echo "Importing GPG private key..."
if [ -z "$GPG_PRIVATE_KEY" ]; then
  echo "ERROR: GPG_PRIVATE_KEY is not set"
  exit 1
fi

if gpg --list-secret-keys "$GPG_KEY_ID" >/dev/null 2>&1; then
  echo "GPG key already exists in keyring, skipping import"
else
  echo "$GPG_PRIVATE_KEY" | base64 -d > /tmp/gpg-key.asc
  gpg --batch --import /tmp/gpg-key.asc
  rm /tmp/gpg-key.asc
  echo "$GPG_KEY_ID:6:" | gpg --import-ownertrust
  echo "GPG key imported successfully"
fi

if [ -n "$SSH_PRIVATE_KEY" ]; then
  echo "Installing SSH private key..."
  mkdir -p /root/.ssh
  echo "$SSH_PRIVATE_KEY" | base64 -d > /root/.ssh/id_ed25519
  chmod 600 /root/.ssh/id_ed25519
  chmod 700 /root/.ssh
  echo "SSH key installed successfully"
fi

NOTES_DIR="${NOTES_DIR:-/app/notes}"
mkdir -p "$NOTES_DIR"

echo "Configuring git safe.directory..."
git config --global --add safe.directory "$NOTES_DIR"

if [ -d "$NOTES_DIR/.git" ]; then
  echo "Local repository exists at $NOTES_DIR, pulling latest changes..."
  cd "$NOTES_DIR"
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "master")
  echo "Current branch: $CURRENT_BRANCH"
  git pull origin "$CURRENT_BRANCH" 2>/dev/null || echo "Pull failed or no remote changes"
else
  echo "Cloning from encrypted GitHub repository..."
  GCRYPT_URL="gcrypt::${GITHUB_REPO_URL}"

  if git clone "$GCRYPT_URL" "$NOTES_DIR" 2>/dev/null; then
    echo "Clone completed successfully"
    cd "$NOTES_DIR"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo "Cloned branch: $CURRENT_BRANCH"
  else
    echo "Clone failed (possibly empty repo), initializing new repository..."
    cd "$NOTES_DIR"
    git init
    git checkout -b master
  fi
fi

echo "Configuring git user..."
git config user.email "${GIT_USER_EMAIL:-notes@app.local}"
git config user.name "${GIT_USER_NAME:-Notes App}"

cd "$NOTES_DIR"
REMOTES=$(git remote 2>/dev/null || echo "")
if ! echo "$REMOTES" | grep -q "^origin$"; then
  echo "Adding git remote origin..."
  GCRYPT_URL="gcrypt::${GITHUB_REPO_URL}"
  git remote add origin "$GCRYPT_URL"
fi

git config remote.origin.gcrypt-participants "$GPG_KEY_ID"

echo "=== Initialization complete ==="
echo ""

cd /app
exec "$@"
