# Build Stage
FROM node:14 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN export NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

# Production Stage
FROM nginx:stable-alpine
# Copy the production build to nginx's public folder
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

