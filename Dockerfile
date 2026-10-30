
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application
COPY . .

# Build and remove npm from the production image
RUN npm run build \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx \
    && chown -R node:node /app

# Run the application as a non-root user
USER node

EXPOSE 3000

CMD ["node", "./node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
