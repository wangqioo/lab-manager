# Stage 1: Build React frontend
FROM node:18-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN node node_modules/vite/bin/vite.js build

# Stage 2: Production image (Node.js + Express)
FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source
COPY backend/ ./

# Copy built frontend
COPY --from=frontend /app/dist ./dist

# Data directory for SQLite
RUN mkdir -p /data

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/lab.db

CMD ["node", "server.js"]
