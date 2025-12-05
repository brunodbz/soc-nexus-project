FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
# Use npm install to allow builds even when a lockfile is not present
RUN npm install --silent
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
