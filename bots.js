"use strict";

const bugs = require('./bugs.js')
const MatrixSDK = require("matrix-bot-sdk");
const MatrixClient = MatrixSDK.MatrixClient;
const SimpleFsStorageProvider = MatrixSDK.SimpleFsStorageProvider;
const AutojoinRoomsMixin = MatrixSDK.AutojoinRoomsMixin;

const redis = require('redis').createClient({
  url: (process.env.REDIS_URL || 'redis://localhost:6379/0')
});

const bots = {};

console.log("booting bots!");
module.exports = async () => {
  try {
    redis.on('error', (err) => bugs.log('bots redis client error', err));
    await redis.connect();
    let bots = {}

    const subscriber = redis.duplicate();
    await subscriber.connect();
    console.log("bot redis connected");
    await subscriber.pSubscribe('chatbot/*', (json, channel) => {
      console.log(`bot message: channel: ${channel}, json: ${json}`);
      
      const params = JSON.parse(json);

      if (channel == 'chatbot/test') {
        const client = new MatrixClient(params['server'], params['access_token']);
        client.resolveRoom(params['channel']).then((roomId) => {
          client.sendMessage(roomId, {"msgtype": "m.notice", "body": params['message']});
        })
      }

      if (channel == 'chatbot/publish') {
        const key = JSON.stringify(params.config)
        if (!bots[key]) {
          bots[key] = new MatrixClient(params.config.server, params.config.access_token);
        }

        bots[key].resolveRoom(params.config.channel).then((roomId) => {
          bots[key].sendHtmlText(roomId, params.payload.html);
        })
      }
    });
  } catch (e) {
    bugs.log(e)
  }
}