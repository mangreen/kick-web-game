# Active Sprint Backlog — Phase 1 / Obstacle Penalty & Art Direction

## Design & implementation
- [x] Review the reference game's publicly described anime 2.5D side-scroller / urban-street direction and retain original assets.
- [x] Update the architecture dependency graph before changing Domain code.
- [x] Add Domain rules and tests for fall recovery, obstacle-crossing direction, safe slide/jump bypass, and clamped coin deductions.
- [x] Trigger player fall animation and lock controls until recovery completes.
- [x] Apply a maximum 3-coin penalty once per obstacle collision; display current balance and lost-coin animation.
- [x] Replace the pastoral scene with procedural city buildings, shopfronts, signage, cables, streetlights, crosswalks, tiles, trees and marked barriers.
- [x] Update README, ADR, MEM, architecture diagram, CHANGELOG and this backlog.
- [x] Use a Conventional Commit and Phase Tag for this testable milestone.

## Validation
- [x] Type-check the dependency-free Domain module with the installed TypeScript compiler.
- [x] Run 30 Domain regression assertions with a temporary Node.js harness (30 passed).
- [x] Parse all TypeScript source/test files with TypeScript `transpileModule` (no syntax diagnostics).
- [x] Type-check application source using a temporary Three.js API declaration stub (no source diagnostics; this is not a substitute for upstream library typings).
- [x] Attempt npm dependency installation; it did not complete in this execution environment, and `node_modules` is unavailable.
- [ ] Run `npm install`, `npm test`, `npm run lint`, `npm run coverage`, and `npm run build` in a network-enabled environment using real package typings.
- [ ] Verify collisions, fall pose, scene layering, and controls manually in Chrome/Edge with WebGL enabled.
- [ ] Add browser E2E tests for start, jump, slide, coin loss, kick, and goal completion.

## Deferred
- [ ] Audio, fully rigged animation, multiple levels, and gamepad support.
- [ ] Browser E2E / screenshot regression.
