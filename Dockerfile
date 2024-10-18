# Use the official Node.js image as a base
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

COPY . .

# Install dependencies
RUN npm install 

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]