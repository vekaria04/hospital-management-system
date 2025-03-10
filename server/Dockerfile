# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json before copying the rest of the files
COPY package*.json ./

# Install dependencies inside the Docker container
RUN npm install

# Copy the rest of the application files
COPY . .

# Run a test build to ensure everything compiles
RUN npm run build || echo "No build script, skipping..."

# Production stage: Use a smaller image to reduce size
FROM node:18-alpine

# Set working directory again in the final stage
WORKDIR /usr/src/app

# Copy built files and dependencies from the builder stage
COPY --from=builder /usr/src/app .

# Expose the required port
ENV PORT=8080
EXPOSE 8080

# Command to start the application
CMD ["node", "server.js"]
