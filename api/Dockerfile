FROM oven/bun:1.4.4 AS production-dependencies
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

FROM oven/bun:1.4.4 AS runtime
WORKDIR /app

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY drizzle ./drizzle

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
