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

function init() {
  let start_hash = window.location.hash;
  if (start_hash) {
    start_hash = start_hash.slice(1);
    // document.getElementById("movie_id").value = start_hash;
    set_movie_table(start_hash);
  }
  // document.getElementById("submit").addEventListener("click", async () => {
  //   const value = document.getElementById("movie_id").value;
  //   const movie_id = normalize_input(value);
  //   if (movie_id === -1) return;
  //   set_movie_table(movie_id);
  // });

  // search input and button logic
  const search_button = document.getElementById("search_button");
  const search_input = document.getElementById("search_input");
  search_button.addEventListener("click", async () => {
    search_for(search_input.value);
  });
  search_input.onkeydown = function(e) {
    if (e.key == "Enter") {
      search_for(search_input.value);
    }
  };
}

async function set_movie_table(movie_id) {
  const endpoint = "/movie/" + movie_id;
  console.log("getting " + endpoint);
  const resp = await axios.get(endpoint);
  console.log(resp.data.movie.title);
  const { movie, cast } = resp.data;
  const years_ago = -moment(movie.release_date).diff(Date.now(), "years");
  //prettier-ignore
  let title_str = `${movie.title} (${movie.release_date}) ${years_ago} years ago`;
  document.getElementById("movie_name").innerHTML = title_str;
  console.log(movie);
  console.log(cast);
  set_hash(movie.id);
  populateTable(cast, movie);
}

async function search_for(query, page = 1) {
  const endpoint = "/search/";
  console.log("searching for: " + query);
  const resp = await axios.post(endpoint, { loc: "multi", query, page });
  const rows = resp.data.results;
  console.log(rows);
  on_search_results(rows);
}

function on_search_results(rows) {
  ul = document.createElement("ul");
  document.getElementById("search_results").appendChild(ul);
  rows.forEach(function(item) {
    let li = document.createElement("li");
    ul.appendChild(li);
    li.innerHTML += result_transform(item);
  });
}

function result_transform(thing) {
  // transform search result objects to HTML
  if (thing.media_type === "movie") {
    // prettier-ignore
    return `<a onclick="location.hash='${thing.id}';location.reload()">${thing.title} (${thing.release_date.slice(0,4
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

document.addEventListener("DOMContentLoaded", init);
