import { describe, expect, it } from 'vitest';
import {
  collectNearbyCoins,
  createInitialBallState,
  createInitialPlayerState,
  hasScored,
  stepBall,
  stepPlayer,
} from '../src/domain/gameRules';
import type { CoinState } from '../src/domain/types';

const idleInput = {
  left: false,
  right: false,
  jumpPressed: false,
  slidePressed: false,
};

describe('player movement rules', () => {
  it('should_move_right_and_face_right_when_right_is_held', () => {
    const next = stepPlayer(createInitialPlayerState(), { ...idleInput, right: true }, 0.05);
    expect(next.x).toBeGreaterThan(0);
    expect(next.facing).toBe(1);
  });

  it('should_jump_when_jump_is_pressed_while_grounded', () => {
    const next = stepPlayer(createInitialPlayerState(), { ...idleInput, jumpPressed: true }, 0.05);
    expect(next.grounded).toBe(false);
    expect(next.vy).toBeGreaterThan(0);
    expect(next.y).toBeGreaterThan(0);
  });

  it('should_not_double_jump_when_already_airborne', () => {
    const airborne = { ...createInitialPlayerState(), y: 2, vy: 1, grounded: false };
    const next = stepPlayer(airborne, { ...idleInput, jumpPressed: true }, 0.02);
    expect(next.vy).toBeLessThan(1);
  });

  it('should_start_a_forward_slide_when_slide_is_pressed_on_ground', () => {
    const next = stepPlayer(createInitialPlayerState(), { ...idleInput, slidePressed: true }, 0.02);
    expect(next.slideRemaining).toBeGreaterThan(0);
    expect(next.vx).toBeGreaterThan(0);
    expect(next.x).toBeGreaterThan(0);
  });

  it('should_land_on_ground_when_falling_below_floor', () => {
    const falling = { ...createInitialPlayerState(), y: 0.01, vy: -6, grounded: false };
    const next = stepPlayer(falling, idleInput, 0.05);
    expect(next.y).toBe(0);
    expect(next.vy).toBe(0);
    expect(next.grounded).toBe(true);
  });

  it('should_keep_position_unchanged_when_delta_time_is_negative', () => {
    const initial = createInitialPlayerState();
    const next = stepPlayer(initial, { ...idleInput, right: true }, -1);
    expect(next.x).toBe(initial.x);
  });

  it('should_move_left_and_face_left_when_left_is_held', () => {
    const next = stepPlayer({ ...createInitialPlayerState(), x: 2 }, { ...idleInput, left: true }, 0.05);
    expect(next.x).toBeLessThan(2);
    expect(next.facing).toBe(-1);
  });

  it('should_not_jump_when_slide_is_active', () => {
    const sliding = { ...createInitialPlayerState(), slideRemaining: 0.3, vx: 7, grounded: true };
    const next = stepPlayer(sliding, { ...idleInput, jumpPressed: true }, 0.02);
    expect(next.y).toBe(0);
    expect(next.grounded).toBe(true);
  });

  it('should_not_move_when_delta_time_is_not_finite', () => {
    const initial = createInitialPlayerState();
    const next = stepPlayer(initial, { ...idleInput, right: true }, Number.NaN);
    expect(next.x).toBe(initial.x);
  });

  it('should_finish_slide_and_return_to_normal_movement_when_slide_timer_expires', () => {
    const sliding = { ...createInitialPlayerState(), x: 2, slideRemaining: 0.01, vx: 5 };
    const next = stepPlayer(sliding, { ...idleInput, right: true }, 0.05);
    expect(next.slideRemaining).toBe(0);
    expect(next.vx).toBeGreaterThan(0);
    expect(next.x).toBeGreaterThan(2);
  });

  it('should_expire_kick_cooldown_when_delta_exceeds_remaining_time', () => {
    const coolingDown = { ...createInitialPlayerState(), kickCooldown: 0.03 };
    const next = stepPlayer(coolingDown, idleInput, 0.05);
    expect(next.kickCooldown).toBe(0);
  });
});

describe('ball physics rules', () => {
  it('should_roll_forward_and_slow_down_when_ball_is_grounded', () => {
    const ball = { ...createInitialBallState(), vx: 8 };
    const next = stepBall(ball, 0.1);
    expect(next.x).toBeGreaterThan(ball.x);
    expect(next.vx).toBeLessThan(ball.vx);
  });

  it('should_settle_after_a_low_speed_bounce_when_ball_touches_ground', () => {
    const lowBounce = { ...createInitialBallState(), y: 0.36, vy: -0.5, grounded: false };
    const next = stepBall(lowBounce, 0.03);
    expect(next.y).toBeGreaterThanOrEqual(0.34);
    expect(next.vy).toBe(0);
    expect(next.grounded).toBe(true);
  });

  it('should_bounce_upward_when_impact_speed_is_high', () => {
    const fastFall = { ...createInitialBallState(), y: 0.36, vy: -4, grounded: false };
    const next = stepBall(fastFall, 0.05);
    expect(next.grounded).toBe(false);
    expect(next.vy).toBeGreaterThan(0);
  });

  it('should_stop_at_playable_boundary_when_ball_rolls_behind_start', () => {
    const rollingBack = { ...createInitialBallState(), x: 0.36, vx: -10 };
    const next = stepBall(rollingBack, 0.05);
    expect(next.x).toBe(0.35);
    expect(next.vx).toBe(0);
  });

  it('should_use_air_drag_when_ball_is_airborne', () => {
    const airborne = { ...createInitialBallState(), y: 1, vy: 3, vx: 8, grounded: false };
    const next = stepBall(airborne, 0.05);
    expect(next.grounded).toBe(false);
    expect(next.vx).toBeLessThan(8);
    expect(next.y).toBeGreaterThan(1);
  });
});

describe('coin and goal rules', () => {
  it('should_collect_nearby_uncollected_coins_exactly_once', () => {
    const coins: CoinState[] = [
      { id: 1, x: 0.2, y: 0.3, collected: false },
      { id: 2, x: 4, y: 0.2, collected: false },
      { id: 3, x: 0, y: 0.1, collected: true },
    ];
    const first = collectNearbyCoins(0, 0, coins, 1);
    expect(first.collectedCount).toBe(1);
    expect(first.coins[0]?.collected).toBe(true);
    expect(first.coins[1]?.collected).toBe(false);
    const second = collectNearbyCoins(0, 0, first.coins, 1);
    expect(second.collectedCount).toBe(0);
  });

  it('should_report_goal_only_when_ball_crosses_goal_line', () => {
    expect(hasScored(9.99, 10)).toBe(false);
    expect(hasScored(10, 10)).toBe(true);
    expect(hasScored(10.1, 10)).toBe(true);
  });

  it('should_use_default_collection_radius_when_radius_is_omitted', () => {
    const coin: CoinState[] = [{ id: 9, x: 1, y: 0.9, collected: false }];
    const result = collectNearbyCoins(0, 0, coin);
    expect(result.collectedCount).toBe(1);
    expect(result.coins[0]?.collected).toBe(true);
  });
});
