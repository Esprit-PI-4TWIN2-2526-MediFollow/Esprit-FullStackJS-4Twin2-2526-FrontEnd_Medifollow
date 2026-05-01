# Build stage
FROM node:22 AS build
WORKDIR /app
COPY . .

RUN npm install --legacy-peer-deps
RUN npm run build -- --configuration production

# Serve stage
FROM nginx:alpine

# ⚠️ CORRECTION ICI
COPY --from=build /app/dist/medifollow-frontend /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]