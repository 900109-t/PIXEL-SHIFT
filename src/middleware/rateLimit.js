const rateLimit = require("express-rate-limit");
const { Ratelimit } = require("@upstash/ratelimit");
const { redis, isEnabled } = require("../db/upstash");

function rejectJson(res) {
  res.status(429).json({
    success: false,
    error: { code: "RATE_LIMITED", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }
  });
}

// Upstash 기반 리미터. window 예: "10 m", "1 h", "60 s"
function buildUpstashLimiter(prefix, limit, window, keyGenerator) {
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: false,
    prefix: `pixelshift:${prefix}`
  });

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const { success } = await ratelimit.limit(key);
      if (!success) return rejectJson(res);
      next();
    } catch (err) {
      // Upstash 장애 시에도 서비스 전체가 멈추지 않도록 통과시키고 로그만 남긴다.
      console.error("[upstash] rate limit 오류, 요청을 통과시킵니다:", err.message);
      next();
    }
  };
}

// Upstash 키가 없는 로컬 개발 환경을 위한 인메모리 fallback
function buildMemoryLimiter(windowMs, max, keyGenerator) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => rejectJson(res),
    keyGenerator: keyGenerator || ((req) => req.ip)
  });
}

function makeLimiter({ prefix, limit, window, windowMs, keyGenerator }) {
  if (isEnabled) {
    return buildUpstashLimiter(prefix, limit, window, keyGenerator);
  }
  return buildMemoryLimiter(windowMs, limit, keyGenerator);
}

// 로그인: 브루트포스 방지 - IP + username 조합 기준
const loginLimiter = makeLimiter({
  prefix: "login",
  limit: 10,
  window: "10 m",
  windowMs: 10 * 60 * 1000,
  keyGenerator: (req) => `${req.ip}:${(req.body && req.body.username) || ""}`
});

const registerLimiter = makeLimiter({
  prefix: "register",
  limit: 5,
  window: "1 h",
  windowMs: 60 * 60 * 1000,
  keyGenerator: (req) => req.ip
});

// 아래 세 개는 requireAuth 다음에 연결되므로 req.user를 키로 사용한다.
const searchLimiter = makeLimiter({
  prefix: "search",
  limit: 30,
  window: "60 s",
  windowMs: 60 * 1000,
  keyGenerator: (req) => (req.user ? req.user.id : req.ip)
});

const friendRequestLimiter = makeLimiter({
  prefix: "friend-request",
  limit: 20,
  window: "60 s",
  windowMs: 60 * 1000,
  keyGenerator: (req) => (req.user ? req.user.id : req.ip)
});

const scoreSubmitLimiter = makeLimiter({
  prefix: "score-submit",
  limit: 20,
  window: "60 s",
  windowMs: 60 * 1000,
  keyGenerator: (req) => (req.user ? req.user.id : req.ip)
});

module.exports = {
  loginLimiter,
  registerLimiter,
  searchLimiter,
  friendRequestLimiter,
  scoreSubmitLimiter
};