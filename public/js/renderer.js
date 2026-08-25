window.PS = window.PS || {};

const PS_RENDER = {};
PS.render = PS_RENDER;

const COLORS = {
  floor: 0x3a4358,
  bridge: 0x4dd0ff,
  hidden: 0x4dff9e,
  trap: 0xff5566,
  checkpoint: 0xffd24d,
  wall: 0x2a2f3d,
  falseWall: 0x2a2f3d,
  player: 0x4dd0ff,
  exit: 0xffd24d,
  bg: 0x05060a
};

PS_RENDER.initThree = function (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setClearColor(COLORS.bg, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLORS.bg, 14, 34);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);

  const ambient = new THREE.AmbientLight(0x8899bb, 0.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(6, 10, 4);
  scene.add(sun);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PS.settings.graphics === "LOW" ? 1 : 2));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  return { renderer, scene, camera };
};

function boxMesh(size, colorHex, opacity) {
  const geo = new THREE.BoxGeometry(size, size, size);
  const mat = new THREE.MeshLambertMaterial({
    color: colorHex,
    transparent: opacity !== undefined,
    opacity: opacity === undefined ? 1 : opacity
  });
  return new THREE.Mesh(geo, mat);
}

function edgeHint(size, colorHex) {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size * 1.02, size * 1.02, size * 1.02));
  const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.2 });
  return new THREE.LineSegments(geo, mat);
}

// 스테이지 씬을 구성하고 illusionSystem에 각 오브젝트를 등록한다.
PS_RENDER.buildStageScene = function (scene, stage, illusionSystem) {
  const group = new THREE.Group();
  illusionSystem.reset();
  illusionSystem.tileEntries = [];
  illusionSystem.wallEntries = [];

  stage.tiles.forEach((t) => {
    const color = COLORS[t.type] || COLORS.floor;
    const isIllusionFloor = t.type === "bridge" || t.type === "hidden";
    const mesh = boxMesh(1, color, isIllusionFloor ? 1 : 1);
    mesh.position.set(t.x, t.y + 0.5, t.z);
    group.add(mesh);

    const hint = isIllusionFloor ? edgeHint(1, color) : null;
    if (hint) {
      hint.position.copy(mesh.position);
      group.add(hint);
    }

    const entry = {
      mesh,
      hintEdge: hint,
      def: t.illusion || { type: null, solid: true },
      solid: t.illusion ? false : true,
      box: { minX: t.x - 0.5, maxX: t.x + 0.5, minZ: t.z - 0.5, maxZ: t.z + 0.5 }
    };
    if (t.illusion) illusionSystem.register(entry);
    illusionSystem.tileEntries.push(entry);
  });

  (stage.walls || []).forEach((w) => {
    const isFalse = w.type === "falseWall";
    const mesh = boxMesh(1, COLORS.wall, 1);
    mesh.position.set(w.x, w.y + 0.5, w.z);
    mesh.scale.set(1, 1.6, 0.3);
    group.add(mesh);

    const hint = isFalse ? edgeHint(1, COLORS.falseWall) : null;
    if (hint) {
      hint.scale.set(1, 1.6, 0.3);
      hint.position.copy(mesh.position);
      group.add(hint);
    }

    const entry = {
      mesh,
      hintEdge: hint,
      def: w.illusion || { type: null, solid: true },
      solid: isFalse ? false : true
    };
    if (w.illusion) illusionSystem.register(entry);
    illusionSystem.wallEntries.push(entry);
  });

  // 출구 표시
  const exitMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 1.4, 6),
    new THREE.MeshLambertMaterial({ color: COLORS.exit, emissive: 0x332200 })
  );
  exitMesh.position.set(stage.exit.x, stage.exit.y + 0.2, stage.exit.z);
  group.add(exitMesh);
  group.userData.exitMesh = exitMesh;

  scene.add(group);
  return group;
};

PS_RENDER.createPlayerMesh = function (scene) {
  const geo = new THREE.BoxGeometry(0.5, 0.9, 0.5);
  const mat = new THREE.MeshLambertMaterial({ color: COLORS.player });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  return mesh;
};

PS_RENDER.disposeGroup = function (scene, group) {
  if (!group) return;
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  scene.remove(group);
};

// 메뉴 배경: 끝없이 올라가는 계단 + 떠 있는 발판 (장식용, 충돌 없음)
PS_RENDER.buildMenuBackground = function (scene) {
  const group = new THREE.Group();

  for (let i = 0; i < 18; i++) {
    const step = boxMesh(1, i % 2 === 0 ? 0x3a4358 : 0x2a2f3d, 1);
    const angle = i * 0.35;
    step.position.set(Math.cos(angle) * 3, i * 0.55 - 4, Math.sin(angle) * 3 - 6);
    group.add(step);
  }

  for (let i = 0; i < 10; i++) {
    const plat = boxMesh(0.8, 0x4dd0ff, 0.5);
    plat.position.set((Math.random() - 0.5) * 10, Math.random() * 6 - 2, -4 - Math.random() * 10);
    group.add(plat);
  }

  scene.add(group);
  return group;
};