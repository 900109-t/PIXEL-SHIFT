import * as THREE from "three";

const MOVE_SPEED = 3.2; // units/sec
const PLAYER_COLOR = 0xffb020;

export class Player {
  constructor(scene, startPos) {
    this.scene = scene;
    this.position = new THREE.Vector3(startPos.x, startPos.y, startPos.z);
    this.velocity = new THREE.Vector3();
    this.isFalling = false;
    this.fallStartY = 0;

    const geo = new THREE.BoxGeometry(0.5, 0.7, 0.5);
    const mat = new THREE.MeshStandardMaterial({
      color: PLAYER_COLOR,
      emissive: 0x662d00,
      emissiveIntensity: 0.3,
      flatShading: true,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);

    this.facingAngle = 0;
  }

  reset(startPos) {
    this.position.set(startPos.x, startPos.y, startPos.z);
    this.velocity.set(0, 0, 0);
    this.isFalling = false;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = 0;
  }

  // moveVec: {x, y} 조이스틱 입력 (-1~1), cameraYaw: 카메라 기준 회전각(rad)
  update(dt, moveVec, cameraYaw) {
    if (this.isFalling) {
      this.position.y -= dt * 9;
      this.mesh.position.copy(this.position);
      return;
    }

    if (moveVec.x !== 0 || moveVec.y !== 0) {
      // 조이스틱 입력을 카메라 방향 기준으로 회전
      const forward = new THREE.Vector3(
        Math.sin(cameraYaw),
        0,
        Math.cos(cameraYaw)
      );
      const right = new THREE.Vector3(
        Math.sin(cameraYaw + Math.PI / 2),
        0,
        Math.cos(cameraYaw + Math.PI / 2)
      );

      const dir = new THREE.Vector3()
        .addScaledVector(forward, -moveVec.y)
        .addScaledVector(right, moveVec.x);

      if (dir.lengthSq() > 0.0001) {
        dir.normalize();
        this.position.addScaledVector(dir, MOVE_SPEED * dt);

        const targetAngle = Math.atan2(dir.x, dir.z);
        this.facingAngle = lerpAngle(this.facingAngle, targetAngle, 0.25);
        this.mesh.rotation.y = this.facingAngle;
      }
    }

    this.mesh.position.copy(this.position);
  }

  startFalling() {
    this.isFalling = true;
    this.fallStartY = this.position.y;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
