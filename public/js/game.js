import * as THREE from "three";
import { createRenderer, createScene, createLights, createCamera, handleResize } from "./renderer.js";
import { CameraRig } from "./camera.js";
import { Player } from "./player.js";
import { InputController } from "./input.js";
import { getLevel } from "./levels.js";

export const STATE = {
  MENU: "MENU",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  FAILED: "FAILED",
  CLEAR: "CLEAR",
};

const BLOCK_SIZE = 1;
const FALL_LIMIT_Y = -6;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = createRenderer(canvas);
    this.scene = createScene();
    this.camera = createCamera();
    createLights(this.scene);
    handleResize(this.renderer, this.camera);

    this.cameraRig = new CameraRig(this.camera);
    this.input = new InputController(this.cameraRig);

    this.state = STATE.MENU;
    this.player = null;
    this.currentLevel = null;
    this.blockMesh = null;
    this.exitMesh = null;
    this.blockSet = new Set(); // "x,z" -> topY, 충돌 판정용

    this.attempts = 0;
    this.stageStartTime = 0;

    this.clock = new THREE.Clock();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  loadStage(stageId) {
    this._clearLevel();

    const level = getLevel(stageId);
    this.currentLevel = level;
    this.attempts = 0;

    this._buildBlocks(level.blocks);
    this._buildExit(level.exit);

    this.player = new Player(this.scene, level.playerStart);
    this.cameraRig.targetYaw = 0;
    this.cameraRig.yaw = 0;

    this.state = STATE.PLAYING;
    this.stageStartTime = performance.now();

    document.getElementById("hud-stage").firstChild.textContent = `${level.name} `;
  }

  respawn() {
    if (!this.currentLevel || !this.player) return;
    this.attempts++;
    this.player.reset(this.currentLevel.playerStart);
    this.state = STATE.PLAYING;
  }

  _buildBlocks(blocks) {
    const geo = new THREE.BoxGeometry(BLOCK_SIZE * 0.96, 0.4, BLOCK_SIZE * 0.96);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a2a3d,
      flatShading: true,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, blocks.length);
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    blocks.forEach((b, i) => {
      dummy.position.set(b.x, b.y - 0.2, b.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      this.blockSet.add(`${b.x},${b.z}`);
    });

    this.scene.add(mesh);
    this.blockMesh = mesh;
  }

  _buildExit(exit) {
    const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffb020,
      emissive: 0xffb020,
      emissiveIntensity: 0.6,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(exit.x, 0.04, exit.z);
    this.scene.add(mesh);
    this.exitMesh = mesh;
    this.exitPos = exit;
  }

  _clearLevel() {
    if (this.blockMesh) {
      this.scene.remove(this.blockMesh);
      this.blockMesh.geometry.dispose();
      this.blockMesh.material.dispose();
      this.blockMesh = null;
    }
    if (this.exitMesh) {
      this.scene.remove(this.exitMesh);
      this.exitMesh = null;
    }
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
    this.blockSet.clear();
  }

  _checkFloor() {
    if (!this.player) return;
    const gx = Math.round(this.player.position.x);
    const gz = Math.round(this.player.position.z);
    const onBlock = this.blockSet.has(`${gx},${gz}`);
    if (!onBlock && !this.player.isFalling) {
      this.player.startFalling();
      this.state = STATE.FAILED;
      setTimeout(() => this.respawn(), 900); // 실패 후 짧은 재시작
    }
  }

  _checkExit() {
    if (!this.player || !this.exitPos) return;
    const dx = this.player.position.x - this.exitPos.x;
    const dz = this.player.position.z - this.exitPos.z;
    if (Math.hypot(dx, dz) < 0.4) {
      this.state = STATE.CLEAR;
    }
  }

  _loop() {
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === STATE.PLAYING && this.player) {
      this.player.update(dt, this.input.moveVec, this.cameraRig.yaw);
      this._checkFloor();
      if (this.player.position.y < FALL_LIMIT_Y) {
        this.respawn();
      }
      this._checkExit();
    }

    if (this.player) {
      this.cameraRig.update(dt, this.player.position);
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._loop);
  }
}
