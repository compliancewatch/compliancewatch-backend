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

# Verify file copy
RUN echo "Verifying file copy..." && \
    ls -la src/ && \
    echo "File check completed"

CMD ["npm", "start"]
