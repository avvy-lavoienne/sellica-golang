# Single stage build
FROM node:20-alpine
WORKDIR /sellica-prop

# Copy the entire project (except items in .dockerignore)
COPY . .

# Install dependencies and build
RUN npm install
RUN npm run build

# Set production environment
ENV NODE_ENV production
ENV HOSTNAME 0.0.0.0

# Use Heroku's dynamic port
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]