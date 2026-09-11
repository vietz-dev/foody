# Foody web (Next.js standalone). Build context must be the repository root:
#   docker build -f apps/web/Dockerfile -t ghcr.io/vietz-dev/foody-web:<tag> .

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /app

# Reduce the monorepo to web + its workspace dependencies (api for the Prisma
# client, packages/*) with a matching pruned lockfile.
FROM base AS pruner
RUN npm install -g turbo@2.10.5
COPY . .
RUN turbo prune web --docker

FROM base AS builder
# Manifests + lockfile first so `pnpm install` stays cached across source changes.
COPY --from=pruner /app/out/json/ .
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# The auth route is initialised while Next.js collects route metadata; a
# placeholder secret is enough at build time (never shipped: builder stage only).
ENV NEXT_TELEMETRY_DISABLED=1 BETTER_AUTH_SECRET=build-time-placeholder
# turbo runs api#prisma:generate before web#build (see apps/web/turbo.json).
RUN pnpm turbo run build --filter=web

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
