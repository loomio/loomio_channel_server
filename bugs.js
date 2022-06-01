"use strict";
const dsn = process.env.SENTRY_PUBLIC_DSN || process.env.SENTRY_DSN
const Sentry = require("@sentry/node");
const SentryTracing = require("@sentry/tracing");

if (dsn) {
	console.log("have DSN:", dsn)
  Sentry.init({ dsn: dsn, tracesSampleRate: 0.1 });
}


module.exports = {
	log: (e) => {
		if (dsn) {
			Sentry.captureException(e);
		}else{
			console.log("error:", e);
		}
	}
}
