'use strict';

let
  redis = require('redis'),
  redisClient = redis.createClient({ port: (process.env.REDIS_PORT || 6379), host: (process.env.REDIS_HOST || 'localhost') })

redisClient.on("error", function(err) {
  console.error("redisClient", err)
});

module.exports = redisClient
