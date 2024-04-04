FROM node:21.1.0-alpine

RUN mkdir /app
WORKDIR /app

COPY ./src /app/src
COPY ./package.json /app
COPY tsconfig.json /app

RUN npm install

CMD npx ts-node-dev src/indexLock.ts