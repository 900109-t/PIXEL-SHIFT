import * as THREE from "three";

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false, // 픽셀풍 스타일 + 모바일 성능
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap; // 저해상도 그림자
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a12);
  scene.fog = new THREE.Fog(0x0a0a12, 14, 34);
  return scene;
}

export function createLights(scene) {
  // 광원 최소화: 방향광 1개 + 약한 환경광
  const ambient = new THREE.AmbientLight(0x4a4a6a, 1.2);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(6, 10, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  scene.add(sun);

  // 착시/시안 포인트 라이트 (분위기용, 그림자 없음)
  const rim = new THREE.PointLight(0x00e5ff, 0.6, 20);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  return { ambient, sun, rim };
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  return camera;
}

export function handleResize(renderer, camera) {
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
