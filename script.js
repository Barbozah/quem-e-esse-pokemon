const ROUNDS = 10;
const TIME_PER_QUESTION = 20;
const DISCOUNT_PER_TIP = 1;
const POKE_COUNT = 905;

const TYPE_COLOURS = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const baseApi = "https://pokeapi.co/api/v2/pokemon/";

async function getPokemonData(id) {
  const response = await fetch(baseApi + `${id}`);
  const data = await response.json();
  const img = data.sprites.front_default;
  const types = data.types;
  const name = data.name;
  return {
    id, img, types, name
  };
}

function elt(type, prop, ...childrens) {
  let elem = document.createElement(type);
  if (prop) Object.assign(elem, prop);
  for (let child of childrens) {
    if (typeof child == "string") elem.appendChild(document.createTextNode(child));
    else elem.appendChild(elem);
  }
  return elem;
}

const DOM_PROGRESS = elt("div", {
  className: "progress-bar"
});
document.querySelector(".progress")
  .appendChild(DOM_PROGRESS);
const DOM_IMG = document.querySelector('img');
const DOM_OPTION1 = document.querySelector('#option1');
const DOM_OPTION2 = document.querySelector('#option2');
const DOM_OPTION3 = document.querySelector('#option3');
const DOM_OPTION4 = document.querySelector('#option4');

function syncProgress() {
  const progress = timeProgress*100 > 0 ? timeProgress*100 : 0;
  DOM_PROGRESS.style.width = progress + "%";
  if (timeProgress > .7) {
    DOM_PROGRESS.style.background = "blue";
  } else if (timeProgress > .4) {
    DOM_IMG.style.filter = "brightness(1)";
    DOM_PROGRESS.style.background = "yellow";
  } else {
    DOM_PROGRESS.style.background = "red";
  }
}

function handleChoice(choice) {
  playersGuess = choice;
  // answered = true;
}

function useTip() {
  tip = true;
  points -= DISCOUNT_PER_TIP;
  const domPokes = [
    DOM_OPTION1, DOM_OPTION2,
    DOM_OPTION3, DOM_OPTION4
  ];
  for(let i=0;i<4;i++) {
    if(pokes[i].types.length > 1) {
      const colors = [
        TYPE_COLOURS[pokes[i].types[0]],
        TYPE_COLOURS[pokes[i].types[1]]
      ]
      domPokes[i].style.background = `
        linear-gradient(
          to right,  ${colors[0]} 0%, ${colors[0]} 50%, 
          ${colors[1]} 50%, ${colors[1]} 100%
        );
      `;
    } else {
      domPokes[i].style.background = TYPE_COLOURS[
        pokes[i].types[0]
      ];
    }
  }
}

var round = 0;
var points = 0;
var questionTimeout = false;
var timeProgress = 1;
var answered = false;
var playersGuess;
var tip = false;
var endTurn = true;
var intervalId;
var pokes = [];

async function Game() {
  var answer = Math.floor(Math.random() * 4);
  pokes = [];
  for (let i=0;i<4;i++) {
    const id = Math.floor(Math.random() * POKE_COUNT);
    const data = await getPokemonData(id);
    pokes.push(data);
    console.log(data);
  }
  while (round < ROUNDS) {
    syncProgress();
    if (endTurn) {
      endTurn = false;
      console.log('start');
      const timeStart = new Date().getTime();
      const timeEnd = timeStart + TIME_PER_QUESTION*1000;
      questionTimeout = false;
      intervalId = setInterval(function() {
        const now = new Date().getTime();
        const seconds = Math.floor(((timeEnd-now) % (1000 * 60)) / 1000);
        timeProgress = seconds/TIME_PER_QUESTION;
        syncProgress();
        if (answered) {
          if (playersGuess == answer) {
            points += 10 * timeProgress;
          }
        }
        if (now > timeEnd) questionTimeout = true;
        if (questionTimeout || answered) clearInterval(intervalId);
      }, 100);
    }
    
    if (questionTimeout || answered) {
      round++;
      tip = false;
      endTurn = true;
      answer = Math.floor(Math.random() * 4);
      pokes = [];
      for (let i=0;i<4;i++) {
        const id = Math.floor(Math.random() * POKE_COUNT);
        const data = await getPokemonData(id);
        pokes.push(data);
      }
    }
  }
}

Game();