FROM node:22-alpine AS single-stage

WORKDIR /app

COPY package*.json ./
COPY services/api-gateway/package.json ./services/api-gateway/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/api-gateway

EXPOSE 3000

CMD ["npm", "run", "dev"]

# --------------------------------------------

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/api-gateway/package.json ./services/api-gateway/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/api-gateway

RUN npm run build

# --------------------------------------------

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY services/api-gateway/package.json ./services/api-gateway/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist

WORKDIR /app/services/api-gateway

EXPOSE 3000

CMD ["node", "dist/index.js"]