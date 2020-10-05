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
