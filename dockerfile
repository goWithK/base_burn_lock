FROM node:21.1.0-alpine

RUN mkdir /app
WORKDIR /app

COPY . /app

CMD npx ts-node-dev src/indexLock.ts