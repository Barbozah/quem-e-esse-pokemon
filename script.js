const ROUNDS = 10;
const TIME_PER_ROUND = 20;
const TIMER_TICKS = 1000;
const DISCOUNT_PER_TIP = 1;
const POKE_COUNT = 905;
const POINTS_PER_ROUND = 10;

const TYPE_COLOURS = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

const POKEMONS_PER_GEN = [151, 251, 386, 493, 649, 721, 809, 905];

const baseApi = "https://pokeapi.co/api/v2/pokemon/";

async function getPokemonData(id) {
  const response = await fetch(baseApi + `${id}`);
  const data = await response.json();
  const img = data.sprites.front_default;
  const types = data.types.map((t) => t.type.name);
  const name = data.name;
  return {
    id,
    img,
    types,
    name,
  };
}

async function randomPokemons(generations, count = 4) {
  const gens = generations.sort();
  const intervals = [];
  for (let i = 0; i < gens.length; i++) {
    intervals.push({
      start: intervals.length > 0 ? intervals[i - 1].start : 0,
      end: POKEMONS_PER_GEN[gens[i]],
    });
  }
  const pokeDatas = [];
  for (let i = 0; i < count; i++) {
    const interval = intervals[Math.floor(Math.random() * intervals.length)];
    let pokeId = -1;
    do {
      pokeId =
        Math.floor(
          Math.random() * (interval.end - interval.start) + interval.start
        ) + 1;
    } while (pokeDatas.includes(pokeId) && game.previous.includes(pokeId));
    game.previous.push(pokeId);
    pokeDatas.push(await getPokemonData(pokeId));
  }
  return pokeDatas;
}

function elt(type, prop, ...childrens) {
  let elem = document.createElement(type);
  if (prop) Object.assign(elem, prop);
  for (let child of childrens) {
    if (typeof child == "string")
      elem.appendChild(document.createTextNode(child));
    else elem.appendChild(elem);
  }
  return elem;
}

const DOM_START_SCREEN = document.querySelector("#startScreen");
const DOM_MAIN_GAME = document.querySelector("#mainGame");
const DOM_PROGRESS = elt("div", {
  className: "progress-bar",
});
document.querySelector(".progress").appendChild(DOM_PROGRESS);
const DOM_IMG = document.querySelector("#img");
const DOM_BONUS = document.querySelector("#bonus");
const DOM_POINTS = document.querySelector("#points");
const DOM_OPTION1 = document.querySelector("#option1");
const DOM_OPTION2 = document.querySelector("#option2");
const DOM_OPTION3 = document.querySelector("#option3");
const DOM_OPTION4 = document.querySelector("#option4");
const DOM_OPTIONS = [DOM_OPTION1, DOM_OPTION2, DOM_OPTION3, DOM_OPTION4];
const DOM_TIP = document.querySelector("#startGame");
const DOM_SCOREBOARD = document.querySelector("#scoreboard > ul");

function syncProgress() {
  const timeProgress = 1 - game.round.timer.elapsedTime / TIME_PER_ROUND;
  const progress = timeProgress * 100 > 0 ? timeProgress * 100 : 0;
  DOM_PROGRESS.style.width = progress + "%";
  DOM_POINTS.innerText = game.player.points;
  if (timeProgress > 0.7) {
    DOM_PROGRESS.style.background = "blue";
  } else if (timeProgress > 0.4) {
    DOM_IMG.style.filter = "brightness(1)";
    DOM_PROGRESS.style.background = "yellow";
  } else {
    DOM_PROGRESS.style.background = "red";
  }
}

function handleChoice(alternative) {
  if (!game.round.started) return;
  if (game.gameover) return;
  if (game.player.guess(alternative, game.round)) {
    playSuccess();
  } else {
    playError();
  }
  game.round.endCallback();
  game.nextRound();
}

function useTip() {
  game.round.tipUsed = true;
  DOM_IMG.style.filter = "brightness(1)";
  DOM_TIP.setAttribute("disabled", "true");
  for (let i = 0; i < 4; i++) {
    const poke = game.round.pokeDatas[i];
    if (poke.types.length > 1) {
      const colors = [TYPE_COLOURS[poke.types[0]], TYPE_COLOURS[poke.types[1]]];
      const gradient = `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]} 50%, ${colors[1]} 50%, ${colors[1]} 100%)`;
      DOM_OPTIONS[i].style.background = gradient;
    } else {
      DOM_OPTIONS[i].style.background = TYPE_COLOURS[poke.types[0]];
    }
  }
}

class Timer {
  constructor(startTime, duration, ticks, ticksCallback, endCallback) {
    this.startTime = startTime;
    this.duration = duration;
    this.ticks = ticks;
    this.ticksCallback = ticksCallback;
    this.endCallBack = endCallback;
    this.elapsedTime = 0;
    this.id = setInterval(() => {
      const now = new Date().getTime();
      this.elapsedTime = Math.floor(((now - startTime) % (1000 * 60)) / 1000);
      this.ticksCallback();
      if (this.elapsedTime >= this.duration) {
        clearTimers();
        this.endCallBack();
      }
    }, this.ticks);
    timers.push(this.id);
  }
}

class Round {
  constructor(conditionsCallback, endCallback) {
    this.startTime = new Date().getTime();
    this.roundTimeout = false;
    this.conditionsCallback = conditionsCallback;
    this.endCallback = endCallback;
    this.timer = new Timer(
      this.startTime,
      Number.MAX_SAFE_INTEGER,
      TIMER_TICKS,
      () => conditionsCallback(this),
      () => {
        this.roundTimeout = true;
        clearTimers();
        playError();
        this.endCallback();
      }
    );
    this.pokeDatas = null;
    this.answer = null;
    this.answed = false;
    this.tipUsed = false;
    this.started = false;
  }

  async startRound() {
    this.pokeDatas = await randomPokemons(game.gens, 4);
    this.answer = Math.floor(Math.random() * 4);
    for (let i = 0; i < 4; i++) {
      DOM_OPTIONS[i].innerText = this.pokeDatas[i].name;
      DOM_OPTIONS[i].style.background = "";
    }
    DOM_IMG.setAttribute("src", this.pokeDatas[this.answer].img);
    DOM_IMG.style.filter = "brightness(0)";
    DOM_TIP.removeAttribute("disabled");
    this.timer.startTime = new Date().getTime();
    this.timer.duration = TIME_PER_ROUND;
    this.started = true;
  }
}

class Player {
  constructor(name) {
    this.name = name;
    this.points = 0;
    this.rounds = [];
  }

  guess(alternative, round) {
    round.answed = true;
    if (alternative === round.answer) {
      const points =
        POINTS_PER_ROUND -
        (POINTS_PER_ROUND * round.timer.elapsedTime) / TIME_PER_ROUND;
      const discount = round.tipUsed ? DISCOUNT_PER_TIP : 0;
      const roundPoints = Math.floor(points - discount);
      this.points += roundPoints;
      DOM_BONUS.innerText = `+${roundPoints}`;
      return true;
    }
    return false;
  }
}

class Game {
  constructor(playerName, gens) {
    this.roundCount = 0;
    this.player = new Player(playerName);
    this.round = null;
    this.previous = [];
    this.gens = gens;
    this.gameover = false;
    this.nextRound = async function () {
      const semaphore = this.round
        ? this.round.answed || this.round.roundTimeout
        : true;
      if (game.roundCount < ROUNDS && semaphore) {
        const round = new Round(
          () => {
            syncProgress();
          },
          (skipRound) => {
            game.roundCount++;
            clearTimers();
            if (!skipRound) this.nextRound();
          }
        );
        game.round = round;
        syncProgress();
        await game.round.startRound();
      }
      if (game.roundCount == ROUNDS && !this.gameover) {
        this.gameover = true;
        players[this.player.name || "Unknown"] = Math.max(
          this.player.points,
          players[this.player.name || "Unknown"] || 0
        );
        store();
        alert(`Fim de jogo. Você obteve ${game.player.points} pontos.`);
        audio.pause();
        DOM_MAIN_GAME.setAttribute("hidden", "true");
        DOM_START_SCREEN.removeAttribute("hidden");
        return;
      }
    };
  }
}

function clearTimers() {
  for (let i = 0; i < timers.length; i++) {
    clearInterval(timers[i]);
  }
}

function playSuccess() {
  if (audio) audio.pause();
  audio = new Audio("public/success.wav");
  audio.play();
}

function playError() {
  if (audio) audio.pause();
  audio = new Audio("public/error.wav");
  audio.play();
}

function store() {
  console.log(players)
  fetch('/scores', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(players)
  });
}

function restore() {
  return fetch('/scores').then(async response => {
    players = await response.json() || players;
  })
}

var game;
var timers = [];
var audio;
var players = {};
restore();

async function startGame() {
  const inputs = [];
  const gens = [];
  for (let i = 0; i < 8; i++) {
    inputs.push(document.querySelector(`#gen${i + 1}`).checked);
    if (inputs[i]) gens.push(i);
  }
  if (!inputs.reduce((s, a) => s + a, 0)) {
    alert("Selecione pelo menos uma geração!");
    return;
  }
  let playerName =
    game && game.player.name
      ? prompt("Digite o seu nome", game.player.name)
      : prompt("Digite o seu nome");
  game = new Game(playerName, gens);
  DOM_START_SCREEN.setAttribute("hidden", "true");
  game.nextRound();
  DOM_BONUS.innerText = "";
  DOM_MAIN_GAME.removeAttribute("hidden");
}

function sortDOMChildren(el) {
  [...el.children]
    .sort((a, b) => (a.innerText > b.innerText ? 1 : -1))
    .forEach((node) => el.appendChild(node));
}

function scoreboard() {
  const playersKeys = Object.keys(players);
  for (let i = 0; i < playersKeys.length; i++) {
    var ps = DOM_SCOREBOARD.querySelector(`#${playersKeys[i]}-score`);
    if (!ps) {
      ps = elt("li", { className: "score", id: `${playersKeys[i]}-score` });
      DOM_SCOREBOARD.appendChild(ps);
    }
    ps.innerText = `${playersKeys[i]}: ${players[playersKeys[i]]}`;
  }
  sortDOMChildren(DOM_SCOREBOARD);
  DOM_START_SCREEN.setAttribute("hidden", "true");
  DOM_SCOREBOARD.parentNode.removeAttribute("hidden");
}

function backScoreboard() {
  DOM_SCOREBOARD.parentNode.setAttribute("hidden", "true");
  DOM_START_SCREEN.removeAttribute("hidden");
}
