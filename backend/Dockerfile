# Build stage - Use Node.js 16 LTS with updated base
FROM node:16.20-bullseye-slim AS builder

WORKDIR /app

# Install OpenSSL and build tools for Prisma compatibility
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build the application
RUN npm run build

# Production stage - Use Node.js 16 LTS with updated base
FROM node:16.20-bullseye-slim AS production

WORKDIR /app

# Install OpenSSL and runtime dependencies for Prisma compatibility
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Install ts-node for seeding (if needed)
RUN npm install -g ts-node

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create non-root user (Debian syntax)
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nodeuser

# Create logs and uploads directories
RUN mkdir -p /app/logs /app/uploads && chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3101

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3101/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]

# Development stage
FROM node:16.20-alpine AS development

WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install development dependencies globally
RUN npm install -g nodemon ts-node

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

EXPOSE 3101

# Start the application in development mode
CMD ["npm", "run", "dev"]