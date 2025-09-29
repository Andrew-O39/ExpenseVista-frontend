# syntax=docker/dockerfile:1.7

#  Build stage (Node)
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

# Copy the rest and build
COPY . .

# Build-time API base URL (set from infra repo's compose)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Vite build (outputs to /app/dist)
RUN npm run build


# Runtime (Nginx)
FROM nginx:1.25-alpine
# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html
# Add nginx config for SPA fallback + gzip
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Basic health tooling (optional)
RUN apk add --no-cache curl

# Static health endpoint
RUN mkdir -p /usr/share/nginx/html && \
    printf 'ok' > /usr/share/nginx/html/health

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]