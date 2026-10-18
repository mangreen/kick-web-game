# MEM: Obstacle Penalty and Urban Art Direction
Date: 2026-10-19
Status: Approved — extended in Phase 2
Tags: [threejs, gameplay, visual-design, tdd]

## Summary
Phase 1 added a testable fall-recovery state with a bounded coin penalty and an original anime-inspired urban side-scroller. Phase 2 adds automatic light kicks, SPACE power kicks, and impact-sensitive obstacle destruction.

## Details
### Context & Evolution
The Phase 0 architecture remains in effect; this memory extends its gameplay and rendering decisions. See [MEM-0001](./MEM-0001-mvp-architecture.md).

### Context & Evolution (Phase 2)
- The ball can now be interacted with without pressing a key: grounded player-ball contact triggers a low-speed light kick.
- SPACE triggers a separate high-speed power kick when the player is close enough to the ball. The power kick can destroy the first obstacle it hits; power is consumed by that impact, preventing one shot from chain-destroying the whole level.
- Collision checks use the previous and current ball positions to avoid tunneling through barriers at high speed. Rules stay independent of Three.js; grouped meshes are hidden by the game adapter.

### Specification
- A non-sliding, non-jumping obstacle collision starts a 0.9-second fall recovery.
- Inputs do not change the player's position while `fallRemaining` is positive.
- Each obstacle hit removes up to 3 coins from current balance; balance is clamped at zero.
- The HUD displays current balance, not lifetime collected tokens.
- A light kick pushes the ball forward at low speed, remains grounded, and cannot destroy an obstacle. If it hits an obstacle, the ball stops just before it.
- A SPACE power kick uses much higher horizontal speed and a small lift; on hitting the first intact obstacle, that obstacle is destroyed and the ball continues. The power state is then consumed.
- A grounded player within the ball-touch radius automatically light-kicks a slow-moving ball after the cooldown expires; a deliberate SPACE press takes priority.
- Original procedural street art may reference general anime 2.5D urban design but must not reuse Kick's proprietary character, title, screenshots, or textures.

### Trade-offs
The rule is predictable and easy to test; a fixed penalty is less dynamic than damage, knockback, or coin-drop physics. Primitive geometry is self-contained but has less expressiveness than authored sprite sheets and rigged models.

## Links
- [Architecture](../docs/architecture/overview.md)
- [ADR-0002](../docs/adr/ADR-0002-obstacle-fall-and-anime-urban-style.md)
- [Backlog](../todo.md)

## When to Use
Use for obstacle collision, coin balance, falling animation, and scene art-direction changes in Phase 1.
