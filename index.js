"use strict";
const bugs = require('./bugs.js')
const records = require('./records.js')
const bots = require('./bots.js')

try {
  records();
  bots();
} catch (e) {
  bugs.log(e);
}
