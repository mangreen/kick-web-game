# Active Sprint Backlog — Phase 2 / Automatic Light Kick & Power Shot

## Design & implementation
- [x] Update the impact graph before Domain changes to include kick rules and ball-obstacle collision.
- [x] Add failing tests first for automatic light kick, power kick, swept collision, and impact outcomes.
- [x] Auto-light-kick when a grounded player contacts a slow-moving ball; use cooldown to prevent repeated frame impulses.
- [x] Make SPACE apply a much stronger kick that bypasses the automatic-kick cooldown.
- [x] Stop light-kicked balls at barriers; preserve the power-shot state after breaking a barrier so subsequent impacts from that shot can also break barriers.
- [x] Group barrier meshes so the scene can hide destroyed obstacles and restore them on restart.
- [x] Update controls, README, architecture, ADR, MEM, CHANGELOG and daily report.
- [x] Add Conventional Commit and Phase Tag for Phase 2.

## Phase 1 retained
- [x] Review the reference game's publicly described anime 2.5D side-scroller / urban-street direction and retain original assets.
- [x] Update the architecture dependency graph before changing Domain code.
- [x] Add Domain rules and tests for fall recovery, obstacle-crossing direction, safe slide/jump bypass, and clamped coin deductions.
- [x] Trigger player fall animation and lock controls until recovery completes.
- [x] Apply a maximum 3-coin penalty once per obstacle collision; display current balance and lost-coin animation.
- [x] Replace the pastoral scene with procedural city buildings, shopfronts, signage, cables, streetlights, crosswalks, tiles, trees and marked barriers.
- [x] Update README, ADR, MEM, architecture diagram, CHANGELOG and this backlog.
- [x] Use a Conventional Commit and Phase Tag for the previous Phase 1 milestone.

## Validation
- [x] Type-check the dependency-free Domain module with the installed TypeScript compiler.
- [x] Run all 41 Domain test cases with a temporary Vitest-compatible harness (41 passed; not the official Vitest runner).
- [x] Parse all TypeScript source/test files with TypeScript `transpileModule` (no syntax diagnostics).
- [x] Strict-check updated application source against a temporary Three.js API stub (no source diagnostics; this is not a substitute for upstream typings).
- [ ] Type-check updated application source against the real Three.js package typings.
- [x] Check whether npm dependencies are installed; `node_modules` is unavailable in this execution environment.
- [ ] Run `npm install`, `npm test`, `npm run lint`, `npm run coverage`, and `npm run build` in a network-enabled environment using real package typings.
- [ ] Verify collisions, fall pose, scene layering, and controls manually in Chrome/Edge with WebGL enabled.
- [ ] Add browser E2E tests for start, jump, slide, coin loss, kick, and goal completion.

## Deferred
- [ ] Audio, fully rigged animation, multiple levels, and gamepad support.
- [ ] Browser E2E / screenshot regression.


## Bug fix — power shot barrier destruction (2026-10-19)
- [x] Preserve power-shot state after a barrier is destroyed.
- [x] Add regression tests for all five obstacle positions, a continuous shot hitting successive barriers, and light-kick blocking.
- [ ] Run the official Vitest suite, lint and production build in an environment with project dependencies installed.
- [ ] Verify the behavior in a real browser after applying the patch to the GitHub working tree.
