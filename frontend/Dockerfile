ARG NODE_IMAGE=mirror.gcr.io/library/node:18-alpine
ARG NGINX_IMAGE=mirror.gcr.io/library/nginx:alpine

FROM ${NODE_IMAGE} as build
WORKDIR /app
COPY package*.json ./
# Use npm install to allow builds even when a lockfile is not present
RUN npm install --silent
COPY . .
RUN npm run build

FROM ${NGINX_IMAGE}
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
