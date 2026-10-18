# ADR-0001: Three.js and lightweight custom physics

- Date: 2026-10-19
- Status: Accepted for MVP

## Context
The product request specifies a pure web game built with Three.js and TypeScript. MVP mechanics are left/right movement, jump, slide, and a kickable soccer ball.

## Decision
Use Vite + TypeScript + Three.js for the browser application. Keep player movement, ball integration, coin collection, and goal-line logic in pure TypeScript functions. Generate the initial art from Three.js primitive geometry. Use Vitest for the Domain tests.

## Trade-off Analysis

**Pros**
- Small dependency surface and no backend.
- Pure game rules are deterministic and easy to unit test.
- Full control over the visual style and input feel.
- Primitive geometry removes the need for model assets or asset licensing work.

**Cons**
- Collision behavior and ball physics are intentionally simplified.
- Procedural characters are less expressive than rigged models.
- Browser-level visual testing requires a separate E2E setup.

**Reason**
The four requested controls and a single short level do not justify the additional complexity of a full game engine or rigid-body physics package. This choice is appropriate for an MVP, not necessarily for a physics-heavy sequel.

## Consequences
- Keep `src/domain/` free from Three.js and DOM imports.
- Increase physics fidelity only when gameplay requirements justify it.
- Add browser E2E verification in a follow-up phase.
