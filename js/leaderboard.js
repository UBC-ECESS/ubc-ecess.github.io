import {
  load,
  rows,
  field,
  lacks,
  sheetUtc,
  writtenDate,
  wireIcons,
  boot,
} from "../app.js?version=7";

const ratingsByGame = {};
const namesById = new Map();

function sheetNumber(row, key, fallback = 0) {
  const raw = field(row, key);
  return raw == null || raw === "" ? fallback : Number(raw);
}

function paramAt(gameName, when) {
  const whenUtc = sheetUtc(when);
  let chosen = -1;
  rows("parameters").forEach((row, index) => {
    if (lacks(row, ["game", "starts"]) || field(row, "game") !== gameName) return;
    if (chosen < 0 || whenUtc >= sheetUtc(field(row, "starts"))) chosen = index;
  });
  return chosen;
}

function tuning(index, key) {
  return field(rows("parameters")[index], key);
}

function blendRatings(left, right, weight) {
  const span = Math.abs(right - left);
  const start = Math.min(left, right);
  const portion = Math.min(Math.max(weight, 0), 1);
  return start + span * portion;
}

function rememberNameList() {
  namesById.clear();
  rows("players").forEach((row) => {
    if (lacks(row, ["id", "name"])) return;
    namesById.set(field(row, "id"), field(row, "name"));
  });
}

function ratingFor(gameName, id, when) {
  const table = ratingsByGame[gameName];
  if (!table.has(id)) {
    const seed = tuning(paramAt(gameName, when), "init_rating");
    table.set(id, seed);
  }
  return table.get(id);
}

function storeRating(gameName, id, next) {
  ratingsByGame[gameName].set(id, next);
}

function trackedSystem(gameName, when) {
  const whenUtc = sheetUtc(when);
  const match = rows("games").find((row) => {
    return (
      field(row, "name") === gameName &&
      field(row, "show") == true &&
      field(row, "system") != null &&
      field(row, "starts") != null &&
      sheetUtc(field(row, "starts")) <= whenUtc
    );
  });
  return match ? field(match, "system") : "";
}

function visibleGames() {
  return rows("games").filter((row) => {
    return (
      lacks(row, ["name", "system", "starts"]) == false &&
      field(row, "show") != false &&
      sheetUtc(field(row, "starts")) <= Date.now()
    );
  });
}

function applyBestTime(match, gameName, ids, prior) {
  const time = field(match, "time");
  if (time < prior[0]) storeRating(gameName, ids[0], time);
}

function applyFreeForAll(match, gameName, ids, prior, activeCount, tuningIndex) {
  const base = tuning(tuningIndex, "base");
  const divisor = tuning(tuningIndex, "divisor");
  const strength = prior.slice(0, activeCount).map((rating) => base ** (rating / divisor));
  const actual = ["p1_points", "p2_points", "p3_points", "p4_points"].map((key) =>
    sheetNumber(match, key),
  );
  const kFactor = tuning(tuningIndex, "k");

  for (let seat = 0; seat < activeCount; seat += 1) {
    let delta = 0;
    for (let rival = 0; rival < activeCount; rival += 1) {
      if (seat === rival) continue;
      const expected = strength[seat] / (strength[seat] + strength[rival]);
      const outcome = actual[seat] === actual[rival] ? 0.5 : actual[seat] > actual[rival] ? 1 : 0;
      delta += outcome - expected;
    }
    const next = prior[seat] + (kFactor / (activeCount - 1)) * delta;
    storeRating(gameName, ids[seat], next);
  }
}

function applyTeamMatch(match, gameName, ids, prior, tuningIndex) {
  const weight = tuning(tuningIndex, "interpolation");
  const teamRating = [
    blendRatings(prior[0], prior[1], weight),
    blendRatings(prior[2], prior[3], weight),
  ];
  const base = tuning(tuningIndex, "base");
  const divisor = tuning(tuningIndex, "divisor");
  const strength = teamRating.map((rating) => base ** (rating / divisor));
  const expected = [
    strength[0] / (strength[0] + strength[1]),
    strength[1] / (strength[0] + strength[1]),
  ];
  const winner = field(match, "winner");
  const scored = [winner === "Team A" ? 1 : 0, winner === "Team B" ? 1 : 0];
  const kFactor = tuning(tuningIndex, "k");

  ids.forEach((id, seat) => {
    if (!id) return;
    const side = Math.floor(seat / 2);
    storeRating(gameName, id, prior[seat] + kFactor * (scored[side] - expected[side]));
  });
}

function replayMatches() {
  visibleGames().forEach((game) => {
    ratingsByGame[field(game, "name")] = new Map();
  });

  rows("matches").forEach((match) => {
    if (field(match, "timestamp") == null) return;
    const gameName = field(match, "game");
    const when = field(match, "timestamp");
    const system = trackedSystem(gameName, when);
    if (!system || !ratingsByGame[gameName]) return;

    const ids = ["p1_id", "p2_id", "p3_id", "p4_id"].map((key) => sheetNumber(match, key));
    const prior = [];
    let activeCount = 0;
    ids.forEach((id, seat) => {
      if (id) {
        prior[seat] = ratingFor(gameName, id, when);
        activeCount += 1;
      } else {
        prior[seat] = prior[Math.max(seat - 1, 0)];
      }
    });

    const tuningIndex = paramAt(gameName, when);
    if (system === "Best Time") applyBestTime(match, gameName, ids, prior);
    else if (system === "Elo FFA") applyFreeForAll(match, gameName, ids, prior, activeCount, tuningIndex);
    else if (system === "Elo Teams") applyTeamMatch(match, gameName, ids, prior, tuningIndex);
  });

  paintBoards();
}

function paintBoards() {
  visibleGames().forEach((game) => {
    const gameName = field(game, "name");
    const places = field(game, "rounding") == null ? 0 : Math.round(field(game, "rounding"));
    const pairs = [...ratingsByGame[gameName].entries()];
    pairs.sort((left, right) =>
      field(game, "system") === "Best Time" ? left[1] - right[1] : right[1] - left[1],
    );
    const board = document.getElementById(`${gameName}-board`);
    if (board) board.innerHTML = boardMarkup(pairs.map((pair) => pair[1]), pairs.map((pair) => pair[0]), places);
  });
}

function rounded(value, places) {
  const scale = 10 ** -places;
  return Math.round(value * scale) / scale;
}

function boardMarkup(values, keys, places) {
  if (!keys.length) {
    return `<li class="player-card message"><div>No scores on this board yet.</div></li>`;
  }

  let markup = "";
  for (let index = 0; index < keys.length; index += 1) {
    const shown = rounded(values[index], places);
    let tied = 0;
    while (index > 0 && shown === rounded(values[index - 1], places)) {
      index -= 1;
      tied += 1;
    }
    const who = namesById.get(keys[index + tied]) || "Anonymous";
    const rank = index + 1;
    markup += `<li class="player-card"><div class="rank r${rank}">${rank}</div><div class="name">${who}</div><div class="rating">${shown.toFixed(Math.max(-places, 0))}</div></li>`;
    index += tied;
  }
  return markup;
}

function buildGameChrome() {
  const buttons = [];
  const boards = [];
  rows("games").forEach((game) => {
    if (lacks(game, ["name", "system", "starts"]) || field(game, "show") == false) return;
    const gameName = field(game, "name");
    const icon = field(game, "icon");
    const iconMarkup = icon == null ? "" : `<i class="fa-solid fa-${icon}"></i>`;
    buttons.push(`<li><button class="button" id="${gameName}-button">${iconMarkup}${gameName}</button></li>`);
    const pending =
      sheetUtc(field(game, "starts")) > Date.now()
        ? `<li class="player-card message"><div>Opens ${writtenDate(field(game, "starts"))}.</div></li>`
        : "";
    boards.push(`<ul class="leaderboard-container" id="${gameName}-board" style="display: none;">${pending}</ul>`);
  });

  document.getElementById("leaderboard-games").innerHTML = buttons.join("");
  document.getElementById("leaderboards").innerHTML = boards.join("");
  document.querySelectorAll("#leaderboard-page :not(nav) .button").forEach((button) => {
    button.addEventListener("click", () => {
      showBoard(button.id.replace(/-button$/, ""));
    });
  });
  wireIcons();
}

function showBoard(gameName) {
  document.querySelectorAll(".leaderboard-container").forEach((board) => {
    board.style.display = "none";
  });
  document.querySelectorAll("#leaderboard-page :not(nav) .button").forEach((button) => {
    button.classList.remove("selected");
  });
  document.getElementById(`${gameName}-board`).style.display = "";
  document.getElementById(`${gameName}-button`).classList.add("selected");
  localStorage.currentBoard = gameName;
}

function searchBoard() {
  const query = document.getElementById("leaderboard-search").value.toUpperCase();
  document.querySelectorAll(".leaderboard-container .player-card").forEach((card) => {
    const nameNode = card.querySelector(".name");
    if (!nameNode) return;
    card.style.display = "none";
    const label = nameNode.textContent.toUpperCase();
    window.setTimeout(() => {
      if (label.includes(query)) card.style.display = "";
    }, 1);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  boot({ injectNav: false });
  load(["games", "players", "matches", "parameters"]).then(() => {
    buildGameChrome();
    rememberNameList();
    replayMatches();
    const saved = localStorage.currentBoard;
    const fallback = field(rows("games")[0], "name");
    try {
      showBoard(saved || fallback);
    } catch {
      showBoard(fallback);
    }
  });
  document.querySelectorAll("#leaderboard-search").forEach((input) => {
    input.addEventListener("keyup", searchBoard);
  });
});
