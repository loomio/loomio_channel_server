'use strict';

const { promisify } = require("util");
const config = require('./config.js')
const redis = require('redis')
const redisSubscribe = redis.createClient(config.redis)
const redisClient = redis.createClient(config.redis)
const getAsync = promisify(redisClient.get).bind(redisClient);

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

  console.log('socket connect', socket.nsp.name)

  redisSubscribe.on("message", function(channel, message_string) {
    let message = JSON.parse(message_string)
    // console.log("message", channel, "group-"+message.group_id,  message_string)
    socket.to(message.room).emit("update", message.records)
  });

  redisSubscribe.subscribe(socket.nsp.name, function(err, value) {
    if (err) {
      console.log("redis subscribe error", socket.nsp.name, err)
      return
    }
    console.log("redis subscribed", socket.nsp.name)
  })
}

module.exports = records
