# Changelog

Notable changes to this project are documented here.

## [0.2.0] - 2026-10-19

### Added
- Obstacle collisions trigger a 0.9-second fall-and-recover animation when the player is not jumping over or sliding under the barrier.
- Obstacle impacts deduct up to three coins from the current balance, clamp the balance at zero, animate lost coins, and display clear feedback.
- Coin HUD now reflects the current wallet balance rather than total coins ever collected.
- Original anime-inspired 2.5D urban scene with tiled sidewalks, crosswalks, storefronts, signs, overhead wires, streetlights, trees, a school goal and high-contrast construction barriers.
- More expressive student silhouette with swept dark hair, uniform, backpack, sneakers, and fall pose.
- Domain regression tests for fall recovery, safe obstacle crossing, and coin penalties.

## [0.1.0] - 2026-10-19

### Added
- Initial Three.js + TypeScript browser-only soccer adventure MVP.
- Keyboard and touch controls for move, jump, slide, and kick.
- Lightweight player/ball physics, coins, obstacles, goal logic, HUD, and restart flow.
- Domain unit tests, coverage threshold, architecture overview, and ADR.
