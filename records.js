"use strict";

const { Server } = require("socket.io");
const redis = require('redis').createClient({
  url: (process.env.REDIS_URL || 'redis://localhost:6379/0')
});

var assumed_app_url = "https://"+(process.env.VIRTUAL_HOST || '').replace('channels.','')

const config = {
  port: (process.env.PORT || 5000),
  allowedOrigin: (process.env.APP_URL || assumed_app_url),
}

console.log(config.appUrl);

module.exports = async () => {
  const io = new Server(config.port, {
    cors: {
      origin: config.allowedOrigin,
      credentials: true
    }
  })

  const recordSocket = io.of(/^\/records/)

  redis.on('error', (err) => console.log('records redis client error', err));
  await redis.connect();

  const subscriber = redis.duplicate();
  await subscriber.connect();

  await subscriber.subscribe('/records', (json, channel) => {
    let data = JSON.parse(json)
    recordSocket.to(data.room).emit("update", JSON.parse(json))
  })

  await subscriber.subscribe('/system_notice', (json, channel) => {
    recordSocket.to('notice').emit("update", JSON.parse(json))
  })

  recordSocket.on("connection", async (socket) => {
    const recordsPath = socket.nsp.name

    socket.join("notice")

    let channel_token = socket.handshake.query.channel_token
    let user = await redis.get("/current_users/"+channel_token)

    if (user) {
      user = JSON.parse(user)
      socket.join("user-"+user.id)
      user.group_ids.forEach(groupId => { socket.join("group-"+groupId) })
      console.log("have current user!", user.name, user.group_ids)
    }else{
      console.log(new Error("cannot find channel token"+channel_token))
    }

    socket.on("catchup", (data, callback) => {
      console.log("catchup:", {data: data, callback: callback})
      Object.keys(data).forEach(async (room) => {
        let clientScore = data[room]
        records = await redis.zrange("/records/"+room, clientScore, "+inf")
        console.log("fetching data", room, data[room], records)
        callback(records.map(JSON.parse))
      })
    })
  })
}

