# syntax=docker/dockerfile:1

# ============================================================================
# Foody — SvelteKit (adapter-node) + Prisma + better-sqlite3
# Monorepo build: context must be the repository root.
#   docker build -t ghcr.io/OWNER/foody:<tag> .
# ============================================================================

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# ----------------------------------------------------------------------------
# Stage 1: install deps + build the app + generate the Prisma client
# ----------------------------------------------------------------------------
FROM base AS builder

# Toolchain for the native better-sqlite3 addon.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Workspace manifests first — keeps `pnpm install` cached across source changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# App source, then build. Order matters:
#   1. `svelte-kit sync` writes apps/web/.svelte-kit/tsconfig.json, which the
#      app tsconfig extends — the Prisma `prisma-client` generator reads it.
#   2. `prisma generate` emits the typed client into src/lib/server/generated.
#   3. the actual adapter-node build (its own `svelte-kit sync && vite build`).
COPY . .
RUN pnpm --filter web exec svelte-kit sync \
    && pnpm --filter web exec prisma generate \
    && pnpm --filter web build

# ----------------------------------------------------------------------------
# Stage 2: runtime
# The whole built workspace is carried over so the runtime keeps:
#   - apps/web/build           → the adapter-node server (`node build`)
#   - node_modules (.pnpm)     → prod deps incl. the native better-sqlite3 addon
#   - prisma/ + prisma.config  → schema + migrations for `prisma migrate deploy`
#   - the Prisma CLI           → run by the chart's migrate initContainer
# Same base image as the builder, so the compiled native addon stays ABI-compatible.
# ----------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# openssl is needed by the Prisma schema engine (`migrate deploy`); ca-certificates
# for the outbound TLS calls to the OIDC issuer and the Anthropic API.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app /app

WORKDIR /app/apps/web
USER node
EXPOSE 3000

# adapter-node entrypoint. The chart runs `prisma migrate deploy` in an
# initContainer before this starts.
CMD ["node", "build"]
