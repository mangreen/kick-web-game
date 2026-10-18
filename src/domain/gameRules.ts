import type {
  BallState,
  CoinCollectionResult,
  CoinState,
  PlayerInput,
  PlayerState,
} from './types';

const PLAYER_SPEED = 7.2;
const JUMP_SPEED = 8.6;
const GRAVITY = 23;
const SLIDE_DURATION = 0.62;
const SLIDE_SPEED = 10.2;
const BALL_RADIUS = 0.34;
const BALL_GRAVITY = 18;

export function createInitialPlayerState(): PlayerState {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    slideRemaining: 0,
    kickCooldown: 0,
    animationTime: 0,
  };
}

export function createInitialBallState(): BallState {
  return { x: 1.2, y: BALL_RADIUS, vx: 0, vy: 0, grounded: true };
}

export function stepPlayer(state: PlayerState, input: PlayerInput, deltaSeconds: number): PlayerState {
  const dt = clampDelta(deltaSeconds);
  let facing = state.facing;
  const direction = Number(input.right) - Number(input.left);

  if (direction !== 0) facing = direction > 0 ? 1 : -1;

  let slideRemaining = Math.max(0, state.slideRemaining - dt);
  const startsSlide = input.slidePressed && state.grounded && state.slideRemaining <= 0;
  if (startsSlide) slideRemaining = SLIDE_DURATION;

  const isSliding = slideRemaining > 0;
  let vx: number;
  if (startsSlide) {
    vx = facing * SLIDE_SPEED;
  } else if (isSliding) {
    vx = state.vx * Math.exp(-1.15 * dt);
  } else {
    vx = direction * PLAYER_SPEED;
  }

  let y = state.y;
  let vy = state.vy;
  let grounded = state.grounded;
  const canJump = input.jumpPressed && grounded && !isSliding;
  if (canJump) {
    vy = JUMP_SPEED;
    grounded = false;
  }

  if (!grounded) {
    vy -= GRAVITY * dt;
    y += vy * dt;
    if (y <= 0) {
      y = 0;
      vy = 0;
      grounded = true;
    }
  } else {
    y = 0;
    vy = 0;
  }

  return {
    x: Math.max(0, state.x + vx * dt),
    y,
    vx,
    vy,
    facing,
    grounded,
    slideRemaining,
    kickCooldown: Math.max(0, state.kickCooldown - dt),
    animationTime: state.animationTime + dt,
  };
}

export function stepBall(state: BallState, deltaSeconds: number): BallState {
  const dt = clampDelta(deltaSeconds);
  let x = state.x + state.vx * dt;
  let y = state.y;
  let vx = state.vx;
  let vy = state.vy;
  let grounded = state.grounded;

  if (!grounded) {
    vy -= BALL_GRAVITY * dt;
    y += vy * dt;
    if (y <= BALL_RADIUS) {
      y = BALL_RADIUS;
      if (Math.abs(vy) > 1.35) {
        vy *= -0.34;
      } else {
        vy = 0;
        grounded = true;
      }
    }
  }

  const friction = grounded ? 2.05 : 0.16;
  vx *= Math.exp(-friction * dt);
  if (Math.abs(vx) < 0.055) vx = 0;

  // A very small backward bound keeps the ball on the playable street.
  if (x < 0.35) {
    x = 0.35;
    vx = Math.max(0, vx);
  }

  return { x, y, vx, vy, grounded };
}

export function collectNearbyCoins(
  playerX: number,
  playerY: number,
  coins: CoinState[],
  radius = 1.12,
): CoinCollectionResult {
  let collectedCount = 0;
  const nextCoins = coins.map((coin) => {
    if (coin.collected) return coin;
    const distance = Math.hypot(coin.x - playerX, coin.y - (playerY + 0.9));
    if (distance > radius) return coin;
    collectedCount += 1;
    return { ...coin, collected: true };
  });
  return { coins: nextCoins, collectedCount };
}

export function hasScored(ballX: number, goalX: number): boolean {
  return ballX >= goalX;
}

function clampDelta(deltaSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return Math.min(deltaSeconds, 0.05);
}
