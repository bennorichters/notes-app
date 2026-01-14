#!/bin/bash
set -e

echo "=== Starting container initialization ==="
echo "DEBUG: GITHUB_REPO_URL is set: $([ -n "$GITHUB_REPO_URL" ] && echo 'yes' || echo 'no')"
echo "DEBUG: GPG_KEY_ID: $GPG_KEY_ID"

echo "Importing GPG private key..."
if [ -z "$GPG_PRIVATE_KEY" ]; then
  echo "ERROR: GPG_PRIVATE_KEY is not set"
  exit 1
fi

echo "Configuring GPG for non-interactive/batch mode..."
export GPG_TTY=$(tty 2>/dev/null || echo "")
export GNUPGHOME=${GNUPGHOME:-/root/.gnupg}
mkdir -p "$GNUPGHOME"
chmod 700 "$GNUPGHOME"

cat > "$GNUPGHOME/gpg.conf" <<EOF
batch
no-tty
pinentry-mode loopback
EOF

cat > "$GNUPGHOME/gpg-agent.conf" <<EOF
allow-loopback-pinentry
default-cache-ttl 3600
max-cache-ttl 7200
EOF

echo "DEBUG: GPG configured for batch mode"
gpgconf --kill gpg-agent 2>/dev/null || true

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

set +e

if [ -d "$NOTES_DIR/.git" ]; then
  echo "Local repository exists at $NOTES_DIR, pulling latest changes..."
  cd "$NOTES_DIR"
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "master")
  echo "Current branch: $CURRENT_BRANCH"

  if ! GIT_TERMINAL_PROMPT=0 timeout 60 git pull origin "$CURRENT_BRANCH" < /dev/null; then
    echo "WARNING: Pull failed or timed out, continuing with existing local repo..."
  fi
else
  echo "Cloning from encrypted GitHub repository..."
  echo "Repository URL: ${GITHUB_REPO_URL}"
  GCRYPT_URL="gcrypt::${GITHUB_REPO_URL}"

  echo "DEBUG: Killing any running gpg-agent..."
  gpgconf --kill gpg-agent 2>/dev/null || true
  sleep 1

  echo "DEBUG: Starting git clone in background..."
  git clone "$GCRYPT_URL" "$NOTES_DIR" </dev/null >/tmp/git-clone.log 2>&1 &
  CLONE_PID=$!
  echo "DEBUG: Clone PID: $CLONE_PID"

  echo "DEBUG: Waiting for repository to appear (max 60 seconds)..."
  WAIT_COUNT=0
  while [ $WAIT_COUNT -lt 60 ]; do
    if [ -d "$NOTES_DIR/.git" ] && [ -f "$NOTES_DIR/.git/config" ]; then
      echo "DEBUG: Repository directory appeared after ${WAIT_COUNT} seconds"
      break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
  done

  echo "DEBUG: Checking if repository exists..."
  if [ -d "$NOTES_DIR/.git" ] && [ -f "$NOTES_DIR/.git/config" ]; then
    echo "Clone completed successfully (repository exists)"
    echo "DEBUG: Killing clone process if still running..."
    kill -9 $CLONE_PID 2>/dev/null || true
    wait $CLONE_PID 2>/dev/null || true

    cd "$NOTES_DIR"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "master")
    echo "Cloned branch: $CURRENT_BRANCH"
  else
    echo "ERROR: Clone failed - repository directory not found after 60s"
    echo "DEBUG: Killing clone process..."
    kill -9 $CLONE_PID 2>/dev/null || true
    wait $CLONE_PID 2>/dev/null || true
    echo "DEBUG: Last lines of clone log:"
    tail -20 /tmp/git-clone.log 2>/dev/null || echo "No log available"

    echo "Attempting to initialize new repository..."
    mkdir -p "$NOTES_DIR"
    cd "$NOTES_DIR"
    git init
    git checkout -b master
  fi
fi

set -e

echo "DEBUG: Re-enabled set -e, continuing with configuration..."

cd "$NOTES_DIR" || exit 1
echo "DEBUG: Working directory: $(pwd)"

echo "Configuring git user..."
git config user.email "${GIT_USER_EMAIL:-notes@app.local}"
git config user.name "${GIT_USER_NAME:-Notes App}"
echo "DEBUG: Git user configured"

REMOTES=$(git remote 2>/dev/null || echo "")
echo "DEBUG: Existing remotes: '$REMOTES'"

if ! echo "$REMOTES" | grep -q "^origin$"; then
  echo "Adding git remote origin..."
  GCRYPT_URL="gcrypt::${GITHUB_REPO_URL}"
  git remote add origin "$GCRYPT_URL"
  echo "DEBUG: Remote added"
else
  echo "DEBUG: Remote origin already exists"
fi

echo "Configuring gcrypt participants..."
git config remote.origin.gcrypt-participants "$GPG_KEY_ID"
echo "DEBUG: Gcrypt participants configured"

echo "=== Initialization complete ==="
echo "DEBUG: About to start application..."
echo ""

cd /app || exit 1
echo "DEBUG: Changed to /app, executing: $@"
exec "$@"
