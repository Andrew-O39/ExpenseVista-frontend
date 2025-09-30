# syntax=docker/dockerfile:1.7

##############################
# Build stage (Node + Vite)  #
##############################
FROM node:20-alpine AS build
WORKDIR /app

# Install deps separately to leverage Docker layer cache
COPY package*.json ./

# Use BuildKit cache mount for npm (faster rebuilds)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the source
COPY . .

# Build-time API base URL (injected by compose build-args)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build static assets
RUN npm run build


##############################
# Runtime (Nginx)            #
##############################
FROM nginx:1.25-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback + compression (ensure your nginx.conf handles this)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health tooling (optional)
RUN apk add --no-cache curl

# Static health endpoint
RUN mkdir -p /usr/share/nginx/html && \
    printf 'ok' > /usr/share/nginx/html/health

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]