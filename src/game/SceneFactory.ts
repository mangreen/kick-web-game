import * as THREE from 'three';
import type { CoinState } from '../domain/types';

export interface CharacterRig {
  root: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Mesh;
}

export interface WorldAssets {
  coins: CoinState[];
  coinMeshes: THREE.Group[];
  obstacles: number[];
  goalX: number;
  ball: THREE.Group;
  character: CharacterRig;
}

const mat = (color: THREE.ColorRepresentation, roughness = 0.82) =>
  new THREE.MeshStandardMaterial({ color, roughness });

export function createWorld(scene: THREE.Scene): WorldAssets {
  scene.background = new THREE.Color('#a8d7e9');
  scene.fog = new THREE.Fog('#a8d7e9', 34, 105);

  const hemisphere = new THREE.HemisphereLight('#fff7dd', '#6a8878', 2.15);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight('#fff0cf', 3.2);
  sun.position.set(-8, 15, 13);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 1024);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 65;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -12;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 22),
    mat('#d7c49b'),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(28, 0, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 38),
    mat('#96bd88'),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(29, -0.1, -17);
  grass.receiveShadow = true;
  scene.add(grass);

  const curb = new THREE.Mesh(new THREE.BoxGeometry(120, 0.18, 0.45), mat('#f1dfb7'));
  curb.position.set(28, 0.08, 4.8);
  curb.castShadow = true;
  curb.receiveShadow = true;
  scene.add(curb);

  addSunDisc(scene);
  addDistantHills(scene);
  addBuildings(scene);
  addTrees(scene);
  addStreetDetails(scene);

  const character = createCharacter(scene);
  const ball = createSoccerBall(scene);
  const goalX = 48;
  createGoal(scene, goalX);

  const coinPositions = [
    [4.2, 0.65], [6.7, 0.65], [9.4, 2.35], [12.0, 0.65], [14.3, 0.65],
    [17.6, 2.35], [20.1, 0.65], [22.5, 0.65], [25.2, 2.35], [28.0, 0.65],
    [30.4, 0.65], [33.3, 2.35], [36.0, 0.65], [38.8, 0.65], [42.0, 2.35],
  ];
  const coins: CoinState[] = coinPositions.map(([x, y], id) => ({
    id,
    x: x ?? 0,
    y: y ?? 0.65,
    collected: false,
  }));
  const coinMeshes = coins.map((coin) => createCoin(scene, coin.x, coin.y));

  const obstacles = [8.4, 16.4, 24.8, 33.2, 40.2];
  obstacles.forEach((x, index) => createStreetObstacle(scene, x, index));

  return { coins, coinMeshes, obstacles, goalX, ball, character };
}

export function createCharacter(scene: THREE.Scene): CharacterRig {
  const root = new THREE.Group();
  root.name = 'player-character';
  scene.add(root);

  const shirtMaterial = mat('#f5f0dc');
  const pantsMaterial = mat('#3c526f');
  const skinMaterial = mat('#dfab7d');
  const hairMaterial = mat('#25323a');
  const shoeMaterial = mat('#fbf6e7');

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.62, 0.36), mat('#dfaa4f'));
  backpack.position.set(-0.42, 1.38, -0.05);
  backpack.rotation.z = -0.12;
  backpack.castShadow = true;
  root.add(backpack);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.88, 0.38), shirtMaterial);
  torso.position.set(0, 1.33, 0);
  torso.castShadow = true;
  root.add(torso);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.405), mat('#80a9a6'));
  collar.position.set(0.04, 1.72, 0.015);
  root.add(collar);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.035), mat('#d47b63'));
  tie.position.set(0.07, 1.48, 0.22);
  tie.rotation.z = -0.05;
  root.add(tie);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), skinMaterial);
  head.position.set(0.04, 2.08, 0.015);
  head.scale.set(0.93, 1.08, 0.88);
  head.castShadow = true;
  root.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.355, 16, 11, 0, Math.PI * 2, 0, Math.PI * 0.68), hairMaterial);
  hair.position.set(0.02, 2.18, 0.0);
  hair.scale.set(1.04, 0.92, 0.94);
  hair.castShadow = true;
  root.add(hair);

  const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.17, 0.24), hairMaterial);
  fringe.position.set(0.25, 2.12, 0.12);
  fringe.rotation.z = -0.32;
  root.add(fringe);

  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat('#26343a'));
  eye.position.set(0.25, 2.08, 0.292);
  root.add(eye);
  const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('#e69a87'));
  cheek.position.set(0.22, 1.96, 0.28);
  root.add(cheek);

  const leftLeg = createLimb(pantsMaterial, shoeMaterial, 0.17, 0.68, root, true);
  const rightLeg = createLimb(pantsMaterial, shoeMaterial, -0.17, 0.68, root, true);
  const leftArm = createArm(shirtMaterial, skinMaterial, -0.36, 1.58, root);
  const rightArm = createArm(shirtMaterial, skinMaterial, 0.36, 1.58, root);

  return { root, leftLeg, rightLeg, leftArm, rightArm, torso };
}

function createLimb(
  cloth: THREE.Material,
  shoe: THREE.Material,
  x: number,
  y: number,
  parent: THREE.Group,
  leg: boolean,
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  parent.add(pivot);
  const length = leg ? 0.56 : 0.48;
  const segment = new THREE.Mesh(new THREE.BoxGeometry(0.22, length, 0.22), cloth);
  segment.position.y = -length / 2;
  segment.castShadow = true;
  pivot.add(segment);
  if (leg) {
    const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.28), shoe);
    sneaker.position.set(0.065, -length + 0.02, 0.055);
    sneaker.castShadow = true;
    pivot.add(sneaker);
  }
  return pivot;
}

function createArm(
  shirt: THREE.Material,
  skin: THREE.Material,
  x: number,
  y: number,
  parent: THREE.Group,
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  parent.add(pivot);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.48, 0.2), shirt);
  upper.position.y = -0.2;
  upper.rotation.z = x > 0 ? -0.12 : 0.12;
  upper.castShadow = true;
  pivot.add(upper);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), skin);
  hand.position.set(0, -0.46, 0.025);
  hand.castShadow = true;
  pivot.add(hand);
  return pivot;
}

function createSoccerBall(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  group.name = 'soccer-ball';
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 16), mat('#fffdf5', 0.52));
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  const patchMaterial = mat('#27343b', 0.7);
  const patchPositions = [
    [0, 0.326, 0], [0, -0.326, 0], [0.30, 0.08, 0], [-0.30, -0.05, 0],
    [0, 0.05, 0.30], [0, -0.05, -0.30],
  ];
  patchPositions.forEach(([x, y, z]) => {
    const patch = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), patchMaterial);
    patch.position.set(x ?? 0, y ?? 0, z ?? 0);
    group.add(patch);
  });
  group.position.set(1.2, 0.34, 0.2);
  scene.add(group);
  return group;
}

function createCoin(scene: THREE.Scene, x: number, y: number): THREE.Group {
  const coin = new THREE.Group();
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.085, 20), mat('#c78333', 0.45));
  edge.rotation.x = Math.PI / 2;
  edge.castShadow = true;
  coin.add(edge);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.095, 20), mat('#ffdc76', 0.4));
  face.rotation.x = Math.PI / 2;
  coin.add(face);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), mat('#fff5cc', 0.4));
  star.position.z = 0.06;
  coin.add(star);
  coin.position.set(x, y, 0.35);
  scene.add(coin);
  return coin;
}

function createGoal(scene: THREE.Scene, x: number): void {
  const frameMaterial = mat('#faf5e5', 0.38);
  const post = (px: number, py: number, width: number, height: number, depth: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), frameMaterial);
    mesh.position.set(px, py, 0.05);
    mesh.castShadow = true;
    scene.add(mesh);
  };
  post(x - 0.8, 1.13, 0.16, 2.3, 0.18);
  post(x + 0.8, 1.13, 0.16, 2.3, 0.18);
  post(x, 2.27, 1.75, 0.16, 0.18);

  const net = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 1.94, 0.08),
    new THREE.MeshStandardMaterial({ color: '#f8f2dc', transparent: true, opacity: 0.34, wireframe: true }),
  );
  net.position.set(x, 1.05, -0.28);
  scene.add(net);

  const sign = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.58, 0.15), mat('#3e7266'));
  board.position.y = 3.05;
  board.castShadow = true;
  sign.add(board);
  const label = makeTextLabel('SCHOOL', '#fff4d1');
  label.position.set(-0.82, 2.92, 0.1);
  sign.add(label);
  sign.position.x = x;
  scene.add(sign);
}

function makeTextLabel(text: string, color: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = color;
    context.font = 'bold 76px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 66);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.49), material);
}

function createStreetObstacle(scene: THREE.Scene, x: number, index: number): void {
  const postMaterial = mat(index % 2 === 0 ? '#d77d65' : '#e5af5f');
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.19, 0.28), postMaterial);
  beam.position.set(x, 1.02, 0.18);
  beam.castShadow = true;
  scene.add(beam);
  for (const dx of [-0.37, 0.37]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.95, 0.17), postMaterial);
    leg.position.set(x + dx, 0.48, 0.18);
    leg.castShadow = true;
    scene.add(leg);
  }
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.29), mat('#fff1d5'));
  stripe.position.set(x, 1.03, 0.34);
  scene.add(stripe);
}

function addSunDisc(scene: THREE.Scene): void {
  const sun = new THREE.Mesh(
    new THREE.CircleGeometry(2.0, 48),
    new THREE.MeshBasicMaterial({ color: '#ffe8a7' }),
  );
  sun.position.set(20, 10, -16);
  scene.add(sun);
  const haze = new THREE.Mesh(
    new THREE.CircleGeometry(2.9, 48),
    new THREE.MeshBasicMaterial({ color: '#ffe8a7', transparent: true, opacity: 0.16 }),
  );
  haze.position.set(20, 10, -16.2);
  scene.add(haze);
}

function addDistantHills(scene: THREE.Scene): void {
  const colors = ['#9ac1a1', '#83b092', '#78a58a'];
  for (let index = 0; index < 10; index += 1) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(5 + (index % 3), 18, 12), mat(colors[index % colors.length] ?? '#9ac1a1'));
    hill.scale.set(1.6, 0.62 + (index % 2) * 0.12, 0.18);
    hill.position.set(index * 9 - 17, -0.4 + (index % 3) * 0.13, -15 - (index % 2));
    scene.add(hill);
  }
}

function addBuildings(scene: THREE.Scene): void {
  const palette = ['#f1c6a6', '#d9e0bb', '#d7b7a6', '#f1d88d', '#bed8d5'];
  for (let index = 0; index < 9; index += 1) {
    const x = index * 8.6 - 5;
    const width = 4.5 + (index % 3) * 0.7;
    const height = 3.6 + (index % 4) * 0.5;
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 1.1),
      mat(palette[index % palette.length] ?? '#f1c6a6'),
    );
    building.position.set(x, height / 2 - 0.2, -7.8);
    scene.add(building);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(width * 0.72, 1.15, 4),
      mat(index % 2 === 0 ? '#bd856d' : '#8eaa9a'),
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.set(x, height + 0.35, -7.8);
    scene.add(roof);
    for (let windowIndex = 0; windowIndex < 2; windowIndex += 1) {
      const windowPane = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.86, 0.06), mat('#8bbdca', 0.4));
      windowPane.position.set(x - 0.9 + windowIndex * 1.8, height * 0.58, -7.17);
      scene.add(windowPane);
    }
  }
}

function addTrees(scene: THREE.Scene): void {
  for (let index = 0; index < 11; index += 1) {
    const x = index * 5.6 - 1.5;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.45, 7), mat('#9f7959'));
    trunk.position.set(x, 0.5, -3.8);
    trunk.castShadow = true;
    scene.add(trunk);
    const leafColors = ['#6c9d78', '#8eaf79', '#79a58b'];
    for (let cluster = 0; cluster < 3; cluster += 1) {
      const leaves = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.92 - cluster * 0.08, 1),
        mat(leafColors[(index + cluster) % leafColors.length] ?? '#6c9d78'),
      );
      leaves.position.set(x + (cluster - 1) * 0.48, 1.6 + (cluster % 2) * 0.38, -3.8);
      leaves.castShadow = true;
      scene.add(leaves);
    }
  }
}

function addStreetDetails(scene: THREE.Scene): void {
  for (let index = 0; index < 18; index += 1) {
    const x = index * 3.8 - 1;
    const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.08 + (index % 3) * 0.025, 6, 5), mat('#b9a47d'));
    pebble.position.set(x, -0.035, 2.3 + (index % 3) * 0.35);
    pebble.scale.set(1.4, 0.35, 0.8);
    scene.add(pebble);
  }
}
