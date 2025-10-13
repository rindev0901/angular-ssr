# Stage 1: Build
FROM node:22-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# Install ALL dependencies with SSL cert bypass
RUN npm config set strict-ssl false && npm ci

# Copy source code
COPY . ./

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /usr/app

# Copy built application
COPY --from=build /dist/angular-ssr ./

# Expose port
EXPOSE 4000

# Start server
CMD ["node", "server/server.mjs"]
