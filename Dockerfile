# Stage 1: Build Frontend
FROM node:14 as frontend-build
WORKDIR /app/frontend
# Set NODE_OPTIONS so that legacy OpenSSL is used during build
ENV NODE_OPTIONS=--openssl-legacy-provider
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build Backend
FROM python:3.9-slim as backend-build
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Stage 3: Final Image with both frontend and backend
FROM python:3.9-slim
WORKDIR /app

# Install Nginx and Supervisor
RUN apt-get update && apt-get install -y nginx supervisor && apt-get clean

# Remove default nginx configuration
RUN rm /etc/nginx/sites-enabled/default

# Copy custom nginx configuration to serve the frontend build
COPY nginx.conf /etc/nginx/conf.d/frontend.conf

# Copy Supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy backend code from backend-build stage
COPY --from=backend-build /app/backend /app/backend

# Copy frontend build from frontend-build stage
COPY --from=frontend-build /app/frontend/build /app/frontend/build

# Expose ports for Nginx (80) and backend (5000)
EXPOSE 80 5000

# Run Supervisor to start both processes
CMD ["/usr/bin/supervisord", "-n"]

