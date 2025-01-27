# Use the official Node.js image as a base
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

COPY . .

# Create a non-root user and switch to it
RUN useradd -m -u 10014 appuser
USER 10014

# Install dependencies
RUN npm install 

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
