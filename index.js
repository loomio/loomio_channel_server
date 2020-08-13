
const io = require("socket.io");
var config = require('./config.js')

var events = require('./events.js')
const server = io.listen(config.port);
server.origins(config.allowedOrigins);

const redisClient = require('./redis.js')

const { promisify } = require("util");

const getAsync = promisify(redisClient.get).bind(redisClient);

nameSpace = server.of(/^\/tiptap\//)

// nameSpace.use(async (socket, next) => {
//   channel_token = socket.handshake.query.channel_token
//   user = await getAsync("/channel_tokens/"+channel_token)
//   socket.user = user
//
//   if (user) {
//     console.log("nexting")
//     next()
//   }else{
//     next(new Error("cannot find channel token"+channel_token))
//   }
// });
//
nameSpace.on("connection", events)
// server.of(/^\/group-\d+$/).on("connection", events)
// server.of(/^\/user-\d+$/).on("connection", events)
// server.of(/^\/global$/).on("connection", events)
