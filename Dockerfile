FROM node:24-slim

WORKDIR /app
ADD . /app

RUN npm install

EXPOSE 5000
CMD npm run start
