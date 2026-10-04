FROM node:22-alpine AS single-stage

WORKDIR /app

COPY package*.json ./
COPY services/user-service/package.json ./services/user-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/user-service

EXPOSE 3000

CMD ["npm", "run", "dev"]

# --------------------------------------------

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/user-service/package.json ./services/user-service/package.json

RUN npm ci

COPY . .

WORKDIR /app/services/user-service

RUN npm run build

# --------------------------------------------

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY services/user-service/package.json ./services/user-service/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/services/user-service/dist ./services/user-service/dist

WORKDIR /app/services/user-service

EXPOSE 3000

CMD ["node", "dist/index.js"]