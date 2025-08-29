FROM node:20-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
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
