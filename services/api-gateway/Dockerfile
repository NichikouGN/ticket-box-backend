FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY services/api-gateway/package.json ./services/api-gateway/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/api-gateway

EXPOSE 3000

CMD ["npm", "run", "dev"]