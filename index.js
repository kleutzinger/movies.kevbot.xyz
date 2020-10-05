const dotenv = require("dotenv");
dotenv.config();
const TMDB_KEY = process.env.TMDB_KEY;
const client = require("./db.js");
const express = require("express");
const axios = require("axios");
const PORT = process.env.PORT || 5000;
const app = express();
const _ = require("lodash");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const path = require("path");
var fs = require("fs");
app.use(bodyParser.json());

// app.set('view engine', 'pug');
var cors = require("cors");
app.use(cors());
app.use(express.static("static"));
app.use(morgan("tiny"));

const server = app.listen(PORT, () => {
  console.log("server at http://localhost:" + PORT);
});

// const { apiRouter, get_upload_history } = require('./api.js');
// app.use('/api', apiRouter);

const gojira = "https://api.themoviedb.org/3/movie/1678";
const default_params = { api_key: TMDB_KEY, language: "en-US" };

app.get("/", async function(req, res, next) {
  try {
    const params = _.assign({ append_to_response: "credits" }, default_params);
    const resp = await axios.get(gojira, { params: params });
    const cast_ids = _.get(resp.data, "credits.cast").map((e) => e.id);
    const extra = cast_ids.slice(0).map((e) => {
      return `http://localhost:${PORT}/actor/${e}`;
    });
    res.json({ extra, data: resp.data });
  } catch (error) {
    next(error);
  }
});

app.get("/actor/:id", async function(req, res, next) {
  try {
    // check cache
    const id = req.params.id;
    const actor_key = `actor.${id}`;
    const cached = await client.get(actor_key);
    let answer;
    if (cached != null) {
      console.log("cache hit on " + actor_key);
      answer = JSON.parse(cached);
    } else {
      // ask tMDB api about actor
      console.log("cache miss on " + actor_key);
      const people_endpoint = "https://api.themoviedb.org/3/person/"; // ${id}
      const params = _.assign({}, default_params);
      const resp = await axios.get(people_endpoint + id, { params });
      answer = resp.data;
      client.set(actor_key, JSON.stringify(resp.data));
    }
    res.json({ answer, id });
  } catch (error) {
    next(error);
  }
});
