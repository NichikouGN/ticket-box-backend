FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY services/concert-service/package.json ./services/concert-service/package.json

RUN echo "==== BEFORE npm ci ===="
RUN cat /app/services/concert-service/package.json
RUN npm ci

COPY . .

RUN echo "==== AFTER copy ===="
RUN cat /app/services/concert-service/package.json

WORKDIR /app/services/concert-service

EXPOSE 3000

CMD ["npm", "run", "dev"]