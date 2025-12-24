# ================================
# Stage 1: Dependencies
# ================================
FROM node:20-slim AS deps
WORKDIR /app

# Install OpenSSL for Prisma and Build Tools for Canvas
# Debian (slim) uses apt-get. We need build-essential (make, g++), python3, and canvas dev libs.
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --legacy-peer-deps --only=production && \
    npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# ================================
# Stage 2: Builder
# ================================
FROM node:20-slim AS builder
WORKDIR /app

# Install OpenSSL and Build Tools (needed for npm install of dev deps)
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies)
RUN npm ci --legacy-peer-deps

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript for server
RUN npx tsc --project tsconfig.server.json

# ================================
# Stage 3: Production Runtime
# ================================
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install Runtime Dependencies
# We need the runtime versions of the canvas libraries and openssl
RUN apt-get update && apt-get install -y \
    openssl \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs appuser

# Copy package.json and production dependencies from deps stage
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=appuser:nodejs /app/package*.json ./

# Copy Prisma files
COPY --chown=appuser:nodejs prisma ./prisma/

# Copy compiled server code from builder
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/config ./config
COPY --from=builder --chown=appuser:nodejs /app/src ./src

# Copy other necessary files
COPY --chown=appuser:nodejs scripts ./scripts

# Create uploads directory
RUN mkdir -p /app/uploads/avatars && \
    chown -R appuser:nodejs /app/uploads

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["npm", "start"]
