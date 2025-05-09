#!/bin/bash

# Stop and remove all running containers
echo "Stopping and removing all running containers..."
docker-compose down --volumes --remove-orphans

# Remove all Docker images
echo "Removing all Docker images..."
docker rmi $(docker images -q) -f

# Remove all Docker volumes
echo "Removing all Docker volumes..."
docker volume rm $(docker volume ls -q) -f

# Build and deploy only the mysql and back-end services
echo "Building and deploying only mysql and back-end services..."
docker-compose up --build -d

echo "MySQL and back-end services are up and running!"
