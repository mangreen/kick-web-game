import type {
  BallState,
  CoinCollectionResult,
  CoinState,
  Direction,
  KickStrength,
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
export const LIGHT_KICK_SPEED = 5.8;
export const POWER_KICK_SPEED = 24.5;
export const POWER_KICK_LIFT = 3.6;
export const PLAYER_BALL_TOUCH_RADIUS = 0.78;
export const BALL_OBSTACLE_COLLISION_RADIUS = 0.93;
export const BALL_OBSTACLE_MAX_HEIGHT = 1.4;
export const FALL_RECOVERY_SECONDS = 0.9;
export const OBSTACLE_COIN_PENALTY = 3;

export function createInitialPlayerState(): PlayerState {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    slideRemaining: 0,
    fallRemaining: 0,
    kickCooldown: 0,
    animationTime: 0,
  };
}

export function createInitialBallState(): BallState {
  return { x: 1.2, y: BALL_RADIUS, vx: 0, vy: 0, grounded: true };
}

export function isPlayerTouchingBall(
  player: PlayerState,
  ball: BallState,
  touchRadius = PLAYER_BALL_TOUCH_RADIUS,
): boolean {
  return player.fallRemaining <= 0
    && player.grounded
    && player.y <= 0.25
    && ball.y <= 0.9
    && Math.abs(player.x - ball.x) <= touchRadius;
}

export function kickBall(ball: BallState, direction: Direction, strength: KickStrength): BallState {
  if (strength === 'light') {
    return {
      ...ball,
      vx: direction * LIGHT_KICK_SPEED,
      vy: 0,
      grounded: true,
      y: BALL_RADIUS,
    };
  }

  return {
    ...ball,
    vx: direction * POWER_KICK_SPEED,
    vy: POWER_KICK_LIFT,
    grounded: false,
  };
}

export function getBallObstacleCollisionDirection(
  previousX: number,
  ball: BallState,
  obstacleX: number,
  collisionRadius = BALL_OBSTACLE_COLLISION_RADIUS,
): Direction | null {
  if (ball.y > BALL_OBSTACLE_MAX_HEIGHT) return null;

  const leftEdge = obstacleX - collisionRadius;
  const rightEdge = obstacleX + collisionRadius;
  if (previousX < leftEdge && ball.x >= leftEdge) return 1;
  if (previousX > rightEdge && ball.x <= rightEdge) return -1;
  return null;
}

export function resolveBallObstacleImpact(
  ball: BallState,
  obstacleX: number,
  collisionDirection: Direction,
  strength: KickStrength,
  collisionRadius = BALL_OBSTACLE_COLLISION_RADIUS,
): { ball: BallState; obstacleDestroyed: boolean; nextKickStrength: KickStrength | null } {
  if (strength === 'power') {
    return {
      ball: { ...ball, vx: ball.vx * 0.88 },
      obstacleDestroyed: true,
      // A power shot keeps its destructive force after breaking a barrier.
      nextKickStrength: 'power',
    };
  }

  return {
    ball: {
      ...ball,
      x: obstacleX - collisionDirection * collisionRadius,
      y: BALL_RADIUS,
      vx: 0,
      vy: 0,
      grounded: true,
    },
    obstacleDestroyed: false,
    nextKickStrength: null,
  };
}

export function stepPlayer(state: PlayerState, input: PlayerInput, deltaSeconds: number): PlayerState {
  const dt = clampDelta(deltaSeconds);
  if (state.fallRemaining > 0) {
    return {
      ...state,
      vx: 0,
      vy: 0,
      grounded: true,
      slideRemaining: 0,
      fallRemaining: Math.max(0, state.fallRemaining - dt),
      kickCooldown: Math.max(0, state.kickCooldown - dt),
      animationTime: state.animationTime + dt,
    };
  }

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
    fallRemaining: 0,
    kickCooldown: Math.max(0, state.kickCooldown - dt),
    animationTime: state.animationTime + dt,
  };
}

export function getObstacleCollisionDirection(
  previousX: number,
  player: PlayerState,
  obstacleX: number,
  collisionRadius = 0.94,
): Direction | null {
  if (player.fallRemaining > 0 || player.slideRemaining > 0 || player.y > 1.18) return null;

  const leftEdge = obstacleX - collisionRadius;
  const rightEdge = obstacleX + collisionRadius;
  if (previousX < leftEdge && player.x >= leftEdge) return 1;
  if (previousX > rightEdge && player.x <= rightEdge) return -1;
  return null;
}

export function startPlayerFall(state: PlayerState): PlayerState {
  return {
    ...state,
    vx: 0,
    vy: 0,
    grounded: true,
    slideRemaining: 0,
    fallRemaining: FALL_RECOVERY_SECONDS,
  };
}

export function deductCoins(balance: number, penalty = OBSTACLE_COIN_PENALTY): number {
  const safeBalance = Number.isFinite(balance) ? Math.max(0, Math.floor(balance)) : 0;
  const safePenalty = Number.isFinite(penalty) ? Math.max(0, Math.floor(penalty)) : 0;
  return Math.max(0, safeBalance - safePenalty);
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
