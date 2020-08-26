'use strict';

const { promisify } = require("util");
const config = require('./config.js')
const redis = require('redis')
const redisSubscribe = redis.createClient(config.redis.records)
const redisClient = redis.createClient(config.redis.records)

const getAsync = promisify(redisClient.get).bind(redisClient);
const zrangeAsync = promisify(redisClient.zrangebyscore).bind(redisClient);

var records = async function(socket) {
  const recordsPath = socket.nsp.name

  let channel_token = socket.handshake.query.channel_token
  let user = await getAsync("/current_users/"+channel_token)
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
      records = await zrangeAsync("/records/"+room, clientScore, "+inf")
      // console.log("fetching data", room, data[room], records)
      callback(records.map(JSON.parse))
    })
  })
}

module.exports = records
