const dotenv = require("dotenv");
dotenv.config();
var redis = require("promise-redis")();
const client = redis.createClient(process.env.REDIS_URI);

module.exports = client;
