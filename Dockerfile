# Stage 1: Build environment
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force

# Stage 2: Runtime environment
FROM node:20-alpine

# Install Chromium with all required dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && mkdir -p /usr/share/fonts/truetype/noto \
    && apk add --no-cache --virtual .fonts-deps curl \
    && curl -L https://noto-website-2.storage.googleapis.com/pkgs/NotoSansCJKsc-hinted.zip -o /tmp/NotoSansCJKsc-hinted.zip \
    && unzip -o /tmp/NotoSansCJKsc-hinted.zip -d /usr/share/fonts/truetype/noto/ \
    && rm /tmp/NotoSansCJKsc-hinted.zip \
    && apk del .fonts-deps

# Puppeteer configuration
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NODE_ENV=production

# Create a non-root user and switch to it
RUN addgroup -S appuser && \
    adduser -S -G appuser appuser && \
    mkdir -p /app/node_modules && \
    chown -R appuser:appuser /app
USER appuser

WORKDIR /app

# Copy built files from builder
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --chown=appuser:appuser . .

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('./src/utils/healthcheck.js')"

CMD ["npm", "start"]
