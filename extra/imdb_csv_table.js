const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const csv_path = path.resolve(__dirname, "imdb_actors.csv");
let year_table = {};

var sizeof = require("object-sizeof");
fs.existsSync();
console.log("loading csv at " + csv_path);
console.time("load_csv");
fs
  .createReadStream(csv_path)
  .pipe(csv.parse({ headers: true }))
  .on("error", (error) => console.error(error))
  .on("data", (row) => {
    // console.log(row);
    const { imdb_id, birth_year, death_year } = row;
    year_table[imdb_id] = {};
    if (birth_year !== "\\N") year_table[imdb_id].b = birth_year;
    if (death_year !== "\\N") year_table[imdb_id].d = death_year;
  })
  .on("end", (rowCount) => {
    console.timeEnd("load_csv");
    console.table({
      key_count : Object.keys(year_table).length,
      size_mb   : Math.round(sizeof(year_table) / 1024 ** 2)
    });
  });

module.exports = year_table;
