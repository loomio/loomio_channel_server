FROM node:24-alpine

WORKDIR /app
ADD . /app

RUN npm install

EXPOSE 5000
CMD npm run start
