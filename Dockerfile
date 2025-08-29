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

# Cache busting
RUN echo "Build timestamp: $(date)" > /tmp/build.txt

COPY package.json ./
RUN npm install --omit=dev

COPY . .

# Verify the new file is copied correctly
RUN echo "Verifying file integrity..." && \
    ls -la src/railway-start-new.js && \
    head -n 5 src/railway-start-new.js && \
    echo "✅ File verification completed"

CMD ["npm", "start"]
