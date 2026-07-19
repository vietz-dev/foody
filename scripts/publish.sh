#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Publish script — the `publish` command for changesets/action.
#
# changesets/action runs this on every push to main that has NO changeset files
# left (i.e. right after the "chore: release" PR is merged, but also after any
# normal commit). It must be idempotent: only signal a release when the current
# version has not been released yet.
#
# Source of truth for "already released" = the git tag v<version> on origin,
# created at the end of the Release workflow (gh release create).
#
# Output contract: changesets/action scans stdout for lines matching
# "New tag: <pkg>@<version>". If it finds any, it sets the step output
# `published=true`, which gates the image + helm + GitHub Release jobs.
# We do NOT publish to npm and we do NOT create git tags here.
# ============================================

VERSION=$(node -p "require('./apps/web/package.json').version")
TAG="v${VERSION}"

if git ls-remote --tags origin "refs/tags/${TAG}" | grep -q "${TAG}"; then
  echo "==> ${TAG} already released — nothing to publish." >&2
  exit 0
fi

echo "==> Releasing ${TAG}" >&2

# Emit a "New tag:" line so changesets/action marks the step as published.
echo "New tag: web@${VERSION}"
