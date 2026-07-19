#!/usr/bin/env bash
set -euo pipefail

# ============================================
# Version script — called by changesets/action when creating the Version PR.
#
# Runs `changeset version` (bumps the app package.json + writes CHANGELOG,
# consumes the .changeset/*.md files), then bumps the Helm chart to the same
# version, so the Version PR contains everything in one commit.
# ============================================

# Bump package.json version(s), update CHANGELOG, remove consumed changesets.
pnpm changeset version

# The single product version = the deployable app's version.
VERSION=$(node -p "require('./apps/web/package.json').version")
echo "Bumping Helm chart to v${VERSION}"

# Keep the chart's own version and the appVersion in lockstep with the app.
sed -i "s/^version:.*/version: ${VERSION}/" helm/foody/Chart.yaml
sed -i "s/^appVersion:.*/appVersion: \"${VERSION}\"/" helm/foody/Chart.yaml

# Stage everything so the Version PR commit includes all bumps.
git add .
