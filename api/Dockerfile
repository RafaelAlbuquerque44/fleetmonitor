FROM oven/bun:1
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY drizzle.config.ts tsconfig.json ./
COPY src ./src

EXPOSE 3000
CMD ["bun", "run", "start"]
