# Foody API (Hono + Prisma). Build context must be the repository root:
#   docker build -f apps/api/Dockerfile -t ghcr.io/vietz-dev/foody-api:<tag> .

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# Reduce the monorepo to api + its workspace dependencies with a matching
# pruned lockfile.
FROM base AS pruner
RUN npm install -g turbo@2.10.5
COPY . .
RUN turbo prune api --docker

FROM base AS builder
# Manifests + lockfile first so `pnpm install` stays cached across source changes.
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# Bundle src + workspace packages into dist/index.js (turbo runs prisma:generate
# first), then reinstall prod deps only (a fresh install, since `--prod` on an
# existing tree leaves devDeps in .pnpm). pnpm skips @prisma/engines' postinstall
# on that reinstall, so run it by hand: it fetches the schema-engine binary that
# `prisma migrate deploy` needs.
RUN pnpm turbo run build --filter=api \
    && rm -rf apps/api/src node_modules apps/*/node_modules packages/*/node_modules \
    && pnpm install --frozen-lockfile --prod \
    && node "$(find node_modules/.pnpm -path '*/@prisma/engines/scripts/postinstall.js')"

FROM base AS runner
ENV NODE_ENV=production PORT=3001
# pnpm keeps real packages in /app/node_modules/.pnpm and symlinks per package,
# so the workspace layout (root node_modules + packages/) must be carried over.
COPY --from=builder --chown=node:node /app/node_modules /app/node_modules
COPY --from=builder --chown=node:node /app/packages /app/packages
COPY --from=builder --chown=node:node /app/apps/api /app/apps/api
WORKDIR /app/apps/api
USER node
EXPOSE 3001
# Migrations: docker run ... foody-api node_modules/.bin/prisma migrate deploy
CMD ["node", "dist/index.js"]
