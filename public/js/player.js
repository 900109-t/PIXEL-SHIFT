window.PS = window.PS || {};

const PLAYER_RADIUS = 0.32;
const PLAYER_SPEED = 3.4;
const GRAVITY = 14;
const FALL_LIMIT_Y = -8;
const SUPPORT_EPS = 0.15;

class Player {
  constructor() {
    this.position = new THREE.Vector3(0, 1, 0);
    this.velocityY = 0;
    this.grounded = false;
    this.checkpoint = new THREE.Vector3(0, 1, 0);
  }

  spawn(pos) {
    this.position.set(pos.x, pos.y, pos.z);
    this.checkpoint.set(pos.x, pos.y, pos.z);
    this.velocityY = 0;
    this.grounded = true;
  }

  setCheckpoint(pos) {
    this.checkpoint.set(pos.x, pos.y, pos.z);
  }

  respawnAtCheckpoint() {
    this.position.copy(this.checkpoint);
    this.velocityY = 0;
    this.grounded = true;
  }

  // dx, dy: 조이스틱 입력(-1..1), cameraYawDeg: 카메라 기준 이동 방향 계산용
  update(dt, dx, dy, cameraYawDeg, illusionSystem, stage) {
    const yawRad = THREE.MathUtils.degToRad(cameraYawDeg);
    const forward = new THREE.Vector3(Math.sin(yawRad), 0, Math.cos(yawRad));
    const right = new THREE.Vector3(Math.cos(yawRad), 0, -Math.sin(yawRad));

    const moveX = right.x * dx + forward.x * -dy;
    const moveZ = right.z * dx + forward.z * -dy;
    const moveLen = Math.hypot(moveX, moveZ);

    let nextX = this.position.x;
    let nextZ = this.position.z;

    if (moveLen > 0.05) {
      const normX = (moveX / moveLen) * PLAYER_SPEED * dt;
      const normZ = (moveZ / moveLen) * PLAYER_SPEED * dt;
      nextX += normX;
      nextZ += normZ;
    }

    // 벽 충돌: solid=true 인 wall/falseWall만 검사 (falseWall은 illusion에서 solid=false로 처리되어 통과됨)
    const wallBoxes = this.collectSolidWallBoxes(stage, illusionSystem);
    const resolved = this.resolveWallCollision(nextX, nextZ, wallBoxes);
    this.position.x = resolved.x;
    this.position.z = resolved.z;

    // 지지대 검사 (바닥/다리/숨겨진 길)
    const support = this.findSupportAt(this.position.x, this.position.z, stage, illusionSystem);

    if (support) {
      this.grounded = true;
      this.velocityY = 0;
      this.position.y = support.top;

      if (support.tile.type === "trap") {
        return { failed: true, reason: "trap" };
      }
      if (support.tile.type === "checkpoint") {
        this.setCheckpoint({ x: this.position.x, y: this.position.y, z: this.position.z });
      }
    } else {
      this.grounded = false;
      this.velocityY -= GRAVITY * dt;
      this.position.y += this.velocityY * dt;
    }

    if (this.position.y < FALL_LIMIT_Y) {
      return { failed: true, reason: "fell" };
    }

    return { failed: false };
  }

  collectSolidWallBoxes(stage, illusionSystem) {
    const boxes = [];
    (stage.walls || []).forEach((w, idx) => {
      const entry = illusionSystem.wallEntries[idx];
      const solid = entry ? entry.solid : true;
      if (solid) {
        boxes.push({ minX: w.x - 0.5, maxX: w.x + 0.5, minZ: w.z - 0.5, maxZ: w.z + 0.5 });
      }
    });
    return boxes;
  }

  resolveWallCollision(x, z, boxes) {
    let px = x;
    let pz = z;
    for (const b of boxes) {
      const closestX = Math.max(b.minX, Math.min(px, b.maxX));
      const closestZ = Math.max(b.minZ, Math.min(pz, b.maxZ));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const dist = Math.hypot(dx, dz);
      if (dist < PLAYER_RADIUS && dist > 0.0001) {
        const push = (PLAYER_RADIUS - dist) / dist;
        px += dx * push;
        pz += dz * push;
      } else if (dist <= 0.0001) {
        // 완전히 겹친 경우 (드문 케이스) 살짝 뒤로 밀기
        px = this.position.x;
        pz = this.position.z;
      }
    }
    return { x: px, z: pz };
  }

  findSupportAt(x, z, stage, illusionSystem) {
    let best = null;
    stage.tiles.forEach((t, idx) => {
      const entry = illusionSystem.tileEntries[idx];
      const solid = entry ? entry.solid : true;
      if (!solid) return;
      if (x >= t.x - 0.5 && x <= t.x + 0.5 && z >= t.z - 0.5 && z <= t.z + 0.5) {
        const top = t.y + 1;
        if (this.position.y >= top - SUPPORT_EPS && this.velocityY <= 0.001) {
          if (!best || top > best.top) best = { top, tile: t };
        }
      }
    });
    return best;
  }
}

PS.Player = Player;
PS.PLAYER_RADIUS = PLAYER_RADIUS;