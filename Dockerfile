# Build stage using Bun with native SQLite
FROM oven/bun:1-alpine AS base

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock* ./

# Install dependencies (uses bun:sqlite natively)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Environment variables for build
ENV NODE_ENV=production
ENV ADMIN_KEY=your-admin-key-here
ENV SKIP_DB_INIT=true

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Create a non-root user
RUN addgroup --system --gid 1001 bunuser
RUN adduser --system --uid 1001 sveltekit

# Copy built application and dependencies
COPY --from=base --chown=sveltekit:bunuser /app/build ./build
COPY --from=base --chown=sveltekit:bunuser /app/node_modules ./node_modules
COPY --from=base --chown=sveltekit:bunuser /app/package.json ./package.json

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/data && chown sveltekit:bunuser /app/data

USER sveltekit

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD bun -e "const http = require('http'); http.request({hostname:'localhost',port:3001,path:'/'},(r)=>r.statusCode===200?process.exit(0):process.exit(1)).on('error',()=>process.exit(1)).end()"

CMD ["bun", "run", "build/index.js"]
