# Mahfud.md — image self-hosted (Next.js standalone output)
# Build:  docker build -t mahfud-md:0.1.0 .
# Jalan:  docker run -d -p 3000:3000 -v ./data:/data byma4n/mahfud-md
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@12.15.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/cli/package.json ./packages/cli/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@12.15.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @mahfud-md/web build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN addgroup -S mahfud && adduser -S mahfud -G mahfud
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/data ./data
COPY --from=builder /app/mahfud.config.json ./mahfud.config.json
USER mahfud
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
