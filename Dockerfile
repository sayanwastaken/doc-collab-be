FROM node:22-alpine

ENV NODE_VERSION 22.12.0

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

COPY . .

RUN npm install 

EXPOSE 4080

# Runs once at build time
RUN echo "Building image..."

# Runs every time the container starts
CMD npm run build && npm run start:prod
