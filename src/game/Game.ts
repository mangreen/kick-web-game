import * as THREE from 'three';
import {
  collectNearbyCoins,
  createInitialBallState,
  createInitialPlayerState,
  hasScored,
  stepBall,
  stepPlayer,
} from '../domain/gameRules';
import type { BallState, CoinState, PlayerInput, PlayerState } from '../domain/types';
import { createWorld } from './SceneFactory';

export interface GameUI {
  introCard: HTMLElement;
  finishCard: HTMLElement;
  startButton: HTMLButtonElement;
  restartButton: HTMLButtonElement;
  bottomHint: HTMLElement;
  coinCount: HTMLElement;
  kickCount: HTMLElement;
  goalStatus: HTMLElement;
  finishSummary: HTMLElement;
  shell: HTMLElement;
}

const GOAL_SCORE_HEIGHT = 2.12;
const DEFAULT_HINT = '找到足球，按 SPACE 踢出漂亮弧線';

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-10, 10, 6, -2, 0.1, 150);
  private readonly world: ReturnType<typeof createWorld>;
  private player: PlayerState = createInitialPlayerState();
  private ball: BallState = createInitialBallState();
  private coins: CoinState[] = [];
  private started = false;
  private completed = false;
  private kickCount = 0;
  private previousTime = 0;
  private kickPoseRemaining = 0;
  private hintTimer = 0;
  private readonly heldKeys = new Set<string>();
  private readonly justPressed = new Set<string>();
  private readonly touchKeys = new Set<string>();
  private animationFrame = 0;
  private readonly obstacles: number[];
  private readonly ui: GameUI;

  constructor(canvas: HTMLCanvasElement, ui: GameUI) {
    this.ui = ui;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.world = createWorld(this.scene);
    this.obstacles = this.world.obstacles;
    this.coins = this.world.coins.map((coin) => ({ ...coin }));
    this.player = createInitialPlayerState();
    this.ball = createInitialBallState();
    this.attachControls();
    this.updateCamera();
    this.resize();
    this.updateVisuals(0);
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = window.requestAnimationFrame(this.render);
  }

  start = (): void => {
    this.started = true;
    this.ui.introCard.classList.add('hidden');
    this.ui.bottomHint.classList.add('visible');
    this.ui.shell.classList.add('playing');
  };

  restart = (): void => {
    this.player = createInitialPlayerState();
    this.ball = createInitialBallState();
    this.coins = this.world.coins.map((coin) => ({ ...coin, collected: false }));
    this.kickCount = 0;
    this.started = true;
    this.completed = false;
    this.kickPoseRemaining = 0;
    this.ui.coinCount.textContent = '0';
    this.ui.kickCount.textContent = '0';
    this.ui.goalStatus.textContent = '0 / 1';
    this.ui.finishCard.classList.add('hidden');
    this.ui.introCard.classList.add('hidden');
    this.ui.bottomHint.textContent = DEFAULT_HINT;
    this.ui.bottomHint.classList.add('visible');
    this.ui.shell.classList.add('playing');
    this.world.coins.forEach((coin, index) => {
      const mesh = this.world.coinMeshes[index];
      if (mesh) mesh.visible = !coin.collected;
    });
    this.heldKeys.clear();
    this.justPressed.clear();
    this.touchKeys.clear();
  };

  destroy(): void {
    window.cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clearKeys);
    this.renderer.dispose();
  }

  private readonly render = (now: number): void => {
    this.animationFrame = window.requestAnimationFrame(this.render);
    const deltaSeconds = this.previousTime === 0 ? 0 : Math.min((now - this.previousTime) / 1000, 0.05);
    this.previousTime = now;

    if (this.started && !this.completed) this.update(deltaSeconds);
    this.renderer.render(this.scene, this.camera);
  };

  private update(deltaSeconds: number): void {
    const input = this.readInput();
    const previousX = this.player.x;
    this.player = stepPlayer(this.player, input, deltaSeconds);
    this.applyObstacleCollisions(previousX);

    const previousBallX = this.ball.x;
    this.ball = stepBall(this.ball, deltaSeconds);
    if (this.justPressed.has('Space')) this.tryKick();
    this.justPressed.clear();

    const collected = collectNearbyCoins(this.player.x, this.player.y, this.coins);
    this.coins = collected.coins;
    if (collected.collectedCount > 0) {
      const total = this.coins.filter((coin) => coin.collected).length;
      this.ui.coinCount.textContent = String(total);
      this.coins.forEach((coin, index) => {
        if (coin.collected && this.world.coinMeshes[index]) this.world.coinMeshes[index]!.visible = false;
      });
      this.flashHint(`好眼力！收集了 ${total} 枚金幣`);
    }

    this.kickPoseRemaining = Math.max(0, this.kickPoseRemaining - deltaSeconds);
    if (this.hintTimer > 0) {
      this.hintTimer = Math.max(0, this.hintTimer - deltaSeconds);
      if (this.hintTimer === 0) this.ui.bottomHint.textContent = DEFAULT_HINT;
    }
    this.updateVisuals(deltaSeconds);
    this.updateCamera();
    this.checkGoal(previousBallX);
  }

  private readInput(): PlayerInput {
    const isHeld = (key: string) => this.heldKeys.has(key) || this.touchKeys.has(key);
    return {
      left: isHeld('ArrowLeft'),
      right: isHeld('ArrowRight'),
      jumpPressed: this.justPressed.has('ArrowUp'),
      slidePressed: this.justPressed.has('ArrowDown'),
    };
  }

  private tryKick(): void {
    if (this.player.kickCooldown > 0) return;
    const directionToBall = (this.ball.x - this.player.x) * this.player.facing;
    const nearEnough = directionToBall >= -0.35 && directionToBall <= 1.9;
    const heightOkay = this.ball.y < 1.55 && this.player.y < 1.15;

    this.kickPoseRemaining = 0.28;
    if (!nearEnough || !heightOkay) {
      this.flashHint('再靠近足球一點，按 SPACE 踢球');
      return;
    }

    this.ball = {
      ...this.ball,
      vx: this.player.facing * (17.5 + Math.max(0, this.player.vx) * 0.22),
      vy: 4.15,
      grounded: false,
    };
    this.player = { ...this.player, kickCooldown: 0.28 };
    this.kickCount += 1;
    this.ui.kickCount.textContent = String(this.kickCount);
    this.flashHint(this.kickCount % 3 === 0 ? '連續踢球！漂亮！' : '漂亮的傳球！繼續追上去');
  }

  private applyObstacleCollisions(previousX: number): void {
    for (const obstacleX of this.obstacles) {
      const crossedObstacle = Math.abs(this.player.x - obstacleX) < 0.94;
      const canPassUnder = this.player.slideRemaining > 0;
      const canJumpOver = this.player.y > 1.18;
      if (!crossedObstacle || canPassUnder || canJumpOver) continue;

      if (previousX < obstacleX - 0.94 && this.player.x > obstacleX - 0.94) {
        this.player = { ...this.player, x: obstacleX - 0.94, vx: 0 };
        this.flashHint('路障擋住了！按 ↓ 滑鏟，或按 ↑ 跳過');
      } else if (previousX > obstacleX + 0.94 && this.player.x < obstacleX + 0.94) {
        this.player = { ...this.player, x: obstacleX + 0.94, vx: 0 };
        this.flashHint('路障擋住了！按 ↓ 滑鏟，或按 ↑ 跳過');
      }
    }
  }

  private updateVisuals(deltaSeconds: number): void {
    const { character, ball } = this.world;
    const isSliding = this.player.slideRemaining > 0;
    const isMoving = Math.abs(this.player.vx) > 0.35;
    const gait = isMoving && this.player.grounded && !isSliding
      ? Math.sin(this.player.animationTime * 12.5) * 0.52
      : 0;

    character.root.position.set(this.player.x, this.player.y, 0.12);
    character.root.scale.set(this.player.facing, isSliding ? 0.36 : 1, 1);
    character.leftLeg.rotation.z = gait;
    character.rightLeg.rotation.z = -gait;
    character.leftArm.rotation.z = -gait * 0.8;
    character.rightArm.rotation.z = gait * 0.8;
    character.torso.rotation.z = isSliding ? -0.32 : (isMoving ? Math.sin(this.player.animationTime * 12.5) * 0.035 : 0);
    if (this.kickPoseRemaining > 0) {
      character.rightLeg.rotation.z = -0.98;
      character.leftArm.rotation.z = 0.38;
    }

    ball.position.set(this.ball.x, this.ball.y, 0.2);
    ball.rotation.z -= this.ball.vx * deltaSeconds / 0.34;
    ball.rotation.x += this.ball.vx * deltaSeconds / 0.4;

    const time = this.previousTime / 1000;
    this.world.coinMeshes.forEach((coin, index) => {
      if (!coin.visible) return;
      coin.rotation.y = Math.sin(time * 2.2 + index) * 0.24;
      coin.position.y = (this.coins[index]?.y ?? 0.65) + Math.sin(time * 2.4 + index * 0.8) * 0.08;
    });
  }

  private updateCamera(): void {
    const cameraX = Math.max(4.5, Math.min(this.player.x + 3.1, this.world.goalX + 3));
    this.camera.position.set(cameraX, 8.0, 26);
    this.camera.lookAt(cameraX, 1.8, 0);
  }

  private checkGoal(previousBallX: number): void {
    const crossed = hasScored(this.ball.x, this.world.goalX) && previousBallX < this.world.goalX;
    const insideFrameHeight = this.ball.y < GOAL_SCORE_HEIGHT && this.ball.y > 0.12;
    if (!crossed || !insideFrameHeight || this.ball.vx <= 0) return;

    this.completed = true;
    this.ui.goalStatus.textContent = '1 / 1';
    this.ui.finishSummary.textContent = `你收集了 ${this.coins.filter((coin) => coin.collected).length} 枚金幣，踢了 ${this.kickCount} 次球。放學路上的小冒險完成！`;
    this.ui.finishCard.classList.remove('hidden');
    this.ui.bottomHint.classList.remove('visible');
    this.ui.shell.classList.remove('playing');
  }

  private flashHint(message: string): void {
    this.ui.bottomHint.textContent = message;
    this.ui.bottomHint.classList.add('visible');
    this.hintTimer = 2.25;
  }

  private attachControls(): void {
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clearKeys);

    this.ui.startButton.addEventListener('click', this.start);
    this.ui.restartButton.addEventListener('click', this.restart);

    this.ui.shell.querySelectorAll<HTMLButtonElement>('[data-touch]').forEach((button) => {
      const action = button.dataset.touch;
      const key = this.touchActionToKey(action);
      if (!key) return;
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        if (!this.touchKeys.has(key)) this.justPressed.add(key);
        this.touchKeys.add(key);
        button.classList.add('pressed');
      });
      const release = () => {
        this.touchKeys.delete(key);
        button.classList.remove('pressed');
      };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
  }

  private touchActionToKey(action: string | undefined): string | null {
    switch (action) {
      case 'left': return 'ArrowLeft';
      case 'right': return 'ArrowRight';
      case 'jump': return 'ArrowUp';
      case 'slide': return 'ArrowDown';
      case 'kick': return 'Space';
      default: return null;
    }
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const key = event.code === 'Space' ? 'Space' : event.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(key)) event.preventDefault();
    if (!this.heldKeys.has(key)) this.justPressed.add(key);
    this.heldKeys.add(key);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    const key = event.code === 'Space' ? 'Space' : event.key;
    this.heldKeys.delete(key);
    this.justPressed.delete(key);
  };

  private readonly clearKeys = (): void => {
    this.heldKeys.clear();
    this.justPressed.clear();
    this.touchKeys.clear();
  };

  private readonly resize = (): void => {
    const width = Math.max(1, this.ui.shell.clientWidth);
    const height = Math.max(1, this.ui.shell.clientHeight);
    const halfHeight = 5.2;
    const halfWidth = halfHeight * (width / height);
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };
}
