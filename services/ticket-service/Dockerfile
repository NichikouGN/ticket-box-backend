FROM node:22-alpine AS single-stage

WORKDIR /app

COPY package*.json ./
COPY services/ticket-service/package.json ./services/ticket-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/ticket-service

EXPOSE 3000

CMD ["npm", "run", "dev"]

# --------------------------------------------

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/ticket-service/package.json ./services/ticket-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/ticket-service

RUN npm run build

# --------------------------------------------

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY services/ticket-service/package.json ./services/ticket-service/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/services/ticket-service/dist ./services/ticket-service/dist

WORKDIR /app/services/ticket-service

EXPOSE 3000

CMD ["node", "dist/index.js"]