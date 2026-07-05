FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY services/notification-service/package.json ./services/notification-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/notification-service

EXPOSE 3000

CMD ["npm", "run", "dev"]