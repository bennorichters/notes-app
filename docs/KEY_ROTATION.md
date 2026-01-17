# GPG and SSH Key Rotation Guide

This guide explains how to rotate the GPG key used for repository encryption and the SSH key used for GitHub access.

## Prerequisites

- Access to the existing decrypted repository on your laptop or VPS
- Git and GPG installed locally
- GitHub account access

## Part 1: Rotating the GPG Key

The GPG key encrypts your notes repository using git-remote-gcrypt. Rotating it requires re-encrypting the repository.

### Step 1: Generate a New GPG Key

```bash
gpg --full-generate-key
```

Select:
- Key type: RSA and RSA
- Key size: 4096 bits
- Expiration: 0 (does not expire) or your preference
- Real name: Your name
- Email: Your email

Note the key ID from the output (looks like `ABCD1234EFGH5678`).

### Step 2: Add New GPG Key to Repository

On your laptop where you have the decrypted repository:

```bash
cd /path/to/decrypted/notes/repo

git config --add remote.origin.gcrypt-participants "NEW_GPG_KEY_ID"
```

If you want to keep the old key temporarily for transition:

```bash
git config --add remote.origin.gcrypt-participants "OLD_GPG_KEY_ID NEW_GPG_KEY_ID"
```

### Step 3: Re-encrypt and Push Repository

```bash
git push origin main --force
```

This re-encrypts the entire repository with the new key(s).

### Step 4: Remove Old GPG Key (Optional but Recommended)

Once confirmed the new key works:

```bash
git config remote.origin.gcrypt-participants "NEW_GPG_KEY_ID"

git push origin main --force
```

### Step 5: Export and Encode New Private Key

```bash
gpg --export-secret-keys --armor NEW_GPG_KEY_ID | base64 -w 0 > gpg-key.b64
```

This creates a base64-encoded file `gpg-key.b64`.

### Step 6: Update Environment Variables

Update your Dokku environment variables:

```bash
dokku config:set notes-app GPG_KEY_ID="NEW_GPG_KEY_ID"
dokku config:set notes-app GPG_PRIVATE_KEY="$(cat gpg-key.b64)"
```

### Step 7: Redeploy

```bash
git push dokku main
```

The predeploy script will import the new GPG key and clone the re-encrypted repository.

### Step 8: Verify

After deployment, check the app loads and you can create/edit notes.

### Step 9: Clean Up

```bash
rm gpg-key.b64
```

Optionally delete the old GPG key from your laptop:

```bash
gpg --delete-secret-key OLD_GPG_KEY_ID
gpg --delete-key OLD_GPG_KEY_ID
```

## Part 2: Rotating the SSH Key

The SSH key provides access to your GitHub repository.

### Step 1: Generate a New SSH Key

```bash
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/notes-app-new
```

Or for RSA (if ed25519 not supported):

```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f ~/.ssh/notes-app-new
```

Press Enter for no passphrase (required for automated deployment).

### Step 2: Add Public Key to GitHub

Copy the public key:

```bash
cat ~/.ssh/notes-app-new.pub
```

Add to GitHub:
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Paste the public key
4. Give it a descriptive title like "Notes App - Dokku VPS"
5. Click "Add SSH key"

### Step 3: Test SSH Connection

```bash
ssh -T -i ~/.ssh/notes-app-new git@github.com
```

You should see: "Hi username! You've successfully authenticated..."

### Step 4: Export and Encode Private Key

```bash
cat ~/.ssh/notes-app-new | base64 -w 0 > ssh-key.b64
```

### Step 5: Update Environment Variable

```bash
dokku config:set notes-app SSH_PRIVATE_KEY="$(cat ssh-key.b64)"
```

### Step 6: Redeploy

```bash
git push dokku main
```

The predeploy script will use the new SSH key to access GitHub.

### Step 7: Verify

After deployment, check the app loads. Test the /sync endpoint to verify GitHub access.

### Step 8: Clean Up

```bash
rm ssh-key.b64
rm ~/.ssh/notes-app-new
rm ~/.ssh/notes-app-new.pub
```

Remove the old SSH key from GitHub:
1. Go to https://github.com/settings/keys
2. Find the old key
3. Click "Delete"

## Rotating Both Keys Together

If rotating both keys at once:

1. Complete GPG rotation steps 1-5
2. Complete SSH rotation steps 1-4
3. Update both environment variables:
   ```bash
   dokku config:set notes-app \
     GPG_KEY_ID="NEW_GPG_KEY_ID" \
     GPG_PRIVATE_KEY="$(cat gpg-key.b64)" \
     SSH_PRIVATE_KEY="$(cat ssh-key.b64)"
   ```
4. Redeploy once
5. Verify
6. Clean up both keys

## Troubleshooting

### GPG Import Fails

Error: "gpg: import failed"

Solution: Verify the base64 encoding is correct:
```bash
echo "$GPG_PRIVATE_KEY" | base64 -d | gpg --import
```

### SSH Authentication Fails

Error: "Permission denied (publickey)"

Solutions:
- Verify public key is added to GitHub
- Check private key is valid:
  ```bash
  echo "$SSH_PRIVATE_KEY" | base64 -d | ssh-keygen -y
  ```
- Ensure no passphrase was set on the key

### Repository Clone Fails

Error: "gcrypt: Repository not found"

Solutions:
- Verify GPG_KEY_ID matches a participant in the gcrypt config
- Check GITHUB_REPO_URL is correct
- Confirm new GPG key was added to gcrypt-participants before re-encrypting

### Deployment Succeeds but App Crashes

Check Dokku logs:
```bash
dokku logs notes-app --tail
```

Common causes:
- GPG key can't decrypt repository
- SSH key can't access GitHub
- Environment variables contain extra whitespace

## Security Notes

- Never commit private keys to git repositories
- Store base64 files temporarily and delete after use
- Use secure channels when transferring keys between machines
- Consider keeping old keys in secure backup until new keys are verified
- Rotate keys periodically (e.g., annually) as a security best practice

## Emergency Recovery

If you lose access to your notes due to key rotation issues:

1. Keep a local decrypted backup of your notes repository
2. If deployment fails, you can always re-encrypt with your old keys
3. Dokku environment variables can be rolled back:
   ```bash
   dokku config:unset notes-app GPG_PRIVATE_KEY
   dokku config:set notes-app GPG_PRIVATE_KEY="old-value-here"
   ```
