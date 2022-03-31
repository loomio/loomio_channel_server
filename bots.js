"use strict";

const MatrixSDK = require("matrix-bot-sdk");
const MatrixClient = MatrixSDK.MatrixClient;
const SimpleFsStorageProvider = MatrixSDK.SimpleFsStorageProvider;
const AutojoinRoomsMixin = MatrixSDK.AutojoinRoomsMixin;

const redis = require('redis').createClient({
  url: (process.env.REDIS_URL || 'redis://localhost:6379/0')
});

const bots = {};

module.exports = async () => {
	console.log("bots server")

  redis.on('error', (err) => console.log('bots redis client error', err));
  await redis.connect();
  let bots = {}

  let startBots = async () => {
    console.log('starting bots')
    let configs = await redis.hGetAll('chatbot/configs')

    for (const botId in configs) {
      config = JSON.parse(configs[botId]);
      config.client = new MatrixClient(config['server'], config['access_token']);
      // AutojoinRoomsMixin.setupOnClient(config.client)
      bots[botId] = config
    }

    for (const botId in bots) {
      bot = bots[botId]
      bot.client.resolveRoom(bot['channel']).then((roomId) => {
        bot.client.sendMessage(roomId, {"msgtype": "m.notice", "body": 'this bot is alive'});
      })
    }

    console.log(bots)
  }

  startBots()

  const subscriber = redis.duplicate();
  await subscriber.connect();
  await subscriber.pSubscribe('chatbot/*', (json, channel) => {
    const params = JSON.parse(json);
    console.log(`channel: ${channel}, json: ${json}`);
    if (channel == 'chatbot/test') {
      const client = new MatrixClient(params['server'], params['access_token']);
      client.resolveRoom(params['channel']).then((roomId) => {
        client.sendMessage(roomId, {"msgtype": "m.notice", "body": params['message']});
      })
    }

    if (channel == 'chatbot/publish') {
      console.log('publish:', params)
      const bot = bots[params['chatbot_id']]
      bot.client.resolveRoom(bot['channel']).then((roomId) => {
        bot.client.sendHtmlText(roomId, params.payload.text);
      })
    }

    if (channel == 'chatbot/config') { startBots() }
  });
}


