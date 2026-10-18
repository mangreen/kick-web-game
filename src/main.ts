import './styles.css';
import { Game } from './game/Game';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const shell = document.querySelector<HTMLElement>('#game-shell');
const introCard = document.querySelector<HTMLElement>('#intro-card');
const finishCard = document.querySelector<HTMLElement>('#finish-card');
const startButton = document.querySelector<HTMLButtonElement>('#start-button');
const restartButton = document.querySelector<HTMLButtonElement>('#restart-button');
const bottomHint = document.querySelector<HTMLElement>('#bottom-hint');
const coinCount = document.querySelector<HTMLElement>('#coin-count');
const kickCount = document.querySelector<HTMLElement>('#kick-count');
const goalStatus = document.querySelector<HTMLElement>('#goal-status');
const finishSummary = document.querySelector<HTMLElement>('#finish-summary');

if (
  !canvas || !shell || !introCard || !finishCard || !startButton || !restartButton
  || !bottomHint || !coinCount || !kickCount || !goalStatus || !finishSummary
) {
  throw new Error('Game UI is incomplete. Check index.html element IDs.');
}

try {
  new Game(canvas, {
    introCard,
    finishCard,
    startButton,
    restartButton,
    bottomHint,
    coinCount,
    kickCount,
    goalStatus,
    finishSummary,
    shell,
  });
} catch (error) {
  console.error('Unable to initialize Kick Street:', error);
  const message = document.createElement('p');
  message.className = 'fatal-error';
  message.textContent = '遊戲初始化失敗。請使用支援 WebGL 的最新版 Chrome、Edge 或 Firefox。';
  shell.append(message);
}
