"use strict";

if (process.env.SENTRY_DSN) {
  const Sentry = require("@sentry/node");
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const records = require('./records.js')
const bots = require('./bots.js')

try {
  records();
  bots();
} catch (e) {
  Sentry.captureException(e);
}
