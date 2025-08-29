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

# CACHE BUSTING - Add this line
RUN echo "Build timestamp: $(date)" > /tmp/build.txt

COPY package.json ./
RUN npm install --omit=dev
COPY . .

CMD ["npm", "start"]
