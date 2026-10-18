# MEM: Obstacle Penalty and Urban Art Direction
Date: 2026-10-19
Status: Approved
Tags: [threejs, gameplay, visual-design, tdd]

## Summary
Phase 1 adds a testable fall-recovery state with a bounded coin penalty and moves the procedural scene toward an original anime-inspired urban side-scroller.

## Details
### Context & Evolution
The Phase 0 architecture remains in effect; this memory extends its gameplay and rendering decisions. See [MEM-0001](./MEM-0001-mvp-architecture.md).

### Specification
- A non-sliding, non-jumping obstacle collision starts a 0.9-second fall recovery.
- Inputs do not change the player's position while `fallRemaining` is positive.
- Each obstacle hit removes up to 3 coins from current balance; balance is clamped at zero.
- The HUD displays current balance, not lifetime collected tokens.
- Original procedural street art may reference general anime 2.5D urban design but must not reuse Kick's proprietary character, title, screenshots, or textures.

### Trade-offs
The rule is predictable and easy to test; a fixed penalty is less dynamic than damage, knockback, or coin-drop physics. Primitive geometry is self-contained but has less expressiveness than authored sprite sheets and rigged models.

## Links
- [Architecture](../docs/architecture/overview.md)
- [ADR-0002](../docs/adr/ADR-0002-obstacle-fall-and-anime-urban-style.md)
- [Backlog](../todo.md)

## When to Use
Use for obstacle collision, coin balance, falling animation, and scene art-direction changes in Phase 1.
