const dotenv = require("dotenv");
dotenv.config();
var redis = require("promise-redis")();

console.log(process.env.FAKE_REDIS);

function fix_redis_uri(a) {
  // https://stackoverflow.com/questions/67613484/redis-err-wrong-number-of-arguments-for-auth-command#comment124201033_67617609
  const usr = a.split("redis://")[1].split(":")[0];
  a = a.replace(usr, "");
  return a;
}
const client =
  process.env.FAKE_REDIS === "1"
    ? require("fakeredis").createClient()
    : redis.createClient(fix_redis_uri(process.env.REDIS_URL));
const fs = require("fs");
const _ = require("lodash");
const parse = require("csv-parse/lib/sync");
let kev_seen_table = {};
const watched_csv = fs.readFileSync("watched.csv");
const watched = parse(watched_csv, { columns: true });
// remove non-alphanumeric characters and convert to lowercase
const cleanString = (s) => s.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
for (const movie of watched) {
  // example: "The Matrix" (1999) => thematrix1999
  const cleaned = cleanString(movie["Name"]);
  const cur = cleaned + movie["Year"];
  kev_seen_table[cur] = true;
}
console.log(`Kevin has seen ${Object.keys(kev_seen_table).length} movies`);

function is_seen_by_kevin(movie) {
  // some movies have slightly different release dates across tmdb and
  // letterboxd. search the range of release_date += year_plus_minus
  try {
    const title = _.get(movie, "title", "");
    const year = parseInt(_.get(movie, "release_date", "0").split("-")[0]);
    const year_plus_minus = 2;
    for (let dy = -year_plus_minus; dy <= year_plus_minus; dy++) {
      const test_name = cleanString(`${title}${year + dy}`);
      if (kev_seen_table[test_name]) {
        return true;
      }
    }
    return false;
  } catch (error) {
    // console.log(error);
    return false;
  }
}
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
module.exports = { client, is_seen_by_kevin };
