###
# Builder
###
FROM node:lts-alpine AS builder

# Install dependencies
WORKDIR /app
RUN npm upgrade -g corepack && corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json vite.config.ts svelte.config.js  /app/
RUN pnpm install --frozen-lockfile

# Build app and remove developer dependencies
ARG DATABASE_DSN
COPY static /app/static
COPY src /app/src
RUN DATABASE_DSN=${DATABASE_DSN} pnpm run build \
    && pnpm install --production --frozen-lockfile

###
# App final image
###
FROM node:lts-alpine AS app

WORKDIR /app
COPY drizzle.config.ts /app/
COPY drizzle/ /app/drizzle/
COPY --from=builder /app/package.json /app/
COPY --from=builder /app/build/ /app/build/
COPY --from=builder /app/node_modules/ /app/node_modules/

ENV NODE_ENV=production
ENV BODY_SIZE_LIMIT=16M

ENTRYPOINT ["node", "build"]
