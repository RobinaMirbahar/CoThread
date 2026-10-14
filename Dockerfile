# Production Dockerfile for SyncMind — Google Cloud Run (AI Builder Cup 2026)
FROM node:22-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first for optimal layer caching
COPY package*.json ./
RUN npm install --production=false

# Copy application source
COPY . .

# Run build step if defined in package.json (e.g., frontend bundle), otherwise no-op
RUN npm run build --if-present

# Cloud Run injects PORT (defaults to 8080)
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Run as non-root user for security on Cloud Run
USER node

# Start the SyncMind collaborative server
CMD ["npm", "start"]
