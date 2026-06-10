import {
  data,
  POP_IN_DELAY,
  fetchSheets,
  getCell,
  anyCellNull,
  dateToUTC,
  dateToString,
  addButtonEvents,
  commonInit,
} from "../app.js";

// LEADERBOARD

let playerRatings = {};
let playerNames;

function getParamsAtDate(game, date) {
  let searchUtc = dateToUTC(date);

  let latestIndex = -1;
  let firstOfGame = true;

  for (let i = 0; i < data.parameters.length; i++) {
    if (
      anyCellNull("parameters", i, ["game", "starts"]) == true ||
      getCell("parameters", i, "game") != game
    ) {
      continue;
    }

    let paramUtc = dateToUTC(getCell("parameters", i, "starts"));

    if (firstOfGame == true) {
      firstOfGame = false;
      latestIndex = i;
    } else if (searchUtc >= paramUtc) {
      latestIndex = i;
    }
  }

  return latestIndex;
}

function setPlayerNames() {
  playerNames = new Map();
  for (let i = 0; i < data.players.length; i++) {
    if (anyCellNull("players", i, ["id", "name"]) == true) {
      continue;
    }
    playerNames.set(getCell("players", i, "id"), getCell("players", i, "name"));
  }
}

function minMaxLerp(a, b, t) {
  return (
    Math.max(0, Math.min(1, t)) * (Math.max(a, b) - Math.min(a, b)) +
    Math.min(a, b)
  );
}

function getPlayerRating(game, id, timestamp) {
  if (playerRatings[game].has(id) == false) {
    let latestInitRating = getCell(
      "parameters",
      getParamsAtDate(game, timestamp),
      "init_rating",
    );
    playerRatings[game].set(id, latestInitRating);
  }
  return playerRatings[game].get(id);
}

function setPlayerRating(game, id, rating) {
  playerRatings[game].set(id, rating);
}

function calculatePlayerRatings() {
  for (let i = 0; i < data.games.length; i++) {
    if (
      anyCellNull("games", i, ["name", "system", "starts"]) == true ||
      dateToUTC(getCell("games", i, "starts")) > Date.now() ||
      getCell("games", i, "show") == false
    ) {
      continue;
    }
    playerRatings[getCell("games", i, "name")] = new Map();
  }

  for (let r = 0; r < data.matches.length; r++) {
    if (getCell("matches", r, "timestamp") == null) {
      continue;
    }
    // get game
    let game = getCell("matches", r, "game");
    let timestamp = getCell("matches", r, "timestamp");

    let system = "";
    for (let i = 0; i < data.games.length; i++) {
      if (
        getCell("games", i, "name") != null &&
        getCell("games", i, "name") == game &&
        getCell("games", i, "show") == true &&
        getCell("games", i, "system") != null &&
        getCell("games", i, "starts") != null &&
        dateToUTC(getCell("games", i, "starts")) <= dateToUTC(timestamp)
      ) {
        system = getCell("games", i, "system");
        break;
      }
    }
    if (system == "") {
      continue;
    } // if no game record being tracked, don't bother

    // get player ids
    let ids = [];
    // team A
    ids[0] = Number(getCell("matches", r, "p1_id")); // P1
    ids[1] =
      getCell("matches", r, "p2_id") != null
        ? Number(getCell("matches", r, "p2_id"))
        : 0; // P2
    // team B
    ids[2] =
      getCell("matches", r, "p3_id") != null
        ? Number(getCell("matches", r, "p3_id"))
        : 0; // P3
    ids[3] =
      getCell("matches", r, "p4_id") != null
        ? Number(getCell("matches", r, "p4_id"))
        : 0; // P4

    // get player ratings (or set to init value if new)
    let Rs = []; // prior ratings
    let playerCount = 0;
    for (let i = 0; i < 4; i++) {
      if (ids[i] != 0) {
        Rs[i] = getPlayerRating(game, ids[i], timestamp);
        playerCount++;
      } else {
        Rs[i] = Rs[Math.max(i - 1, 0)];
      }
    }

    let gameParams = getParamsAtDate(game, timestamp);

    if (system == "Best Time") {
      let time = getCell("matches", r, "time");
      if (time < Rs[0]) {
        setPlayerRating(game, ids[0], time);
      }
    } else if (system == "Elo FFA") {
      let Qs = []; // q values
      for (let i = 0; i < playerCount; i++) {
        Qs[i] = Math.pow(
          getCell("parameters", gameParams, "base"),
          Rs[i] / getCell("parameters", gameParams, "divisor"),
        );
      }

      let Es = [
        new Array(playerCount),
        new Array(playerCount),
        new Array(playerCount),
        new Array(playerCount),
      ]; // estimated scores
      for (let i = 0; i < playerCount; i++) {
        for (let j = 0; j < playerCount; j++) {
          Es[i][j] = Qs[i] / (Qs[i] + Qs[j]); // player i playing against player j
        }
      }

      let Ss = [
        getCell("matches", r, "p1_points") != null
          ? Number(getCell("matches", r, "p1_points"))
          : 0,
        getCell("matches", r, "p2_points") != null
          ? Number(getCell("matches", r, "p2_points"))
          : 0,
        getCell("matches", r, "p3_points") != null
          ? Number(getCell("matches", r, "p3_points"))
          : 0,
        getCell("matches", r, "p4_points") != null
          ? Number(getCell("matches", r, "p4_points"))
          : 0,
      ]; // actual scores

      for (let i = 0; i < playerCount; i++) {
        let mult = 0;
        for (let j = 0; j < playerCount; j++) {
          if (i == j) {
            continue;
          }
          let wld = Ss[i] > Ss[j] ? 1 : Ss[i] < Ss[j] ? 0 : 0.5; // win-lose-draw
          mult += wld - Es[i][j];
        }
        setPlayerRating(
          game,
          ids[i],
          Rs[i] +
            (getCell("parameters", gameParams, "k") / (playerCount - 1)) * mult,
        );
      }
    } else if (system == "Elo Teams") {
      let Rt = [
        minMaxLerp(
          Rs[0],
          Rs[1],
          getCell("parameters", gameParams, "interpolation"),
        ),
        minMaxLerp(
          Rs[2],
          Rs[3],
          getCell("parameters", gameParams, "interpolation"),
        ),
      ]; // ratings for team A and B
      let Qs = [
        Math.pow(
          getCell("parameters", gameParams, "base"),
          Rt[0] / getCell("parameters", gameParams, "divisor"),
        ),
        Math.pow(
          getCell("parameters", gameParams, "base"),
          Rt[1] / getCell("parameters", gameParams, "divisor"),
        ),
      ];
      let Es = [Qs[0] / (Qs[0] + Qs[1]), Qs[1] / (Qs[0] + Qs[1])]; // estimated scores for team A and B
      let Ss = [
        getCell("matches", r, "winner") == "Team A" ? 1 : 0,
        getCell("matches", r, "winner") == "Team B" ? 1 : 0,
      ]; // actual scores for team A and B

      for (let i = 0; i < 4; i++) {
        if (ids[i] == 0) {
          continue;
        }
        setPlayerRating(
          game,
          ids[i],
          Rs[i] +
            getCell("parameters", gameParams, "k") *
              (Ss[Math.floor(i / 2)] - Es[Math.floor(i / 2)]),
        );
      }
    }
  }

  refreshLeaderboard();
}

function refreshLeaderboard() {
  for (let i = 0; i < data.games.length; i++) {
    if (
      anyCellNull("games", i, ["name", "system", "starts"]) == true ||
      dateToUTC(getCell("games", i, "starts")) > Date.now() ||
      getCell("games", i, "show") == false
    ) {
      continue;
    }

    let game = getCell("games", i, "name");
    let system = getCell("games", i, "system");
    let rounding =
      getCell("games", i, "rounding") != null
        ? Math.round(getCell("games", i, "rounding"))
        : 0;
    let rankedMap;

    if (system == "Best Time") {
      rankedMap = new Map(
        Array.from(playerRatings[game]).sort((a, b) => a[1] - b[1]),
      );
    } else {
      rankedMap = new Map(
        Array.from(playerRatings[game]).sort((b, a) => a[1] - b[1]),
      );
    }
    document.getElementById(game + "-board").innerHTML = makeLeaderboardHTML(
      Array.from(rankedMap.values()),
      Array.from(rankedMap.keys()),
      rounding,
    );
  }
}

let shownGames = [];

function makeLeaderboardGames() {
  let buttonsHTML = "";
  let boardsHTML = "";
  for (let i = 0; i < data.games.length; i++) {
    if (
      anyCellNull("games", i, ["name", "system", "starts"]) == true ||
      getCell("games", i, "show") == false
    ) {
      continue;
    }

    shownGames.push(getCell("games", i, "name"));

    buttonsHTML += `<li><button class="button" id="${getCell("games", i, "name")}-button">`;
    if (getCell("games", i, "icon") != null) {
      buttonsHTML += `<i class="fa-solid fa-${getCell("games", i, "icon")}"></i>`;
    }
    buttonsHTML += `${getCell("games", i, "name")}</button></li>`;

    boardsHTML += `<ul class="leaderboard-container" id="${getCell("games", i, "name")}-board" style="display: none;">`;

    if (dateToUTC(getCell("games", i, "starts")) > Date.now()) {
      boardsHTML += `<li class="player-card message"><div>This leaderboard starts on ${dateToString(getCell("games", i, "starts"))}!</div></li>`;
    }

    boardsHTML += `</ul>`;
  }
  document.getElementById("leaderboard-games").innerHTML = buttonsHTML;
  document.getElementById("leaderboards").innerHTML = boardsHTML;

  document
    .querySelectorAll("#leaderboard-page :not(nav) .button")
    .forEach((el) => {
      el.addEventListener("click", (event) => {
        changeLeaderboard(el.getAttribute("id").split("-")[0]);
      });
    });

  addButtonEvents();
}

function makeLeaderboardHTML(values, keys, round) {
  let html = "";

  if (keys.length == 0) {
    return `<li class="player-card message"><div>No contenders yet. Be the first!</div></li>`;
  }

  for (let i = 0; i < keys.length; i++) {
    let playerName = playerNames.get(keys[i])
      ? playerNames.get(keys[i])
      : "Anonymous";

    let rating =
      Math.round(values[i] * Math.pow(10, -round)) / Math.pow(10, -round);

    let tieCount = 0;
    while (
      i > 0 &&
      rating ==
        Math.round(values[i - 1] * Math.pow(10, -round)) / Math.pow(10, -round)
    ) {
      i--;
      tieCount++;
    }

    html += `<li class="player-card" style="animation-delay: ${i * POP_IN_DELAY}ms;"><div class="rank r${i + 1}">${i + 1}</div><div class="name">${playerName}</div><div class="rating">${rating.toFixed(Math.max(-round, 0))}</div></li>`;

    i += tieCount;
  }

  return html;
}

function changeLeaderboard(id) {
  document.querySelectorAll(".leaderboard-container").forEach((el) => {
    el.style.display = "none";
  });
  document
    .querySelectorAll("#leaderboard-page :not(nav) .button")
    .forEach((el) => {
      el.classList.remove("selected");
    });
  document.getElementById(id + "-board").style.display = "";
  document.getElementById(id + "-button").classList.add("selected");

  localStorage.currentBoard = id;
}

function filterSearch() {
  let input = document.getElementById("leaderboard-search").value.toUpperCase();
  let boards = document.querySelectorAll(".leaderboard-container");
  for (let i = 0; i < boards.length; i++) {
    let cards = boards[i].querySelectorAll(".player-card");
    let cardIdx = 0;

    for (let i = 0; i < cards.length; i++) {
      let nameObj = cards[i].querySelector(".name");
      if (nameObj == null) {
        continue;
      }
      cards[i].style = ``;
      cards[i].style.display = "none";
      setTimeout(() => {
        let name = nameObj.innerHTML;
        if (name.toUpperCase().indexOf(input) > -1) {
          cards[i].style.display = "";
          cards[i].style = `animation-delay: ${cardIdx * POP_IN_DELAY}ms`;
          cardIdx++;
        }
      }, 1);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  commonInit({ injectNav: false });
  fetchSheets(["games", "players", "matches", "parameters"], () => {
    makeLeaderboardGames();
    setPlayerNames();
    calculatePlayerRatings();
    let currentBoard =
      localStorage.currentBoard != null
        ? localStorage.currentBoard
        : getCell("games", 0, "name");
    try {
      changeLeaderboard(currentBoard);
    } catch (error) {
      changeLeaderboard(getCell("games", 0, "name"));
    }
  });

  document.querySelectorAll("#leaderboard-search").forEach((el) => {
    el.addEventListener("keyup", filterSearch);
  });
});
