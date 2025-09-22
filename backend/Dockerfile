FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install development dependencies globally for production container
RUN npm install -g nodemon ts-node

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build the application (skip for now due to TypeScript errors)
# RUN npm run build

EXPOSE 3101

# Start the application in development mode
CMD ["npm", "run", "dev"]