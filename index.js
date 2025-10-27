"use strict";
const bugs = require('./bugs.js')
const records = require('./records.js')
const bots = require('./bots.js')

if ((process.env.APP_URL || "").length == 0) {
  throw "Missing ENV: APP_URL. It should be something like http://app:3000 or http://localhost:3000 or https://example.com"
}

try {
  records();
  bots();
} catch (e) {
  bugs.log(e);
}
