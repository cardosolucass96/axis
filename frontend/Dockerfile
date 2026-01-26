# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG GEMINI_API_KEY

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}
ENV GEMINI_API_KEY=${GEMINI_API_KEY}

# Build the application
RUN npm run build

# Production stage - using nginx to serve static files
FROM nginx:alpine AS production

# Install timezone data
RUN apk add --no-cache tzdata

# Set timezone
ENV TZ=America/Sao_Paulo

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
