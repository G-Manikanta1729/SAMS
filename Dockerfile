# ========== Stage 1: Build frontend ==========
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ========== Stage 2: Build backend ==========
FROM node:20-alpine AS backend-builder

WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

# ========== Stage 3: Final image (Node + MongoDB + static files) ==========
FROM ubuntu:22.04

# Install Node.js, MongoDB, and supervisor
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean

# Install MongoDB
RUN curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg \
    && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list \
    && apt-get update \
    && apt-get install -y mongodb-org \
    && apt-get clean

# Create directories
WORKDIR /app

# Copy backend from builder
COPY --from=backend-builder /backend /app/backend
# Copy built frontend to static folder
COPY --from=frontend-builder /frontend/dist /app/backend/public

# Create supervisor configuration
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create data directory for MongoDB
RUN mkdir -p /data/db && chown -R mongodb:mongodb /data/db

# Expose ports
EXPOSE 5000 27017

# Start supervisor (manages both MongoDB and Node backend)
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]