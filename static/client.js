async function init() {
  window.tmdb_cfg = (await axios.get("/config")).data;
  let query = new URLSearchParams(window.location.search);
  let movie_id = query.get("m");
  if (movie_id) set_movie_table(movie_id);
  if (window.location.href.includes("localhost:")) {
    document.body.style.backgroundColor = "#e5e5aa";
  }

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
    .addEventListener("click", async (e) => {
      e.target.setAttribute("disabled", true);
      document.getElementById("thing_name").innerText = "Getting New Movie";

      axios.get("/random_id").then(async (r) => {
        const id = r.data.id;
        await set_movie_table(id);

        e.target.removeAttribute("disabled");
      });
    });
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
    const movie_endpoint = "/movie/" + movie_id;
    const movie_actor_count_endpoint = "/movie-actor-count/" + movie_id;
    console.time(movie_endpoint);
    const actor_count = (await axios.get(movie_actor_count_endpoint)).data;
    document.getElementById("tabulator").innerHTML = `<p>fetching ${actor_count} actors</p>`
    const resp = await axios.get(movie_endpoint);
    console.timeEnd(movie_endpoint);
    console.log(resp.data.movie.title);
    let { movie, cast } = resp.data;
    cast = movie_onto_cast(movie, cast);
    const years_ago = -moment(movie.release_date).diff(Date.now(), "years");
    const tmdb_movie_link = `https://www.themoviedb.org/movie/${movie.id}`;
    const directors = _.filter(movie.credits.crew, { job: "Director" });
    const director_names = _.map(directors, "name").join(", ");
    const movie_overview = _.get(movie, "overview");
    const trailer_link = _.get(movie, "trailer_link");
    let title_link = linkify(movie.title, tmdb_movie_link);
    let description_string = `${movie.release_date}</br>${years_ago} years ago</br>Directed by ${director_names}`;
    let overview_text = "";
    overview_text += movie_overview ? `<br/>${movie_overview}` : "";
    if (trailer_link) {
      overview_text += `<br/><a href="${trailer_link}">Trailer (YouTube)</a>`;
    }
    const seen_icon = movie.seen_by_kevin ? "🎞️" : "";
    document.getElementById("thing_name").innerHTML = seen_icon + movie.title;
    document.getElementById("thing_description").innerHTML = description_string;
    document.getElementById("movie_overview").innerHTML = overview_text;
    document.getElementById("thing_image").src = thing_to_img_src(
      movie,
      window.tmdb_cfg
    );
    document.getElementById("thing_image_link").href = tmdb_movie_link;
    // window.location.search = `m=${movie_id}`;
    if ("URLSearchParams" in window && write_url_query) {
      var searchParams = new URLSearchParams(window.location.search);
      searchParams.set("m", movie_id);
      var newRelativePathQuery =
        window.location.pathname + "?" + searchParams.toString();
      history.pushState(null, "", newRelativePathQuery);
    }
    populateTable(cast, movie);
    console.log("movie, ", movie);
    console.table(cast);
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
  const resp = await axios.post(endpoint, { loc, query, page });
  const rows = resp.data.results;
  const cfg = window.tmdb_cfg || (await axios.get("/config")).data;
  on_search_results2(rows, cfg);
}

function on_search_results(rows, cfg) {
  // console.table(rows);
  ul = document.createElement("ul");
  const search_results_node = document.getElementById("search_results");
  search_results_node.innerHTML = "";
  search_results_node.appendChild(ul);
  rows.forEach(function (item) {
    let li = document.createElement("li");
    ul.appendChild(li);
    li.innerHTML += search_result_to_link_text(item, cfg);
  });
}

function on_search_results2(rows, cfg) {
  `
  <table>
  <tr>
    <th>Column 1 Heading</th>
    <th>Column 2 Heading</th>
    <th>Column 3 Heading</th>
  </tr>
  <tr>
    <td>Data in Column 1, Row 2</td>
    <td>Data in Column 2, Row 2</td>
    <td>Data in Column 3, Row 2</td>
  </tr>
</table>
  `;
  // console.table(rows);
  if (!rows) rows = [];
  ul = document.createElement("ul");
  const search_results_node = document.getElementById("search_results");
  search_results_node.innerHTML = "";
  search_results_node.appendChild(ul);
  rows.forEach(function (item) {
    let li = document.createElement("li");
    ul.appendChild(li);
    li.innerHTML += search_result_to_link_text(item, cfg);
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

function search_result_to_link_text(thing, cfg) {
  // transform search result objects to HTML
  if (thing.media_type === "movie") {
    const seen_icon = thing.seen_by_kevin ? "🎞️" : "";
    return `<a href="/?m=${thing.id}">${seen_icon} ${
      thing.title
    } (${thing.release_date.slice(0, 4)})</a>`;
  } else if (thing.media_type === "person") {
    return `<a href="https://themoviedb.org/person/${thing.id}">${thing.name}</a>`;
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
  return `<a href="${href}">${str}</a>`;
}

document.addEventListener("DOMContentLoaded", init);

// https://stackoverflow.com/questions/18986895/jquery-ajax-search-debounce

function onSearchKeyUp() {
  const search_val = document.getElementById("search_input").value;
  const loc = document.getElementById("search_toggle").checked
    ? "person"
    : "movie";
  search_for(search_val || "", loc);
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
