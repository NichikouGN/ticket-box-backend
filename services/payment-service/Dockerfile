FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY services/payment-service/package.json ./services/payment-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/payment-service

EXPOSE 3000

CMD ["npm", "run", "dev"]