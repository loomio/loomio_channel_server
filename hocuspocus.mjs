"use strict";
import { Server } from "@hocuspocus/server";
import { SQLite } from "@hocuspocus/extension-sqlite";
import { Logger } from "@hocuspocus/extension-logger";

const url = (process.env.APP_URL || `https://${process.env.CANONICAL_HOST}`) + '/api/hocuspocus'
const port = (process.env.RAILS_ENV == 'production') ? 5000 : 4444

console.log("hocuspocus auth url: ", url);

const server = Server.configure({
  port: port,
  timeout: 30000,
  debounce: 5000,
  maxDebounce: 30000,
  quiet: false,
  name: "hocuspocus",
  extensions: [
    new Logger(),
    new SQLite({database: ''}), // anonymous database on disk
  ],
  async onAuthenticate(data) {
    const { token, documentName } = data;
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ user_secret: token, document_name: documentName }),
        headers: { 'Content-type': 'application/json; charset=UTF-8' },
    })

    if (response.status != 200) {
      throw new Error("Not authorized!");
    } else {
      return true;
    }
  },
});

server.listen();
