FROM oven/bun:1.1.26 AS builder
WORKDIR /app

# Copy package manifests
COPY package.json bun.lock ./
COPY core/package.json ./core/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install workspace dependencies
RUN bun install

# Copy source code
COPY . .

# Generate Prisma ORM client
RUN cd server && bunx prisma generate

# Build React Frontend Client
RUN cd client && bun run build

# Runner Stage
FROM oven/bun:1.1.26-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app /app

EXPOSE 3000

CMD ["sh", "-c", "cd /app/server && bunx prisma db push && cd /app && bun server/src/index.ts"]
