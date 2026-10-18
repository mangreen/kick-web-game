# ADR-0002: Obstacle fall penalty and anime-inspired urban scene

- Date: 2026-10-19
- Status: Accepted for Phase 1
- Updates: [ADR-0001](./ADR-0001-threejs-custom-physics.md)

## Context
Phase 0 blocks the player at obstacles without a fall animation or economic consequence. Its rural low-poly art direction is notably different from the reference game's anime 2.5D street-adventure presentation.

## Decision
- A non-sliding, non-jumping obstacle collision starts a timed fall state. Movement inputs are ignored until recovery.
- Each collision removes up to three coins from the current balance; the result cannot become negative. The collision happens once on entry, not every frame during a fall.
- Keep fall timing and coin deduction as pure Domain rules and retain obstacle-position detection in the game adapter.
- Replace the pastoral setting with an original, procedural anime-inspired urban street: tiled sidewalk, roadway and crosswalk, storefronts, signs, overhead cables, street trees and a school destination. Continue generating all assets in Three.js.

## Trade-off Analysis

**Pros**
- The penalty and recovery timing are deterministic and unit-testable.
- A bounded three-coin penalty is easy to communicate and avoids making one mistake erase all progress.
- Procedural geometry keeps the web app self-contained and avoids asset licensing or network dependencies.
- An urban 2.5D composition better reflects the reference's visual language and obstacle-based gameplay.

**Cons**
- A fixed penalty is less nuanced than a full damage or knockback system.
- Primitive-based anime art cannot match hand-drawn animation or a fully rigged model.
- More scene meshes can increase draw calls; visual detail should be balanced against browser performance.

**Reason**
This is a focused MVP improvement that preserves the requested Three.js + TypeScript stack, maintains deterministic gameplay rules, and improves the most visible mismatch without adding an external physics engine or asset pipeline.

## Consequences
- Add `fallRemaining` to the pure player state and test collision-recovery and coin-penalty rules.
- Treat the HUD coin count as the current balance, not lifetime coins collected.
- Update the scene art direction and maintenance docs in this phase.
