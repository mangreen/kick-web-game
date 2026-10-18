# MEM: MVP Architecture — Kick Street

Date: 2026-10-19
Status: Approved for Phase 0 review
Tags: [threejs, typescript, web-game, architecture]

## Summary
A browser-only Three.js game with pure TypeScript domain rules and procedural 3D visuals.

## Details
### Context & Evolution
The request requires a pure web game with left/right movement, up to jump, down to slide, and Space to kick the ball. The reference video provides inspiration for a cozy side-scrolling soccer adventure; all current meshes and gameplay implementation are original.

### Specification
- Rendering: Three.js + WebGL.
- Build/dev server: Vite.
- Language: TypeScript strict mode.
- Domain rules: `src/domain/gameRules.ts` and `src/domain/types.ts`.
- Render/input integration: `src/game/Game.ts` and `src/game/SceneFactory.ts`.
- Testing: Vitest; domain coverage threshold configured at 80%.
- No backend, database, secrets, or external gameplay APIs.

### Links
- Architecture: [`../docs/architecture/overview.md`](../docs/architecture/overview.md)
- Decision record: [`../docs/adr/ADR-0001-threejs-custom-physics.md`](../docs/adr/ADR-0001-threejs-custom-physics.md)
- Backlog: [`../todo.md`](../todo.md)

## When to Use
Use this decision for MVP game changes. Revisit if requirements add real multiplayer, online persistence, full rigid-body physics, or downloaded 3D assets.
