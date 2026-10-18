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
  coinLossTokens: THREE.Group[];
  obstacles: number[];
  goalX: number;
  ball: THREE.Group;
  character: CharacterRig;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

const mat = (color: THREE.ColorRepresentation, roughness = 0.82): THREE.MeshStandardMaterial => {
  const key = `${String(color)}:${roughness}`;
  const cached = materialCache.get(key);
  if (cached) return cached;
  const created = new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
  materialCache.set(key, created);
  return created;
};

export function createWorld(scene: THREE.Scene): WorldAssets {
  scene.background = new THREE.Color('#83c9f4');
  scene.fog = new THREE.Fog('#b8e1f4', 62, 125);

  scene.add(new THREE.HemisphereLight('#effaff', '#8a7a69', 2.15));
  const sun = new THREE.DirectionalLight('#fff1d3', 3.4);
  sun.position.set(-9, 17, 13);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -28;
  sun.shadow.camera.right = 62;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -14;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);

  createGroundLayers(scene);
  addClouds(scene);
  addDistantSkyline(scene);
  addJapaneseStreetBuildings(scene);
  addStreetTrees(scene);
  addUtilityPolesAndLights(scene);
  addStreetFurniture(scene);
  addRoadDetails(scene);
  addSidewalkDetails(scene);

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
  const coinLossTokens = Array.from({ length: 3 }, () => {
    const token = createCoin(scene, 0, 1.5);
    token.visible = false;
    return token;
  });

  const obstacles = [8.4, 16.4, 24.8, 33.2, 40.2];
  obstacles.forEach((x, index) => createRoadBarrier(scene, x, index));

  return { coins, coinMeshes, coinLossTokens, obstacles, goalX, ball, character };
}

export function createCharacter(scene: THREE.Scene): CharacterRig {
  const root = new THREE.Group();
  root.name = 'player-character';
  scene.add(root);

  const shirtMaterial = mat('#f8f3e9');
  const pantsMaterial = mat('#35364f');
  const skinMaterial = mat('#f1bc95');
  const hairMaterial = mat('#182a3a');
  const shoeMaterial = mat('#fffdf6');
  const bagMaterial = mat('#245b9b');
  const soleMaterial = mat('#d9e5e9');

  // The large head, swept fringe, school shirt and backpack make the silhouette read as an anime school kid.
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.66, 0.34), bagMaterial);
  backpack.position.set(-0.4, 1.38, -0.12);
  backpack.rotation.z = -0.13;
  backpack.castShadow = true;
  root.add(backpack);
  const bagPocket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.23, 0.035), mat('#f1bf54'));
  bagPocket.position.set(-0.4, 1.25, 0.065);
  root.add(bagPocket);
  const bagStrap = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.61, 0.05), mat('#e3b85f'));
  bagStrap.position.set(-0.22, 1.49, 0.19);
  bagStrap.rotation.z = -0.24;
  root.add(bagStrap);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.88, 0.38), shirtMaterial);
  torso.position.set(0, 1.32, 0.025);
  torso.castShadow = true;
  root.add(torso);
  const shirtHem = new THREE.Mesh(new THREE.BoxGeometry(0.63, 0.11, 0.39), mat('#e4e0d5'));
  shirtHem.position.set(0, 0.91, 0.025);
  root.add(shirtHem);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.41), mat('#c7d9e6'));
  collar.position.set(0.04, 1.72, 0.02);
  root.add(collar);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.29, 0.035), mat('#ce574e'));
  tie.position.set(0.075, 1.48, 0.23);
  tie.rotation.z = -0.06;
  root.add(tie);
  const shirtPocket = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.19, 0.035), mat('#d8e4e8'));
  shirtPocket.position.set(-0.19, 1.49, 0.22);
  root.add(shirtPocket);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.18, 8), skinMaterial);
  neck.position.set(0.04, 1.83, 0.04);
  root.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.355, 20, 16), skinMaterial);
  head.position.set(0.06, 2.08, 0.035);
  head.scale.set(0.94, 1.05, 0.87);
  head.castShadow = true;
  root.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.37, 18, 13, 0, Math.PI * 2, 0, Math.PI * 0.7), hairMaterial);
  hairCap.position.set(0.035, 2.22, 0.005);
  hairCap.scale.set(1.06, 0.9, 0.99);
  hairCap.castShadow = true;
  root.add(hairCap);
  createHairSpike(root, hairMaterial, 0.26, 2.17, 0.14, -0.38);
  createHairSpike(root, hairMaterial, 0.05, 2.26, 0.13, -0.08);
  createHairSpike(root, hairMaterial, -0.18, 2.16, 0.08, 0.48);
  createHairSpike(root, hairMaterial, -0.28, 2.02, -0.02, 0.82);

  const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.066, 12, 9), mat('#fffaf0'));
  eyeWhite.position.set(0.245, 2.09, 0.31);
  eyeWhite.scale.set(0.78, 1, 0.42);
  root.add(eyeWhite);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), mat('#1e2837'));
  eye.position.set(0.265, 2.085, 0.34);
  root.add(eye);
  const eyebrow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.035), hairMaterial);
  eyebrow.position.set(0.245, 2.19, 0.3);
  eyebrow.rotation.z = 0.16;
  root.add(eyebrow);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skinMaterial);
  nose.position.set(0.365, 2.02, 0.23);
  nose.scale.set(1, 0.6, 0.65);
  root.add(nose);
  const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), mat('#ed958d'));
  cheek.position.set(0.23, 1.96, 0.3);
  cheek.scale.set(1.2, 0.48, 0.25);
  root.add(cheek);

  const leftLeg = createLeg(pantsMaterial, shoeMaterial, soleMaterial, -0.17, 0.73, root);
  const rightLeg = createLeg(pantsMaterial, shoeMaterial, soleMaterial, 0.17, 0.73, root);
  const leftArm = createArm(shirtMaterial, skinMaterial, -0.34, 1.59, root);
  const rightArm = createArm(shirtMaterial, skinMaterial, 0.34, 1.59, root);

  return { root, leftLeg, rightLeg, leftArm, rightArm, torso };
}

function createHairSpike(
  parent: THREE.Group,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rotation: number,
): void {
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.42, 6), material);
  spike.position.set(x, y, z);
  spike.rotation.z = Math.PI + rotation;
  spike.castShadow = true;
  parent.add(spike);
}

function createLeg(
  pants: THREE.Material,
  shoe: THREE.Material,
  sole: THREE.Material,
  x: number,
  y: number,
  parent: THREE.Group,
): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0.015);
  parent.add(pivot);
  const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.35, 4, 8), pants);
  leg.position.y = -0.24;
  leg.castShadow = true;
  pivot.add(leg);
  const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.17, 0.3), shoe);
  sneaker.position.set(0.08, -0.59, 0.065);
  sneaker.castShadow = true;
  pivot.add(sneaker);
  const outsole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.045, 0.31), sole);
  outsole.position.set(0.08, -0.68, 0.065);
  pivot.add(outsole);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 0.018), mat('#e36e61'));
  stripe.position.set(0.06, -0.57, 0.22);
  pivot.add(stripe);
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
  pivot.position.set(x, y, 0.015);
  parent.add(pivot);
  const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.22, 4, 8), shirt);
  sleeve.position.y = -0.12;
  sleeve.rotation.z = x > 0 ? -0.2 : 0.2;
  sleeve.castShadow = true;
  pivot.add(sleeve);
  const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.2, 4, 8), skin);
  forearm.position.set(0, -0.34, 0.015);
  forearm.castShadow = true;
  pivot.add(forearm);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), skin);
  hand.position.set(0.015, -0.47, 0.02);
  pivot.add(hand);
  return pivot;
}

function createSoccerBall(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();
  group.name = 'soccer-ball';
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 24), mat('#fffdf8', 0.55));
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  const patchMaterial = mat('#202b38', 0.72);
  const patchDirections = [
    [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
    [0.58, 0.58, 0.58], [-0.58, 0.58, 0.58], [0.58, -0.58, 0.58], [-0.58, -0.58, 0.58],
    [0.58, 0.58, -0.58], [-0.58, 0.58, -0.58], [0.58, -0.58, -0.58], [-0.58, -0.58, -0.58],
  ];
  patchDirections.forEach(([x, y, z]) => {
    const normal = new THREE.Vector3(x ?? 0, y ?? 0, z ?? 0).normalize();
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.072, 5), patchMaterial);
    patch.position.copy(normal.clone().multiplyScalar(0.332));
    patch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    group.add(patch);
  });
  group.position.set(1.2, 0.34, 0.2);
  scene.add(group);
  return group;
}

function createCoin(scene: THREE.Scene, x: number, y: number): THREE.Group {
  const coin = new THREE.Group();
  coin.name = 'gold-star-token';
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.09, 24), mat('#c68125', 0.48));
  edge.rotation.x = Math.PI / 2;
  edge.castShadow = true;
  coin.add(edge);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.095, 24), mat('#ffcf4f', 0.38));
  face.rotation.x = Math.PI / 2;
  coin.add(face);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.018, 7, 20), mat('#fff0a5', 0.4));
  ring.position.z = 0.052;
  coin.add(ring);
  const starShape = new THREE.Shape();
  for (let point = 0; point < 10; point += 1) {
    const angle = Math.PI / 2 + point * Math.PI / 5;
    const radius = point % 2 === 0 ? 0.115 : 0.055;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (point === 0) starShape.moveTo(px, py);
    else starShape.lineTo(px, py);
  }
  starShape.closePath();
  const star = new THREE.Mesh(new THREE.ShapeGeometry(starShape), mat('#fff9d9', 0.35));
  star.position.z = 0.065;
  coin.add(star);
  coin.position.set(x, y, 0.38);
  scene.add(coin);
  return coin;
}

function createGoal(scene: THREE.Scene, x: number): void {
  const frameMaterial = mat('#f7f5ee', 0.38);
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
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.58, 0.15), mat('#c84843'));
  board.position.y = 3.05;
  board.castShadow = true;
  sign.add(board);
  const label = makeTextLabel('SCHOOL', '#fff9e8');
  label.scale.set(1.04, 1.02, 1);
  label.position.set(-0.82, 2.92, 0.1);
  sign.add(label);
  sign.position.x = x;
  scene.add(sign);
}

function createRoadBarrier(scene: THREE.Scene, x: number, index: number): void {
  const orange = mat(index % 2 === 0 ? '#f16b42' : '#f28f42', 0.62);
  const white = mat('#fff0d9', 0.58);
  const footMaterial = mat('#3d414b', 0.78);

  for (const offsetX of [-0.39, 0.39]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.38), footMaterial);
    foot.position.set(x + offsetX, 0.08, 0.23);
    foot.castShadow = true;
    scene.add(foot);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.78, 0.2), orange);
    leg.position.set(x + offsetX, 0.45, 0.21);
    leg.castShadow = true;
    scene.add(leg);
  }

  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.25, 0.28), orange);
  beam.position.set(x, 0.86, 0.23);
  beam.castShadow = true;
  beam.receiveShadow = true;
  scene.add(beam);
  for (let stripeIndex = -2; stripeIndex <= 2; stripeIndex += 1) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.295), white);
    stripe.position.set(x + stripeIndex * 0.22, 0.86, 0.24);
    stripe.rotation.z = -0.45;
    stripe.castShadow = true;
    scene.add(stripe);
  }
  const warning = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.025), mat('#b63a33'));
  warning.position.set(x, 0.85, 0.39);
  scene.add(warning);
}

function createGroundLayers(scene: THREE.Scene): void {
  const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(150, 16), mat('#c9c4ba'));
  sidewalk.rotation.x = -Math.PI / 2;
  sidewalk.position.set(28, -0.04, 0.1);
  sidewalk.receiveShadow = true;
  scene.add(sidewalk);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(150, 9), mat('#555d68', 0.96));
  road.rotation.x = -Math.PI / 2;
  road.position.set(28, -0.055, 7.2);
  road.receiveShadow = true;
  scene.add(road);

  const backLot = new THREE.Mesh(new THREE.PlaneGeometry(150, 30), mat('#9abd91'));
  backLot.rotation.x = -Math.PI / 2;
  backLot.position.set(28, -0.22, -18);
  backLot.receiveShadow = true;
  scene.add(backLot);

  const curb = new THREE.Mesh(new THREE.BoxGeometry(150, 0.2, 0.34), mat('#f5eee0'));
  curb.position.set(28, 0.055, 4.55);
  curb.castShadow = true;
  curb.receiveShadow = true;
  scene.add(curb);

  const curbPaint = new THREE.Mesh(new THREE.BoxGeometry(150, 0.035, 0.36), mat('#e9a18b'));
  curbPaint.position.set(28, 0.16, 4.55);
  scene.add(curbPaint);

  for (let x = -4; x < 68; x += 2.35) {
    for (let z = -4.25; z < 3.3; z += 1.72) {
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(2.29, 0.035, 1.66),
        mat((Math.round(x * 4) + Math.round(z * 4)) % 3 === 0 ? '#d9d2c6' : '#cec8bd', 0.94),
      );
      tile.position.set(x + 0.8, 0.005, z);
      tile.receiveShadow = true;
      scene.add(tile);
    }
  }
}

function addRoadDetails(scene: THREE.Scene): void {
  const lanePaint = mat('#e9e9df', 0.82);
  for (let x = -3; x < 68; x += 5.2) {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.018, 0.1), lanePaint);
    lane.position.set(x, -0.005, 7.2);
    scene.add(lane);
  }
  for (const crossingX of [13.4, 29.7, 44.2]) {
    for (let stripe = -4; stripe <= 4; stripe += 1) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.02, 5.4), lanePaint);
      mark.position.set(crossingX + stripe * 0.66, -0.006, 7.25);
      scene.add(mark);
    }
  }
  const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.025, 22), mat('#777d83'));
  manhole.position.set(20.6, 0.002, 9.5);
  scene.add(manhole);
}

function addClouds(scene: THREE.Scene): void {
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: '#f8fdff' });
  for (const [x, y, scale] of [[2, 9, 1], [18, 10.6, 0.75], [35, 9.4, 1.05], [51, 10.8, 0.8]]) {
    const cloud = new THREE.Group();
    for (let puff = 0; puff < 4; puff += 1) {
      const radius = (0.72 + (puff % 2) * 0.17) * scale;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), cloudMaterial);
      sphere.position.set((puff - 1.5) * 0.72 * scale, (puff % 2) * 0.26 * scale, 0);
      cloud.add(sphere);
    }
    cloud.position.set(x, y, -22);
    scene.add(cloud);
  }
}

function addDistantSkyline(scene: THREE.Scene): void {
  const skylineColors = ['#a4cbd9', '#b2d5df', '#8cb8cc', '#b9d8df'];
  for (let index = 0; index < 15; index += 1) {
    const width = 3.5 + (index % 3) * 1.15;
    const height = 4.8 + (index % 5) * 0.8;
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, 0.85),
      mat(skylineColors[index % skylineColors.length] ?? '#a4cbd9'),
    );
    building.position.set(index * 5.1 - 8, height / 2 - 0.3, -18.3);
    scene.add(building);
    const roofUnit = new THREE.Mesh(new THREE.BoxGeometry(width * 0.32, 0.45, 0.55), mat('#8baeba'));
    roofUnit.position.set(index * 5.1 - 8 + 0.5, height + 0.05, -18.0);
    scene.add(roofUnit);
  }
}

function addJapaneseStreetBuildings(scene: THREE.Scene): void {
  const palette = [
    { wall: '#e6d5c2', trim: '#c9a78c', sign: '#d84e45', text: 'BAKERY' },
    { wall: '#d9e3df', trim: '#91b7b5', sign: '#2f7796', text: 'BOOKS' },
    { wall: '#edcfad', trim: '#cb9879', sign: '#eab943', text: 'MARKET' },
    { wall: '#d8d2e6', trim: '#a39ac6', sign: '#bd5365', text: 'CAFE' },
    { wall: '#d2e1c3', trim: '#9cb48e', sign: '#3f8972', text: 'FLOWERS' },
    { wall: '#ead5ce', trim: '#c28c7c', sign: '#d95e45', text: 'RAMEN' },
    { wall: '#d6e0eb', trim: '#8faac7', sign: '#4a79ad', text: 'KONBINI' },
    { wall: '#e9dfb7', trim: '#c3ad7b', sign: '#6f9870', text: 'FRIENDS' },
  ];

  for (let index = 0; index < 9; index += 1) {
    const x = index * 6.35 - 2.7;
    const width = 5.8;
    const height = 6.2 + (index % 4) * 0.65;
    const depth = 1.5;
    const style = palette[index % palette.length] ?? palette[0]!;
    const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat(style.wall));
    building.position.set(x, height / 2 - 0.08, -9.2);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);

    const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.22, 0.18, depth + 0.12), mat(style.trim));
    roofTrim.position.set(x, height - 0.06, -9.2);
    roofTrim.castShadow = true;
    scene.add(roofTrim);

    // Upstairs windows and air-conditioning boxes provide a recognisable Japanese backstreet rhythm.
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const wx = x - 1.72 + col * 1.72;
        const wy = height - 1.25 - row * 1.35;
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.04, 0.08), mat('#f4e9d8'));
        frame.position.set(wx, wy, -8.39);
        scene.add(frame);
        const glass = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.86, 0.045), mat('#81bbd1', 0.42));
        glass.position.set(wx, wy, -8.33);
        scene.add(glass);
        const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.88, 0.025), mat('#f9efe0'));
        mullion.position.set(wx, wy, -8.29);
        scene.add(mullion);
      }
    }

    const storeWindowFrame = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.78, 0.09), mat('#f8ead9'));
    storeWindowFrame.position.set(x - 0.93, 1.28, -8.31);
    scene.add(storeWindowFrame);
    const storeGlass = new THREE.Mesh(new THREE.BoxGeometry(1.88, 1.55, 0.045), mat('#86c4d8', 0.38));
    storeGlass.position.set(x - 0.93, 1.28, -8.25);
    scene.add(storeGlass);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.78, 2.08, 0.08), mat('#76584b'));
    door.position.set(x + 1.65, 1.08, -8.3);
    scene.add(door);
    const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.62, 0.035), mat('#9bcbd7', 0.4));
    doorGlass.position.set(x + 1.65, 1.23, -8.24);
    scene.add(doorGlass);
    const doorknob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat('#eecb74', 0.42));
    doorknob.position.set(x + 1.9, 1.05, -8.18);
    scene.add(doorknob);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(width - 0.45, 0.58, 0.16), mat(style.sign));
    signBoard.position.set(x, 2.66, -8.14);
    signBoard.castShadow = true;
    scene.add(signBoard);
    const signLabel = makeTextLabel(style.text, '#fff8e9');
    signLabel.scale.set((width - 0.75) / 1.95, 0.54 / 0.49, 1);
    signLabel.position.set(x, 2.59, -8.04);
    scene.add(signLabel);

    for (let stripe = 0; stripe < 10; stripe += 1) {
      const awningPanel = new THREE.Mesh(
        new THREE.BoxGeometry((width - 0.2) / 10, 0.17, 0.56),
        mat(stripe % 2 === 0 ? '#f6ead9' : style.trim),
      );
      awningPanel.position.set(x - (width - 0.2) / 2 + (stripe + 0.5) * ((width - 0.2) / 10), 2.35, -7.97);
      awningPanel.castShadow = true;
      scene.add(awningPanel);
    }

    if (index % 2 === 0) {
      const acUnit = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 0.38), mat('#d9dedb'));
      acUnit.position.set(x - 1.2, height - 0.9, -8.3);
      scene.add(acUnit);
      const fan = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 7, 14), mat('#7c898e'));
      fan.position.set(x - 1.2, height - 0.9, -8.08);
      scene.add(fan);
    }

    if (index % 2 === 1) addShopLantern(scene, x + 2.1, 3.65, -7.92);
    addPottedPlant(scene, x - 2.22, -6.9, index % 3);
  }
}

function addShopLantern(scene: THREE.Scene, x: number, y: number, z: number): void {
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.48, 6), mat('#4a5059'));
  string.position.set(x, y + 0.3, z);
  scene.add(string);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.46, 12), mat('#e84f3f'));
  lantern.position.set(x, y, z);
  lantern.castShadow = true;
  scene.add(lantern);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.055, 12), mat('#4d4e54'));
  top.position.set(x, y + 0.23, z);
  scene.add(top);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 12), mat('#4d4e54'));
  bottom.position.set(x, y - 0.23, z);
  scene.add(bottom);
}

function addPottedPlant(scene: THREE.Scene, x: number, z: number, variant: number): void {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.42, 8), mat('#bd7757'));
  pot.position.set(x, 0.22, z);
  scene.add(pot);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.62, 6), mat('#856348'));
  trunk.position.set(x, 0.66, z);
  scene.add(trunk);
  const leafColors = ['#4b8d67', '#6aa56f', '#77ae79'];
  for (let leaf = 0; leaf < 4; leaf += 1) {
    const foliage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.3 + ((leaf + variant) % 2) * 0.06, 1),
      mat(leafColors[(leaf + variant) % leafColors.length] ?? '#4b8d67'),
    );
    foliage.position.set(x + (leaf % 2 === 0 ? -0.18 : 0.18), 0.93 + Math.floor(leaf / 2) * 0.25, z);
    foliage.castShadow = true;
    scene.add(foliage);
  }
}

function addStreetTrees(scene: THREE.Scene): void {
  const positions = [-0.8, 10.4, 22.6, 35.8, 47.1, 57.2];
  const leafColors = ['#3f8d63', '#58a26d', '#6eae78'];
  positions.forEach((x, index) => {
    const z = -4.65;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 2.15, 7), mat('#886143'));
    trunk.position.set(x, 1.05, z);
    trunk.castShadow = true;
    scene.add(trunk);
    for (let cluster = 0; cluster < 5; cluster += 1) {
      const leaves = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.72 + (cluster % 3) * 0.12, 1),
        mat(leafColors[(index + cluster) % leafColors.length] ?? '#3f8d63'),
      );
      leaves.position.set(x + (cluster - 2) * 0.42, 2.25 + (cluster % 2) * 0.42, z);
      leaves.castShadow = true;
      scene.add(leaves);
    }
  });
}

function addUtilityPolesAndLights(scene: THREE.Scene): void {
  const poleMaterial = mat('#64727d', 0.8);
  const wireMaterial = mat('#4e6574', 0.85);
  const positions = [3.7, 18.6, 32.8, 46.4, 58];
  positions.forEach((x, index) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 7.4, 8), poleMaterial);
    pole.position.set(x, 3.6, -3.6);
    pole.castShadow = true;
    scene.add(pole);
    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.09, 0.12), poleMaterial);
    crossArm.position.set(x, 6.8, -3.6);
    scene.add(crossArm);
    for (const offset of [-0.55, 0, 0.55]) {
      const insulator = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 7), mat('#e5e0d0'));
      insulator.position.set(x + offset, 6.89, -3.6);
      scene.add(insulator);
    }
    if (index < positions.length - 1) {
      const nextX = positions[index + 1] ?? x + 10;
      const cableCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 6.82, -3.55),
        new THREE.Vector3((x + nextX) / 2, 6.15, -3.55),
        new THREE.Vector3(nextX, 6.82, -3.55),
      ]);
      const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 14, 0.018, 4, false), wireMaterial);
      scene.add(cable);
    }
  });

  for (const x of [13, 28, 43]) {
    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 3.9, 8), mat('#475d6a'));
    lampPole.position.set(x, 1.92, -1.85);
    scene.add(lampPole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.075, 0.08), mat('#475d6a'));
    arm.position.set(x + 0.31, 3.78, -1.85);
    scene.add(arm);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.26), mat('#fff0b8', 0.35));
    lamp.position.set(x + 0.6, 3.68, -1.85);
    scene.add(lamp);
  }
}

function addStreetFurniture(scene: THREE.Scene): void {
  const poleMaterial = mat('#596e7a');
  for (const x of [19.2, 37.1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8), poleMaterial);
    pole.position.set(x, 1.2, -1.8);
    scene.add(pole);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.92, 0.22), mat('#394754'));
    housing.position.set(x, 2.56, -1.78);
    scene.add(housing);
    for (const [offsetY, color] of [[0.24, '#e95146'], [0, '#f0c657'], [-0.24, '#79c86e']] as const) {
      const signal = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), new THREE.MeshBasicMaterial({ color }));
      signal.position.set(x, 2.56 + offsetY, -1.65);
      scene.add(signal);
    }
  }
}

function addSidewalkDetails(scene: THREE.Scene): void {
  for (let index = 0; index < 27; index += 1) {
    const drain = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.018, 0.18), mat('#8a9495'));
    drain.position.set(index * 2.45 - 1.3, 0.026, 4.02);
    scene.add(drain);
    for (let line = 0; line < 4; line += 1) {
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.008, 0.012), mat('#68767c'));
      groove.position.set(index * 2.45 - 1.3, 0.038, 3.96 + line * 0.04);
      scene.add(groove);
    }
  }
}

function makeTextLabel(text: string, color: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.strokeStyle = 'rgba(30, 42, 54, 0.2)';
    context.lineWidth = 3;
    context.font = '900 70px "Trebuchet MS", "Noto Sans JP", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.strokeText(text, 256, 66);
    context.fillText(text, 256, 66);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(1.95, 0.49), material);
}
