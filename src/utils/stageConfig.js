// 스테이지별 "물리적으로 불가능한 최소 클리어 시간"(ms).
// 클라이언트가 조작해서 짧은 시간을 제출해도 이 값보다 짧으면 거부한다.
// 값은 대략적인 최단 경로 이동시간 + 여유값으로 설정.
const STAGE_MIN_TIME_MS = {
  1: 2000,
  2: 2500,
  3: 3000,
  4: 4000,
  5: 4500,
  6: 5000,
  7: 5000,
  8: 5500,
  9: 6000,
  10: 6000,
  11: 7000,
  12: 9000
};

const TOTAL_STAGES = Object.keys(STAGE_MIN_TIME_MS).length;

function minTimeFor(stageId) {
  return STAGE_MIN_TIME_MS[stageId] ?? 2000;
}

module.exports = { STAGE_MIN_TIME_MS, TOTAL_STAGES, minTimeFor };