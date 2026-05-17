FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency file first (for caching)
COPY package.json ./
COPY server.js ./

# Install dependencies
RUN npm install

# Copy remaining application code
COPY . .

# Create a non-root user
RUN addgroup -S roboshop && adduser -S roboshop -G roboshop

# Give ownership
RUN chown -R roboshop:roboshop /app

# Set environment variables
ENV MONGO=true
ENV MONGO_URL=mongodb://mongodb:27017/catalogue

# Switch user
USER roboshop

# Expose port
EXPOSE 8080

# Start app
CMD ["node", "server.js"]