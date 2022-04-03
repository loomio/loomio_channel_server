"use strict";

if (dsn = process.env.SENTRY_PUBLIC_DSN || process.env.SENTRY_DSN) {
  const Sentry = require("@sentry/node");
  Sentry.init({ dsn: dsn });
}

const records = require('./records.js')
const bots = require('./bots.js')

try {
  records();
  bots();
} catch (e) {
  Sentry.captureException(e);
}
