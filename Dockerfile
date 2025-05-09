# Use Node.js as the base image
FROM node:22.13.1-alpine3.21

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .


# Expose the application port
EXPOSE 3000

# Run Prisma commands and start the application
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run start:dev"]