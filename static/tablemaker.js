function populateTable(cast, movie) {
  cast = normalize_cast(cast, movie);
  var table = new Tabulator("#tabulator", {
    data: cast, //assign data to table
    resizableColumns: "header",
    columns: genColumns(movie),
    responsiveLayout: "collapse", // collapse columns that no longer fit on the table into a list under the row
    columnMinWidth: 1,
    virtualDom: true,
    cellVertAlign: "middle",
    cellHozAlign: "center",
    layoutColumnsOnNewData: true,
    // layout: "fitData",
    // layout      : 'fitColumns',
    initialSort: [
      // set the initial sort order of the data
      { column: "order", dir: "asc" },
    ],
  });
}
// const cfg = (await axios.get("/config")).data;

function genColumns(movie) {
  return [
    //prettier-ignore
    { title: "Icon", field: "meta.icon_html", frozen:true, hozAlign: "center", formatter: "html" },
    //prettier-ignore
    { title: "Actor/Role", hozAlign:"left", frozen: false, field: "meta.info_column_html", formatter: "html", width: 150 },
    //prettier-ignore
    { title: `Age ${date2year(movie.release_date)}`, field: "meta.filming_age", },
    { title: "Status Today", field: "meta.status_html", formatter: "html" },
    //prettier-ignore
    { title: "Birthday", field: "meta.birthday_zodiac_html", formatter: "html" },
    { title: "Popularity", field: "meta.popularity", visible: true },
    { title: "cast_order", field: "order", visible: false },
  ];
}
// https://github.com/olifolkerd/tabulator/issues/685#issuecomment-341579977
function gm_fmt(cell, formatterParams, onRendered) {
  const val = cell.getValue();
  if (!val) return;
  const ret = `
  <a href="${val.dl_url}"><img class='infoImage' src="${val.icon}"></img></a>
  `;
  return ret;
}

const date2year = (d) => {
  if (d) {
    return d.split("-")[0];
  } else return "0000";
};

const actor_to_zodiac_html = (actor) => {
  if (actor.birthday !== null && !actor.approximate_birthday)
    return `<span title="${_.get(actor, "meta.zodiac.name")}">
    ${_.get(actor, "meta.zodiac.symbol", "")}
  </span>`;
  else {
    return "";
  }
};

function normalize_cast(cast, movie) {
  // cast = cast.filter((e) => e.meta.status !== "no_bday");
  cast = cast.map((actor) => {
    actor.meta.filming_age = getAge(actor.birthday, movie.release_date);
    actor.meta.icon_html = actor_to_icon_html(actor, false);
    actor.meta.info_column_html = `
      <div>
      <strong>${actor.name}</strong></br>
      ${actor.character || ""}</br>
      </div>`;

    actor.meta.birthday_zodiac_html =
      `${
        actor.approximate_birthday
          ? actor.meta.imdb_b
          : actor.birthday || "Unknown"
      }&nbsp;` + actor_to_zodiac_html(actor);
    actor.meta.status_html = actor_to_status_html(actor);
    return actor;
  });
  return cast;
}

function actor_to_status_html(actor) {
  // meta.filming_age must be set
  let ageish = "";
  let intro = "Unknown</br>Status";
  let outro = "";
  let _class;
  let _alt_text;
  if (actor.meta.status === "alive") {
    ageish = actor.meta.age;
    intro = "alive<br/>";
    _class = "alive_text";
  }
  if (actor.meta.status === "deceased") {
    ageish = actor.meta.died_at;
    const death_year = date2year(actor.deathday);
    const today_age = getAge(actor.birthday, new Date());
    intro = `died ${death_year}<br/>at `;
    outro = " y.o.";
    _class = "dead_text";
    // alt text of how old they would be today
    _alt_text = `How old they would be today: ${today_age}`;
  }
  return `<span class="${_class}" title="${_alt_text}">${intro}${ageish}${outro}<span>`;
}

function actor_to_icon_html(actor, small = true) {
  // generate `<img>  </img>` STRING for an actor
  const img_src = thing_to_img_src(actor, window.tmdb_cfg, small);
  // const img_html = `  <a href="/actor/${actor.id}"><img class='infoImage' src="${img_src}"></img></a>`;
  const img_html = `<img class='infoImage' src="${img_src}"></img>`;

  return linkify(img_html, actor.meta.tmdb_link);
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
  if (start === null) {
    return "";
  }
  var birthDate = new Date(start);
  var until = new Date(until);

  var age = until.getFullYear() - birthDate.getFullYear();
  var m = until.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && until.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
