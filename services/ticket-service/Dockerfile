FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY services/ticket-service/package.json ./services/ticket-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/ticket-service

EXPOSE 3000

CMD ["npm", "run", "dev"]