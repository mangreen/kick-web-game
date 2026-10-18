# Active Sprint Backlog — Phase 0 / MVP

## Design & implementation
- [x] Confirm reference direction and define original visual scope.
- [x] Draw dependency impact graph and separate pure domain rules from render integration.
- [x] Implement TypeScript + Three.js scene with procedural meshes.
- [x] Implement movement, jump, slide, soccer ball, coins, obstacles, goal, HUD, and restart.
- [x] Add keyboard and basic touch input.
- [x] Add domain unit tests before implementing domain rules.
- [x] Add README, Mermaid architecture, ADR, and memory record.
- [x] Add CI workflow for lint, test, coverage, build, dependency audit, and secret scan.

## Validation
- [x] Attempt to install npm dependencies; package registry DNS failed in the execution environment (EAI_AGAIN).
- [x] Review source and configuration for obvious integration issues.
- [x] Type-check the pure Domain module using the installed TypeScript compiler.
- [x] Execute all 19 Domain test cases in a lightweight local assertion harness (19 passed).
- [x] Parse all TypeScript source files and type-check app source with temporary external-library declarations.
- [ ] Run `npm install` in a network-enabled environment.
- [ ] Run `npm test`, `npm run lint`, `npm run coverage`, and `npm run build` after installing dependencies.
- [ ] Verify gameplay manually in Chrome/Edge with WebGL enabled.
- [ ] Add browser E2E tests for start, jump, slide, coin collection, kick, and goal completion.

## Deferred
- [ ] Audio, richer character animation, multiple levels, and gamepad support.
- [ ] Browser E2E / screenshot regression.
