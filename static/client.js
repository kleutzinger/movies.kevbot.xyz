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
  document.getElementById("submit").addEventListener("click", async () => {
    const value = document.getElementById("movie_id").value;
    const movie_id = normalize_input(value);
    if (movie_id === -1) return;
    const endpoint = "/movie/" + movie_id;
    console.log("getting " + endpoint);
    const resp = await axios.get(endpoint);
    console.log(resp.data.movie.title);
    const { movie, cast } = resp.data;
    const title_str = `${movie.title} (${movie.release_date})`;
    document.getElementById("movie_name").innerHTML = title_str;
    console.log(movie);
    console.log(cast);
    populateTable(cast, movie);
  });
  document.getElementById("submit").click();
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
