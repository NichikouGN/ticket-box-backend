FROM node:22-alpine AS single-stage

WORKDIR /app

COPY package*.json ./
COPY services/notification-service/package.json ./services/notification-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/notification-service

EXPOSE 3000

CMD ["npm", "run", "dev"]

# --------------------------------------------

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/notification-service/package.json ./services/notification-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/notification-service

RUN npm run build

# --------------------------------------------

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY services/notification-service/package.json ./services/notification-service/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist

WORKDIR /app/services/notification-service

EXPOSE 3000

CMD ["node", "dist/index.js"]
CMD ["npm", "run", "dev"]