# syntax=docker/dockerfile:1

# ============================================================================
# Foody — Next.js + Prisma + PostgreSQL (pg driver)
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

# ca-certificates for pnpm's registry TLS. The `pg` driver is pure JS, so no
# native build toolchain (python3/make/g++) is required.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Workspace manifests first — keeps `pnpm install` cached across source changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile

# App source, then generate Prisma's typed client in its owning API package
# before building Next.js.
COPY . .
RUN pnpm --filter api run prisma:generate \
    && pnpm --filter web build

# ----------------------------------------------------------------------------
# Stage 2: runtime
# The whole built workspace is carried over so the runtime keeps:
#   - apps/web/.next           → the Next.js production build
#   - node_modules (.pnpm)     → prod deps incl. the `pg` Postgres driver
#   - apps/api/prisma/ + prisma.config → schema + migrations for `prisma migrate deploy`
#   - the Prisma CLI           → run by the chart's migrate initContainer
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

# The chart runs the API's `prisma migrate deploy` in an initContainer before this starts.
CMD ["pnpm", "start"]
