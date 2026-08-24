// 스테이지 데이터. 새 스테이지는 이 배열에 같은 구조로 추가한다.
// blocks: 밟을 수 있는 바닥/발판 좌표 (격자 단위, y는 높이)
// illusions: 착시 오브젝트 (STEP 7에서 본격 사용, 지금은 빈 배열)

export const LEVELS = [
  {
    id: 1,
    name: "STAGE 01",
    playerStart: { x: 0, y: 0.35, z: 0 },
    exit: { x: 0, y: 0.35, z: -6 },
    blocks: generateStraightPath(),
    illusions: [],
  },
];

function generateStraightPath() {
  const blocks = [];
  for (let z = 0; z >= -6; z--) {
    for (let x = -1; x <= 1; x++) {
      blocks.push({ x, y: 0, z });
    }
  }
  return blocks;
}

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}
