FROM node:22

WORKDIR /app
ADD . /app

RUN npm install

EXPOSE 5000
CMD npm run start
