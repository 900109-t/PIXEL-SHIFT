const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;

function isValidUsername(username) {
  if (typeof username !== "string") return false;
  if (username.trim() !== username) return false;
  if (/\s/.test(username)) return false;
  return USERNAME_REGEX.test(username);
}

function isValidPassword(password) {
  if (typeof password !== "string") return false;
  return password.length >= 8 && password.length <= 128;
}

// HTML / XSS 방지: 표시용 문자열에서 위험 문자를 이스케이프
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidStageId(stageId, maxStage) {
  const n = Number(stageId);
  return Number.isInteger(n) && n >= 1 && n <= maxStage;
}

// 서버에서 클라이언트가 제출한 elapsedMs / attempts 가 상식적인 범위인지 검사
function isPlausibleCompletion({ elapsedMs, attempts }, minTimeMs) {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return false;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 9999) return false;
  if (elapsedMs < minTimeMs) return false; // 물리적으로 불가능한 최소 시간보다 빠름
  if (elapsedMs > 1000 * 60 * 60) return false; // 1시간 초과는 비정상으로 간주
  return true;
}

module.exports = {
  isValidUsername,
  isValidPassword,
  escapeHtml,
  isValidStageId,
  isPlausibleCompletion
};