"use strict";

const bugs = require('./bugs.js')
const { Server } = require("socket.io");
const redis = require('redis').createClient({
  url: (process.env.REDIS_URL || 'redis://localhost:6379/0')
});

var assumed_app_url = "https://"+ (process.env.CANONICAL_HOST || (process.env.VIRTUAL_HOST || '').replace('channels.',''))

const config = {
  port: (process.env.PORT || 5000),
  allowedOrigin: (process.env.APP_URL || assumed_app_url),
}

console.log("Allowed origin", config.allowedOrigin);

module.exports = async () => {
  try {
    const io = new Server(config.port, {
      connectionStateRecovery: {
        maxDisconnectionDuration: 30 * 60 * 1000,
        skipMiddlewares: true,
      },
      cors: {
        origin: config.allowedOrigin,
        credentials: true
      }
    })

    redis.on('error', (err) => bugs.log(err) );
    await redis.connect();

    const redisSub = redis.duplicate();
    await redisSub.connect();

    await redisSub.subscribe('/records', (json, channel) => {
      let data = JSON.parse(json)
      io.to(data.room).emit('records', data)
    })

    await redisSub.subscribe('/system_notice', (json, channel) => {
      io.emit('notice', JSON.parse(json))
    })

    io.on("connection", async (socket) => {
      socket.join("notice")

      let channel_token = socket.handshake.query.channel_token
      let user = await redis.get("/current_users/"+channel_token)

      if (user) {
        user = JSON.parse(user)
        socket.join("user-"+user.id)
        user.group_ids.forEach(groupId => { socket.join("group-"+groupId) })
        console.log("have current user!", user.name, user.group_ids)
      }
    })
  } catch (e) {
    bugs.log(e)
  }
}
