FROM node:18-slim

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Set timezone
ENV TZ=America/Chicago

# Run the tweet bot by default
# Change to replyguy.js if you want to run that bot instead
CMD ["node", "bot-types/tweetBot.js"]
