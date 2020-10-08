async function init() {
  let start_hash = window.location.hash;
  if (start_hash) {
    start_hash = start_hash.slice(1);
    // document.getElementById("movie_id").value = start_hash;
    set_movie_table(start_hash);
  }
  window.tmdb_cfg = (await axios.get("/config")).data;
  // document.getElementById("submit").addEventListener("click", async () => {
  //   const value = document.getElementById("movie_id").value;
  //   const movie_id = normalize_input(value);
  //   if (movie_id === -1) return;
  //   set_movie_table(movie_id);
  // });

  // search input and button logic
  const search_button = document.getElementById("search_button");
  const search_input = document.getElementById("search_input");
  // loc === multi | movie | person
  document
    .getElementById("search_button_movies")
    .addEventListener("click", async () => {
      search_for(search_input.value, "movie");
    });
  document
    .getElementById("search_button_people")
    .addEventListener("click", async () => {
      search_for(search_input.value, "person");
    });
  document
    .getElementById("search_button_lucky")
    .addEventListener("click", async () => {
      if (!search_input.value) {
        while (!await set_movie_table(Math.floor(Math.random() * 10000))) {}
      } else {
        return; // set to first search result
        search_for(set_movie_table, search_input.value);
      }
    });
  search_input.onkeydown = function(e) {
    if (e.key == "Enter") {
      search_for(search_input.value);
    }
  };

  document.addEventListener("keydown", (event) => {
    console.log(`key=${event.key},code=${event.code}`);
    if (event.key.length === 1 && event.key !== " ") {
      search_input.focus();
    }
  });
}

function create_element(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstElementChild;
}

async function set_movie_table(movie_id) {
  try {
    const endpoint = "/movie/" + movie_id;
    console.log("getting " + endpoint);
    const resp = await axios.get(endpoint);
    console.log(resp.data.movie.title);
    let { movie, cast } = resp.data;
    cast = movie_onto_cast(movie, cast);
    const years_ago = -moment(movie.release_date).diff(Date.now(), "years");
    //prettier-ignore
    let title_str = `${movie.title} (${movie.release_date}) ${years_ago} years ago`;
    title_str = linkify(
      title_str,
      `https://www.themoviedb.org/movie/${movie.id}`
    );
    document.getElementById("movie_name").innerHTML = title_str;
    console.log("movie, ", movie);
    console.log("cast, ", cast);
    set_hash(movie.id);
    populateTable(cast, movie);
    console.trace("madit");
    return true;
  } catch (error) {
    console.log("no response ", error);
    return false;
  }
}

function movie_onto_cast(movie, cast) {
  // push some info from the `movie` obj onto the cast
  // credits ordering... credits.cast[0].id
  // this'll be n^2 but whatever
  // returns modified cast
  cast.forEach((actor, idx, arr) => {
    let { order } = _.find(movie.credits.cast, { id: actor.id });
    if (Number.isInteger(order)) {
      arr[idx].order = order + 1;
    } else {
      arr[idx].order = 9999;
    }
  });
  console.log(cast);
  return cast;
}

async function search_for(query, loc = "movie", page = 1) {
  const endpoint = "/search/";
  console.log("searching for: " + query);
  document.getElementById("search_results").innerHTML = "<p>Loading...</p>";

  const resp = await axios.post(endpoint, { loc, query, page });
  const rows = resp.data.results;
  const cfg = (await axios.get("/config")).data;
  console.log(rows);
  on_search_results(rows, cfg);
}

function on_search_results(rows, cfg) {
  ul = document.createElement("ul");
  const search_results_node = document.getElementById("search_results");
  search_results_node.innerHTML = "";
  search_results_node.appendChild(ul);
  rows.forEach(function(item) {
    let li = document.createElement("li");
    ul.appendChild(li);
    li.innerHTML += search_result_transform(item, cfg);
  });
}

function thing_to_img_src(thing, cfg, is_icon = true) {
  const img_base = cfg.images.secure_base_url;
  const { media_type } = thing;
  let path, size;
  if (thing.poster_path) {
    path = thing.poster_path;
    size = cfg.images.poster_sizes[0];
    if (!is_icon) size = "original";
  } else if (thing.profile_path) {
    path = thing.profile_path;
    size = cfg.images.profile_sizes[0];
    if (!is_icon) size = "original";
  }
  if (size) return [ img_base, size, path ].join("");
  else return "";
}

function search_result_transform(thing, cfg) {
  // transform search result objects to HTML
  if (thing.media_type === "movie") {
    // prettier-ignore
    return `<a class="clickable" onclick="location.hash='${thing.id}';location.reload()">${thing.title} (${thing.release_date.slice(0,4
    )})</a>`;
  } else if (thing.media_type === "person") {
    return `<a>${thing.name}</a>`;
  } else {
    return `<a>${thing.name} (tv shows unsupported)</a>`;
  }
}

function set_and_go() {
  // to set id
}

function random_button() {}

function set_hash(hash) {
  if (history.pushState) {
    history.pushState(null, null, "#" + hash);
  } else {
    location.hash = "#" + hash;
  }
}

function normalize_input(str) {
  // could be a link or a number
  // 146
  // https://www.themoviedb.org/movie/146-wo-hu-cang-long
  // https://www.themoviedb.org/movie/146
  try {
    const num = Number.parseInt(str);
    if (!Number.isNaN(num)) {
      return num;
    }
    let id = str.match(/\/movie\/([\d]+)-?/)[1];
    return id;
  } catch (error) {
    console.log(error);
    console.log("not movie id or tmdb link: " + str);
    return -1;
  }
}

function makeTable() {
  var table = new Tabulator(
    "#tabulator",
    {
      //table setup options
    }
  );
}

function linkify(str, href) {
  // surround: <a $href> $str </a>
  // https://www.themoviedb.org/movie/${movie.id}
  return `<a href="${href}" target=”_blank” rel=”noopener noreferrer”>${str}</a>`;
}

document.addEventListener("DOMContentLoaded", init);

// https://stackoverflow.com/questions/18986895/jquery-ajax-search-debounce

// $("#search_term").on(
//   "keyup",
//   _.debounce(function(e) {
//     $.ajax({
//       type    : "GET",
//       url     : "quicksearch.php",
//       data    : { search_term: $("#search_term").val() },
//       success : function(msg) {
//         $("#quick_search_results").html(msg).slideDown();
//       }
//     });
//   }, 300)
// ); // < try 300 rather than 100
