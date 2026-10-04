FROM node:22-alpine AS single-stage

WORKDIR /app

COPY package*.json ./
COPY services/concert-service/package.json ./services/concert-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/concert-service

EXPOSE 3000

CMD ["npm", "run", "dev"]

# --------------------------------------------

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/concert-service/package.json ./services/concert-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/concert-service

RUN npm run build

# --------------------------------------------

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY services/concert-service/package.json ./services/concert-service/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/services/concert-service/dist ./services/concert-service/dist

WORKDIR /app/services/concert-service

EXPOSE 3000

CMD ["node", "dist/index.js"]