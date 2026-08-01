"use strict";

const dns = require("node:dns")

const originalLookup = dns.lookup

dns.lookup = function lookup(hostname, options, callback) {
  if (typeof options === "function") {
    callback = options
    options = {}
  }
  return originalLookup.call(this, hostname, Object.assign({}, options, { family: 4 }), callback)
}
