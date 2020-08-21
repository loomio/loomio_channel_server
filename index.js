

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
