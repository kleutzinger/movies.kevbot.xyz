const dotenv = require("dotenv");
dotenv.config();
const TMDB_KEY = process.env.TMDB_KEY;
if (!process.env.BASE_URL) {
  process.env.BASE_URL = "https://actors.kevbot.xyz";
}
const BASE_URL = process.env.BASE_URL;

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
  console.log("BASE_URL = " + process.env.BASE_URL);
});

// const { apiRouter, get_upload_history } = require('./api.js');
// app.use('/api', apiRouter);

const gojira = "https://api.themoviedb.org/3/movie/1678";
const default_params = { api_key: TMDB_KEY, language: "en-US" };

app.get("/gojira", async function(req, res, next) {
  try {
    const params = _.assign({ append_to_response: "credits" }, default_params);
    const resp = await axios.get(gojira, { params: params });
    const cast_ids = _.get(resp.data, "credits.cast").map((e) => e.id);
    const clickable = cast_ids.slice(0).map((e) => {
      const base_url = process.env.BASE_URL;
      return `${base_url}/actor/${e}`;
    });
    // cast_ids.push("abc");
    const promises = cast_ids.map((id) => axios.get(BASE_URL + "/actor/" + id));
    Promise.allSettled(promises)
      .then((results) => {
        // results.map((e) => console.log(e.status));
        const [ validResults, badResults ] = _.partition(
          results,
          (e) => e.status === "fulfilled"
        );
        if (badResults.length >= 1) {
          console.log(badResults);
        }
        const actors = validResults.map((e) => e.value.data);
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

app.get("/movie/:id", async function(req, res, next) {
  try {
    const endpoint = "https://api.themoviedb.org/3/movie/" + req.params.id;
    res.json({ msg: "TODO ", endpoint });
  } catch (error) {
    next(error);
  }
});

app.get("/actor/:id", async function(req, res, next) {
  try {
    const endpoint = "https://api.themoviedb.org/3/person/" + req.params.id;
    // check cache
    const cache_key = req.path;
    const cached = await client.get(cache_key);
    if (cached != null) {
      res.json(JSON.parse(cached));
    } else {
      // cache miss, ask tMDB api about actor
      console.log("api hit " + cache_key);
      const resp = await axios.get(endpoint, { params: default_params });
      if (resp.status === 200) {
        // we have a new actor
        const actor = resp.data;
        actor.meta = actor_meta(actor);
        client.setex(cache_key, 3600 * 24, JSON.stringify(actor));
      }
      resp.data.cache_miss = true;
      res.json(resp.data);
    }
  } catch (error) {
    next(error);
  }
});

function actor_meta(actor) {
  let status;
  let age;
  let died_at;
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
  return { status, age, died_at };
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
