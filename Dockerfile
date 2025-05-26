FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Install dependencies in a separate stage for caching
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN apk add --no-cache dos2unix
RUN dos2unix docker-entrypoint.sh
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Create a non-root user (optional, for security)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

USER root
COPY  --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

USER appuser
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

# Set the entrypoint to the script
ENTRYPOINT ["./docker-entrypoint.sh"]

# Default command to run the application
CMD ["node", "dist/src/main"]