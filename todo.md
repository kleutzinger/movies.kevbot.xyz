## Todo

- [ ] Image of the movie
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
- [ ] toggle between ppl search and move search
- [ ] column titled "age in \$release_year"
- [x] fix table greyspace
- - set .tabulator css to `max-width: min-content;`
- [ ] fix max character name width
- [x] star sign (optional?)
- - used `require("zodiac-signs")("en");`
- [x] actor.meta.imdb_b / imdb_d
- [x] add default blacked out image
- [ ] include people with no_bday
- [ ] server-side random movie-getting
- - ask `/random` for random VALID movie_id (cache when it finds one)
- [ ] current age/year died

## Design:

- [x] handle no birthday
- Use imdb_d to set death day (appx death dates not be notated)
- setting birthday to birth year, overwrite and set actor.approx = true
