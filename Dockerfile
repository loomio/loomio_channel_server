FROM node:14
RUN apt-get update -qq && apt-get install -y build-essential sudo apt-utils

WORKDIR /app
ADD . /app

RUN npm install

EXPOSE 5000
CMD npm run start
