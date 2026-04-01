import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./hooks/useActor";

// ─── Types ───────────────────────────────────────────────────────────────────
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
interface Point {
  x: number;
  y: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_SIZE = 20;
const TICK_MS = 150;

const SNAKE_GREEN = "#22c55e";
const SNAKE_GREEN_DARK = "#16a34a";
const SNAKE_HEAD = "#4ade80";
const FOOD_RED = "#ef4444";
const FOOD_GLOW = "#ef444488";
const BOARD_BG = "#0a0a0a";
const GRID_LINE = "#181818";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function createInitialSnake(): Point[] {
  const mid = Math.floor(GRID_SIZE / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

function randomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (occupied.has(`${pos.x},${pos.y}`));
  return pos;
}

function oppositeDir(a: Direction, b: Direction): boolean {
  return (
    (a === "UP" && b === "DOWN") ||
    (a === "DOWN" && b === "UP") ||
    (a === "LEFT" && b === "RIGHT") ||
    (a === "RIGHT" && b === "LEFT")
  );
}

// ─── Drawing ─────────────────────────────────────────────────────────────────
function drawGame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  snake: Point[],
  food: Point,
  gameOver: boolean,
  score: number,
  highScore: number,
) {
  const cw = canvas.width;
  const ch = canvas.height;
  const cell = cw / GRID_SIZE;

  // Background
  ctx.fillStyle = BOARD_BG;
  ctx.fillRect(0, 0, cw, ch);

  // Grid lines
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, ch);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell);
    ctx.lineTo(cw, i * cell);
    ctx.stroke();
  }

  // Food – glowing circle
  const fx = food.x * cell + cell / 2;
  const fy = food.y * cell + cell / 2;
  const fr = cell * 0.38;

  // Glow
  const foodGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr * 2.2);
  foodGlow.addColorStop(0, FOOD_GLOW);
  foodGlow.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(fx, fy, fr * 2.2, 0, Math.PI * 2);
  ctx.fillStyle = foodGlow;
  ctx.fill();

  // Food body
  ctx.beginPath();
  ctx.arc(fx, fy, fr, 0, Math.PI * 2);
  ctx.fillStyle = FOOD_RED;
  ctx.fill();

  // Snake
  snake.forEach((seg, idx) => {
    const isHead = idx === 0;
    const x = seg.x * cell;
    const y = seg.y * cell;
    const pad = cell * 0.06;
    const r = cell * 0.18;

    // Neon glow on head
    if (isHead) {
      ctx.shadowColor = SNAKE_GREEN;
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowBlur = 0;
    }

    // Segment fill
    ctx.fillStyle = isHead ? SNAKE_HEAD : SNAKE_GREEN;
    roundRect(ctx, x + pad, y + pad, cell - pad * 2, cell - pad * 2, r);
    ctx.fill();

    // Segment border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = SNAKE_GREEN_DARK;
    ctx.lineWidth = 1;
    roundRect(ctx, x + pad, y + pad, cell - pad * 2, cell - pad * 2, r);
    ctx.stroke();
  });

  ctx.shadowBlur = 0;

  // Game Over overlay
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.fillRect(0, 0, cw, ch);

    const centerX = cw / 2;

    // GAME OVER title
    ctx.fillStyle = FOOD_RED;
    ctx.font = `bold ${Math.floor(cell * 1.6)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = FOOD_RED;
    ctx.shadowBlur = 18;
    ctx.fillText("GAME OVER", centerX, ch * 0.36);

    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = "#e5e7eb";
    ctx.font = `${Math.floor(cell * 0.9)}px "JetBrains Mono", monospace`;
    ctx.fillText(`Score: ${score}`, centerX, ch * 0.52);

    if (highScore > 0) {
      ctx.fillStyle = SNAKE_GREEN;
      ctx.fillText(`Best: ${highScore}`, centerX, ch * 0.62);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game state in refs (for use inside interval)
  const snakeRef = useRef<Point[]>(createInitialSnake());
  const foodRef = useRef<Point>(randomFood(snakeRef.current));
  const dirRef = useRef<Direction>("RIGHT");
  const nextDirRef = useRef<Direction>("RIGHT");
  const scoreRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameActiveRef = useRef(false);

  // React state for UI updates
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [canvasSize, setCanvasSize] = useState(360);
  const [started, setStarted] = useState(false);

  // Actor for backend calls
  const { actor } = useActor();

  // Fetch high score when actor is ready
  useEffect(() => {
    if (!actor) return;
    actor
      .getHighScore()
      .then((hs) => setHighScore(Number(hs)))
      .catch(() => {});
  }, [actor]);

  // Responsive canvas sizing
  useEffect(() => {
    function updateSize() {
      const vw = window.innerWidth;
      const size = Math.min(vw - 32, 400);
      setCanvasSize(size);
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Redraw canvas whenever sizes change
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawGame(
      ctx,
      canvas,
      snakeRef.current,
      foodRef.current,
      gameOver,
      scoreRef.current,
      highScore,
    );
  }, [gameOver, highScore]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Stop the game loop
  const stopLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    gameActiveRef.current = false;
  }, []);

  // Actor ref so we can use it inside callbacks without stale closure
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  // Handle game over
  const handleGameOver = useCallback(
    async (finalScore: number) => {
      stopLoop();
      setGameOver(true);

      // Redraw with overlay
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawGame(
            ctx,
            canvas,
            snakeRef.current,
            foodRef.current,
            true,
            finalScore,
            highScore,
          );
        }
      }

      try {
        const currentActor = actorRef.current;
        if (currentActor) {
          await currentActor.submitScore(BigInt(finalScore));
          const hs = await currentActor.getHighScore();
          setHighScore(Number(hs));
        }
      } catch {
        // silent
      }
    },
    [stopLoop, highScore],
  );

  // Game tick
  const tick = useCallback(() => {
    if (!gameActiveRef.current) return;

    const snake = snakeRef.current;
    const food = foodRef.current;
    const dir = nextDirRef.current;
    dirRef.current = dir;

    const head = snake[0];
    let nx = head.x;
    let ny = head.y;

    if (dir === "UP") ny -= 1;
    else if (dir === "DOWN") ny += 1;
    else if (dir === "LEFT") nx -= 1;
    else if (dir === "RIGHT") nx += 1;

    // Wall collision
    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) {
      handleGameOver(scoreRef.current);
      return;
    }

    // Self collision
    if (snake.some((s) => s.x === nx && s.y === ny)) {
      handleGameOver(scoreRef.current);
      return;
    }

    const newHead: Point = { x: nx, y: ny };
    const ate = nx === food.x && ny === food.y;

    let newSnake: Point[];
    if (ate) {
      newSnake = [newHead, ...snake]; // grow
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      foodRef.current = randomFood(newSnake);
    } else {
      newSnake = [newHead, ...snake.slice(0, -1)];
    }

    snakeRef.current = newSnake;

    // Draw
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawGame(
          ctx,
          canvas,
          newSnake,
          foodRef.current,
          false,
          scoreRef.current,
          highScore,
        );
      }
    }
  }, [handleGameOver, highScore]);

  // Start / restart
  const startGame = useCallback(() => {
    stopLoop();

    const initSnake = createInitialSnake();
    snakeRef.current = initSnake;
    foodRef.current = randomFood(initSnake);
    dirRef.current = "RIGHT";
    nextDirRef.current = "RIGHT";
    scoreRef.current = 0;

    setScore(0);
    setGameOver(false);
    setStarted(true);
    gameActiveRef.current = true;

    // Draw initial frame
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawGame(ctx, canvas, initSnake, foodRef.current, false, 0, highScore);
      }
    }

    intervalRef.current = setInterval(tick, TICK_MS);
  }, [stopLoop, tick, highScore]);

  // Restart refs the tick, so we need tick to be stable; bind after mount
  // Re-create interval when tick changes (e.g. highScore updated)
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // Keyboard controls
  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: "UP",
      ArrowDown: "DOWN",
      ArrowLeft: "LEFT",
      ArrowRight: "RIGHT",
      w: "UP",
      s: "DOWN",
      a: "LEFT",
      d: "RIGHT",
      W: "UP",
      S: "DOWN",
      A: "LEFT",
      D: "RIGHT",
    };

    function onKeyDown(e: KeyboardEvent) {
      const newDir = keyMap[e.key];
      if (!newDir) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      if (!gameActiveRef.current) return;
      if (!oppositeDir(dirRef.current, newDir)) {
        nextDirRef.current = newDir;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopLoop();
  }, [stopLoop]);

  // On-screen direction button handler
  const pressDir = useCallback((dir: Direction) => {
    if (!gameActiveRef.current) return;
    if (!oppositeDir(dirRef.current, dir)) {
      nextDirRef.current = dir;
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-6 select-none">
      {/* Header */}
      <header className="mb-4 text-center">
        <h1 className="font-mono text-2xl font-bold tracking-widest text-primary uppercase">
          Snake
        </h1>
        <p className="text-muted-foreground text-xs font-mono tracking-wider mt-1">
          Classic Arcade
        </p>
      </header>

      {/* Score Panel */}
      <div
        data-ocid="game.score_panel"
        className="flex gap-6 mb-4 font-mono text-sm"
        style={{ width: canvasSize }}
      >
        <div className="flex-1 bg-card border border-border rounded-md px-3 py-2 text-center">
          <div className="text-muted-foreground text-xs tracking-widest uppercase mb-1">
            Score
          </div>
          <div className="text-primary text-xl font-bold tabular-nums">
            {score}
          </div>
        </div>
        <div className="flex-1 bg-card border border-border rounded-md px-3 py-2 text-center">
          <div className="text-muted-foreground text-xs tracking-widest uppercase mb-1">
            Best
          </div>
          <div
            className="text-xl font-bold tabular-nums"
            style={{ color: highScore > 0 ? "#f59e0b" : "#4b5563" }}
          >
            {highScore}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative"
        style={{ width: canvasSize, height: canvasSize }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          data-ocid="game.canvas_target"
          className="block rounded-lg"
          style={{
            border: "1px solid #222",
            boxShadow: "0 0 32px #22c55e18, 0 0 2px #22c55e44",
          }}
        />

        {/* Start screen overlay */}
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/70">
            <p className="font-mono text-primary text-lg font-bold tracking-widest mb-2">
              PRESS START
            </p>
            <p className="font-mono text-muted-foreground text-xs mb-6 tracking-wide">
              Arrow keys or on-screen buttons
            </p>
            <NeonButton data-ocid="game.restart_button" onClick={startGame}>
              Start Game
            </NeonButton>
          </div>
        )}

        {/* Game Over restart button */}
        {gameOver && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <NeonButton data-ocid="game.restart_button" onClick={startGame}>
              Play Again
            </NeonButton>
          </div>
        )}
      </div>

      {/* D-Pad Controls */}
      <div className="mt-6 flex flex-col items-center gap-1">
        {/* Up row */}
        <div className="flex justify-center">
          <DPadButton
            label="▲"
            ocid="game.up_button"
            onPress={() => pressDir("UP")}
          />
        </div>
        {/* Middle row */}
        <div className="flex gap-1">
          <DPadButton
            label="◄"
            ocid="game.left_button"
            onPress={() => pressDir("LEFT")}
          />
          {/* Center spacer */}
          <div className="w-16 h-16 rounded-md bg-card border border-border flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-muted" />
          </div>
          <DPadButton
            label="►"
            ocid="game.right_button"
            onPress={() => pressDir("RIGHT")}
          />
        </div>
        {/* Down row */}
        <div className="flex justify-center">
          <DPadButton
            label="▼"
            ocid="game.down_button"
            onPress={() => pressDir("DOWN")}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center font-mono text-xs text-muted-foreground">
        <p>Developed by Appu</p>
      </footer>
    </div>
  );
}

// ─── D-Pad Button ─────────────────────────────────────────────────────────────
interface DPadButtonProps {
  label: string;
  ocid: string;
  onPress: () => void;
}

function DPadButton({ label, ocid, onPress }: DPadButtonProps) {
  const handlePress = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      onPress();
    },
    [onPress],
  );

  return (
    <button
      type="button"
      data-ocid={ocid}
      onMouseDown={handlePress}
      onTouchStart={handlePress}
      aria-label={ocid.replace("game.", "").replace("_button", "")}
      className="w-16 h-16 rounded-md font-mono text-lg font-bold transition-all duration-75 active:scale-95 select-none"
      style={{
        background: "#111111",
        color: "#22c55e",
        border: "1px solid #222",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        touchAction: "none",
      }}
    >
      {label}
    </button>
  );
}

// ─── NeonButton ───────────────────────────────────────────────────────────────
interface NeonButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  "data-ocid"?: string;
}

function NeonButton({ onClick, children, "data-ocid": ocid }: NeonButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="font-mono text-sm font-bold tracking-widest uppercase px-8 py-3 rounded-md transition-all duration-150"
      style={{
        background: "#22c55e",
        color: "#0a0a0a",
        boxShadow: hovered ? "0 0 32px #22c55eaa" : "0 0 20px #22c55e66",
      }}
    >
      {children}
    </button>
  );
}
