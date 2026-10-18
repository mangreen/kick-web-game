# ADR-0002: Obstacle penalties, anime urban scene, and ball kicks

- Date: 2026-10-19
- Status: Accepted for Phase 1; extended in Phase 2
- Updates: [ADR-0001](./ADR-0001-threejs-custom-physics.md)

## Context
Phase 0 blocks the player at obstacles without a fall animation or economic consequence. Its rural low-poly art direction is notably different from the reference game's anime 2.5D street-adventure presentation.

## Context & Evolution
Phase 2 extends the same browser-only design without adding a physics engine. It separates ball impulse strength from collision handling so weak ball contact cannot destroy world obstacles.

## Decision
- A non-sliding, non-jumping obstacle collision starts a timed fall state. Movement inputs are ignored until recovery.
- Each collision removes up to three coins from the current balance; the result cannot become negative. The collision happens once on entry, not every frame during a fall.
- Keep fall timing and coin deduction as pure Domain rules and retain obstacle-position detection in the game adapter.
- Replace the pastoral setting with an original, procedural anime-inspired urban street: tiled sidewalk, roadway and crosswalk, storefronts, signs, overhead cables, street trees and a school destination. Continue generating all assets in Three.js.
- A grounded player touching a slow-moving ball automatically applies a light kick in the facing direction. The player kick cooldown prevents frame-by-frame repeated impulses.
- SPACE applies a distinct power kick when the ball is reachable; the player kick cooldown does not block a deliberate power shot.
- Light kicks stop the ball at an obstacle without damage. A power-kicked ball destroys the first obstacle it sweeps into, retains forward motion, and consumes its power-impact state.
- Keep impulse calculation, touch detection, swept obstacle-crossing detection, and impact result calculation in the pure Domain layer. `Game` applies those outcomes to grouped Three.js barrier meshes and restores all barriers on restart.

## Trade-off Analysis

**Pros**
- The penalty, kick impulse and impact results are deterministic and unit-testable.
- Swept collision checks account for fast ball motion without adding a physics package.
- A bounded three-coin penalty is easy to communicate and avoids making one mistake erase all progress.
- Consuming the power-shot state on the first destroyed obstacle creates readable feedback and prevents a single shot from clearing every barrier.
- Procedural geometry keeps the web app self-contained and avoids asset licensing or network dependencies.
- An urban 2.5D composition better reflects the reference's visual language and obstacle-based gameplay.

**Cons**
- A fixed penalty is less nuanced than a full damage or knockback system.
- Simplified one-dimensional obstacle collision does not simulate detailed rigid-body contact or debris physics.
- Primitive-based anime art cannot match hand-drawn animation or a fully rigged model.
- More scene meshes can increase draw calls; visual detail should be balanced against browser performance.

**Reason**
This is a focused MVP improvement that preserves the requested Three.js + TypeScript stack, separates kick strength from render code, makes obstacle results testable, and avoids adding an external physics engine or asset pipeline.

## Consequences
- Extend the Domain test suite for automatic contact, impulse differences, swept ball collisions, and non-destructive versus destructive obstacle impacts.
- Add `fallRemaining` to the pure player state and test collision-recovery and coin-penalty rules.
- Treat the HUD coin count as the current balance, not lifetime coins collected.
- Update the scene art direction and maintenance docs in this phase.
