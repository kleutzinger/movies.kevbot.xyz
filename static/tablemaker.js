function populateTable(cast, movie) {
  cast = normalize_cast(cast, movie);
  var table = new Tabulator("#tabulator", {
    data          : cast, //assign data to table
    // prettier-ignore
    columns: genColumns(),
    cellVertAlign : "middle",
    layout        : "fitData"
    // layout      : 'fitColumns',
    // initialSort   : [
    //   //set the initial sort order of the data
    //   // { column: "start_atp", dir: "desc" }
    // ]
  });
}
// const cfg = (await axios.get("/config")).data;

function genColumns() {
  return [
    { title: "Actor", field: "name", frozen: true },
    { title: "Status", field: "meta.status" },
    { title: "Age<br/>today", field: "meta.age" },
    { title: "Age<br/>then", field: "meta.filming_age" },
    { title: "Died<br/>at", field: "meta.died_at" },
    { title: "Popularity", field: "meta.popularity" },
    //prettier-ignore
    { title: "Icon", field: "meta.icon_html", hozAlign: "center", formatter: "html" }

    // {
    //   title           : "Time",
    //   field           : "name",
    //   sorter          : "datetime",
    //   formatter       : "datetime",
    //   formatterParams : {
    //     // inputFormat        : 'YYYY-MM-DD HH:ii',
    //     outputFormat       : "MMM Do, YYYY",
    //     invalidPlaceholder : "(invalid date)"
    //     // timezone           : 'America/Los_Angeles'
    //   }
    // },
    // { title: "P1", field: "P1", formatter: "html" },
    // { title: "G1", field: "G1", hozAlign: "center", formatter: gm_fmt },
  ];
}

function gm_fmt(cell, formatterParams, onRendered) {
  const val = cell.getValue();
  if (!val) return;
  const ret = `
  <a href="${val.dl_url}"><img class='infoImage' src="${val.icon}"></img></a>
  `;
  return ret;
}

function normalize_cast(cast, movie) {
  cast = cast.filter((e) => e.meta.status !== "no_bday");
  cast = cast.map((actor) => {
    actor.meta.filming_age = getAge(actor.birthday, movie.release_date);
    actor.meta.icon_html = actor_to_icon_html(actor);
    return actor;
  });
  return cast;
}

function actor_to_icon_html(actor) {
  // generate `<img>  </img>` STRING for an actor
  const img_src = thing_to_img_src(actor, window.tmdb_cfg, true);
  const img_html = `  <a href="/actor/${actor.id}"><img class='infoImage' src="${img_src}"></img></a>`;
  return img_html;
}
function addDataToSets(sets) {
  return _.map(sets, (set) => {
    const game1 = set.games[0];
    set.start_at2 = moment(game1.start_at);
    set.P1 = game1.nice.p0_tag;
    set.P2 = game1.nice.p1_tag;
    set.CHAR = game2chars(game1);
    let game_num = 1;
    for (const game of set.games) {
      set["G" + game_num] = { icon: game2stg(game), dl_url: game.dl_url };
      game_num += 1;
    }
    return set;
  });
}

function getAge(start, until = new Date()) {
  var birthDate = new Date(start);
  var until = new Date(until);
  var age = until.getFullYear() - birthDate.getFullYear();
  var m = until.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && until.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
