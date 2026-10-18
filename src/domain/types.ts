export type Direction = -1 | 1;

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Direction;
  grounded: boolean;
  slideRemaining: number;
  kickCooldown: number;
  animationTime: number;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
  slidePressed: boolean;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
}

export interface CoinState {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface CoinCollectionResult {
  coins: CoinState[];
  collectedCount: number;
}
