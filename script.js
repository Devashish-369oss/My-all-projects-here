console.log("game script loaded");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W = 0,
  H = 0;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const ui = {
  startScreen: document.getElementById("startScreen"),
  howScreen: document.getElementById("howScreen"),
  gameOver: document.getElementById("gameOver"),
  scoreEl: document.getElementById("score"),
  timeEl: document.getElementById("time"),
  finalScore: document.getElementById("finalScore"),
  finalTime: document.getElementById("finalTime"),
  startBtn: document.getElementById("startBtn"),
  howBtn: document.getElementById("howBtn"),
  backBtn: document.getElementById("backBtn"),
  playBtn: document.getElementById("playBtn"),
  retryBtn: document.getElementById("retryBtn"),
  menuBtn: document.getElementById("menuBtn"),
  leftBtn: document.getElementById("leftBtn"),
  rightBtn: document.getElementById("rightBtn"),
};

let running = false;
let lastTime = 0;
let spawnTimer = 0;
let spawnInterval = 900; // ms
let difficultyTimer = 0;
let obstacles = [];
let particles = [];
let score = 0;
let startTime = 0;

const player = {
  w: 64,
  h: 18,
  x: 0,
  y: 0,
  speed: 420,
  vx: 0,
};

function resetState() {
  obstacles = [];
  particles = [];
  score = 0;
  spawnInterval = 900;
  difficultyTimer = 0;
  player.w = Math.max(40, Math.min(80, Math.floor(W * 0.08)));
  player.h = Math.max(14, Math.floor(player.w * 0.28));
  player.x = W / 2 - player.w / 2;
  player.y = H - player.h - 70;
}

function spawnObstacle() {
  const w = 20 + Math.random() * 60;
  const x = Math.random() * (W - w);
  const speed =
    120 + Math.random() * 220 + Math.min(1.2, difficultyTimer / 15000) * 200;
  obstacles.push({
    x,
    y: -w,
    w,
    h: w * 0.6,
    speed,
    color: `hsl(${Math.floor(Math.random() * 50) + 10},70%,60%)`,
  });
}

function addParticles(x, y, color, count = 20) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 1.5) * 6,
      life: 60 + Math.random() * 40,
      color,
    });
  }
}

function checkCollision(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function gameOver() {
  running = false;
  ui.finalScore.textContent = Math.floor(score);
  const elapsed = (performance.now() - startTime) / 1000;
  ui.finalTime.textContent = elapsed.toFixed(2);
  ui.gameOver.classList.remove("hidden");
  addParticles(player.x + player.w / 2, player.y + player.h / 2, "white", 40);
}

function update(dt) {
  if (!running) return;
  // move player
  player.x += player.vx * dt;
  if (player.x < 8) player.x = 8;
  if (player.x + player.w > W - 8) player.x = W - player.w - 8;

  // spawn logic
  spawnTimer += dt * 1000;
  difficultyTimer += dt * 1000;
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
  }
  // increase difficulty gradually
  if (difficultyTimer > 4000 && spawnInterval > 260) {
    spawnInterval *= 0.985;
  }

  // update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.speed * dt;
    if (o.y > H + 200) {
      obstacles.splice(i, 1);
      score += 12; // dodged
      continue;
    }
    // collision with player
    const pbox = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (checkCollision(pbox, o)) {
      addParticles(
        player.x + player.w / 2,
        player.y + player.h / 2,
        o.color,
        40
      );
      gameOver();
      return;
    }
  }

  // update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const P = particles[i];
    P.x += P.vx;
    P.y += P.vy;
    P.vy += 0.18;
    P.life -= 1;
    if (P.life <= 0) particles.splice(i, 1);
  }

  // score increases with time
  score += dt * 8;
  ui.scoreEl.textContent = Math.floor(score);
  ui.timeEl.textContent = ((performance.now() - startTime) / 1000).toFixed(2);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // subtle horizon
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, "rgba(255,255,255,0.02)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // draw player
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  const px = player.x,
    py = player.y,
    pw = player.w,
    ph = player.h;
  ctx.fillRect(px, py, pw, ph);

  // draw obstacles
  for (const o of obstacles) {
    ctx.fillStyle = o.color;
    ctx.beginPath();
    ctx.ellipse(
      o.x + o.w / 2,
      o.y + o.h / 2,
      o.w / 2,
      o.h / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // draw particles
  for (const P of particles) {
    ctx.fillStyle = P.color;
    ctx.globalAlpha = Math.max(0, P.life / 80);
    ctx.fillRect(P.x, P.y, 3, 3);
    ctx.globalAlpha = 1;
  }
}

function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min(0.05, (ts - lastTime) / 1000);
  lastTime = ts;
  update(dt);
  draw();
  if (running) requestAnimationFrame(loop);
}

// controls
const keys = { left: false, right: false };
function updatePlayerVelocity() {
  if (keys.left && !keys.right) player.vx = -player.speed;
  else if (keys.right && !keys.left) player.vx = player.speed;
  else player.vx = 0;
}
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D")
    keys.right = true;
  updatePlayerVelocity();
});
window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A")
    keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D")
    keys.right = false;
  updatePlayerVelocity();
});

// mobile button controls
let leftDown = false,
  rightDown = false;
ui.leftBtn.addEventListener("pointerdown", () => {
  keys.left = true;
  updatePlayerVelocity();
});
ui.leftBtn.addEventListener("pointerup", () => {
  keys.left = false;
  updatePlayerVelocity();
});
ui.rightBtn.addEventListener("pointerdown", () => {
  keys.right = true;
  updatePlayerVelocity();
});
ui.rightBtn.addEventListener("pointerup", () => {
  keys.right = false;
  updatePlayerVelocity();
});

// UI hookups
ui.startBtn.addEventListener("click", () => {
  ui.startScreen.classList.add("hidden");
  startGame();
});
ui.howBtn.addEventListener("click", () => {
  ui.startScreen.classList.add("hidden");
  ui.howScreen.classList.remove("hidden");
});
ui.backBtn.addEventListener("click", () => {
  ui.howScreen.classList.add("hidden");
  ui.startScreen.classList.remove("hidden");
});
ui.playBtn.addEventListener("click", () => {
  ui.howScreen.classList.add("hidden");
  startGame();
});
ui.retryBtn.addEventListener("click", () => {
  ui.gameOver.classList.add("hidden");
  startGame();
});
ui.menuBtn.addEventListener("click", () => {
  ui.gameOver.classList.add("hidden");
  ui.startScreen.classList.remove("hidden");
});

function startGame() {
  resetState();
  running = true;
  lastTime = 0;
  spawnTimer = 0;
  startTime = performance.now();
  ui.scoreEl.textContent = "0";
  ui.timeEl.textContent = "0.00";
  requestAnimationFrame(loop);
}

// init
resetState();
// nice warm intro animation - small drop of obstacles
for (let i = 0; i < 6; i++) spawnObstacle();
