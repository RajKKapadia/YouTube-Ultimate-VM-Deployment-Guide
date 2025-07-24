FROM node:23.11.1-alpine3.21

WORKDIR /app

COPY . .

RUN npm install -g pnpm

ENV CI=true

RUN pnpm install

RUN pnpm build

EXPOSE 5000
