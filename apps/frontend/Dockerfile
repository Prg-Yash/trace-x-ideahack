# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root configurations and workspace settings
COPY package.json package-lock.json turbo.json ./

# Copy the apps and packages to maintain workspace references
COPY apps/ ./apps/
COPY packages/ ./packages/

# Install dependencies using the root lockfile
RUN npm ci

# Build the frontend bundle
# Using workspace flag to build from root
RUN npm run build -w @trace-x/frontend

# Stage 2: Production Nginx
FROM nginx:alpine

# Copy the compiled static files to Nginx
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
