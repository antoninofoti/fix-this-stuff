#!/bin/bash

# Script to start all microservices

# Navigate to the project directory
cd "$(dirname "$0")"

# Define colors for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Fix This Stuff Microservices...${NC}"

# Detect whether to use 'docker compose' or 'docker-compose'
DOCKER_COMPOSE_CMD="docker-compose"
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Warning: Neither 'docker compose' nor 'docker-compose' command found.${NC}"
    echo -e "${YELLOW}Please ensure Docker and Docker Compose are installed correctly.${NC}"
    exit 1
fi

echo -e "${BLUE}Using command: ${DOCKER_COMPOSE_CMD}${NC}"

# Stop any existing containers and remove them
echo -e "${BLUE}Stopping any existing containers...${NC}"
$DOCKER_COMPOSE_CMD down

# Build and start all services
echo -e "${BLUE}Building and starting all services...${NC}"
$DOCKER_COMPOSE_CMD up -d --build

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Check if services are running
echo -e "${BLUE}Checking service status:${NC}"
$DOCKER_COMPOSE_CMD ps

# Display API endpoints
echo -e "\n${GREEN}=== Fix This Stuff API Endpoints ===${NC}"
echo -e "${YELLOW}Auth Service:${NC} http://localhost:3001"
echo -e "  - Register: POST /api/auth/register"
echo -e "  - Login: POST /api/auth/login"
echo -e "  - Profile: GET /api/auth/profile"
echo -e ""
echo -e "${YELLOW}User Service:${NC} http://localhost:3002"
echo -e "  - Get All Users: GET /api/users"
echo -e "  - Get User: GET /api/users/:userId"
echo -e "  - Update User: PUT /api/users/:userId"
echo -e "  - Delete User: DELETE /api/users/:userId"
echo -e ""
echo -e "${YELLOW}Ticket Service:${NC} http://localhost:3003"
echo -e "  - Create Ticket: POST /api/tickets"
echo -e "  - Get All Tickets: GET /api/tickets"
echo -e "  - Get Ticket: GET /api/tickets/:ticketId"
echo -e "  - Update Ticket: PUT /api/tickets/:ticketId"
echo -e "  - Delete Ticket: DELETE /api/tickets/:ticketId"
echo -e ""
echo -e "${BLUE}Database:${NC} PostgreSQL on port 5432"
echo -e "${BLUE}pgAdmin:${NC} http://localhost:8080"
echo -e ""
echo -e "${GREEN}To stop all services, run: ${DOCKER_COMPOSE_CMD} down${NC}"
