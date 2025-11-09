# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Faster, cached installs
COPY package*.json ./
RUN npm ci

# Build-time API base: default to /api for production
# (Server’s docker-compose will pass VITE_API_BASE_URL: /api)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build the app
COPY . .
RUN npm run build

# --- runtime stage ---
FROM nginx:1.25-alpine
# Harden a bit
RUN adduser -D -H -s /sbin/nologin app && \
    mkdir -p /usr/share/nginx/html && chown -R app:app /usr/share/nginx/html

# Your nginx reverse-proxy for /api + SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Ship the compiled app
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/health || exit 1

USER app