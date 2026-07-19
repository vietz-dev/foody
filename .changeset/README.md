# Changesets

This folder drives Foody's release versioning. See the full docs at
https://github.com/changesets/changesets

## How it works here

- The deployable app (`web`) is the versioned unit. Its version is the single
  "product version": it drives the Docker image tag AND the Helm chart
  `version`/`appVersion` (kept in sync by `scripts/version.sh`).
- Internal tooling packages (`@repo/ui`, `@repo/eslint-config`,
  `@repo/typescript-config`) are listed under `ignore` — they are never
  released.
- `fixed: [["web"]]` groups the deployables under one shared version. When a
  separate backend is added, add its package name to this group, e.g.
  `fixed: [["web", "api"]]`, so both always release together under one version.

## Adding a changeset

When you make a change worth releasing:

```sh
pnpm changeset
```

Pick **patch** / **minor** / **major** and write a short summary. Commit the
generated file in `.changeset/`. You never pick the version number yourself —
Changesets computes it from the accumulated changesets on the next release.

## Releasing

On merge to `main`, the Release workflow opens (or updates) a
**"chore: release"** PR that bumps the version + Chart. Merging that PR builds
and pushes the image + Helm chart and creates the GitHub Release. See
`.github/workflows/release.yml`.
