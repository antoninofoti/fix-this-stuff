# Multi-stage build for Vue.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy all source files
COPY . .

# Clean install of dependencies
RUN npm ci --ignore-scripts || npm install

# Build arguments for environment variables
ARG VITE_AUTH_API_URL
ARG VITE_USER_API_URL
ARG VITE_TICKET_API_URL
ARG VITE_ROLE_API_URL
ARG VITE_COMMENT_API_URL

# Set environment variables for build
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_USER_API_URL=$VITE_USER_API_URL
ENV VITE_TICKET_API_URL=$VITE_TICKET_API_URL
ENV VITE_ROLE_API_URL=$VITE_ROLE_API_URL
ENV VITE_COMMENT_API_URL=$VITE_COMMENT_API_URL

# Build the application
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Install curl for healthcheck (more reliable than wget)
RUN apk add --no-cache curl

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check - using curl with proper timeouts and longer start period
# start-period increased to 40s to account for slow startup after docker compose restart
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl --fail --silent --show-error http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
