## Todo

- [x] Image of the movie
- [x] Image of the actors
- [x] Cache config from TMDB api
- [x] ~~set_hash() on api call~~
- [x] ~~get_hash() on pageload~~
- [x] ~~get_hash() on pageload~~
- [x] I'm feeling lucky button
- [x] Random movie (id?) button
- [x] don't require refresh / communication thru #
- - [x] use query strings?
- - [ ] https://css-tricks.com/separate-form-submit-buttons-go-different-urls/
- [x] auto search on type
- [x] toggle between ppl search and move search
- [x] column titled "age in \$release_year"
- [x] fix table greyspace
- - set .tabulator css to `max-width: min-content;`
- [x] fix max character name width
- [x] fix search_input width (width: 100%; box-sizing: border-box;)
- - it just rolls off the end
- [x] star sign (optional?)
- - used `require("zodiac-signs")("en");`
- [x] actor.meta.imdb_b / imdb_d
- [x] add default blacked out image
- [x] include people with no_bday
- [x] server-side random movie-getting
- - [ ] try to guarantee that it works, all 5 can fail
- - ask `/random` for random VALID movie_id (cache when it finds one)
- [x] current age/year died
- [ ] random button: show color of upcoming random movie (clue)
- [ ] or make background kind of the color of the movie

## unrelated idea

find movie gradient of film by center pixel stripe for each frame (or every n frames)

## Design:

- [x] handle no birthday
- Use imdb_d to set death day (appx death dates not be notated)
- setting birthday to birth year, overwrite and set actor.approx = true
