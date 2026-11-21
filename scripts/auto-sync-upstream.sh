#!/bin/bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Checking for upstream updates..."

# Ensure remotes exist
if ! git remote get-url upstream >/dev/null 2>&1; then
  git remote add upstream https://github.com/NYLLON-SOFTWARE/SignuDoc.git
fi

git fetch upstream main --tags --quiet

LOCAL_COMMIT=$(git rev-parse HEAD)
UPSTREAM_COMMIT=$(git rev-parse upstream/main)

if [ "$LOCAL_COMMIT" = "$UPSTREAM_COMMIT" ] || git merge-base --is-ancestor upstream/main HEAD; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Already up to date with upstream/main ($UPSTREAM_COMMIT)."
  exit 0
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] New upstream commits found! Merging upstream/main ($UPSTREAM_COMMIT)..."

# Merge upstream/main
if ! git merge upstream/main --no-edit -m "Auto-merge upstream fixes: $UPSTREAM_COMMIT"; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Conflict detected during auto-merge. Resolving package name..."
  if [ -f package.json ]; then
    sed -i '' 's/"name": "signudoc"/"name": "blueprint"/g' package.json 2>/dev/null || sed -i 's/"name": "signudoc"/"name": "blueprint"/g' package.json
    git add package.json
  fi
  if [ -f package-lock.json ]; then
    sed -i '' 's/"name": "signudoc"/"name": "blueprint"/g' package-lock.json 2>/dev/null || sed -i 's/"name": "signudoc"/"name": "blueprint"/g' package-lock.json
    git add package-lock.json
  fi
  git commit -m "Auto-merge upstream fixes and retain Blueprint naming" || true
fi

# If on the production host with docker-compose
if [ -f "docker-compose.prod.yml" ] && command -v docker >/dev/null 2>&1; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Rebuilding and restarting production containers..."
  docker compose -f docker-compose.prod.yml build app
  docker compose -f docker-compose.prod.yml up -d app
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Production container rebuilt and restarted."
fi

# Push to origin if git remote origin is configured
if git remote get-url origin >/dev/null 2>&1; then
  git push origin main || true
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Upstream update completed."
