const dotenv = require("dotenv");
dotenv.config();

// don't load table on local development
const TMDB_KEY = process.env.TMDB_KEY;
if (!process.env.BASE_URL) {
  process.env.BASE_URL = "http://movies.kevbot.xyz";
}
const dboptions = {
  readonly: true,
  fileMustExist: true,
};
var fs = require("fs");
// check if imdb_years exists
//
let db;
if (fs.existsSync("imdb_years.db")) {
  db = require("better-sqlite3")("imdb_years.db", dboptions);
}

const BASE_URL = process.env.BASE_URL;

const { client, is_seen_by_kevin } = require("./db.js");
const express = require("express");
const axios = require("axios");
const any = require("promise.any");
const Zodiac = require("zodiac-signs")("en");
const pe = require("pretty-error").start();

const PORT = process.env.PORT || 5000;
const INTERNAL_URL = `http://localhost:${PORT}`;

const app = express();
const _ = require("lodash");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const path = require("path");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.set('view engine', 'pug');
var cors = require("cors");
app.use(cors());
app.use(
  require("serve-favicon")(
    path.join(__dirname, "static", "img", "favicon.ico"),
  ),
);
app.use(morgan("tiny"));

const server = app.listen(PORT, () => {
  console.log("server at http://localhost:" + PORT);
  console.log("BASE_URL = " + process.env.BASE_URL);
});

// const { apiRouter, get_upload_history } = require('./api.js');
// app.use('/api', apiRouter);

const gojira = "https://api.themoviedb.org/3/movie/1678";
const default_params = { api_key: TMDB_KEY, language: "en-US" };

app.get("/", async (req, res) => {
  console.log("gettin");
  res.sendFile(path.join(__dirname, "static/index.html"));
});
app.use(express.static("static"));

app.get("/gojira", (req, res) => {
  req.url = "/movie/1678";
  app.handle(req, res);
});

app.get("/random_movie", async function (req, res, next) {
  res.json({ message: "todo" });
});

app.get("/valid_ids", async function (req, res, next) {
  // const endpoint = "https://api.themoviedb.org/3/movie/"; // + id
  const endpoint = "https://www.themoviedb.org/movie/";
  const ordered_ids = [];
  for (let i = 0; i < 300; i++) {
    ordered_ids.push(i);
  }
  const proms = ordered_ids.map((id) => {
    return axios.get(endpoint + id, {
      params: { validateStatus: false, ...default_params },
    });
  });
  console.log(ordered_ids);
  r = await Promise.allSettled(proms);
  const statuses = r.map((e, idx) => {
    return {
      idx,
      status: e.status === "fulfilled",
    };
  });
  // client.setex("/movie/" + r.data.id, 10000, JSON.stringify(r.data));
  res.json(statuses);
});

app.get("/movie-actor-count/:id", async function (req, res, next) {
  try {
    const resp = await get_tmdb(req.params.id, "movie");
    res.json(_.get(resp, "credits.cast").length);
  } catch (error) {
    next(error);
  }
});

app.get("/movie/:id", async function (req, res, next) {
  try {
    const resp = await get_tmdb(req.params.id, "movie");
    resp.seen_by_kevin = is_seen_by_kevin(resp);
    const cast_ids = _.get(resp, "credits.cast").map((e) => e.id);
    const clickable = cast_ids.slice(0).map((e) => {
      const base_url = process.env.BASE_URL;
      return `${base_url}/actor/${e}`;
    });
    // cast_ids.push("abc");
    const promises = cast_ids.map(
      // (id) => axios.get(INTERNAL_URL + "/actor/" + id)
      (id) => get_tmdb(id, "actor"),
    );
    Promise.allSettled(promises)
      .then((results) => {
        // results.map((e) => console.log(e.status));
        const [validResults, badResults] = _.partition(
          results,
          (e) => e.status === "fulfilled",
        );
        // if (badResults.length >= 1) {
        //   console.log(badResults);
        // }
        const actors = validResults.map((e) => e.value);
        // prettier-ignore
        const gimme = (actor) => _.pick(actor, ["profile_path","id", "name", "birthday", "deathday", "meta", "approximate_birthday"]);
        const cast_summary = _.sortBy(_.map(actors, gimme), [
          // 0, //don't sort
          (p) => -p.meta.popularity,
          "meta.status",
          (a) => -a.meta.age, // sort by oldest alive first
        ]);
        res.json({ cast: cast_summary, movie: resp });
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

app.get("/actor/:id", async function (req, res, next) {
  try {
    const actor = await get_tmdb(req.params.id, "actor");
    res.json(actor);
  } catch (error) {
    next(error);
  }
});

app.get("/config", async function (req, res, next) {
  try {
    const cfg = await get_tmdb_config();
    res.json(cfg);
  } catch (error) {
    next(error);
  }
});

app.get("/random_id", async (req, res, next) => {
  // return a random valid movie id number (or movie obj?) caching?
  try {
    const endpoint = "https://api.themoviedb.org/3/movie/"; // + id
    const random_ids = [];
    for (let i = 0; i < 5; i++) {
      random_ids.push(Math.floor(Math.random() * 10000));
    }
    const proms = random_ids.map((id) => {
      return axios.get(endpoint + id, {
        params: { validateStatus: false, ...default_params },
      });
    });
    console.log(random_ids);
    r = await any(proms);
    // client.setex("/movie/" + r.data.id, 10000, JSON.stringify(r.data));
    res.json(r.data);
    // axios.get(url, { validateStatus: false });
    // Promise.any([axios.get(tmdb.org/movie/math.random())])
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any
  } catch (error) {
    next(error);
  }
});
app.post("/search", async function (req, res, next) {
  try {
    // loc === multi | movie | person | people
    // https://api.themoviedb.org/3/search/multi?api_key=<<api_key>>&language=en-US&page=1&include_adult=false
    let loc = req.body.loc;
    if (loc === "people") loc = "person";
    const query = req.body.query;
    if (query === "") return res.json([]);
    console.log("search: ", { loc, query });
    const resp = await search_tmdb(query, loc);
    if (loc !== "multi") {
      resp.results = resp.results.map((e) => {
        e.media_type = loc;
        return e;
      });
    }
    if (loc === "movie") {
      resp.results = resp.results.map((movie) => {
        movie.seen_by_kevin = is_seen_by_kevin(movie);
        return movie;
      });
      resp.results = _.sortBy(resp.results, (m) => !m.seen_by_kevin);
    }

    res.json(resp);
  } catch (error) {
    console.log(error.message);
    res.json([]);
    next(error);
  }
});

// process.on("unhandledRejection", (err) => {
//   console.error(err.stack);
//   console.log("exit?");
//   // process.exit(1);
// });

async function search_tmdb(query, loc = "multi", page = 1) {
  // loc === multi | movie | person
  if (!["multi", "movie", "person"].includes(loc))
    throw new Error("bad loc @ index.js search_tmdb() " + loc);
  let endpoint = "https://api.themoviedb.org/3/search/" + loc;
  let extra_params = { query, adult: "false", page };
  const resp = await axios.get(endpoint, {
    params: _.assign(default_params, extra_params),
  });
  if (resp.status === 200 && !_.isEmpty(resp.data)) {
    const results = resp.data;
    return results;
  } else return [];
}

async function get_tmdb_config() {
  return await get_tmdb("", "config", 3600 * 24 * 2);
}

async function get_tmdb(id, loc = "actor", cache_expiry = 3600 * 24) {
  // loc = actor | movie | config
  // TODO | config
  // get actor value from cache or api
  let cache_key, endpoint, extra_params, thing;

  if (loc === "actor" || loc === "person") {
    cache_key = "/actor/" + id;
    endpoint = "https://api.themoviedb.org/3/person/" + id;
  } else if (loc === "movie") {
    cache_key = "/movie/" + id;
    endpoint = "https://api.themoviedb.org/3/movie/" + id;
    extra_params = { append_to_response: "credits,videos" };
  } else if (loc === "config") {
    cache_key = "/config/";
    endpoint = "https://api.themoviedb.org/3/configuration";
  } else {
    throw new Error("loc not equal actor | movie | config");
  }
  // check cache
  const cached = await client.get(cache_key);
  if (cached != null) {
    thing = JSON.parse(cached);
  } else {
    console.log("asked tmbd api " + cache_key);
    // console.log(_.assign(default_params, extra_params));
    const resp = await axios.get(endpoint, {
      params: _.assign(default_params, extra_params),
    });
    if (resp.status === 200 && !_.isEmpty(resp.data)) {
      thing = resp.data;
      // prettier-ignore
      if (loc == "actor") {thing = _.omit(thing, [ "credits", "biography", "also_known_as" ]);}
      if (loc == "movie") {
        const trailer = find_trailer(thing.videos.results);
        if (trailer) {
          thing.trailer_link = trailer;
        }
      }
      client.setex(cache_key, cache_expiry, JSON.stringify(thing));
      thing.cache_miss = true;
    }
  }
  // cached or not, add metadata
  if (loc === "actor") {
    thing = actor_backup_data(thing);
    thing.meta = actor_meta(thing);
  }
  return thing;
}

function actor_backup_data(actor) {
  // get current actor from imdb_years.db from the years table
  const in_db =
    db?.prepare("SELECT * FROM years WHERE imdb_id = ?").get(actor.imdb_id) ||
    {};
  const imdb_b = _.get(in_db, "birth_year", null);
  const imdb_d = _.get(in_db, "death_year", null);
  if (!actor.deathday && imdb_d) {
    // set deathday to jan 1 $YEAR
    actor.deathday = imdb_d + "-01-01";
  }
  if (!actor.birthday && imdb_b) {
    // set birthday to jan 1 $YEAR
    actor.birthday = imdb_b + "-01-01";
    actor.approximate_birthday = true;
  }
  actor.imdb_b = imdb_b;
  actor.imdb_d = imdb_d;
  return actor;
}

function actor_meta(actor) {
  let status, age, died_at, imdb_link, tmdb_link, zodiac;
  const imdb_b = _.get(actor, "imdb_b", null);
  const imdb_d = _.get(actor, "imdb_d", null);

  if (!actor.birthday) {
    status = "no_bday";
  } else if (actor.deathday) {
    status = "deceased";
    died_at = getAge(Date.parse(actor.birthday), new Date(actor.deathday));
    age = getAge(Date.parse(actor.birthday), new Date());
  } else {
    status = actor.approximate_birthday ? "?" : "alive";
    age = getAge(new Date(actor.birthday), new Date());
  }
  if (actor.imdb_id) {
    imdb_link = "https://www.imdb.com/name/" + actor.imdb_id;
  }
  tmdb_link = "https://www.themoviedb.org/person/" + actor.id;
  if (actor.birthday && !actor.approximate_birthday) {
    const [byear, bmonth, bday] = actor.birthday.split("-");
    zodiac = Zodiac.getSignByDate({ day: bday, month: bmonth });
    zodiac = _.pick(zodiac, ["name", "symbol"]);
  }

  return {
    status,
    age,
    died_at,
    imdb_link,
    tmdb_link,
    popularity: actor.popularity,
    imdb_b,
    imdb_d,
    zodiac,
    approximate_birthday: actor.approximate_birthday,
  };
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

function find_trailer(results) {
  try {
    const trailer = _.find(results, { site: "YouTube", type: "Trailer" });
    const yt_id = _.get(trailer, "key", false);
    return yt_id ? `https://www.youtube.com/watch?v=${yt_id}` : false;
  } catch (err) {
    console.log(err);
    return false;
  }
}
