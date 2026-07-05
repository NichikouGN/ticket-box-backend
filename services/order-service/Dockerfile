FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY services/order-service/package.json ./services/order-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/order-service

EXPOSE 3000

CMD ["npm", "run", "dev"]