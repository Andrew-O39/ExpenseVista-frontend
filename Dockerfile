FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV CI=true
ENV NODE_OPTIONS=--max_old_space_size=512
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:alpine
RUN rm -f /etc/nginx/conf.d/*.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
