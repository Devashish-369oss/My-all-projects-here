const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");

const gridSize = 20;
let tileCount;

function resizeCanvas() {
  const maxSize = 400;
  const minSize = 200;
  const size = Math.min(
    maxSize,
    Math.max(
      minSize,
      Math.min(window.innerWidth * 0.8, window.innerHeight * 0.6)
    )
  );
  canvas.width = size;
  canvas.height = size;
  tileCount = Math.floor(canvas.width / gridSize);
}

let snake = [{ x: 10, y: 10 }];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let gameRunning = false;
let gameLoop;

function randomTile() {
  return Math.floor(Math.random() * tileCount);
}

function generateFood() {
  food = {
    x: randomTile(),
    y: randomTile(),
  };
  // Ensure food doesn't spawn on snake
  for (let segment of snake) {
    if (segment.x === food.x && segment.y === food.y) {
      generateFood();
      return;
    }
  }
}

function drawGame() {
  // Clear canvas
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw snake with gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#4ea74e");
  gradient.addColorStop(1, "#088d08");
  ctx.fillStyle = gradient;
  for (let i = 0; i < snake.length; i++) {
    const segment = snake[i];
    const size = gridSize - 2;
    const x = segment.x * gridSize + 1;
    const y = segment.y * gridSize + 1;
    ctx.fillRect(x, y, size, size);
    // Add shadow for head
    if (i === 0) {
      ctx.shadowColor = "#0db90d";
      ctx.shadowBlur = 10;
      ctx.fillRect(x, y, size, size);
      ctx.shadowBlur = 0;
    }
  }

  // Draw food with animation effect
  const time = Date.now() * 0.005;
  const scale = 1 + Math.sin(time) * 0.1;
  const foodSize = (gridSize - 2) * scale;
  const foodX = food.x * gridSize + (gridSize - foodSize) / 2;
  const foodY = food.y * gridSize + (gridSize - foodSize) / 2;
  ctx.fillStyle = "#ff0000";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 15;
  ctx.fillRect(foodX, foodY, foodSize, foodSize);
  ctx.shadowBlur = 0;
}

function moveSnake() {
  if (dx === 0 && dy === 0) return; // Don't move if no direction is set

  const head = { x: snake[0].x + dx, y: snake[0].y + dy };

  // Check wall collision
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    gameOver();
    return;
  }

  // Check self collision
  for (let segment of snake) {
    if (head.x === segment.x && head.y === segment.y) {
      gameOver();
      return;
    }
  }

  snake.unshift(head);

  // Check food collision
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreElement.textContent = score;
    generateFood();
  } else {
    snake.pop();
  }
}

function gameOver() {
  gameRunning = false;
  clearInterval(gameLoop);
  alert(`Game Over! Score: ${score}`);
}

function gameStep() {
  moveSnake();
  drawGame();
}

function startGame() {
  if (!gameRunning) {
    gameRunning = true;
    snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    generateFood();
    gameLoop = setInterval(gameStep, 150); // Move every 150ms for playable speed
  }
}

function resetGame() {
  gameRunning = false;
  clearInterval(gameLoop);
  snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
  dx = 0;
  dy = 0;
  score = 0;
  scoreElement.textContent = score;
  generateFood();
  drawGame();
}

document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  const key = e.key;
  if (key === "ArrowLeft" || key === "a" || key === "A") {
    if (dx === 0) {
      dx = -1;
      dy = 0;
    }
  } else if (key === "ArrowUp" || key === "w" || key === "W") {
    if (dy === 0) {
      dx = 0;
      dy = -1;
    }
  } else if (key === "ArrowRight" || key === "d" || key === "D") {
    if (dx === 0) {
      dx = 1;
      dy = 0;
    }
  } else if (key === "ArrowDown" || key === "s" || key === "S") {
    if (dy === 0) {
      dx = 0;
      dy = 1;
    }
  }
});

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

// Handle window resize
window.addEventListener("resize", () => {
  resizeCanvas();
  if (!gameRunning) {
    generateFood();
    drawGame();
  }
});

// Initial setup
resizeCanvas();
generateFood();
drawGame();
