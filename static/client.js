async function init() {
  let query = new URLSearchParams(window.location.search);
  let movie_id = query.get("m");
  if (movie_id) set_movie_table(movie_id);
  if (window.location.href.includes("localhost:")) {
    document.body.style.backgroundColor = "#e5e5aa";
  }
  window.tmdb_cfg = (await axios.get("/config")).data;

  events_setup();
}

function events_setup() {
  // search input and button logic
  const search_input = document.getElementById("search_input");
  // loc === multi | movie | person
  const search_toggle = document.getElementById("search_toggle");
  search_toggle.addEventListener("change", function () {
    onSearchKeyUp();
    if (this.checked) {
      // Checkbox is checked..
    } else {
      // Checkbox is not checked..
    }
  });
  document
    .getElementById("search_button_lucky")
    .addEventListener("click", async () => {
      while (!(await set_movie_table(Math.floor(Math.random() * 10000)))) {
        // empty while
      }
    });
  // search_input.onkeydown = function(e) {
  //   if (e.key == "Enter") {
  //     search_for(search_input.value);
  //   }
  // };
  search_input.onkeyup = _.debounce(() => {
    onSearchKeyUp();
  }, 250);

  document.addEventListener("keydown", (event) => {
    // console.log(`key=${event.key},code=${event.code}`);
    if (event.key.length === 1 && event.key !== " ") {
      search_input.focus();
    }
  });

  // prettier-ignore
  window.onpopstate = function (event) {
    // alert("location: " + document.location + ", state: " + JSON.stringify(event.state));
  };
}

function create_element(htmlString) {
  var div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstElementChild;
}

async function set_movie_table(movie_id, write_url_query = true) {
  try {
    const endpoint = "/movie/" + movie_id;
    console.log(`getting ${endpoint} from server`);
    const resp = await axios.get(endpoint);
    console.log(resp.data.movie.title);
    let { movie, cast } = resp.data;
    cast = movie_onto_cast(movie, cast);
    const years_ago = -moment(movie.release_date).diff(Date.now(), "years");
    //prettier-ignore
    let title_str = `${movie.title} [${movie.release_date}] [${years_ago} years ago]`;
    title_str = linkify(
      title_str,
      `https://www.themoviedb.org/movie/${movie.id}`
    );
    document.getElementById("movie_name").innerHTML = title_str;

    console.log("movie, ", movie);
    console.table(cast);
    // window.location.search = `m=${movie_id}`;
    if ("URLSearchParams" in window && write_url_query) {
      var searchParams = new URLSearchParams(window.location.search);
      searchParams.set("m", movie_id);
      var newRelativePathQuery =
        window.location.pathname + "?" + searchParams.toString();
      history.pushState(null, "", newRelativePathQuery);
    }
    populateTable(cast, movie);
    return true;
  } catch (error) {
    console.log("no response ", error);
    return false;
  }
}

function movie_onto_cast(movie, cast) {
  // push some info from the `movie` obj onto the cast
  // credits ordering... credits.cast[0].id
  // character name
  // this'll be n^2 but whatever
  // returns modified cast
  cast.forEach((actor, idx, arr) => {
    let { order, character } = _.find(movie.credits.cast, { id: actor.id });
    if (Number.isInteger(order)) {
      arr[idx].order = order + 1;
    } else {
      arr[idx].order = 9999;
    }
    arr[idx].character = character || "";
  });
  return cast;
}

async function search_for(query, loc = "movie", page = 1) {
  // loc === multi | movie | person
  const endpoint = "/search/";
  console.log("searching for: " + query);
  document.getElementById(
    "search_results"
  ).innerHTML = `<p>loading search...</p>`;

  const resp = await axios.post(endpoint, { loc, query, page });
  const rows = resp.data.results;
  const cfg = (await axios.get("/config")).data;
  on_search_results(rows, cfg);
}

function on_search_results(rows, cfg) {
  ul = document.createElement("ul");
  const search_results_node = document.getElementById("search_results");
  search_results_node.innerHTML = "";
  search_results_node.appendChild(ul);
  rows.forEach(function (item) {
    let li = document.createElement("li");
    ul.appendChild(li);
    li.innerHTML += search_result_transform(item, cfg);
  });
}

function thing_to_img_src(thing, cfg, is_icon = true) {
  const img_base = cfg.images.secure_base_url;
  const { media_type } = thing;
  let path, size;
  if ("poster_path" in thing) {
    path = thing.poster_path;
    size = cfg.images.poster_sizes[0];
    if (!is_icon) size = "original";
  } else if ("profile_path" in thing) {
    path = thing.profile_path;
    if (!path) return "/img/no_pic.svg";
    size = cfg.images.profile_sizes[0];
    if (!is_icon) size = "original";
  }
  if (size) return [img_base, size, path].join("");
  else return "";
}

function search_result_transform(thing, cfg) {
  // transform search result objects to HTML
  if (thing.media_type === "movie") {
    // prettier-ignore
    return `<a href="/?m=${thing.id}">${thing.title} (${thing.release_date.slice(0,4
    )})</a>`;
  } else if (thing.media_type === "person") {
    return `<a>${thing.name}</a>`;
  } else {
    return `<a>${thing.name} (tv shows unsupported)</a>`;
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
  var table = new Tabulator("#tabulator", {
    //table setup options
  });
}

function linkify(str, href) {
  // surround: <a $href> $str </a>
  // https://www.themoviedb.org/movie/${movie.id}
  return `<a href="${href}" target=”_blank” rel=”noopener noreferrer”>${str}</a>`;
}

document.addEventListener("DOMContentLoaded", init);

// https://stackoverflow.com/questions/18986895/jquery-ajax-search-debounce

function onSearchKeyUp() {
  const search_val = document.getElementById("search_input").value;
  const loc = document.getElementById("search_toggle").checked
    ? "person"
    : "movie";
  search_for(search_val, loc);
}

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
