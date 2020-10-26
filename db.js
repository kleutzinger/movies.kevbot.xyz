const dotenv = require("dotenv");
dotenv.config();
var redis = require("promise-redis")();
const client = redis.createClient(process.env.REDIS_URL);

// which do you run as you random?
// what if there's no entries in queue available?
// what if all entries are too old?
// what are we actually storing in the queue?

function populate_queue() {
  // POOL / BUFFERED
  // https://stackoverflow.com/a/48051185 (reds fifo time expiry)
  // 5 buffered queue inputs
  // run every N minutes
}

function filter_queue() {
  // remove old cached stuff
  // run on startup? or when?
}

function check_queue() {
  // return length(?) of queue
}

function queue_pop() {
  // get a recent-enough queue thing if possible
}
module.exports = { client };
