'use strict';

let
  redis = require('redis'),
  redisClient = redis.createClient({ port: 6379, host: 'localhost' })

redisClient.on("error", function(err) {
  console.error("redisClient", err)
});

module.exports = redisClient
