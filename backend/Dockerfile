# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma schema engine
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# ── Stage 2: Production ────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL (required by Prisma schema/migration engine at runtime)
RUN apk add --no-cache openssl

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

# Copy Prisma schema + generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 4000

CMD ["./entrypoint.sh"]
