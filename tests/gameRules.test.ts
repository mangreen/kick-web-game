import { describe, expect, it } from 'vitest';
import {
  collectNearbyCoins,
  createInitialBallState,
  createInitialPlayerState,
  deductCoins,
  getBallObstacleCollisionDirection,
  getObstacleCollisionDirection,
  hasScored,
  isPlayerTouchingBall,
  kickBall,
  resolveBallObstacleImpact,
  startPlayerFall,
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

describe('obstacle fall and coin penalty rules', () => {
  it('should_start_a_timed_fall_and_stop_horizontal_movement_when_obstacle_collision_occurs', () => {
    const moving = { ...createInitialPlayerState(), x: 4, vx: 7.2, slideRemaining: 0.2 };
    const fallen = startPlayerFall(moving);

    expect(fallen.x).toBe(4);
    expect(fallen.vx).toBe(0);
    expect(fallen.vy).toBe(0);
    expect(fallen.grounded).toBe(true);
    expect(fallen.slideRemaining).toBe(0);
    expect(fallen.fallRemaining).toBeGreaterThan(0);
  });

  it('should_ignore_movement_inputs_until_fall_recovery_finishes', () => {
    const fallen = { ...startPlayerFall(createInitialPlayerState()), fallRemaining: 0.2 };
    const next = stepPlayer(fallen, { ...idleInput, right: true, jumpPressed: true, slidePressed: true }, 0.05);

    expect(next.x).toBe(fallen.x);
    expect(next.y).toBe(0);
    expect(next.vx).toBe(0);
    expect(next.fallRemaining).toBeCloseTo(0.15);
  });

  it('should_deduct_three_coins_when_balance_is_sufficient', () => {
    expect(deductCoins(7)).toBe(4);
  });

  it('should_clamp_coin_balance_to_zero_when_penalty_exceeds_balance', () => {
    expect(deductCoins(2)).toBe(0);
    expect(deductCoins(0)).toBe(0);
  });

  it('should_not_return_a_negative_balance_for_invalid_negative_input', () => {
    expect(deductCoins(-5)).toBe(0);
  });

  it('should_treat_non_finite_coin_values_as_safe_balances', () => {
    expect(deductCoins(Number.NaN)).toBe(0);
    expect(deductCoins(5, Number.NaN)).toBe(5);
  });

  it('should_resume_movement_after_fall_recovery_timer_expires', () => {
    const fallen = { ...startPlayerFall(createInitialPlayerState()), fallRemaining: 0.01 };
    const recoveryFrame = stepPlayer(fallen, { ...idleInput, right: true }, 0.05);
    const nextFrame = stepPlayer(recoveryFrame, { ...idleInput, right: true }, 0.05);

    expect(recoveryFrame.x).toBe(fallen.x);
    expect(recoveryFrame.fallRemaining).toBe(0);
    expect(nextFrame.x).toBeGreaterThan(recoveryFrame.x);
  });

  it('should_detect_an_unsafe_crossing_from_the_left', () => {
    const player = { ...createInitialPlayerState(), x: 7.5 };
    expect(getObstacleCollisionDirection(7.3, player, 8.4)).toBe(1);
  });

  it('should_detect_an_unsafe_crossing_from_the_right', () => {
    const player = { ...createInitialPlayerState(), x: 9.3 };
    expect(getObstacleCollisionDirection(9.6, player, 8.4)).toBe(-1);
  });

  it('should_allow_a_player_to_pass_an_obstacle_when_sliding_or_high_in_the_air', () => {
    const crossing = { ...createInitialPlayerState(), x: 7.5 };
    expect(getObstacleCollisionDirection(7.3, { ...crossing, slideRemaining: 0.3 }, 8.4)).toBeNull();
    expect(getObstacleCollisionDirection(7.3, { ...crossing, y: 1.3 }, 8.4)).toBeNull();
    expect(getObstacleCollisionDirection(7.3, { ...crossing, fallRemaining: 0.3 }, 8.4)).toBeNull();
  });

  it('should_not_report_a_collision_without_crossing_the_obstacle_edge', () => {
    const player = { ...createInitialPlayerState(), x: 7.4 };
    expect(getObstacleCollisionDirection(7.3, player, 8.4)).toBeNull();
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

describe('automatic light kick and power kick rules', () => {
  it('should_light_kick_the_ball_forward_at_a_low_speed', () => {
    const initialBall = createInitialBallState();
    const kicked = kickBall(initialBall, 1, 'light');

    expect(kicked.vx).toBeGreaterThan(0);
    expect(kicked.vx).toBeLessThan(8);
    expect(kicked.vy).toBe(0);
    expect(kicked.grounded).toBe(true);
  });

  it('should_apply_a_stronger_forward_velocity_for_a_power_kick', () => {
    const initialBall = createInitialBallState();
    const lightKick = kickBall(initialBall, 1, 'light');
    const powerKick = kickBall(initialBall, 1, 'power');

    expect(powerKick.vx).toBeGreaterThan(lightKick.vx * 3);
    expect(powerKick.vy).toBeGreaterThan(0);
    expect(powerKick.grounded).toBe(false);
  });

  it('should_respect_the_kickers_facing_direction_for_a_power_kick', () => {
    const kicked = kickBall(createInitialBallState(), -1, 'power');
    expect(kicked.vx).toBeLessThan(0);
  });

  it('should_detect_player_ball_contact_only_when_the_player_is_grounded_and_nearby', () => {
    const player = { ...createInitialPlayerState(), x: 0.5 };
    const ball = createInitialBallState();

    expect(isPlayerTouchingBall(player, ball)).toBe(true);
    expect(isPlayerTouchingBall({ ...player, x: -1 }, ball)).toBe(false);
    expect(isPlayerTouchingBall({ ...player, y: 1, grounded: false }, ball)).toBe(false);
    expect(isPlayerTouchingBall({ ...player, fallRemaining: 0.2 }, ball)).toBe(false);
  });
});

describe('ball and obstacle impact rules', () => {
  it('should_detect_a_ball_sweeping_into_an_obstacle_from_either_direction', () => {
    const lowBall = { ...createInitialBallState(), x: 8.2, y: 0.34 };
    expect(getBallObstacleCollisionDirection(7.2, lowBall, 8.4)).toBe(1);
    expect(getBallObstacleCollisionDirection(9.6, { ...lowBall, x: 8.8 }, 8.4)).toBe(-1);
  });

  it('should_ignore_ball_paths_that_do_not_intersect_an_obstacle_or_are_too_high', () => {
    expect(getBallObstacleCollisionDirection(7, { ...createInitialBallState(), x: 7.2 }, 8.4)).toBeNull();
    expect(getBallObstacleCollisionDirection(7.2, { ...createInitialBallState(), x: 8.2, y: 1.8 }, 8.4)).toBeNull();
  });

  it('should_stop_a_light_kicked_ball_at_the_barrier_without_destroying_it', () => {
    const ball = { ...createInitialBallState(), x: 8.2, vx: 5.5 };
    const impact = resolveBallObstacleImpact(ball, 8.4, 1, 'light');

    expect(impact.obstacleDestroyed).toBe(false);
    expect(impact.ball.x).toBeLessThan(8.4);
    expect(impact.ball.vx).toBe(0);
    expect(impact.ball.vy).toBe(0);
    expect(impact.ball.grounded).toBe(true);
  });

  it('should_allow_a_power_kick_to_destroy_the_barrier_and_continue_forward', () => {
    const ball = { ...createInitialBallState(), x: 8.2, vx: 24, vy: 0.8, grounded: false };
    const impact = resolveBallObstacleImpact(ball, 8.4, 1, 'power');

    expect(impact.obstacleDestroyed).toBe(true);
    expect(impact.ball.vx).toBeGreaterThan(0);
    expect(impact.ball.x).toBe(ball.x);
  });
});
