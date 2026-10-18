# Changelog

Notable changes to this project are documented here.

## [0.3.0] - 2026-10-19

### Added
- Touching a slow-moving ball while grounded automatically applies a forward light kick with a cooldown.
- SPACE now performs a distinct, faster power kick when the ball is within reach.
- Light-kicked balls stop at intact barriers; a power-kicked ball destroys the first barrier it hits and keeps moving.
- Barrier meshes are grouped so they can be hidden on destruction and restored on restart.
- Domain regression tests for kick speeds, player-ball contact, swept ball collision, and light/power impact outcomes.
- Updated HUD hints and control instructions to explain automatic light kicks and SPACE power shots.

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
