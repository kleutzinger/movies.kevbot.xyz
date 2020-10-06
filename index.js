const dotenv = require("dotenv");
dotenv.config();
const TMDB_KEY = process.env.TMDB_KEY;
if (!process.env.BASE_URL) {
  process.env.BASE_URL = "http://actors.kevbot.xyz";
}
const BASE_URL = process.env.BASE_URL;

const client = require("./db.js");
const express = require("express");
const axios = require("axios");
const PORT = process.env.PORT || 5000;
const INTERNAL_URL = `http://localhost:${PORT}`;
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
  console.log("BASE_URL = " + process.env.BASE_URL);
});

// const { apiRouter, get_upload_history } = require('./api.js');
// app.use('/api', apiRouter);

const gojira = "https://api.themoviedb.org/3/movie/1678";
const default_params = { api_key: TMDB_KEY, language: "en-US" };

app.get("/gojira", (req, res) => {
  req.url = "/movie/1678";
  app.handle(req, res);
});

app.get("/movie/:id", async function(req, res, next) {
  try {
    const resp = await get_tmdb(req.params.id, "movie");
    const cast_ids = _.get(resp, "credits.cast").map((e) => e.id);
    const clickable = cast_ids.slice(0).map((e) => {
      const base_url = process.env.BASE_URL;
      return `${base_url}/actor/${e}`;
    });
    // cast_ids.push("abc");
    const promises = cast_ids.map(
      // (id) => axios.get(INTERNAL_URL + "/actor/" + id)
      (id) => get_tmdb(id, "actor")
    );
    Promise.allSettled(promises)
      .then((results) => {
        // results.map((e) => console.log(e.status));
        const [ validResults, badResults ] = _.partition(
          results,
          (e) => e.status === "fulfilled"
        );
        // if (badResults.length >= 1) {
        //   console.log(badResults);
        // }
        const actors = validResults.map((e) => e.value);
        const gimme = (actor) => _.pick(actor, [ "name", "birthday", "meta" ]);
        const summary = _.sortBy(_.map(actors, gimme), [
          "meta.status",
          (a) => -a.meta.age // sort by oldest alive first
        ]);
        res.json({ summary, clickable, data: resp.data });
      })
      .catch((error) => {
        next(error);
      });
  } catch (error) {
    next(error);
  }
});

// have: my endpoint urls
// app.get("/cast/:movie_id")
// app.get("/alives/:movie_id")
// TODO age in film

app.get("/actor/:id", async function(req, res, next) {
  try {
    const actor = await get_tmdb(req.params.id, "actor");
    res.json(actor);
  } catch (error) {
    next(error);
  }
});

async function get_tmdb(id, loc = "actor") {
  // loc = actor | movie
  // TODO | config
  // get actor value from cache or api
  let cache_key, endpoint, extra_params, thing;

  if (loc === "actor" || loc === "person") {
    cache_key = "/actor/" + id;
    endpoint = "https://api.themoviedb.org/3/person/" + id;
  } else if (loc === "movie") {
    cache_key = "/movie/" + id;
    endpoint = "https://api.themoviedb.org/3/movie/" + id;
    extra_params = { append_to_response: "credits" };
  } else {
    throw "loc not equal actor | movie";
  }
  // check cache
  const cached = await client.get(cache_key);
  if (cached != null) {
    thing = JSON.parse(cached);
  } else {
    console.log("askd tmbd api " + cache_key);
    // console.log(_.assign(default_params, extra_params));
    const resp = await axios.get(endpoint, {
      params : _.assign(default_params, extra_params)
    });
    if (resp.status === 200 && !_.isEmpty(resp.data)) {
      thing = resp.data;
      // prettier-ignore
      if (loc == "actor") {thing = _.omit(thing, [ "credits", "biography", "also_known_as" ]);}
      client.setex(cache_key, 3600 * 24, JSON.stringify(thing));
      thing.cache_miss = true;
    }
  }
  if (loc === "actor") {
    thing.meta = actor_meta(thing);
  }
  return thing;
}

function actor_meta(actor) {
  let status, age, died_at, imdb_link, tmdb_link;
  if (!actor.birthday) {
    status = "no_bday";
  } else if (actor.deathday) {
    status = "deceased";
    died_at = getAge(Date.parse(actor.birthday), new Date(actor.deathday));
    age = getAge(Date.parse(actor.birthday), new Date());
  } else {
    status = "alive";
    age = getAge(new Date(actor.birthday), new Date());
  }
  if (actor.imdb_id) {
    imdb_link = "https://www.imdb.com/name/" + actor.imdb_id;
  }
  tmdb_link = "https://www.themoviedb.org/person/" + actor.id;

  return { status, age, died_at, imdb_link, tmdb_link };
}

function getAge(start, until = new Date()) {
  var birthDate = new Date(start);
  var age = until.getFullYear() - birthDate.getFullYear();
  var m = until.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && until.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const exampl_actor = {
  birthday             : "1897-12-01",
  known_for_department : "Acting",
  deathday             : "1967-12-29",
  id                   : 134406,
  name                 : "Toranosuke Ogawa",
  also_known_as        : [ "小川虎之助", "小川寅次" ],
  gender               : 2,
  biography            : "",
  popularity           : 1.4,
  place_of_birth       : "Tokyo, Tokyo Prefecture, Japan",
  profile_path         : "/ity0fmKfozqyLjhNZN4Rzv65NSZ.jpg",
  adult                : false,
  imdb_id              : "nm0644574",
  homepage             : null,
  cache_miss           : true
};
