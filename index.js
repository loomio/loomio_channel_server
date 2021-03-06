require('dotenv').config()

if (process.env.SENTRY_DSN) {
  const Sentry = require("@sentry/node");
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const config = require('./config.js')
const io = require("socket.io");
const server = io.listen(config.port);
server.origins(config.allowedOrigins);

var tiptapEvents = require('./tiptap.js')
tiptapNamespace = server.of(/^\/tiptap\//)
tiptapNamespace.on("connection", tiptapEvents)

var recordsEvents = require('./records.js')
recordsNamespace = server.of(/^\/records/)
recordsNamespace.on("connection", recordsEvents)

const redis = require('redis')
const redisSubscribe = redis.createClient(config.redis)

redisSubscribe.on("message", function(channel, message_string) {
  let message = JSON.parse(message_string)
  if(message.notice) {
    recordsNamespace.to('notice').emit("update", {notice: message.notice})
  } else {
    recordsNamespace.to(message.room).emit("update", message)
  }
});

redisSubscribe.subscribe('/records', function(err, value) {
  if (err) {
    console.log("redis subscribe error",'/records', err)
    return
  }
  console.log("redis subscribed", '/records')
})

redisSubscribe.subscribe('/system_notice', function(err, value) {
  if (err) {
    console.log("redis subscribe to /system_notice error", err)
    return
  }
  console.log("redis subscribed", '/system_notice')
})
