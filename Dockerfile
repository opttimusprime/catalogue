FROM node:24-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create a non-root user and group
RUN addgroup -S roboshop && \
    adduser -S roboshop -G roboshop

# Copy dependency file
COPY package.json ./

# Install production dependencies
RUN npm install --omit=dev && \
    npm cache clean --force

# Copy application code
COPY --chown=roboshop:roboshop . .

# Switch to non-root user
USER roboshop

# Expose application port
EXPOSE 8080

# Start Catalogue application
CMD ["node", "server.js"]