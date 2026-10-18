# Project Instructions — Kick Street

## Scope
Build an original, browser-only 3D soccer adventure using Three.js and TypeScript. Keep the MVP simple; do not add a backend, database, authentication, analytics SDK, API keys, or external 3D asset dependencies without an explicit requirement.

## Architecture
- `src/domain/`: pure deterministic game rules and state types; no Three.js or DOM imports.
- `src/game/`: input adapters, frame loop, collision integration, scene rendering.
- `src/main.ts`: browser DOM composition and initialization error handling.
- `tests/`: AAA-pattern unit tests named `should_[behavior]_when_[condition]`.
- Update Mermaid architecture docs when domain boundaries or state contracts change.

## Required loop
1. Draw/update the impact graph before changing domain contracts.
2. Write or update a failing unit test first.
3. Implement the minimum passing behavior, then refactor.
4. Run `npm test`, `npm run lint`, and `npm run build`; run coverage for domain changes.
5. Update README, todo, and CHANGELOG when behavior changes.
6. Use Conventional Commit messages for each complete testable unit.

## Trade-offs
For meaningful technical choices, document Pros, Cons, and Reason in the PR or ADR. Prefer a small, deterministic custom physics model over a large physics engine until the gameplay requires full rigid-body simulation.

## Safety and quality
- Never hard-code credentials. This project currently has no secrets or server endpoints.
- Do not hide failing tests by weakening assertions.
- Do not claim a command passed unless it actually ran successfully.
- Maintain keyboard access, responsive layout, and a graceful WebGL initialization error.
