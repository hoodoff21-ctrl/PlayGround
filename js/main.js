import { AudioEngine } from "./audio.js";
import { makeBackground } from "./background.js";
import {
  FRUIT_KEYS,
  FRUIT_TYPES,
  drawBomb,
  drawFruit,
  drawHalf,
  makeFruit
} from "./fruits.js";

const canvas = document.querySelector("#scene");
const ctx = canvas.getContext("2d", { alpha: false });
const audio = new AudioEngine();

const dom = {
  menuScreen: document.querySelector("#menuScreen"),
  pauseScreen: document.querySelector("#pauseScreen"),
  overScreen: document.querySelector("#overScreen"),
  hud: document.querySelector("#hud"),
  scoreValue: document.querySelector("#scoreValue"),
  chainCount: document.querySelector("#chainCount"),
  chainMultiplier: document.querySelector("#chainMultiplier"),
  chainFill: document.querySelector("#chainFill"),
  chainStatus: document.querySelector("#chainStatus"),
  chainTimer: document.querySelector("#chainTimer"),
  chainPanel: document.querySelector("#chainPanel"),
  focusGems: [...document.querySelectorAll(".focus-gem")],
  focusGemsWrap: document.querySelector("#focusGems"),
  comboBanner: document.querySelector("#comboBanner"),
  comboBannerTitle: document.querySelector("#comboBannerTitle"),
  comboBannerSub: document.querySelector("#comboBannerSub"),
  menuBest: document.querySelector("#menuBest"),
  menuChain: document.querySelector("#menuChain"),
  playBtn: document.querySelector("#playBtn"),
  soundBtn: document.querySelector("#soundBtn"),
  pauseBtn: document.querySelector("#pauseBtn"),
  resumeBtn: document.querySelector("#resumeBtn"),
  quitBtn: document.querySelector("#quitBtn"),
  againBtn: document.querySelector("#againBtn"),
  homeBtn: document.querySelector("#homeBtn"),
  overKicker: document.querySelector("#overKicker"),
  overTitle: document.querySelector("#overTitle"),
  overReason: document.querySelector("#overReason"),
  finalScore: document.querySelector("#finalScore"),
  finalChain: document.querySelector("#finalChain"),
  finalCuts: document.querySelector("#finalCuts"),
  finalBest: document.querySelector("#finalBest"),
  newRecord: document.querySelector("#newRecord")
};

const CHAIN_WINDOW = 1.55;
const MAX_FOCUS = 3;
const TIER_CLASSES = ["", "chain-hot", "chain-blaze", "chain-storm", "chain-dragon"];
const TIER_COLORS = ["#ffe4ad", "#ffb05e", "#ff8552", "#89edff", "#fff1b2"];
const CHAIN_STATUS = ["TEMPERED", "EMBER", "BLAZE", "STORM", "DRAGON"];

let width = window.innerWidth;
let height = window.innerHeight;
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let background = null;
let backgroundFrame = 0;
let lastTime = performance.now();

const state = {
  mode: "menu",
  time: 0,
  elapsed: 0,
  score: 0,
  displayScore: 0,
  best: readNumber("blade-chain-best", 0),
  bestChain: readNumber("blade-chain-chain", 0),
  lives: MAX_FOCUS,
  chain: 0,
  chainTimer: 0,
  tier: 0,
  cuts: 0,
  misses: 0,
  maxChain: 0,
  spawnClock: 0,
  deathTimer: 0,
  deathReason: "",
  fruits: [],
  halves: [],
  particles: [],
  floaters: [],
  rings: [],
  slashes: [],
  links: [],
  petals: [],
  motes: [],
  menuFruits: [],
  trail: [],
  shake: 0,
  flash: 0,
  flashColor: "255, 106, 61",
  comboBannerTimer: 0,
  scoreFloater: null,
  lastCut: { x: 0, y: 0, time: -10, valid: false },
  frozen: false,
  freezeTime: 0,
  pointer: {
    x: width * 0.5,
    y: height * 0.5,
    prevX: width * 0.5,
    prevY: height * 0.5,
    angle: -0.56,
    targetAngle: -0.56,
    active: false,
    down: false,
    lastMove: -10,
    lastTrailTime: -10
  }
};

/* ── Utility ─────────────────────────────────────────────── */

function readNumber(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeNumber(key, value) {
  try {
    localStorage.setItem(key, String(Math.round(value)));
  } catch {}
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function shortestAngle(from, to) {
  let difference = (to - from + Math.PI) % (Math.PI * 2);
  if (difference < 0) difference += Math.PI * 2;
  return difference - Math.PI;
}

function formatNumber(value) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function tierFor(chain) {
  if (chain >= 20) return 4;
  if (chain >= 15) return 3;
  if (chain >= 10) return 2;
  if (chain >= 5) return 1;
  return 0;
}

/* ── Canvas & scene ──────────────────────────────────────── */

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const token = ++backgroundFrame;
  if (background) {
    background = makeBackground(width, height, dpr);
  } else {
    background = makeBackground(width, height, dpr);
  }
  if (token !== backgroundFrame) return;

  createPetals();
  createMotes();
  if (state.mode === "menu" || state.mode === "gameover") createMenuFruits();
}

function createPetals() {
  const count = width < 640 ? 22 : 36;
  state.petals = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 2.4 + Math.random() * 5.2,
    speed: 12 + Math.random() * 30,
    drift: 10 + Math.random() * 22,
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 1.5,
    rot: Math.random() * Math.PI * 2,
    alpha: 0.14 + Math.random() * 0.34,
    pink: Math.random() > 0.35
  }));
}

function createMotes() {
  state.motes = Array.from({ length: width < 640 ? 10 : 16 }, () => ({
    x: Math.random() * width,
    y: height * (0.25 + Math.random() * 0.68),
    size: 0.7 + Math.random() * 1.8,
    phase: Math.random() * Math.PI * 2,
    speed: 0.15 + Math.random() * 0.3,
    amplitude: 8 + Math.random() * 22
  }));
}

function createMenuFruits() {
  const base = clamp(Math.min(width, height) * 0.062, 38, 68);
  const compact = height < 740 && width < 700;
  let layout;

  if (width < 700 && compact) {
    layout = [
      ["watermelon", 0.07, 0.56, 0.7, 0.7],
      ["orange", 0.93, 0.53, 0.64, -0.8],
      ["dragonfruit", 0.96, 0.87, 0.58, 0.45],
      ["plum", 0.035, 0.86, 0.52, 1.55]
    ];
  } else if (width < 700) {
    layout = [
      ["watermelon", 0.09, 0.68, 0.92, 0.7],
      ["orange", 0.89, 0.64, 0.86, -0.8],
      ["dragonfruit", 0.8, 0.83, 0.9, 0.45],
      ["plum", 0.17, 0.84, 0.78, 1.55]
    ];
  } else {
    layout = [
      ["watermelon", 0.075, 0.68, 1.12, 0.4],
      ["orange", 0.91, 0.59, 0.98, -0.5],
      ["dragonfruit", 0.855, 0.79, 0.94, 0.9],
      ["plum", 0.155, 0.84, 0.82, 1.5],
      ["apple", 0.215, 0.47, 0.82, -1.1]
    ];
  }

  state.menuFruits = layout.map(([type, x, y, scale, phase], index) => ({
    type,
    baseX: width * x,
    baseY: height * y,
    radius: base * scale,
    phase,
    x: width * x,
    y: height * y,
    rot: phase + index * 0.8,
    seed: 1000 + index * 91
  }));
}

/* ── Mode & screens ──────────────────────────────────────── */

function applyMode(mode) {
  state.mode = mode;
  document.body.dataset.mode = mode;

  const screens = [
    [dom.menuScreen, mode === "menu"],
    [dom.pauseScreen, mode === "paused"],
    [dom.overScreen, mode === "gameover"]
  ];

  screens.forEach(([screen, active]) => {
    screen.classList.toggle("is-active", active);
    screen.setAttribute("aria-hidden", active ? "false" : "true");
    if (active) screen.removeAttribute("inert");
    else screen.setAttribute("inert", "");
  });

  dom.hud.setAttribute("aria-hidden", mode === "menu" || mode === "gameover" ? "true" : "false");
}

function startGame() {
  audio.init();
  audio.resume();
  audio.click();

  state.elapsed = 0;
  state.score = 0;
  state.displayScore = 0;
  state.lives = MAX_FOCUS;
  state.chain = 0;
  state.chainTimer = 0;
  state.tier = 0;
  state.cuts = 0;
  state.misses = 0;
  state.maxChain = 0;
  state.spawnClock = 0.05;
  state.deathTimer = 0;
  state.deathReason = "";
  state.fruits = [];
  state.halves = [];
  state.particles = [];
  state.floaters = [];
  state.rings = [];
  state.slashes = [];
  state.links = [];
  state.trail = [];
  state.menuFruits = [];
  state.shake = 0;
  state.flash = 0;
  state.comboBannerTimer = 0;
  state.scoreFloater = null;
  state.lastCut = { x: 0, y: 0, time: -10, valid: false };
  state.pointer.prevX = state.pointer.x;
  state.pointer.prevY = state.pointer.y;

  syncFocus();
  setChainTier(0);
  hideComboBanner();
  updateHud(true);
  applyMode("playing");
  spawnWave(3, true);

  lastTime = performance.now();
}

function pauseGame() {
  if (state.mode !== "playing") return;
  audio.click();
  applyMode("paused");
}

function resumeGame() {
  if (state.mode !== "paused") return;
  audio.init();
  audio.resume();
  audio.click();
  applyMode("playing");
  lastTime = performance.now();
}

function goToMenu() {
  state.fruits = [];
  state.halves = [];
  state.particles = [];
  state.floaters = [];
  state.rings = [];
  state.slashes = [];
  state.links = [];
  state.trail = [];
  state.halves = [];
  state.score = 0;
  state.displayScore = 0;
  state.chain = 0;
  state.chainTimer = 0;
  state.lives = MAX_FOCUS;
  state.elapsed = 0;
  state.scoreFloater = null;
  setChainTier(0);
  syncFocus();
  updateHud(true);
  createMenuFruits();
  updateMenuRecords();
  hideComboBanner();
  applyMode("menu");
}

function endRun() {
  if (state.mode === "paused") {
    finishGame("quit");
  }
}

function finishGame(reason) {
  if (state.mode === "gameover") return;
  const previousBest = state.best;
  const isRecord = state.score > previousBest && state.score > 0;

  if (state.score > state.best) {
    state.best = Math.round(state.score);
    writeNumber("blade-chain-best", state.best);
  }
  if (state.maxChain > state.bestChain) {
    state.bestChain = state.maxChain;
    writeNumber("blade-chain-chain", state.bestChain);
  }

  const copy = {
    bomb: {
      kicker: "THE BOMB FOUND YOU",
      title: "RUN ENDED",
      reason: "Some fruit is not fruit. The fuse does not forgive."
    },
    focus: {
      kicker: "THE CHAIN BREAKS",
      title: "OUT OF FOCUS",
      reason: "Three misses. The dojo remembers every fallen fruit."
    },
    quit: {
      kicker: "THE BLADE RESTS",
      title: "RUN ENDED",
      reason: "A short meditation is still a meditation."
    },
    test: {
      kicker: "THE CHAIN BREAKS",
      title: "RUN ENDED",
      reason: "The duel is over."
    }
  }[reason] || {
    kicker: "THE CHAIN BREAKS",
    title: "RUN ENDED",
    reason: "A blade is only as sharp as its patience."
  };

  setText(dom.overKicker, copy.kicker);
  setText(dom.overTitle, copy.title);
  setText(dom.overReason, copy.reason);
  setText(dom.finalScore, formatNumber(state.score));
  setText(dom.finalChain, formatNumber(state.maxChain));
  setText(dom.finalCuts, formatNumber(state.cuts));
  setText(dom.finalBest, formatNumber(state.best));
  dom.newRecord.classList.toggle("is-visible", isRecord);

  updateMenuRecords();
  updateHud(true);
  hideComboBanner();
  setChainTier(0);
  applyMode("gameover");
  audio.gameOver();
  state.fruits = state.fruits.filter((fruit) => fruit.type !== "bomb");
  state.trail = [];
}

function updateMenuRecords() {
  setText(dom.menuBest, formatNumber(state.best));
  setText(dom.menuChain, formatNumber(state.bestChain));
}

function syncFocus() {
  dom.focusGems.forEach((gem, index) => {
    const lost = index >= state.lives;
    gem.classList.toggle("is-lost", lost);
  });
  dom.focusGemsWrap.setAttribute("aria-label", `${state.lives} focus remaining`);
}

function setChainTier(tier) {
  if (state.tier === tier) return;
  state.tier = tier;
  TIER_CLASSES.forEach((className) => {
    if (className) document.body.classList.remove(className);
  });
  if (tier > 0) document.body.classList.add(TIER_CLASSES[tier]);
}

function updateHud(dt = 0, force = false) {
  if (state.displayScore !== state.score) {
    if (force) {
      state.displayScore = state.score;
    } else {
      const factor = 1 - Math.exp(-dt * 11);
      state.displayScore = lerp(state.displayScore, state.score, factor);
      if (Math.abs(state.score - state.displayScore) < 0.75) state.displayScore = state.score;
    }
  }

  setText(dom.scoreValue, formatNumber(state.displayScore));

  const chain = state.chain;
  const tier = tierFor(chain);
  setChainTier(tier);
  setText(dom.chainCount, String(chain));
  const multiplier = 1 + 0.25 * Math.max(0, chain - 1);
  setText(dom.chainMultiplier, `×${multiplier.toFixed(1)}`);
  const ratio = chain > 0 ? clamp(state.chainTimer / CHAIN_WINDOW, 0, 1) : 0;
  dom.chainFill.style.transform = `scaleX(${ratio})`;
  const status = chain === 0 ? "READY" : CHAIN_STATUS[tier];
  setText(dom.chainStatus, status);
  setText(dom.chainTimer, chain > 0 ? `${Math.max(0, state.chainTimer).toFixed(1)}s` : "—");
}

/* ── Game flow ───────────────────────────────────────────── */

function spawnWave(count, intro = false) {
  const baseRadius = clamp(Math.min(width, height) * 0.058, 37, 64);
  const difficulty = clamp(state.elapsed / 78, 0, 1);
  const lanes = shuffle([0.16, 0.37, 0.62, 0.84]);
  let usedBomb = false;

  for (let i = 0; i < count; i += 1) {
    const lane = count === 1
      ? 0.12 + Math.random() * 0.76
      : lanes[i % lanes.length] + (Math.random() - 0.5) * 0.06;
    const x = clamp(lane * width, width * 0.07, width * 0.93);
    const targetX = clamp(
      x + (width * 0.5 - x) * (0.32 + Math.random() * 0.26) + (Math.random() - 0.5) * width * 0.28,
      width * 0.08,
      width * 0.92
    );
    const vy = -height * (1.48 + Math.random() * 0.23);
    const gravity = height * 1.48;
    const timeToApex = -vy / gravity;
    const vx = (targetX - x) / Math.max(0.5, timeToApex);
    const radius = baseRadius * (0.9 + Math.random() * 0.18);

    const bombChance = intro ? 0 : clamp(0.045 + difficulty * 0.075, 0, 0.12);
    const makeBomb = !usedBomb && state.elapsed > 9 && Math.random() < bombChance;

    if (makeBomb) {
      usedBomb = true;
      state.fruits.push({
        type: "bomb",
        x,
        y: height + radius * 1.6,
        vx,
        vy,
        radius: radius * 1.06,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 1.7,
        seed: Math.random() * 1000,
        age: 0
      });
    } else {
      const type = FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
      state.fruits.push(
        makeFruit(type, x, height + radius * 1.6, radius, vx, vy, Math.random() * 1e9)
      );
    }
  }
}

function updateFruits(dt, checkMisses) {
  const gravity = height * 1.48;

  for (let i = state.fruits.length - 1; i >= 0; i -= 1) {
    const fruit = state.fruits[i];
    fruit.age += dt;
    fruit.vy += gravity * dt;
    fruit.x += fruit.vx * dt;
    fruit.y += fruit.vy * dt;
    fruit.rot += fruit.rotSpeed * dt;

    const out =
      fruit.y - fruit.radius > height + 30 ||
      fruit.x < -fruit.radius * 2.4 ||
      fruit.x > width + fruit.radius * 2.4;

    if (out && fruit.vy > 0) {
      state.fruits.splice(i, 1);
      if (checkMisses && fruit.type !== "bomb") {
        missingFruit(fruit);
      }
    }
  }
}

function missingFruit(fruit) {
  if (state.mode !== "playing") return;
  state.misses += 1;
  state.lives = Math.max(0, state.lives - 1);
  breakChain();
  syncFocus();
  state.shake = Math.max(state.shake, 9);
  state.flash = Math.max(state.flash, 0.16);
  state.flashColor = "198, 43, 55";
  audio.miss();

  addFloater(
    clamp(fruit.x, width * 0.14, width * 0.86),
    height - 74,
    "MISS",
    "FOCUS LOST",
    "#ffb5a3",
    25,
    1.15
  );

  if (state.lives <= 0) {
    beginDying("focus", 0.72);
  }
}

function beginDying(reason, duration) {
  if (state.mode !== "playing") return;
  state.mode = "dying";
  state.deathReason = reason;
  state.deathTimer = duration;
  state.spawnClock = 999;
  state.trail = [];
  breakChain();
  document.body.dataset.mode = "dying";
  dom.hud.setAttribute("aria-hidden", "false");
}

function updateDying(dt) {
  state.deathTimer -= dt;
  updateFruits(dt, false);
  updateEffects(dt);
  if (state.deathTimer <= 0) {
    finishGame(state.deathReason || "focus");
  }
}

function breakChain() {
  if (state.chain >= 2) audio.comboBreak();
  state.chain = 0;
  state.chainTimer = 0;
  state.lastCut.valid = false;
  setChainTier(0);
}

function handleSpawner(dt) {
  const difficulty = clamp(state.elapsed / 78, 0, 1);
  state.spawnClock -= dt;

  if (state.spawnClock > 0) return;

  let count = 1;
  const roll = Math.random();
  if (state.elapsed < 8) {
    count = roll > 0.56 ? 3 : 2;
  } else {
    if (roll > 0.74 - difficulty * 0.12) count = 2;
    if (roll > 0.92 - difficulty * 0.09) count = 3;
  }
  count = Math.min(count, Math.max(1, 13 - state.fruits.length));
  spawnWave(count);

  const base = lerp(1.5, 0.68, difficulty);
  state.spawnClock = base * (0.72 + Math.random() * 0.54);
}

/* ── Slicing ─────────────────────────────────────────────── */

function segmentHit(fruit, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  let t = 0;
  if (lengthSq > 0.0001) {
    t = clamp(((fruit.x - x1) * dx + (fruit.y - y1) * dy) / lengthSq, 0, 1);
  }
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  const nx = fruit.x - px;
  const ny = fruit.y - py;
  return {
    hit: nx * nx + ny * ny <= fruit.radius * fruit.radius * 0.84,
    t,
    x: px,
    y: py
  };
}

function trySlice(x1, y1, x2, y2) {
  if (state.mode !== "playing") return;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hits = [];

  state.fruits.forEach((fruit) => {
    const result = segmentHit(fruit, x1, y1, x2, y2);
    if (result.hit) hits.push({ fruit, ...result });
  });

  if (!hits.length) return;
  hits.sort((a, b) => a.t - b.t);

  const startScore = state.score;
  const cutResults = [];

  for (const hit of hits) {
    if (state.mode !== "playing") break;
    if (!state.fruits.includes(hit.fruit)) continue;
    if (hit.fruit.type === "bomb") {
      detonateBomb(hit.fruit);
      break;
    }
    const result = sliceFruit(hit.fruit, angle, hit.x, hit.y, false);
    if (result) cutResults.push(result);
  }

  if (cutResults.length) {
    showCutScore(cutResults, state.score - startScore);
  }
}

function tapSlice(x, y) {
  if (state.mode !== "playing") return;
  let closest = null;
  let closestDistance = Infinity;

  for (const fruit of state.fruits) {
    const distance = Math.hypot(fruit.x - x, fruit.y - y);
    if (distance < fruit.radius * 0.94 && distance < closestDistance) {
      closest = fruit;
      closestDistance = distance;
    }
  }

  if (!closest) return;
  const angle = Math.random() * Math.PI;

  if (closest.type === "bomb") {
    detonateBomb(closest);
  } else {
    const result = sliceFruit(closest, angle, x, y, false);
    if (result) showCutScore([result], result.points);
  }
}

function sliceFruit(fruit, angle, hitX, hitY, withFloater = true) {
  const index = state.fruits.indexOf(fruit);
  if (index < 0) return;
  state.fruits.splice(index, 1);

  state.cuts += 1;
  if (state.chainTimer > 0) state.chain += 1;
  else state.chain = 1;
  state.chainTimer = CHAIN_WINDOW;
  state.maxChain = Math.max(state.maxChain, state.chain);
  state.tier = tierFor(state.chain);

  const type = FRUIT_TYPES[fruit.type];
  const multiplier = 1 + 0.25 * (state.chain - 1);
  const points = Math.round(type.points * multiplier);
  state.score += points;

  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const nx = -dy;
  const ny = dx;
  const sideDistance = (fruit.x - hitX) * nx + (fruit.y - hitY) * ny;
  const offset = clamp(-sideDistance, -fruit.radius * 0.72, fruit.radius * 0.72);
  const cutLocal = angle - fruit.rot;
  const separation = 118 + Math.random() * 78;

  for (const side of [-1, 1]) {
    state.halves.push({
      type: fruit.type,
      x: fruit.x,
      y: fruit.y,
      vx: fruit.vx * 0.38 + nx * separation * side + dx * 18,
      vy: fruit.vy * 0.33 + ny * separation * side - 34,
      radius: fruit.radius,
      rot: fruit.rot,
      rotSpeed: fruit.rotSpeed + side * (1.25 + Math.random() * 1.6),
      cutLocal,
      offset,
      side,
      seed: fruit.seed,
      alpha: 1,
      life: 2.7 + Math.random() * 0.5,
      age: 0
    });
  }

  spawnJuice(fruit, angle, hitX, hitY);
  state.slashes.push({
    x: hitX,
    y: hitY,
    angle,
    length: fruit.radius * (2.7 + Math.random() * 0.8),
    life: 0.19,
    maxLife: 0.19,
    color: TIER_COLORS[state.tier] || TIER_COLORS[0]
  });
  state.rings.push({
    x: hitX,
    y: hitY,
    radius: fruit.radius * 0.2,
    speed: fruit.radius * 4.2,
    life: 0.38,
    maxLife: 0.38,
    color: type.accent,
    width: 2
  });

  if (state.lastCut.valid && state.time - state.lastCut.time < CHAIN_WINDOW + 0.2) {
    state.links.push({
      x1: state.lastCut.x,
      y1: state.lastCut.y,
      x2: hitX,
      y2: hitY,
      life: 0.68,
      maxLife: 0.68,
      seed: Math.random() * 1000,
      tier: state.chain
    });
  }
  state.lastCut = { x: hitX, y: hitY, time: state.time, valid: true };

  if (withFloater) {
    addFloater(
      hitX,
      hitY - fruit.radius * 0.38,
      `+${points}`,
      state.chain > 1 ? `CHAIN ${state.chain}` : "",
      state.chain >= 15 ? "#fff3bd" : state.chain >= 10 ? "#a8f7ff" : "#ffe5ae",
      state.chain >= 10 ? 33 : 27,
      0.92
    );
  }

  if (state.chain % 5 === 0) {
    triggerMilestone(state.chain);
  }

  audio.slice(state.chain, (hitX / width) * 2 - 1);
  state.shake = Math.max(state.shake, state.chain >= 10 ? 2.6 : 1.1);
  addSwordSparks(hitX, hitY, angle);

  return { x: hitX, y: hitY, radius: fruit.radius, points };
}

function showCutScore(results, totalPoints) {
  if (!results.length || totalPoints <= 0) return;
  const x = clamp(
    results.reduce((sum, result) => sum + result.x, 0) / results.length,
    width * 0.12,
    width * 0.88
  );
  const top = clamp(
    Math.min(...results.map((result) => result.y - result.radius * 0.3)),
    height * 0.16,
    height * 0.8
  );
  const color = state.chain >= 15 ? "#fff3bd" : state.chain >= 10 ? "#a8f7ff" : "#ffe5ae";
  const sub = state.chain > 1 ? `CHAIN ${state.chain}` : "";
  const size = state.chain >= 10 ? 34 : 28;
  const previous = state.scoreFloater;

  if (previous && state.floaters.includes(previous) && state.time - previous.born < 0.24) {
    previous.points = (previous.points || 0) + totalPoints;
    previous.text = `+${previous.points}`;
    previous.sub = sub;
    previous.color = color;
    previous.size = size;
    previous.x = x;
    previous.y = Math.min(previous.y, top);
    previous.life = previous.maxLife;
    previous.born = state.time;
    previous.vy = -42;
    return;
  }

  const floater = addFloater(x, top, `+${totalPoints}`, sub, color, size, 0.98);
  floater.points = totalPoints;
  state.scoreFloater = floater;
}

function triggerMilestone(chain) {
  const tier = tierFor(chain);
  const subtitle = tier >= 4
    ? "THE DRAGON STIRS"
    : tier === 3
      ? "STORMBOUND"
      : tier === 2
        ? "BLAZE UNBOUND"
        : tier === 1
          ? "EMBER AWAKENED"
          : "THE BLADE SINGS";

  setText(dom.comboBannerTitle, `CHAIN ×${chain}`);
  setText(dom.comboBannerSub, subtitle);
  dom.comboBanner.classList.remove("is-storm", "is-dragon");
  if (tier >= 4) dom.comboBanner.classList.add("is-dragon");
  else if (tier >= 3) dom.comboBanner.classList.add("is-storm");
  dom.comboBanner.classList.add("is-visible");
  clearTimeout(triggerMilestone.timeout);
  triggerMilestone.timeout = setTimeout(hideComboBanner, 1450);

  audio.milestone(chain);
  state.rings.push({
    x: width * 0.5,
    y: height * 0.5,
    radius: Math.min(width, height) * 0.12,
    speed: Math.min(width, height) * 1.4,
    life: 0.9,
    maxLife: 0.9,
    color: TIER_COLORS[tier],
    width: 1.5
  });
  if (navigator.vibrate) navigator.vibrate(tier >= 3 ? [18, 30, 24] : 16);
}

function hideComboBanner() {
  dom.comboBanner.classList.remove("is-visible");
}

function detonateBomb(bomb) {
  const index = state.fruits.indexOf(bomb);
  if (index >= 0) state.fruits.splice(index, 1);
  if (state.mode !== "playing") return;

  state.shake = 38;
  state.flash = 0.84;
  state.flashColor = "255, 122, 53";
  audio.bomb();
  if (navigator.vibrate) navigator.vibrate([35, 45, 90]);

  for (let i = 0; i < 52; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 560;
    state.particles.push({
      x: bomb.x,
      y: bomb.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      size: 2 + Math.random() * 8,
      color: Math.random() > 0.35 ? "#ffb04f" : "#fff0c2",
      life: 0.45 + Math.random() * 0.8,
      maxLife: 0.9,
      gravity: 520,
      drag: 0.987,
      kind: Math.random() > 0.6 ? "spark" : "ember"
    });
  }
  for (let i = 0; i < 30; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 25 + Math.random() * 180;
    state.particles.push({
      x: bomb.x + (Math.random() - 0.5) * 25,
      y: bomb.y + (Math.random() - 0.5) * 25,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      size: 18 + Math.random() * 34,
      color: "44, 37, 40",
      life: 0.8 + Math.random() * 1.2,
      maxLife: 2,
      gravity: -20,
      drag: 0.975,
      kind: "smoke"
    });
  }
  state.rings.push({
    x: bomb.x,
    y: bomb.y,
    radius: 12,
    speed: 850,
    life: 0.65,
    maxLife: 0.65,
    color: "#ffc36f",
    width: 5
  });
  state.rings.push({
    x: bomb.x,
    y: bomb.y,
    radius: 10,
    speed: 470,
    life: 0.9,
    maxLife: 0.9,
    color: "#ff5d38",
    width: 2
  });
  state.slashes.push({
    x: bomb.x,
    y: bomb.y,
    angle: Math.random() * Math.PI,
    length: Math.min(width, height) * 0.4,
    life: 0.32,
    maxLife: 0.32,
    color: "#fff2c9"
  });

  beginDying("bomb", 1.15);
}

/* ── Effects ─────────────────────────────────────────────── */

function spawnJuice(fruit, angle, x, y) {
  const type = FRUIT_TYPES[fruit.type];
  const colors = type.juice;
  const normalX = -Math.sin(angle);
  const normalY = Math.cos(angle);

  for (let i = 0; i < 22; i += 1) {
    const side = i % 2 === 0 ? 1 : -1;
    const spread = (Math.random() - 0.5) * 1.15;
    const direction = angle + Math.PI * 0.5 * side + spread;
    const speed = 70 + Math.random() * 390;
    state.particles.push({
      x: x + normalX * side * (Math.random() * 8),
      y: y + normalY * side * (Math.random() * 8),
      vx: fruit.vx * 0.18 + Math.cos(direction) * speed,
      vy: fruit.vy * 0.12 + Math.sin(direction) * speed - 20,
      size: 1.4 + Math.random() * 4.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0.5 + Math.random() * 0.8,
      maxLife: 1.3,
      gravity: 780,
      drag: 0.985,
      kind: "juice"
    });
  }

  for (let i = 0; i < 7; i += 1) {
    const direction = Math.random() * Math.PI * 2;
    const speed = 90 + Math.random() * 260;
    state.particles.push({
      x,
      y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      size: 1.2 + Math.random() * 2,
      color: Math.random() > 0.4 ? type.accent : "#fff0bf",
      life: 0.2 + Math.random() * 0.4,
      maxLife: 0.6,
      gravity: 300,
      drag: 0.96,
      kind: "spark"
    });
  }
}

function addSwordSparks(x, y, angle) {
  const tier = state.tier;
  if (tier < 2) return;
  for (let i = 0; i < 4; i += 1) {
    const direction = angle + (Math.random() - 0.5) * Math.PI * 1.3;
    const speed = 80 + Math.random() * 200;
    state.particles.push({
      x,
      y,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      size: 1.3 + Math.random() * 2,
      color: tier >= 4 ? "#fff2b1" : "#a6f5ff",
      life: 0.18 + Math.random() * 0.35,
      maxLife: 0.53,
      gravity: 80,
      drag: 0.97,
      kind: "spark"
    });
  }
}

function addFloater(x, y, text, sub, color, size, life) {
  const floater = {
    x,
    y,
    text,
    sub,
    color,
    size,
    life,
    maxLife: life,
    vy: -48,
    born: state.time
  };
  state.floaters.push(floater);
  return floater;
}

function updateEffects(dt) {
  for (let i = state.halves.length - 1; i >= 0; i -= 1) {
    const half = state.halves[i];
    half.age += dt;
    half.life -= dt;
    half.vy += height * 1.48 * dt;
    half.x += half.vx * dt;
    half.y += half.vy * dt;
    half.rot += half.rotSpeed * dt;
    half.alpha = clamp(half.life * 2.4, 0, 1);
    if (
      half.life <= 0 ||
      half.y - half.radius > height + 50 ||
      half.x < -half.radius * 3 ||
      half.x > width + half.radius * 3
    ) {
      state.halves.splice(i, 1);
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const particle = state.particles[i];
    particle.life -= dt;
    if (particle.life <= 0) {
      state.particles.splice(i, 1);
      continue;
    }
    particle.vy += (particle.gravity || 0) * dt;
    particle.vx *= Math.pow(particle.drag || 1, dt * 60);
    particle.vy *= Math.pow(particle.drag || 1, dt * 60);
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
  }

  if (state.particles.length > 520) {
    state.particles.splice(0, state.particles.length - 520);
  }

  for (let i = state.rings.length - 1; i >= 0; i -= 1) {
    const ring = state.rings[i];
    ring.life -= dt;
    ring.radius += ring.speed * dt;
    ring.speed *= Math.pow(0.92, dt * 60);
    if (ring.life <= 0) state.rings.splice(i, 1);
  }

  for (let i = state.slashes.length - 1; i >= 0; i -= 1) {
    state.slashes[i].life -= dt;
    if (state.slashes[i].life <= 0) state.slashes.splice(i, 1);
  }

  for (let i = state.links.length - 1; i >= 0; i -= 1) {
    state.links[i].life -= dt;
    if (state.links[i].life <= 0) state.links.splice(i, 1);
  }

  for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
    const floater = state.floaters[i];
    floater.life -= dt;
    floater.y += floater.vy * dt;
    floater.vy *= Math.pow(0.94, dt * 60);
    if (floater.life <= 0) state.floaters.splice(i, 1);
  }

  state.shake *= Math.exp(-7.5 * dt);
  state.flash = Math.max(0, state.flash - dt * 2.5);

  const now = state.time;
  state.trail = state.trail.filter((point) => now - point.time < 0.72);
  state.links = state.links.filter((link) => link.life > 0);
}

function updateAmbient(dt) {
  if (state.mode !== "paused") {
    const t = state.time;
    for (const petal of state.petals) {
      petal.y += petal.speed * dt;
      petal.x += Math.sin(t * 0.55 + petal.phase) * petal.drift * dt;
      petal.rot += petal.spin * dt;
      if (petal.y > height + 20) {
        petal.y = -20;
        petal.x = Math.random() * width;
      }
      if (petal.x < -20) petal.x = width + 10;
      if (petal.x > width + 20) petal.x = -10;
    }
  }

  if (state.mode === "menu" && state.menuFruits.length) {
    for (const fruit of state.menuFruits) {
      const wave = state.time * 0.55 + fruit.phase;
      fruit.x = fruit.baseX + Math.sin(wave * 0.72) * 7;
      fruit.y = fruit.baseY + Math.sin(wave) * 9;
      fruit.rot += dt * (0.06 + Math.abs(fruit.phase) * 0.02);
    }
  }
}

/* ── Main loop ───────────────────────────────────────────── */

function update(dt) {
  updateAmbient(dt);

  if (state.mode === "playing") {
    state.elapsed += dt;

    if (state.chainTimer > 0) {
      state.chainTimer = Math.max(0, state.chainTimer - dt);
      if (state.chainTimer === 0) {
        breakChain();
      }
    }

    handleSpawner(dt);
    updateFruits(dt, true);
    updateEffects(dt);
    updateHud(dt);
  } else if (state.mode === "dying") {
    updateDying(dt);
    updateHud(dt);
  } else if (state.mode === "gameover") {
    updateEffects(dt);
    updateHud(dt, true);
  } else if (state.mode === "paused") {
    updateHud(0, true);
  }

  const pointer = state.pointer;
  if (pointer.active) {
    pointer.angle += shortestAngle(pointer.angle, pointer.targetAngle) * Math.min(1, dt * 26);
  }

  if (state.mode === "playing" || state.mode === "dying") {
    if (pointer.active && state.time - pointer.lastMove > 0.12 && state.tier >= 2) {
      const tierColor = state.tier >= 4 ? "#ffe8a0" : "#8aefff";
      if (Math.random() > 0.7) {
        state.particles.push({
          x: pointer.x + (Math.random() - 0.5) * 22,
          y: pointer.y + (Math.random() - 0.5) * 22,
          vx: (Math.random() - 0.5) * 45,
          vy: (Math.random() - 0.5) * 45,
          size: 1 + Math.random() * 1.8,
          color: tierColor,
          life: 0.2 + Math.random() * 0.3,
          maxLife: 0.5,
          gravity: 0,
          drag: 0.95,
          kind: "spark"
        });
      }
    }
  }
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const shake = state.shake;
  const shakeX = (Math.random() * 2 - 1) * shake;
  const shakeY = (Math.random() * 2 - 1) * shake;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  if (background) ctx.drawImage(background, 0, 0, width, height);
  else {
    ctx.fillStyle = "#08070d";
    ctx.fillRect(0, 0, width, height);
  }

  drawPetals();
  drawMotes();

  if (state.mode === "menu" && state.menuFruits.length) drawMenuFruits();

  state.halves.forEach((half) => drawHalf(ctx, half));
  state.fruits.forEach((fruit) => {
    if (fruit.type === "bomb") {
      drawBomb(ctx, fruit, state.time);
    } else {
      drawFruitHalo(fruit);
      drawFruit(ctx, fruit);
    }
  });

  drawParticles();
  drawSlashes();
  drawRings();
  drawLinks();
  drawFloaters();

  if (state.mode === "playing" || state.mode === "dying" || state.mode === "paused") {
    drawTrail();
    drawSword();
  }

  ctx.restore();

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(${state.flashColor}, ${state.flash})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawPetals() {
  ctx.save();
  for (const petal of state.petals) {
    ctx.save();
    ctx.translate(petal.x, petal.y);
    ctx.rotate(petal.rot);
    ctx.globalAlpha = petal.alpha;
    ctx.fillStyle = petal.pink ? "#e7a0ab" : "#cfc1b0";
    ctx.beginPath();
    ctx.moveTo(0, -petal.size);
    ctx.bezierCurveTo(petal.size * 1.2, -petal.size * 0.5, petal.size * 0.8, petal.size * 0.55, 0, petal.size);
    ctx.bezierCurveTo(-petal.size * 0.7, petal.size * 0.4, -petal.size * 1.05, -petal.size * 0.45, 0, -petal.size);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawMotes() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const mote of state.motes) {
    const x = mote.x + Math.sin(state.time * mote.speed + mote.phase) * mote.amplitude;
    const y = mote.y + Math.cos(state.time * mote.speed * 0.8 + mote.phase) * mote.amplitude * 0.4;
    const pulse = 0.32 + Math.sin(state.time * 1.2 + mote.phase) * 0.2;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, mote.size * 8);
    glow.addColorStop(0, `rgba(255, 226, 168, ${pulse})`);
    glow.addColorStop(0.12, `rgba(255, 208, 138, ${pulse * 0.42})`);
    glow.addColorStop(0.45, `rgba(255, 188, 112, ${pulse * 0.1})`);
    glow.addColorStop(1, "rgba(255, 180, 100, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, mote.size * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#fff4d4";
    ctx.beginPath();
    ctx.arc(x, y, mote.size * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawMenuFruits() {
  for (const fruit of state.menuFruits) {
    const type = FRUIT_TYPES[fruit.type];
    ctx.save();
    const halo = ctx.createRadialGradient(fruit.x, fruit.y, fruit.radius * 0.2, fruit.x, fruit.y, fruit.radius * 2.1);
    halo.addColorStop(0, `${type.accent}18`);
    halo.addColorStop(1, `${type.accent}00`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(fruit.x, fruit.y, fruit.radius * 2.1, 0, Math.PI * 2);
    ctx.fill();
    drawFruit(ctx, {
      ...fruit,
      rot: fruit.rot,
      radius: fruit.radius,
      seed: fruit.seed
    });
    ctx.restore();
  }
}

function drawFruitHalo(fruit) {
  const type = FRUIT_TYPES[fruit.type];
  if (!type) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const halo = ctx.createRadialGradient(
    fruit.x,
    fruit.y,
    fruit.radius * 0.45,
    fruit.x,
    fruit.y,
    fruit.radius * 1.8
  );
  halo.addColorStop(0, `${type.accent}26`);
  halo.addColorStop(0.5, `${type.accent}10`);
  halo.addColorStop(1, `${type.accent}00`);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(fruit.x, fruit.y, fruit.radius * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles() {
  ctx.save();
  for (const particle of state.particles) {
    const ratio = clamp(particle.life / particle.maxLife, 0, 1);
    if (particle.kind === "smoke") {
      ctx.globalAlpha = ratio * 0.32;
      ctx.fillStyle = `rgb(${particle.color})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (1.6 - ratio * 0.65), 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    if (particle.kind === "spark") {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = ratio;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.size;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x - particle.vx * 0.018, particle.y - particle.vy * 0.018);
      ctx.stroke();
      continue;
    }

    if (particle.kind === "ember") {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = ratio * 0.85;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * ratio, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = clamp(ratio * 1.25, 0, 1);
    ctx.fillStyle = particle.color;
    const speed = Math.hypot(particle.vx, particle.vy);
    const stretch = 1 + Math.min(speed / 260, 1.6);
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(Math.atan2(particle.vy, particle.vx));
    ctx.beginPath();
    ctx.ellipse(0, 0, particle.size * stretch, particle.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawSlashes() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const slash of state.slashes) {
    const ratio = slash.life / slash.maxLife;
    const dx = Math.cos(slash.angle) * slash.length * 0.5;
    const dy = Math.sin(slash.angle) * slash.length * 0.5;
    ctx.globalAlpha = ratio * 0.7;
    ctx.strokeStyle = slash.color;
    ctx.lineWidth = 1.4 + ratio * 2.4;
    ctx.beginPath();
    ctx.moveTo(slash.x - dx, slash.y - dy);
    ctx.lineTo(slash.x + dx, slash.y + dy);
    ctx.stroke();
    ctx.globalAlpha = ratio * 0.2;
    ctx.lineWidth = 8;
    ctx.strokeStyle = slash.color;
    ctx.stroke();
  }
  ctx.restore();
}

function drawRings() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const ring of state.rings) {
    const ratio = clamp(ring.life / ring.maxLife, 0, 1);
    ctx.globalAlpha = ratio * 0.6;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width * ratio;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLinks() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const link of state.links) {
    const ratio = clamp(link.life / link.maxLife, 0, 1);
    const color = link.tier >= 20
      ? "#fff0ab"
      : link.tier >= 15
        ? "#8af1ff"
        : link.tier >= 10
          ? "#ffb470"
          : "#ffe4a0";
    const length = Math.hypot(link.x2 - link.x1, link.y2 - link.y1);
    const segments = 8;
    const nx = -(link.y2 - link.y1) / Math.max(1, length);
    const ny = (link.x2 - link.x1) / Math.max(1, length);
    const time = state.time * 28;

    const path = () => {
      ctx.beginPath();
      ctx.moveTo(link.x1, link.y1);
      for (let i = 1; i < segments; i += 1) {
        const t = i / segments;
        const wobble = Math.sin(link.seed * 0.013 + i * 9.1 + time) * Math.min(23, length * 0.11);
        ctx.lineTo(
          lerp(link.x1, link.x2, t) + nx * wobble,
          lerp(link.y1, link.y2, t) + ny * wobble
        );
      }
      ctx.lineTo(link.x2, link.y2);
    };

    ctx.globalAlpha = ratio * 0.2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    path();
    ctx.stroke();

    ctx.globalAlpha = ratio * 0.9;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    path();
    ctx.stroke();

    ctx.globalAlpha = ratio * 0.5;
    ctx.strokeStyle = "#fff9dd";
    ctx.lineWidth = 0.8;
    path();
    ctx.stroke();
  }
  ctx.restore();
}

function drawFloaters() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const floater of state.floaters) {
    const ratio = clamp(floater.life / floater.maxLife, 0, 1);
    const appear = Math.min(1, (1 - ratio) * 6);
    ctx.globalAlpha = Math.min(1, ratio * 1.7) * appear;
    ctx.fillStyle = floater.color;
    ctx.font = `500 ${floater.size}px "Bodoni 72", "Bodoni MT", Didot, Georgia, serif`;
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 10;
    ctx.fillText(floater.text, floater.x, floater.y);
    if (floater.sub) {
      ctx.globalAlpha = Math.min(1, ratio * 1.7) * appear * 0.65;
      ctx.fillStyle = "#f7eedb";
      ctx.font = `700 ${Math.max(7, floater.size * 0.27)}px "Avenir Next", "Century Gothic", sans-serif`;
      ctx.fillText(floater.sub, floater.x, floater.y + floater.size * 0.66);
    }
  }
  ctx.restore();
}

function drawTrail() {
  if (!state.pointer.active) return;
  const points = state.trail;
  if (points.length < 2) return;

  const color = TIER_COLORS[state.tier] || TIER_COLORS[0];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const pass of [
    { width: 38, alpha: 0.13, tint: color },
    { width: 16, alpha: 0.26, tint: color },
    { width: 5.4, alpha: 0.55, tint: "#fff1c4" },
    { width: 1.7, alpha: 0.9, tint: "#fffdf4" }
  ]) {
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const age = state.time - b.time;
      const life = clamp(1 - age / 0.72, 0, 1);
      if (life <= 0) continue;
      const along = i / (points.length - 1);
      const taper = 0.1 + Math.pow(along, 0.72) * 0.9;
      ctx.globalAlpha = life * pass.alpha * (0.22 + along * 0.78);
      ctx.strokeStyle = pass.tint;
      ctx.lineWidth = Math.max(0.4, pass.width * taper * (0.55 + life * 0.45));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  // A hot leading edge keeps the newest motion feeling sharp.
  const tip = points[points.length - 1];
  const tipLife = clamp(1 - (state.time - tip.time) / 0.72, 0, 1);
  if (tipLife > 0) {
    const flare = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 30);
    flare.addColorStop(0, `rgba(255, 248, 220, ${0.32 * tipLife})`);
    flare.addColorStop(0.3, `rgba(255, 210, 140, ${0.1 * tipLife})`);
    flare.addColorStop(1, "rgba(255, 190, 110, 0)");
    ctx.fillStyle = flare;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSword() {
  const pointer = state.pointer;
  if (!pointer.active) return;
  const scale = clamp(Math.min(width, height) / 720, 0.82, 1.34);
  const tier = state.tier;
  const glow = TIER_COLORS[tier] || TIER_COLORS[0];
  const moving = state.time - pointer.lastMove < 0.18;
  const pulse = 0.7 + Math.sin(state.time * 7) * 0.15;

  ctx.save();
  ctx.translate(pointer.x, pointer.y);
  ctx.rotate(pointer.angle);
  ctx.scale(scale, scale);

  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = glow;
  ctx.shadowColor = glow;
  ctx.shadowBlur = tier > 0 ? 28 : 14;
  ctx.globalAlpha = (tier > 0 ? 0.3 : 0.13) * (moving ? 1 : 0.7) * pulse;
  ctx.lineWidth = tier > 1 ? 16 : 9;
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.quadraticCurveTo(44, -2.5, 75, 0);
  ctx.stroke();

  if (tier >= 1) {
    ctx.globalAlpha = 0.3 * pulse;
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i += 1) {
      const start = 10 + i * 19;
      ctx.beginPath();
      ctx.moveTo(start, -3.3);
      ctx.quadraticCurveTo(start + 8, -9 - Math.sin(state.time * 11 + i) * 3, start + 17, -3.4);
      ctx.stroke();
    }
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 9;
  ctx.shadowOffsetY = 2.5;

  ctx.beginPath();
  ctx.moveTo(79, 0);
  ctx.quadraticCurveTo(48, -6.3, 7, -5.1);
  ctx.lineTo(-10, -4.4);
  ctx.lineTo(-10, 4.4);
  ctx.quadraticCurveTo(43, 6.4, 79, 0);
  ctx.closePath();
  const steel = ctx.createLinearGradient(0, -7, 0, 7);
  steel.addColorStop(0, "#fffaf0");
  steel.addColorStop(0.28, "#d7d9d2");
  steel.addColorStop(0.5, "#899ba2");
  steel.addColorStop(0.72, "#4e6069");
  steel.addColorStop(1, "#b8bcb8");
  ctx.fillStyle = steel;
  ctx.fill();
  ctx.strokeStyle = "rgba(14, 18, 22, 0.6)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(255, 255, 246, 0.72)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(10, -3.5);
  ctx.quadraticCurveTo(48, -4.6, 75.5, -0.3);
  ctx.stroke();

  ctx.strokeStyle = "rgba(248, 252, 255, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(9, -1.4);
  ctx.quadraticCurveTo(43, 0.1, 76, 0);
  ctx.stroke();

  if (tier >= 1) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.62 * pulse;
    ctx.strokeStyle = glow;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, -4.7);
    ctx.quadraticCurveTo(48, -5.1, 77, -0.5);
    ctx.stroke();
    ctx.restore();
  }

  const guard = ctx.createLinearGradient(-17, -12, -10, 12);
  guard.addColorStop(0, "#ffe7a7");
  guard.addColorStop(0.42, "#d5a44f");
  guard.addColorStop(0.72, "#8d5b28");
  guard.addColorStop(1, "#f6cf7e");
  ctx.fillStyle = guard;
  ctx.beginPath();
  ctx.ellipse(-14, 0, 4.4, 12.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(33, 21, 12, 0.65)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.fillStyle = "#201b19";
  ctx.beginPath();
  ctx.moveTo(-17, -4.3);
  ctx.lineTo(-48, -3.4);
  ctx.lineTo(-55, 0);
  ctx.lineTo(-48, 3.4);
  ctx.lineTo(-17, 4.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(233, 183, 99, 0.35)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    const x = -21 - i * 6.4;
    ctx.strokeStyle = i % 2 ? "rgba(233, 183, 99, 0.55)" : "rgba(239, 224, 192, 0.3)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, -4.1);
    ctx.lineTo(x - 3.2, 4.1);
    ctx.stroke();
  }

  ctx.fillStyle = "#d2a252";
  ctx.beginPath();
  ctx.arc(-55.5, 0, 3.4, 0, Math.PI * 2);
  ctx.fill();

  if (tier >= 1) {
    ctx.strokeStyle = glow;
    ctx.globalAlpha = 0.45 * pulse;
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 5; i += 1) {
      const x = -59 - i * 7.2;
      const y = Math.sin(state.time * 5 + i * 1.8) * 3.2;
      ctx.beginPath();
      ctx.arc(x, y, 4 - i * 0.22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/* ── Input ───────────────────────────────────────────────── */

function pointFromEvent(event) {
  return {
    x: clamp(event.clientX, 0, width),
    y: clamp(event.clientY, 0, height)
  };
}

function isInteractiveTarget(event) {
  return event.target instanceof Element && Boolean(event.target.closest("button, a, input, .screen, .modal"));
}

function addTrailPoint(x, y) {
  const now = state.time;
  const last = state.trail[state.trail.length - 1];
  if (last) {
    const distance = Math.hypot(x - last.x, y - last.y);
    if (distance < 2.2) return;
    if (distance > 34) {
      const steps = Math.min(8, Math.floor(distance / 18));
      for (let i = 1; i < steps; i += 1) {
        const t = i / steps;
        state.trail.push({
          x: lerp(last.x, x, t),
          y: lerp(last.y, y, t),
          time: now
        });
      }
    }
  }
  state.trail.push({ x, y, time: now });
  if (state.trail.length > 32) state.trail.shift();
}

function onPointerMove(event) {
  if (isInteractiveTarget(event)) return;
  const point = pointFromEvent(event);
  const pointer = state.pointer;
  pointer.active = true;
  pointer.prevX = pointer.x;
  pointer.prevY = pointer.y;

  const dx = point.x - pointer.x;
  const dy = point.y - pointer.y;
  const distance = Math.hypot(dx, dy);

  if (distance > 1.1) {
    pointer.targetAngle = Math.atan2(dy, dx);
    pointer.lastMove = state.time;
  }

  pointer.x = point.x;
  pointer.y = point.y;

  if (state.mode === "playing") {
    if (distance > 0.8) {
      trySlice(pointer.prevX, pointer.prevY, point.x, point.y);
      addTrailPoint(point.x, point.y);
    }
  }
}

function onPointerDown(event) {
  audio.init();
  audio.resume();
  if (isInteractiveTarget(event)) return;
  const point = pointFromEvent(event);
  const pointer = state.pointer;
  pointer.active = true;
  pointer.down = true;
  pointer.x = point.x;
  pointer.y = point.y;
  pointer.prevX = point.x;
  pointer.prevY = point.y;
  pointer.lastMove = state.time;

  if (state.mode === "playing") {
    tapSlice(point.x, point.y);
    addTrailPoint(point.x, point.y);
  }
}

function onPointerUp() {
  state.pointer.down = false;
}

function onPointerLeave() {
  if (state.pointer.down) return;
  state.pointer.active = false;
}

/* ── UI wiring ───────────────────────────────────────────── */
function toggleMute() {
  audio.init();
  audio.setMuted(!audio.isMuted);
  document.body.classList.toggle("is-muted", audio.isMuted);
  dom.soundBtn.setAttribute("aria-label", audio.isMuted ? "Unmute sound" : "Mute sound");
  dom.soundBtn.title = audio.isMuted ? "Unmute (M)" : "Mute (M)";
  if (!audio.isMuted) audio.click();
}

dom.playBtn.addEventListener("click", startGame);
dom.againBtn.addEventListener("click", startGame);
dom.resumeBtn.addEventListener("click", resumeGame);
dom.pauseBtn.addEventListener("click", pauseGame);
dom.quitBtn.addEventListener("click", endRun);
dom.homeBtn.addEventListener("click", goToMenu);
dom.soundBtn.addEventListener("click", toggleMute);

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  if (event.key.toLowerCase() === "m") {
    toggleMute();
    return;
  }

  if (event.key === "Escape" || event.key.toLowerCase() === "p") {
    if (state.mode === "playing") pauseGame();
    else if (state.mode === "paused") resumeGame();
    return;
  }

  if ((event.key === "Enter" || event.key === " ") && state.mode === "menu") {
    const active = document.activeElement;
    if (active && active.tagName === "BUTTON") return;
    event.preventDefault();
    startGame();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.mode === "playing") pauseGame();
});

window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointerup", onPointerUp, { passive: true });
window.addEventListener("pointercancel", onPointerUp, { passive: true });
window.addEventListener("pointerleave", onPointerLeave, { passive: true });
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 220));

/* ── Boot ────────────────────────────────────────────────── */

document.body.classList.toggle("is-muted", audio.isMuted);
dom.soundBtn.setAttribute("aria-label", audio.isMuted ? "Unmute sound" : "Mute sound");
dom.soundBtn.title = audio.isMuted ? "Unmute (M)" : "Mute (M)";

resize();
updateMenuRecords();
syncFocus();
applyMode("menu");
updateHud(true);

requestAnimationFrame(function frame(now) {
  const realDt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;
  const dt = state.frozen ? 0 : realDt;
  if (!state.frozen) state.time = now / 1000;
  update(dt);
  render();
  requestAnimationFrame(frame);
});

/* Debug surface used by the visual test harness. */
const debugApi = {
  get mode() {
    return state.mode;
  },
  snapshot() {
    return {
      mode: state.mode,
      score: state.score,
      chain: state.chain,
      lives: state.lives,
      cuts: state.cuts,
      maxChain: state.maxChain,
      fruits: state.fruits.map((fruit) => ({
        type: fruit.type,
        x: Math.round(fruit.x),
        y: Math.round(fruit.y),
        radius: Math.round(fruit.radius)
      })),
      particles: state.particles.length
    };
  },
  spawn(type, x, y) {
    if (!FRUIT_TYPES[type]) return false;
    const radius = clamp(Math.min(width, height) * 0.058, 37, 64);
    state.fruits.push(makeFruit(type, x, y, radius, 0, -40, Math.random() * 1e9));
    return true;
  },
  spawnBomb(x, y) {
    const radius = clamp(Math.min(width, height) * 0.058, 37, 64) * 1.06;
    state.fruits.push({
      type: "bomb",
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      rot: 0,
      rotSpeed: 0,
      seed: 2,
      age: 0
    });
  },
  cutAt(x, y) {
    tapSlice(x, y);
  },
  chain(amount = 5) {
    state.chain = amount;
    state.chainTimer = CHAIN_WINDOW;
    state.maxChain = Math.max(state.maxChain, amount);
    setChainTier(tierFor(amount));
    updateHud(0, true);
  },
  start() {
    startGame();
  },
  calm() {
    state.spawnClock = 9999;
    state.fruits = state.fruits.filter((fruit) => fruit.type === "bomb");
  },
  lives(value = MAX_FOCUS) {
    state.lives = clamp(value, 0, MAX_FOCUS);
    syncFocus();
  },
  pauseGame,
  resumeGame,
  freeze() {
    state.freezeTime = state.time;
    state.frozen = true;
  },
  unfreeze() {
    state.frozen = false;
    lastTime = performance.now();
  },
  finish() {
    finishGame("test");
  }
};

Object.defineProperty(window, "__bladeChain", {
  value: debugApi,
  configurable: false
});
