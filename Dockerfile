FROM node:20-alpine

# Install Chromium and dependencies for Alpine Linux
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev

# Set Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Complete cache busting
RUN echo "Fresh build: $(date +%s)" > /tmp/cache_bust.txt

COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Verify the new bootstrap file
RUN echo "✅ Build complete. Verifying files..." && \
    ls -la src/ && \
    echo "Bootstrap file content:" && \
    head -n 10 src/bootstrap.js

CMD ["npm", "start"]
