// SimCity embed: runs the Micropolis WASM engine headless in the article
// page and draws it with the original DOS tile art onto a canvas.
"use strict";

import initModule from "./micropolisengine.js";

// Art is a <set>_<mode> pair of PNGs in gfx/. Tile size is a property of the
// mode; all sets share the same tile order, so a set swap is a pure art swap.
const MODES = {
  vga:  { tileW: 8,  tileH: 8  },
  ega:  { tileW: 16, tileH: 16 },
  mono: { tileW: 16, tileH: 16 },
};

// Graphics set key -> selector button label.
const SETS = {
  classic: "Classic",
  asia:    "Ancient Asia",
  feur:    "Future Europe",
  fusa:    "Future USA",
  medi:    "Medieval Times",
  moon:    "Moon Colony",
  west:    "Wild West",
};

// Sprite sheet geometry per pair, in type order: {t: type, w/h: frame size,
// n: frame count}. Static, so it ships inline rather than as 21 fetches.
const SPRITES = {
  classic_vga: [
    { t: 1, w: 16, h: 16, n: 4 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 29, h: 29, n: 8 }, { t: 4, w: 32, h: 32, n: 8 },
    { t: 5, w: 32, h: 32, n: 18 }, { t: 6, w: 32, h: 40, n: 3 },
    { t: 7, w: 24, h: 24, n: 5 },
  ],
  asia_vga: [
    { t: 1, w: 17, h: 17, n: 8 }, { t: 2, w: 31, h: 26, n: 8 },
    { t: 3, w: 30, h: 30, n: 8 }, { t: 4, w: 32, h: 30, n: 8 },
    { t: 5, w: 32, h: 32, n: 16 }, { t: 6, w: 32, h: 40, n: 3 },
    { t: 7, w: 30, h: 30, n: 5 },
  ],
  feur_vga: [
    { t: 1, w: 16, h: 16, n: 5 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 32, h: 32, n: 8 }, { t: 4, w: 32, h: 32, n: 8 },
    { t: 5, w: 40, h: 40, n: 16 }, { t: 6, w: 32, h: 40, n: 3 },
    { t: 7, w: 30, h: 30, n: 5 },
  ],
  fusa_vga: [
    { t: 1, w: 16, h: 16, n: 4 }, { t: 2, w: 31, h: 26, n: 8 },
    { t: 3, w: 28, h: 28, n: 8 }, { t: 4, w: 31, h: 29, n: 8 },
    { t: 5, w: 40, h: 40, n: 16 }, { t: 6, w: 32, h: 40, n: 3 },
    { t: 7, w: 30, h: 30, n: 5 },
  ],
  medi_vga: [
    { t: 1, w: 17, h: 17, n: 8 }, { t: 2, w: 34, h: 28, n: 8 },
    { t: 3, w: 28, h: 28, n: 8 }, { t: 4, w: 33, h: 33, n: 8 },
    { t: 5, w: 40, h: 40, n: 16 }, { t: 6, w: 32, h: 40, n: 3 },
    { t: 7, w: 30, h: 30, n: 5 },
  ],
  moon_vga: [
    { t: 1, w: 16, h: 16, n: 4 }, { t: 2, w: 31, h: 26, n: 8 },
    { t: 3, w: 28, h: 28, n: 8 }, { t: 4, w: 31, h: 29, n: 8 },
    { t: 5, w: 40, h: 40, n: 16 }, { t: 6, w: 32, h: 40, n: 3 },
    { t: 7, w: 30, h: 30, n: 5 },
  ],
  west_vga: [
    { t: 1, w: 18, h: 18, n: 8 }, { t: 2, w: 30, h: 30, n: 8 },
    { t: 3, w: 33, h: 28, n: 8 }, { t: 4, w: 33, h: 33, n: 8 },
    { t: 5, w: 41, h: 41, n: 16 }, { t: 6, w: 32, h: 40, n: 3 },
    { t: 7, w: 30, h: 30, n: 6 },
  ],
  classic_ega: [
    { t: 1, w: 32, h: 32, n: 4 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 18 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 6 },
  ],
  asia_ega: [
    { t: 1, w: 32, h: 32, n: 8 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 5 },
  ],
  feur_ega: [
    { t: 1, w: 32, h: 32, n: 4 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 5 },
  ],
  fusa_ega: [
    { t: 1, w: 32, h: 32, n: 4 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 6 },
  ],
  medi_ega: [
    { t: 1, w: 32, h: 32, n: 8 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 5 },
  ],
  moon_ega: [
    { t: 1, w: 30, h: 30, n: 4 }, { t: 2, w: 30, h: 30, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 4 },
    { t: 7, w: 48, h: 48, n: 6 },
  ],
  west_ega: [
    { t: 1, w: 32, h: 32, n: 8 }, { t: 2, w: 48, h: 48, n: 8 },
    { t: 3, w: 32, h: 32, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 5 },
  ],
  classic_mono: [
    { t: 1, w: 32, h: 32, n: 4 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 18 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 4 },
  ],
  asia_mono: [
    { t: 1, w: 32, h: 32, n: 8 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 6 },
  ],
  feur_mono: [
    { t: 1, w: 32, h: 32, n: 4 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 5 },
  ],
  fusa_mono: [
    { t: 1, w: 32, h: 32, n: 4 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 5 },
  ],
  medi_mono: [
    { t: 1, w: 32, h: 32, n: 8 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 6 },
  ],
  moon_mono: [
    { t: 1, w: 32, h: 32, n: 4 }, { t: 2, w: 32, h: 32, n: 8 },
    { t: 3, w: 48, h: 48, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 4 },
    { t: 7, w: 48, h: 48, n: 5 },
  ],
  west_mono: [
    { t: 1, w: 32, h: 32, n: 8 }, { t: 2, w: 48, h: 48, n: 8 },
    { t: 3, w: 32, h: 32, n: 8 }, { t: 4, w: 48, h: 48, n: 8 },
    { t: 5, w: 48, h: 48, n: 16 }, { t: 6, w: 48, h: 48, n: 3 },
    { t: 7, w: 48, h: 48, n: 6 },
  ],
};
const ENGINE_PX_PER_TILE = 16;
const TILES_X = 32;
const WORLD_W = 120;
const WORLD_H = 100;
const VALVE_RANGE = 2000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Slider positions 0-8: render fps and sim passes per tick.
const SPEEDS = [
  { fps: 1, passes: 1 }, { fps: 5, passes: 1 }, { fps: 10, passes: 1 },
  { fps: 30, passes: 1 }, { fps: 60, passes: 1 }, { fps: 120, passes: 1 },
  { fps: 120, passes: 4 }, { fps: 120, passes: 10 }, { fps: 120, passes: 50 },
];

// Engine message texts (Micropolis res/stri.301).
const MESSAGE_TEXTS = {
  1: "More residential zones needed.",
  2: "More commercial zones needed.",
  3: "More industrial zones needed.",
  4: "More roads required.",
  5: "Inadequate rail system.",
  6: "Build a Power Plant.",
  7: "Residents demand a Stadium.",
  8: "Industry requires a Sea Port.",
  9: "Commerce requires an Airport.",
  10: "Pollution very high.",
  11: "Crime very high.",
  12: "Frequent traffic jams reported.",
  13: "Citizens demand a Fire Department.",
  14: "Citizens demand a Police Department.",
  15: "Blackouts reported. Check power map.",
  16: "Citizens upset. The tax rate is too high.",
  17: "Roads deteriorating, due to lack of funds.",
  18: "Fire departments need funding.",
  19: "Police departments need funding.",
  20: "Fire reported !",
  21: "A Monster has been sighted !!",
  22: "Tornado reported !!",
  23: "Major earthquake reported !!!",
  24: "A plane has crashed !",
  25: "Shipwreck reported !",
  26: "A train crashed !",
  27: "A helicopter crashed !",
  28: "Unemployment rate is high.",
  29: "YOUR CITY HAS GONE BROKE!",
  30: "Firebombing reported !",
  31: "Need more parks.",
  32: "Explosion detected !",
  33: "Insufficient funds to build that.",
  34: "Area must be bulldozed first.",
  35: "Population has reached 2,000.",
  36: "Population has reached 10,000.",
  37: "Population has reached 50,000.",
  38: "Population has reached 100,000.",
  39: "Population has reached 500,000.",
  40: "Brownouts, build another Power Plant.",
  41: "Heavy Traffic reported.",
  42: "Flooding reported !!",
  43: "A Nuclear Meltdown has occurred !!!",
  44: "They're rioting in the streets !!",
  45: "Started a New City.",
  46: "Restored a Saved City.",
};

// One-shot disasters by select value; "auto" and "off" are the persistent
// states.
const DISASTER_ACTIONS = {
  earthquake: "makeEarthquake", fire: "makeFire", flood: "makeFlood",
  tornado: "makeTornado", monster: "makeMonster",
  meltdown: "makeMeltdown", firebombs: "makeFireBombs",
};

// The published set: five cities built to maximise the game's own score and
// five built to maximise population, each half ranked best-first by its own
// twelve-seed verify.  There is no honest joint ranking of a 930-point village
// against a half-million-person megalopolis, so the two halves are named
// rather than merged into one numbering.
const CITIES = [
  ...Array.from({ length: 5 }, (_, i) => `bigscore${i + 1}.cty`),
  ...Array.from({ length: 5 }, (_, i) => `bigpop${i + 1}.cty`),
];

const $ = (id) => document.getElementById(id);
const canvas = $("simcity-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const status = $("simcity-status");
const embedEl = $("simcity-embed");
const screenEl = $("simcity-screen");

function setStatus(text) {
  status.textContent = text;
}

function fixChurch(v) {
  return v >= 956 && v <= 1018 ? 414 + ((v - 956) % 9) : v;
}

function clampDemand(valve) {
  return Math.max(-99, Math.min(99, Math.round(valve * 100 / VALVE_RANGE)));
}

function fmtMoney(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// The engine's getUnemployment() severity, clamped at +255 only: a labor
// surplus stays negative, so it is shown raw.
function unemployment(res, com, ind) {
  const b = (com + ind) * 8;
  return b === 0 ? 0 : Math.min(Math.round((res / b - 1) * 255), 255);
}

// ---- engine boot ----------------------------------------------------------

const engine = await initModule({
  print: () => {},
  printErr: (e) => console.warn(e),
  setStatus: setStatus,
  locateFile: (f) => "./" + f,
});

const messages = [];
let messageCursor = 0;
let lastRotate = 0;

// Rotate every 2 s; drop once 2 game months AND 5 s of wall time have passed
// (the wall floor keeps messages readable at high sim speed).
const MESSAGE_ROTATE_MS = 2000;
const MESSAGE_KEEP_MONTHS = 2;
const MESSAGE_MIN_MS = 5000;

// Everything the reader is told goes through the queue: engine messages,
// disasters, and our own failures, which is what makes them all rotate and
// expire alike. `red` marks bad news.
function announce(text, red) {
  messages.push({ at: m.cityTime, wall: Date.now(), text, red: !!red });
  messageCursor = messages.length - 1;
  lastRotate = Date.now();
}

const noop = () => {};
const engineCallback = new engine.JSCallback({
  autoGoto: noop, didGenerateMap: noop, didLoadCity: noop, didLoadScenario: noop,
  didLoseGame: noop, didSaveCity: noop, didTool: noop, didWinGame: noop,
  didntLoadCity: noop, didntSaveCity: noop, makeSound: onEngineSound, newGame: noop,
  saveCityAs: noop, sendMessage: (e, ud, msg) => {
    announce(MESSAGE_TEXTS[msg] || "City message #" + msg);
  },
  showBudgetAndWait: noop, showZoneStatus: noop,
  simulateRobots: noop, simulateChurch: noop, startGame: noop,
  startEarthquake: (e, ud, strength) => startQuake(strength),
  startScenario: noop, updateBudget: noop, updateCityName: noop, updateDate: noop,
  updateDemand: noop, updateEvaluation: noop, updateFunds: noop, updateGameLevel: noop,
  updateHistory: noop, updateMap: noop, updateOptions: noop, updatePasses: noop,
  updatePaused: noop, updateSpeed: noop, updateTaxRate: noop,
});

const m = new engine.Micropolis();
m.setCallback(engineCallback, m);
m.init();

// Live view of the WASM heap map (column-major). Re-acquired every call:
// ALLOW_MEMORY_GROWTH may detach older views.
function mapView() {
  const heap = engine.HEAPU16;
  const addr = m.getMapAddress();
  return heap.subarray(addr >> 1, (addr >> 1) + m.getMapSize() / 2);
}

// ---- audio ------------------------------------------------------------
//
// Two switches, both off to begin with, and each fetches only when it is
// first turned on, so a reader who scrolls past pays nothing for either.
// Autoplay is blocked anyway, so the AudioContext is created and resumed by
// a user gesture.
//
// Effects are the 1994 Sound Blaster recordings, 8-bit wav, 62 KB for the
// set.  The 1989 .PSF packs would have given each graphics set its own
// effects for a tenth of that, and the container is decoded, but their sample
// encoding is not solved -- see AUDIO.md in the micropolis repo.

// Only the sounds the engine can actually raise.  Micropolis defines
// doMakeSound(), the whole message-driven path, and never calls it, so every
// makeSound() in message.cpp -- Siren included -- is unreachable.  These five
// are the live call sites in sprite.cpp and micropolis.cpp.
const SOUND_FILES = {
  HeavyTraffic: "copter.wav",     // the helicopter passing over
  FogHornLow: "tootit.wav",       // the ship
  HonkHonkLow: "honk.wav",        // also the ship
  Monster: "mango.wav",           // reachable from the disaster menu
  ExplosionHigh: "explode.wav",
  ExplosionLow: "explode.wav",
};

let audioCtx = null;
let soundOn = false;
let musicOn = false;
const soundData = {};
const decoded = {};
const playing = {};
const lastSoundAt = {};
let soundsPromise = null;

function loadSounds() {
  if (!soundsPromise) {
    soundsPromise = Promise.all(
      [...new Set(Object.values(SOUND_FILES))].map(async (file) => {
        const r = await fetch(`./audio/${file}`);
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        soundData[file] = await r.arrayBuffer();
      }),
    ).catch((err) => {
      soundsPromise = null;   // let a later unmute retry
      throw err;
    });
  }
  return soundsPromise;
}

function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function decode(file) {
  if (!decoded[file]) {
    decoded[file] = audioCtx.decodeAudioData(soundData[file].slice(0));
  }
  return decoded[file];
}

function onEngineSound(micropolis, callbackVal, channel, sound, x, y) {
  if (!soundOn || !audioCtx || audioCtx.state !== "running") return;
  const file = SOUND_FILES[sound];
  if (!file || playing[file] || !soundData[file]) return;
  // The engine fires bursts; one instance per sound, 300 ms apart, like the
  // DOS game's single sound channel.
  const now = performance.now();
  if (now - (lastSoundAt[file] || 0) < 300) return;
  lastSoundAt[file] = now;
  decode(file).then((buffer) => {
    if (!soundOn || !audioCtx || playing[file]) return;
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.6;
    src.connect(gain);
    gain.connect(audioCtx.destination);
    playing[file] = src;
    src.onended = () => { playing[file] = null; };
    src.start();
  }).catch(() => {});
}

// ---- music ---------------------------------------------------------------
//
// SCTUNE.XMI rendered offline through an OPL3 with the game's own AdLib
// patches, so nothing has to be synthesised here.  The file is exactly one
// loop period, cut so that it wraps without a seam.  Opus is 846 KB and
// plays everywhere current; the MP3 is for Safari older than 17.4.  Neither
// is touched until the button is pressed.

let musicEl = null;

function startMusic() {
  if (!musicEl) {
    const probe = document.createElement("audio");
    musicEl = new Audio(probe.canPlayType('audio/ogg; codecs="opus"')
      ? "./audio/sctune.opus" : "./audio/sctune.mp3");
    musicEl.loop = true;
    musicEl.volume = 0.55;
  }
  return musicEl.play();
}

function stopMusic() {
  if (musicEl) {
    musicEl.pause();
    musicEl.currentTime = 0;
  }
}

// ---- map-derived census ----------------------------------------------------

// Zone anchors carry ZONEBIT (0x400); the tile range picks the type. Fire
// tiles are FIREBASE..LASTFIRE (56-63).
function countMap(map) {
  let r = 0, c = 0, i = 0, fires = 0;
  for (let x = 0; x < WORLD_W; x++) {
    for (let y = 0; y < WORLD_H; y++) {
      const v = map[x * WORLD_H + y];
      const t = v & 1023;
      if (v & 0x400) {
        if (t >= 240 && t < 423) r++;
        else if (t >= 423 && t < 612) c++;
        else if (t >= 612 && t < 693) i++;
      } else if (t >= 56 && t <= 63) {
        fires++;
      }
    }
  }
  return { r, c, i, fires };
}

function census() {
  const counts = countMap(mapView());
  return {
    name: m.cityName, year: m.cityYear, month: m.cityMonth, funds: m.totalFunds,
    r: counts.r, c: counts.c, i: counts.i,
    resValve: m.resValve, comValve: m.comValve, indValve: m.indValve,
    score: m.cityScore, pop: m.cityPop,
    unemployment: unemployment(m.resPop, m.comPop, m.indPop),
    pollution: m.pollutionAverage, crime: m.crimeAverage,
    traffic: m.trafficAverage, landValue: m.landValueAverage,
    tax: m.cityTax, fires: counts.fires, unpowered: m.unpoweredZoneCount,
  };
}

// Demand rides in the rotation as one more slot, read fresh every time it
// comes round rather than queued: it is a live reading, not news.  With the
// queue empty it is the only slot and simply stays up, which is where the
// line of its own used to be.
function demandMessage(census) {
  const demand = [["C", census.comValve], ["R", census.resValve],
                  ["I", census.indValve]]
    .map(([label, valve]) => `${label}:${String(clampDemand(valve)).padEnd(3)}`)
    .join(" ");
  return { text: `demand ${demand}`, red: false };
}

function currentMessage(census) {
  const now = Math.floor(m.cityTime / 4);
  const wall = Date.now();
  for (let i = messages.length - 1; i >= 0; i--) {
    const entry = messages[i];
    if (now - Math.floor(entry.at / 4) >= MESSAGE_KEEP_MONTHS &&
        wall - entry.wall >= MESSAGE_MIN_MS) {
      messages.splice(i, 1);
    }
  }
  const slots = messages.length + 1;   // the queue, plus demand
  if (slots > 1 && wall - lastRotate >= MESSAGE_ROTATE_MS) {
    messageCursor = (messageCursor + 1) % slots;
    lastRotate = wall;
  }
  if (messageCursor >= slots) messageCursor = slots - 1;
  return messageCursor < messages.length
    ? messages[messageCursor]
    : demandMessage(census);
}

// Fixed-width left-justified fields so the columns never shift.  Everything
// but the date and the money is a message now, demand included, so a phone
// spends one line here instead of two.
function topBarParts(census, message) {
  const date = `${String(census.year).padEnd(4)} ${MONTHS[census.month]}`;
  return { left: `${date}  ${fmtMoney(census.funds)}`, msg: message };
}

function bottomBarParts(c) {
  return {
    left: `Score ${String(c.score).padEnd(4)}  ` +
          `Population ${c.pop.toLocaleString("en-US").padEnd(7)}`,
    // Tax is dropped: the control below the map already shows it. Fire and
    // Unpwr are dropped too -- these cities have full coverage and no
    // unpowered zones, so both read 0 forever and only cost width.
    //
    // Two halves, because on a phone the stylesheet gives each its own row.
    // One row that always carries the same fields cannot reflow as a number
    // gains or loses a digit, and a bar that changes height resizes the map
    // under it.  Land Value is spelled out, that row having width to spare.
    rightA: `Unemp ${String(c.unemployment).padEnd(4)}  ` +
            `Pollution ${String(c.pollution).padEnd(3)}  ` +
            `Crime ${String(c.crime).padEnd(3)}`,
    rightB: `Traffic ${String(c.traffic).padEnd(3)}  ` +
            `Land Value ${String(c.landValue).padEnd(3)}`,
  };
}

// ---- rendering -------------------------------------------------------------

// EGA is the default pair.  Its tiles are 16x16 against VGA's 8x8, so the
// offscreen map canvas is 1920x1600 rather than 960x800 and the whole map
// fits the column at half the zoom -- see fitZoom() below, which is what the
// camera floor is for.  The mode buttons in index.rst mark the same default
// so the bar does not flash the wrong one before this file runs.
let currentMode = "ega";
let currentSet = "classic";
let sheet = null;           // current pair's tile atlas Image
let spriteSheet = null;     // current pair's sprite sheet Image
let spriteRows = null;      // current pair's frame rects (type -> row)
let TILE_W = MODES[currentMode].tileW;
let TILE_H = MODES[currentMode].tileH;
let scale = 1;

// Per-pair asset cache, keyed "<set>_<mode>": fetched on first selection.
const artCache = {};

// Frame rects: one row per sprite type in type order, that type's frames left
// to right, each row as tall as its own type.
function spriteSheetRows(table) {
  const rows = {};
  let y = 0;
  for (const s of table) {
    rows[s.t] = { width: s.w, height: s.h, frameCount: s.n, y };
    y += s.h;
  }
  return rows;
}

async function loadArt(set, mode) {
  const key = `${set}_${mode}`;
  if (!SPRITES[key] || !MODES[mode] || !SETS[set]) return;
  if (!artCache[key]) {
    const tiles = new Image();
    const sprites = new Image();
    tiles.src = `./gfx/${key}_tiles.png`;
    sprites.src = `./gfx/${key}_sprites.png`;
    // Cache only once both decode, so a failure leaves no half-built entry.
    await Promise.all([tiles.decode(), sprites.decode()]);
    artCache[key] = { atlas: tiles, sprites, rows: spriteSheetRows(SPRITES[key]) };
  }
  const entry = artCache[key];
  currentSet = set;
  currentMode = mode;
  sheet = entry.atlas;
  spriteSheet = entry.sprites;
  spriteRows = entry.rows;
  TILE_W = MODES[mode].tileW;
  TILE_H = MODES[mode].tileH;
  mapCanvas.width = WORLD_W * TILE_W;
  mapCanvas.height = WORLD_H * TILE_H;
}

// Camera. `zoom` is apparent magnification and viewX/viewY are the map offset
// in CSS pixels.  The floor is NOT 1: the fitted canvas is drawn at native size
// and CSS-fitted to the column, so showing the whole map is 0.36x on a 350px
// phone in VGA and 0.18x in EGA.  Treating 1 as the floor hid that entire
// range -- one press of + went from the whole city straight to 1.25x, a jump of
// 3.4x in VGA and 6.9x in EGA, with nothing in between.  The floor is fitZoom()
// instead, and the rungs are multiplicative so every press is the same visual
// step wherever you are.  Fitted, the canvas keeps its natural size; zoomed, it
// is a fixed viewport onto a sub-rect.
const ZOOM_STEP = 1.25;
let zoom = 0;            // below any fitZoom(), so the first layout is fitted
let viewX = 0;
let viewY = 0;
const MAX_VISIBLE_TILES = 32;
// Tiles across is viewportWidth / (TILE_W * scale * zoom), so it does depend
// on the viewport: this bound is a cap on magnification, not a guarantee of
// how much city is on screen.
const MAX_ZOOM = Math.min(4, WORLD_W / MAX_VISIBLE_TILES);
const viewport = { w: 0, h: 0 };

// Recomputed by resizeCanvas rather than measured on demand: draw() consults
// it every frame and clientWidth would force a layout each time.
let fitted = 1;

function fitZoom() { return fitted; }
function zoomCeiling() { return Math.max(MAX_ZOOM, fitted); }
function isFitted() { return zoom <= fitted * (1 + 1e-9); }

// Pan steps (CSS pixels) for WASD, active while zoomed.  The arrow keys are
// deliberately left alone: the embed does not take focus, so binding them
// stole the page scroll from a reader who was nowhere near the city.
const PANS = { KeyA: [-48, 0], KeyD: [48, 0],
               KeyW: [0, -48], KeyS: [0, 48] };

function clampView() {
  if (isFitted()) {
    viewX = viewY = 0;
    return;
  }
  const s = scale * zoom;
  viewX = Math.min(Math.max(0, viewX),
                   Math.max(0, WORLD_W * TILE_W * s - viewport.w));
  viewY = Math.min(Math.max(0, viewY),
                   Math.max(0, WORLD_H * TILE_H * s - viewport.h));
}

// iPhone Safari has no element fullscreen -- only <video> can go fullscreen
// there -- so when the real API is missing or rejects, the embed pins itself
// over the viewport with CSS instead.  Layout must not care which it is.
let pseudoFullscreen = false;

function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement)
      || pseudoFullscreen;
}

// Settles `scale` and the fitted floor from the box as it currently stands.
function measureFit() {
  const screen = $("simcity-screen");
  const w = screen.clientWidth || window.innerWidth;
  const fullscreen = isFullscreen();
  // In-article: scale by width. Fullscreen: largest integer scale fitting both
  // dimensions, so CSS only ever pixel-upscales.
  const h = fullscreen ? (screen.clientHeight || window.innerHeight) : Infinity;
  const byW = Math.floor((w - 8) / (WORLD_W * TILE_W));
  const byH = Math.floor((h - 8) / (WORLD_H * TILE_H));
  scale = Math.max(1, fullscreen ? Math.min(byW, byH) : byW);
  fitted = w / (WORLD_W * TILE_W * scale);
}

function resizeCanvas() {
  const screen = $("simcity-screen");
  measureFit();
  // The zoomed and fill classes size the box that the fitted floor is measured
  // from, and the floor in turn decides those classes, so a caller that sets
  // the classes first can only set them from the OLD floor.  Going fullscreen
  // out of a narrow article column is where that bites: the column is a third
  // of the screen, so fitted triples and swallows the reader's zoom, the view
  // becomes fitted -- and with the zoomed class still on, `width/height: 100%`
  // stretches a whole-map canvas across a 16:9 box and every sprite comes out
  // short.  Correct the classes and re-measure against the box they make.
  // Once, not in a loop: the second measurement is the one the classes match.
  if ($("simcity-embed").classList.contains("simcity-zoomed") === isFitted()) {
    updateZoomClasses();
    measureFit();
  }
  if (isFitted()) {
    canvas.width = WORLD_W * TILE_W * scale;
    canvas.height = WORLD_H * TILE_H * scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Resizing resets the context; re-assert nearest-neighbour.
    ctx.imageSmoothingEnabled = false;
    return;
  }
  // Zoomed: fixed viewport at devicePixelRatio, so tiles land on real pixels.
  const dpr = window.devicePixelRatio || 1;
  const fullscreen = isFullscreen();
  viewport.w = Math.max(1, Math.round(screen.clientWidth));
  viewport.h = Math.max(1, Math.round(fullscreen
      ? screen.clientHeight : screen.clientWidth * WORLD_H / WORLD_W));
  canvas.width = Math.round(viewport.w * dpr);
  canvas.height = Math.round(viewport.h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  clampView();
}

function updateZoomClasses() {
  const embed = $("simcity-embed");
  embed.classList.toggle("simcity-zoomed", !isFitted());
  embed.classList.toggle("simcity-fill", isFullscreen() && isFitted());
  // Real and pseudo fullscreen under one class: the stylesheet needs to tell
  // fullscreen from in-article, and :fullscreen is not dependable on Safari.
  embed.classList.toggle("simcity-in-fullscreen", isFullscreen());
}

// Visible tiles are composited here at native tile pixels, then blitted with
// ONE scaled draw: per-tile scaled draws round to different physical pixels at
// a fractional devicePixelRatio and leave 1-px seams.
const mapCanvas = document.createElement("canvas");
const mapCtx = mapCanvas.getContext("2d");
mapCanvas.width = WORLD_W * TILE_W;
mapCanvas.height = WORLD_H * TILE_H;

function draw(map) {
  // Fitted draws at native size and lets CSS do the fitting, so the drawing
  // scale is `scale` alone -- zoom is the apparent result, not an input.
  const fit = isFitted();
  const s = fit ? scale : scale * zoom;
  const vw = fit ? canvas.width : viewport.w;
  const vh = fit ? canvas.height : viewport.h;
  const x0 = Math.max(0, Math.floor(viewX / (TILE_W * s)));
  const y0 = Math.max(0, Math.floor(viewY / (TILE_H * s)));
  const x1 = Math.min(WORLD_W, Math.ceil((viewX + vw) / (TILE_W * s)));
  const y1 = Math.min(WORLD_H, Math.ceil((viewY + vh) / (TILE_H * s)));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const t = fixChurch(map[x * WORLD_H + y] & 1023);
      mapCtx.drawImage(sheet, (t % TILES_X) * TILE_W, ((t / TILES_X) | 0) * TILE_H,
                       TILE_W, TILE_H, x * TILE_W, y * TILE_H, TILE_W, TILE_H);
    }
  }
  ctx.drawImage(mapCanvas, x0 * TILE_W, y0 * TILE_H,
                (x1 - x0) * TILE_W, (y1 - y0) * TILE_H,
                x0 * TILE_W * s - viewX, y0 * TILE_H * s - viewY,
                (x1 - x0) * TILE_W * s, (y1 - y0) * TILE_H * s);
}

// Per-type draw offset in the engine's 16-px/tile unit, mirroring the constant
// xOffset/yOffset of Micropolis::initSprite(), which getActiveSprites() does
// not return. (Its xHot/yHot are a movement lookahead point, not this.)
const SPRITE_OFFSETS = {
  1: { x: 32, y: -16 },  // TRAIN
  2: { x: 32, y: -16 },  // HELICOPTER
  3: { x: 24, y: 0 },    // AIRPLANE
  4: { x: 32, y: -16 },  // SHIP
  5: { x: 24, y: 0 },    // MONSTER
  6: { x: 24, y: 0 },    // TORNADO
  7: { x: 24, y: 0 },    // EXPLOSION
};

// Sprite x/y are in the engine's 16-px/tile space, so they go through the same
// world-tile transform as map tiles; frame sizes are already in the current
// mode's pixel space and only need the display scale.
function drawSprites(sprites) {
  if (!spriteSheet || !spriteRows) return;
  // The same scale draw() uses, and for the same reason: fitted draws at
  // native size and lets CSS do the fitting.  Folding zoom in here while the
  // tiles ignore it put every sprite short of its own tile, up and to the
  // left, by the whole distance from the map origin.
  const s = isFitted() ? scale : scale * zoom;
  for (const sp of sprites) {
    const info = spriteRows[sp.type];
    const off = SPRITE_OFFSETS[sp.type];
    if (!info || !off) continue;   // no DOS art for this type (e.g. BUS)
    const frame = sp.frame - 1;
    if (frame < 0 || frame >= info.frameCount) continue;
    const tileX = (sp.x + off.x) / ENGINE_PX_PER_TILE;
    const tileY = (sp.y + off.y) / ENGINE_PX_PER_TILE;
    const screenX = tileX * TILE_W * s - viewX;
    const screenY = tileY * TILE_H * s - viewY;
    ctx.drawImage(spriteSheet, frame * info.width, info.y,
                  info.width, info.height,
                  screenX, screenY, info.width * s, info.height * s);
  }
}

let lastBarUpdate = 0;

// A transient notice (a city being fetched) shown in the message slot ahead of
// the queue, and cleared by whoever set it rather than by expiry.
let notice = null;

function setNotice(text) {
  notice = text ? { text } : null;
  // Loading stops the sim, so paint now instead of waiting on frame().
  updateBars();
}

function updateBars() {
  const c = census();
  const top = topBarParts(c, notice || currentMessage(c));
  $("simcity-top-left").textContent = top.left;
  const msgEl = $("simcity-top-msg");
  msgEl.classList.toggle("simcity-msg-show", !!top.msg);
  if (top.msg) {
    msgEl.textContent = top.msg.text;
    msgEl.classList.toggle("simcity-danger-msg", !!top.msg.red);
  }
  const bottom = bottomBarParts(c);
  $("simcity-bottom-left").textContent = bottom.left;
  $("simcity-bottom-right-a").textContent = bottom.rightA;
  $("simcity-bottom-right-b").textContent = bottom.rightB;
}

// ---- earthquake shake ------------------------------------------------------
//
// doEarthquake() hands the front end a strength of 300 to 1000, which the
// original read as how long to shake the map for, in milliseconds.  The jolt
// fades over that span so the map settles rather than stopping dead.
//
// The reach is a FRACTION of the displayed map, not a fixed pixel count: a
// constant read as a good hard jolt on a 390px phone and as a barely visible
// twitch across a desktop column three times as wide.
const QUAKE_REACH_FRAC = 0.018; // ~7 CSS px on a 390px phone
const QUAKE_REACH_MIN = 3;      // CSS px, so a tiny embed still moves
const QUAKE_MAX_MS = 2000;
// prefers-reduced-motion is advisory: it reports a preference, it does not
// withhold anything, and a canvas translate works the same either way.  What
// it is FOR is motion the reader did not ask for, so that is all it stops
// here.  Pick Earthquake off the disaster menu and the map shakes whatever the
// setting says -- you asked for an earthquake, the shaking is the earthquake.
// A quake the sim throws on its own in auto mode is the unprompted case, and
// that one stays still.  (Traffic, sprites and animated tiles never consult
// the setting at all, so gating the one effect a reader deliberately triggers
// was the wrong way round.)
//
// Held as the query, not its answer: read once at load, someone who turns
// Reduce Motion off mid-read keeps a dead earthquake until they reload.
const stillness = window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)");
function wantsStillness() { return !!(stillness && stillness.matches); }

// A window rather than a flag cleared in a finally: doEarthquake() calls back
// synchronously today, but a disaster routed through the front-end message
// queue later would arrive a tick after the click and read as unprompted.
const ASKED_WINDOW_MS = 3000;
let disasterAskedAt = -Infinity;
function readerAskedForThis() {
  return Date.now() - disasterAskedAt < ASKED_WINDOW_MS;
}
let quakeEnds = 0;
let quakeSpan = 1;
let shakeX = 0;
let shakeY = 0;

function quakeReach() {
  return Math.max(QUAKE_REACH_MIN, (canvas.clientWidth || 390) *
      QUAKE_REACH_FRAC);
}

function startQuake(strength) {
  if (wantsStillness() && !readerAskedForThis()) return;
  quakeSpan = Math.min(QUAKE_MAX_MS, Math.max(1, strength || 1000));
  quakeEnds = Date.now() + quakeSpan;
}

// Picks this frame's offset, and answers whether there is one.
function stepShake() {
  const left = quakeEnds - Date.now();
  if (left <= 0) {
    shakeX = shakeY = 0;
    return false;
  }
  const reach = quakeReach() * (left / quakeSpan);
  shakeX = Math.round((Math.random() * 2 - 1) * reach);
  shakeY = Math.round((Math.random() * 2 - 1) * reach);
  return shakeX !== 0 || shakeY !== 0;
}

function frame() {
  if (!sheet) return;
  const shaking = stepShake();
  if (shaking) {
    // The jolt carries the map off its own edges, so clear first: without it
    // the frame underneath shows through along whichever side moved.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.save();
    // Fitted draws into a canvas the size of the whole map and leaves the
    // shrinking to CSS, so a translate there is in map pixels, not screen
    // pixels: scale the jolt by the same ratio or it all but vanishes at the
    // outermost zoom.  Zoomed already draws in screen pixels.
    const gain = isFitted()
      ? canvas.width / Math.max(1, canvas.clientWidth)
      : 1;
    ctx.translate(Math.round(shakeX * gain), Math.round(shakeY * gain));
  }
  draw(mapView());
  drawSprites(m.getActiveSprites());
  if (shaking) ctx.restore();
  // Bars refresh once a second; the map redraws every frame.
  const now = Date.now();
  if (now - lastBarUpdate >= 1000) {
    lastBarUpdate = now;
    updateBars();
  }
}

window.addEventListener("resize", () => {
  resizeCanvas();
  frame();
});
document.addEventListener("fullscreenchange", () => {
  updateZoomClasses();
  resizeCanvas();
  frame();
  showChrome(false);
});
// iOS resizes the visual viewport as its URL bar slides away; re-fit when it
// settles so the map does not sit under browser chrome.
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    if (pseudoFullscreen) { resizeCanvas(); frame(); }
  });
}
// Fullscreen hands the map whatever height the bars above and below it leave
// over, so a bar that rewraps changes the size of the canvas box without any
// resize event to notice it: the bitmap keeps its old dimensions and CSS
// stretches it, which reads as the sprites growing taller and snapping back.
// Watch the box itself.  Deferred to an animation frame so the resize lands
// after layout settles rather than inside the observer's own callback.
if (window.ResizeObserver) {
  let pending = 0;
  new ResizeObserver(() => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      resizeCanvas();
      frame();
    });
  }).observe($("simcity-screen"));
}

// ---- simulation loop -------------------------------------------------------

let tickTimer = null;
let renderTimer = null;
let speedVal = 1;
let lastSpeed = 1;

function startLoop() {
  stopLoop();
  const s = SPEEDS[speedVal];
  m.setSpeed(speedVal);
  m.setPasses(s.passes);
  tickTimer = setInterval(() => {
    m.simTick();
    m.animateTiles();
  }, 1000 / s.fps);
  renderTimer = setInterval(frame, 33);   // ~30 fps render, sim runs free
}

function stopLoop() {
  if (tickTimer !== null) clearInterval(tickTimer);
  if (renderTimer !== null) clearInterval(renderTimer);
  tickTimer = renderTimer = null;
}

// Speed 0 is Pause; other values are remembered so Space can bounce back.
function setSpeed(v) {
  speedVal = v;
  if (v === 0) {
    stopLoop();
    m.setSpeed(0);
  } else {
    lastSpeed = v;
    m.setSpeed(v);
    startLoop();
  }
}

// Move the slider and the engine together, for the callers that are not the
// slider itself: Space and the number keys.
function selectSpeed(v) {
  speedSlider.value = v;
  setSpeed(v);
}

function togglePause() {
  selectSpeed(speedVal === 0 ? lastSpeed : 0);
}

// ---- speed slider ----------------------------------------------------------

const speedSlider = $("simcity-speed");

speedSlider.addEventListener("input", () => {
  setSpeed(Number(speedSlider.value));
});

// ---- tax rate --------------------------------------------------------------
//
// Tax is the dial with a cost on both sides of the ledger, which is why it is
// worth handing to the reader.
//
// Spending side: the engine funds roads, rail, fire and police out of the
// treasury every year, and the income that refills it is
// totalPop * landValueAverage / 120 * cityTax * 1.4 -- so at 0% the income is
// exactly zero and the city is running down a balance nothing replaces.  When
// it empties, the budget is scaled back to whatever the year took in and the
// score is multiplied by up to 0.81 (once for underfunded police, once for
// fire).  Scoring side: the rate is a score term in its own right, ten raw
// problem points per point of tax, about thirteen off the score.
//
// Each city carries the rate it was built for; the buttons override it for
// the session, and an override sticks across city changes so a rate can be
// compared across the set.
const MIN_TAX = 0;
const MAX_TAX = 20;

// null = follow the city file's own rate.
let taxOverride = null;
let taxRate = 0;

const taxLabel = $("simcity-taxrate");

function paintTax() {
  taxLabel.textContent = "Tax " + taxRate + "%";
}

// Called after every load: the reader's choice wins if they have made one,
// otherwise the city's own rate becomes what the label shows.
function applyTax() {
  if (taxOverride === null) {
    taxRate = m.cityTax;
  } else {
    taxRate = taxOverride;
    m.setCityTax(taxRate);
  }
  paintTax();
}

function setTax(v) {
  const t = Math.max(MIN_TAX, Math.min(MAX_TAX, v));
  if (t === taxRate) return;
  taxOverride = taxRate = t;
  m.setCityTax(t);
  paintTax();
  updateBars();
}

// ---- city rotation (wrap-around, hold-to-repeat) ---------------------------

let cityIndex = 0;

function cityName() {
  return CITIES[cityIndex].replace(/\.cty$/, "");
}

// Every city is fetched on first use and written into the engine's filesystem,
// then kept for the session.  The preload package holds a city of its own that
// this list no longer names; it is what creates /cities, and is never opened.
const fetched = new Set();

async function ensureCity(name) {
  if (fetched.has(name)) return;
  const res = await fetch("./cities/" + name);
  // fetch only rejects on a transport error; a 404 would otherwise be handed
  // to the engine as an error page's worth of bytes.
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  // Re-check: a hold-to-repeat run can have two fetches of one city in
  // flight, and FS_createDataFile on an existing path throws.
  if (fetched.has(name)) return;
  engine.FS_createDataFile("/cities", name, bytes, true, true, true);
  fetched.add(name);
}

// Serialised by token: holding the city buttons starts a load per repeat, and
// only the newest may apply -- an earlier fetch landing later would otherwise
// leave the engine on a city the label no longer names.
let cityToken = 0;

async function loadCityAt(i) {
  cityIndex = (i + CITIES.length) % CITIES.length;
  const name = CITIES[cityIndex];
  $("simcity-cityname").textContent = cityName();
  stopLoop();
  setNotice("Loading " + cityName() + "...");
  const token = ++cityToken;
  try {
    await ensureCity(name);
  } catch (err) {
    console.error(`simcity: cities/${name} failed to load`, err);
    if (token === cityToken) {
      announce("Could not fetch " + cityName() + ".", true);
      setNotice(null);
    }
    return;
  }
  if (token !== cityToken) return;   // superseded while fetching
  if (m.loadCity("/cities/" + name)) {
    messages.length = 0;
    // City files carry their own sound, disaster, budget and tax settings;
    // re-assert ours.  autoBudget matters: 26 of the 100 files were saved
    // after a broke year had switched it off, and with it off the engine
    // never restores service funding to 100% once the money is back.
    m.setEnableSound(true);
    m.setEnableDisasters(disasterPref === "auto");
    m.setAutoBudget(true);
    applyTax();
    disasterSel.value = disasterPref;
    // Zoom and pan are kept across reloads.
    resizeCanvas();
    frame();
    setNotice(null);
    startLoop();
  } else {
    announce("Failed to load " + name, true);
    setNotice(null);
  }
}

// One action on press; holding 500 ms then repeats every 125 ms.
function holdRepeat(btn, action) {
  let delayTimer = null;
  let repeatTimer = null;
  const start = (e) => {
    e.preventDefault();
    action();
    delayTimer = setTimeout(() => {
      repeatTimer = setInterval(action, 125);
    }, 500);
  };
  const stop = () => {
    clearTimeout(delayTimer);
    clearInterval(repeatTimer);
  };
  btn.addEventListener("mousedown", start);
  btn.addEventListener("touchstart", start, { passive: false });
  btn.addEventListener("mouseup", stop);
  btn.addEventListener("mouseleave", stop);
  btn.addEventListener("touchend", stop);
  btn.addEventListener("touchcancel", stop);
}

holdRepeat($("simcity-prev"), () => loadCityAt(cityIndex - 1));
holdRepeat($("simcity-next"), () => loadCityAt(cityIndex + 1));
holdRepeat($("simcity-taxdown"), () => setTax(taxRate - 1));
holdRepeat($("simcity-taxup"), () => setTax(taxRate + 1));

// ---- disasters -------------------------------------------------------------

const disasterSel = $("simcity-disaster");

// The persistent choice, independent of a one-shot disaster passing through
// the select; reapplied by loadCityAt().
let disasterPref = "auto";

disasterSel.addEventListener("change", () => {
  const v = disasterSel.value;
  if (v === "off") {
    disasterPref = v;
    m.setEnableDisasters(false);
  } else if (v === "auto") {
    disasterPref = v;
    m.setEnableDisasters(true);
  } else {
    // Fire once, then settle back on the persistent choice (unless they have
    // since picked something else).  The engine announces the disaster itself
    // ("A Monster has been sighted !!"), so there is nothing to say here.
    m.setEnableDisasters(true);
    disasterAskedAt = Date.now();
    m[DISASTER_ACTIONS[v]]();
    setTimeout(() => {
      if (disasterSel.value === v) {
        disasterSel.value = disasterPref;
        m.setEnableDisasters(disasterPref === "auto");
      }
    }, 1000);
  }
});

// ---- graphics mode / set switch ---------------------------------------------
//
// Two single-select button rows, read from the markup (data-mode / data-set);
// a bar missing from the markup simply yields no buttons.

const modeBar = $("simcity-modebar");
const modeButtons = modeBar ? [...modeBar.querySelectorAll("button")] : [];
const setBar = $("simcity-setbar");
const setButtons = setBar ? [...setBar.querySelectorAll("button")] : [];

function updateModeButtons() {
  for (const btn of modeButtons) {
    btn.classList.toggle("simcity-mode-active", btn.dataset.mode === currentMode);
  }
  for (const btn of setButtons) {
    btn.classList.toggle("simcity-mode-active", btn.dataset.set === currentSet);
  }
}

async function switchArt(set, mode) {
  if (set === currentSet && mode === currentMode) return;
  if (!SETS[set] || !MODES[mode]) return;
  // A mode change swaps the tile size under the camera: 8px for VGA, 16 for
  // EGA and mono.  Carrying zoom across therefore halves or doubles how much
  // city is on screen, and carrying viewX/viewY -- which are the TOP-LEFT of
  // the viewport -- pins that change to the corner instead of to what the
  // reader was looking at.  Capture the two things that should survive: how
  // many tiles are across, and which tile is in the middle.
  const oldS = scale * zoom;
  const framing = !isFitted() ? {
    tilesAcross: viewport.w / (TILE_W * oldS),
    centreX: (viewX + viewport.w / 2) / (TILE_W * oldS),
    centreY: (viewY + viewport.h / 2) / (TILE_H * oldS),
  } : null;
  try {
    await loadArt(set, mode);
  } catch (err) {
    // Leave the current art selected and say so, rather than dead-button.
    console.error(`simcity: gfx/${set}_${mode}_*.png failed to load`, err);
    announce(`Could not load the ${SETS[set]} ${mode.toUpperCase()} art.`, true);
    updateBars();
    updateModeButtons();
    return;
  }
  updateModeButtons();
  resizeCanvas();          // settles `scale` for the new tile size
  if (framing) {
    // Same idea as openingZoom(): solve for the zoom that puts the same number
    // of tiles across, then re-centre on the same tile rather than the same
    // corner.  Clamping can stop it landing exactly, which is why the pan is
    // recomputed from the zoom actually used.
    zoom = Math.max(fitZoom(), Math.min(zoomCeiling(),
        viewport.w / (framing.tilesAcross * TILE_W * scale)));
    updateZoomClasses();
    resizeCanvas();        // viewport depends on whether zoom is still 1
    const newS = scale * zoom;
    viewX = framing.centreX * TILE_W * newS - viewport.w / 2;
    viewY = framing.centreY * TILE_H * newS - viewport.h / 2;
    clampView();
  }
  frame();
}

for (const btn of modeButtons) {
  btn.addEventListener("click", () => switchArt(currentSet, btn.dataset.mode));
}
for (const btn of setButtons) {
  btn.addEventListener("click", () => switchArt(btn.dataset.set, currentMode));
}

// ---- overlay control auto-hide ---------------------------------------------
//
// The map overlays fade out (opacity + pointer-events, so nothing moves) once
// the pointer rests or leaves; any activity in the map brings them back.
//
// In the article a coarse pointer is exempt, having no idle state to detect --
// a finger that is not on the glass is not "resting" anywhere, and the overlays
// sit against a map that is only a few hundred pixels tall.  Fullscreen is the
// other case: the map is the whole screen, so the overlays fade there too and
// any touch brings them back.  The CSS carries the same split.
const CHROME_IDLE_MS = 2000;
const CONTROL_SELECTOR =
  ".simcity-zoombar, .simcity-topbar, .simcity-setbar";
const finePointer = !window.matchMedia ||
  window.matchMedia("(pointer: fine)").matches;
let chromeTimer = 0;

function hideChrome() {
  clearTimeout(chromeTimer);
  if (!chromeAutoHides()) return;
  embedEl.classList.add("simcity-chrome-hidden");
}

// keepUp holds the controls up while the pointer rests on one of them.
function showChrome(keepUp) {
  clearTimeout(chromeTimer);
  embedEl.classList.remove("simcity-chrome-hidden");
  if (!keepUp) chromeTimer = setTimeout(hideChrome, CHROME_IDLE_MS);
}

function chromeAutoHides() {
  return finePointer || isFullscreen();
}

const wake = (ev) => {
  if (!chromeAutoHides()) return;
  // A mouse resting on a control holds the overlays up.  A finger has no
  // resting state, so touch always restarts the countdown instead: hold on
  // "keep up" and the first tap on a control would pin them open for good.
  showChrome(finePointer && ev.target instanceof Element &&
             !!ev.target.closest(CONTROL_SELECTOR));
};
for (const type of ["pointermove", "pointerdown", "pointerup", "wheel"]) {
  screenEl.addEventListener(type, wake, { passive: true });
}
// A mouse leaving the map is a clear idle signal.  A finger lifting is not --
// that is the end of a tap, not the end of playing -- so touch waits out the
// timer like any other pause.
screenEl.addEventListener("pointerleave", () => {
  if (finePointer) hideChrome();
});
// Keyboard play counts as activity even with the mouse parked elsewhere.
document.addEventListener("keydown", () => {
  if (chromeAutoHides()) showChrome(false);
});
if (finePointer) hideChrome();

// ---- sound and music toggles -----------------------------------------------

const soundBtn = $("simcity-sound");
const musicBtn = $("simcity-music");

function updateSoundButton() {
  soundBtn.textContent = soundOn ? "\u{1F50A}" : "\u{1F507}";
  soundBtn.title = soundOn ? "Sound effects on" : "Sound effects off";
  soundBtn.classList.toggle("simcity-sound-on", soundOn);
}

function updateMusicButton() {
  musicBtn.textContent = "\u266B";
  musicBtn.title = musicOn ? "Music on" : "Music off";
  musicBtn.classList.toggle("simcity-sound-on", musicOn);
}

soundBtn.addEventListener("click", () => {
  ensureAudio();
  soundOn = !soundOn;
  if (soundOn) {
    loadSounds().catch(() => {
      announce("Could not load the sounds.", true);
      updateBars();
    });
  }
  updateSoundButton();
});

musicBtn.addEventListener("click", () => {
  musicOn = !musicOn;
  if (musicOn) {
    startMusic().catch((err) => {
      console.error("simcity: the tune failed to play", err);
      musicOn = false;
      updateMusicButton();
      announce("Could not load the music.", true);
      updateBars();
    });
  } else {
    stopMusic();
  }
  updateMusicButton();
});

// ---- reload ----------------------------------------------------------------

$("simcity-reload").addEventListener("click", () => {
  loadCityAt(cityIndex);
});

// ---- fullscreen ------------------------------------------------------------

// Safari tints its own toolbars from <meta name="theme-color">, falling back
// to the page background.  Neither is the pinned embed, so hand it black while
// the map owns the screen and put back exactly what was there on the way out.
let addedThemeColor = null;   // the tag we added, if we added one
let priorThemeColor = null;   // what an existing tag said before we touched it

function darkenBrowserChrome(on) {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (on) {
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
      addedThemeColor = meta;
    } else if (priorThemeColor === null) {
      priorThemeColor = meta.content;
    }
    meta.content = "#000000";
  } else if (addedThemeColor) {
    addedThemeColor.remove();
    addedThemeColor = null;
  } else if (meta && priorThemeColor !== null) {
    meta.content = priorThemeColor;
    priorThemeColor = null;
  }
}

function setPseudoFullscreen(on) {
  pseudoFullscreen = on;
  $("simcity-embed").classList.toggle("simcity-pseudo-fullscreen", on);
  // Stop the article scrolling behind the pinned embed.
  document.documentElement.classList.toggle("simcity-fullscreen-lock", on);
  darkenBrowserChrome(on);
  updateZoomClasses();
  resizeCanvas();
  frame();
  showChrome(false);
}

$("simcity-fullscreen").addEventListener("click", () => {
  if (pseudoFullscreen) {
    setPseudoFullscreen(false);
    return;
  }
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    return;
  }
  const el = $("simcity-embed");
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req) {
    setPseudoFullscreen(true);          // iPhone Safari: no API at all
    return;
  }
  // Android Chrome resolves; anything that refuses falls back rather than
  // leaving the button dead.
  Promise.resolve(req.call(el)).catch(() => setPseudoFullscreen(true));
});

// Escape leaves real fullscreen by itself; the faked one needs handling.
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && pseudoFullscreen) setPseudoFullscreen(false);
});

// iOS Safari ignores touch-action for pinch; swallow its gesture events.
embedEl.addEventListener("gesturestart", (e) => e.preventDefault());
embedEl.addEventListener("gesturechange", (e) => e.preventDefault());
// Audio needs a user gesture; any first interaction unlocks the context.
embedEl.addEventListener("pointerdown", () => ensureAudio(), { once: true });

// ---- pan and zoom ----------------------------------------------------------

// One wheel notch is one quarter-step rung, anchored at the cursor; the map
// captures the wheel at every zoom level, but leaves Ctrl/Cmd+wheel alone.
let wheelAccum = 0;

function setZoom(z, cx, cy, snap = true) {
  const fit = fitZoom();
  if (snap) {
    // Snap to the multiplicative ladder anchored at the fitted view, so
    // repeated presses land on the same rungs however you arrived at them.
    const rung = Math.max(0, Math.round(Math.log(z / fit) / Math.log(ZOOM_STEP)));
    z = fit * Math.pow(ZOOM_STEP, rung);
  }
  z = Math.max(fit, Math.min(zoomCeiling(), z));
  if (Math.abs(z - zoom) < 1e-9) return;
  const s = scale;
  let fx;
  let fy;
  if (isFitted()) {
    // The fitted canvas is CSS-scaled; map the cursor through displayed size.
    fx = cx / Math.max(1, canvas.clientWidth) * WORLD_W * TILE_W * s;
    fy = cy / Math.max(1, canvas.clientHeight) * WORLD_H * TILE_H * s;
  } else {
    fx = (cx + viewX) / (s * zoom);
    fy = (cy + viewY) / (s * zoom);
  }
  zoom = z;
  if (isFitted()) {
    viewX = viewY = 0;
  } else {
    viewX = snap ? Math.round(fx * s * z - cx) : fx * s * z - cx;
    viewY = snap ? Math.round(fy * s * z - cy) : fy * s * z - cy;
  }
  updateZoomClasses();
  resizeCanvas();
  frame();
}

canvas.addEventListener("wheel", (e) => {
  if (e.ctrlKey || e.metaKey) return;
  let d = e.deltaY;
  if (e.deltaMode === 1) d *= 33;
  else if (e.deltaMode === 2) d *= 100;
  e.preventDefault();
  wheelAccum += d / 100;
  const steps = Math.round(wheelAccum);
  if (steps !== 0) {
    wheelAccum -= steps;
    const rect = canvas.getBoundingClientRect();
    setZoom(zoom * Math.pow(ZOOM_STEP, steps),
            e.clientX - rect.left, e.clientY - rect.top);
  }
}, { passive: false });

canvas.addEventListener("dblclick", (e) => {
  if (!isFitted()) setZoom(fitZoom(), 0, 0);
  else setZoom(fitZoom() * Math.pow(ZOOM_STEP, 4), e.offsetX, e.offsetY);
});

// Zoom buttons (fallback for touch screens without multitouch).
$("simcity-zoomin").addEventListener("click", () => {
  const rect = canvas.getBoundingClientRect();
  setZoom(zoom * ZOOM_STEP, rect.width / 2, rect.height / 2);
});
$("simcity-zoomout").addEventListener("click", () => {
  const rect = canvas.getBoundingClientRect();
  setZoom(zoom / ZOOM_STEP, rect.width / 2, rect.height / 2);
});

// One finger pans, two pinch-zoom continuously about the midpoint, snapped to
// the nearest rung on release.
const pointers = new Map();
let panning = false;
let pinchStart = null;

canvas.addEventListener("pointerdown", (e) => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvas.setPointerCapture(e.pointerId);
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const rect = canvas.getBoundingClientRect();
    pinchStart = {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      zoom: zoom,
      cx: (a.x + b.x) / 2 - rect.left,
      cy: (a.y + b.y) / 2 - rect.top,
    };
    panning = false;
    canvas.classList.remove("simcity-grabbing");
  } else if (pointers.size === 1 && !isFitted()) {
    panning = true;
    canvas.classList.add("simcity-grabbing");
  }
});

canvas.addEventListener("pointermove", (e) => {
  const p = pointers.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x;
  const dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (pointers.size === 2 && pinchStart && pinchStart.dist > 0) {
    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    setZoom(pinchStart.zoom * dist / pinchStart.dist,
            pinchStart.cx, pinchStart.cy, false);
  } else if (panning) {
    viewX -= dx;
    viewY -= dy;
    clampView();
    frame();
  }
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pinchStart && pointers.size < 2) {
    // Snap to the nearest rung, anchored at the remaining finger or the lift.
    const [a] = [...pointers.values()];
    const rect = canvas.getBoundingClientRect();
    setZoom(zoom, (a ? a.x : e.clientX) - rect.left,
            (a ? a.y : e.clientY) - rect.top, true);
    pinchStart = null;
  }
  if (pointers.size === 0) {
    panning = false;
    canvas.classList.remove("simcity-grabbing");
  } else if (pointers.size === 1 && !isFitted()) {
    panning = true;
  }
}

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

// ---- keyboard --------------------------------------------------------------

window.addEventListener("keydown", (e) => {
  if (e.target !== document.body) return;
  // Leave the browser's own chords alone -- Ctrl-1 switches tabs.
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === "Space") {
    e.preventDefault();
    togglePause();
  } else if (e.key.length === 1 && e.key >= "0" && e.key <= "8") {
    // A digit picks its slider position: 0 is Pause, 8 the fastest.  The
    // slider stops at 8, so the digits do too.
    e.preventDefault();
    selectSpeed(Number(e.key));
  } else if (!isFitted() && PANS[e.code]) {
    e.preventDefault();
    viewX += PANS[e.code][0];
    viewY += PANS[e.code][1];
    clampView();
    frame();
  }
});

// ---- opening view ----------------------------------------------------------
//
// A score city is a diamond about thirty tiles across on a map of twelve
// thousand tiles, so the zoom-1 fit renders it a thumbnail. Open the page part
// way up the zoom ladder and centred on the zoned area, so the first thing a
// reader sees is the city at something like its own pixel size.
//
// FIRST LOAD ONLY. After this the camera belongs to the reader: loadCityAt
// deliberately keeps zoom and pan across a city change, and re-centring on
// every switch would fight whoever is panning around comparing two of them.
// Frame a fixed number of TILES, not a fixed magnification.  Tiles across is
// viewportWidth / (TILE_W * scale * zoom), so a constant zoom shows a
// different amount of city on every screen: at 2.5 a 660px article column got
// 33 tiles and a 350px phone got 17.  Solving for the zoom that yields
// OPENING_TILES makes both land on the same view.
const OPENING_TILES = 30;

function openingZoom() {
  const w = $("simcity-screen").clientWidth || window.innerWidth;
  // scale is whatever the last resizeCanvas() settled on, and TILE_W changes
  // with the graphics mode (8 for VGA, 16 for EGA and mono), so both are read
  // rather than assumed.
  const z = w / (OPENING_TILES * TILE_W * scale);
  return Math.max(fitZoom(), Math.min(zoomCeiling(), z));
}

// The bounding box of the zone anchors, which is where the city is; a map with
// no zones at all falls back to the middle.
function zonedCentre(map) {
  let x0 = WORLD_W, y0 = WORLD_H, x1 = -1, y1 = -1;
  for (let x = 0; x < WORLD_W; x++) {
    for (let y = 0; y < WORLD_H; y++) {
      if (map[x * WORLD_H + y] & 0x400) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x: WORLD_W / 2, y: WORLD_H / 2 };
  return { x: (x0 + x1 + 1) / 2, y: (y0 + y1 + 1) / 2 };
}

// Not setZoom(): that anchors the zoom at a point on SCREEN, and what is
// wanted here is a point on the MAP put in the middle of the viewport.
function openCentredOnCity() {
  const z = openingZoom();
  if (z <= fitZoom() * (1 + 1e-9)) return;
  const centre = zonedCentre(mapView());
  zoom = z;
  // Classes first, then the resize: the viewport is measured from the element
  // the zoomed class sizes.
  updateZoomClasses();
  resizeCanvas();
  const s = scale * zoom;
  viewX = centre.x * TILE_W * s - viewport.w / 2;
  viewY = centre.y * TILE_H * s - viewport.h / 2;
  clampView();
  frame();
}

// ---- init ------------------------------------------------------------------

$("simcity-cityname").textContent = cityName();
paintTax();

try {
  await loadArt(currentSet, currentMode);
  updateModeButtons();
  updateSoundButton();
  updateMusicButton();
  // From the sim speed, not the markup: a cached page can carry a stale value.
  speedSlider.value = speedVal;
  await loadCityAt(cityIndex);
  openCentredOnCity();
} catch (e) {
  setStatus("Embed error: " + e.message);
}
