const rateLimit = require("express-rate-limit");

const jsonHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: { code: "RATE_LIMITED", message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }
  });
};

// 로그인: 브루트포스 방지 - IP + username 조합 기준으로 짧은 시간에 소수 회만 허용
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
  keyGenerator: (req) => `${req.ip}:${(req.body && req.body.username) || ""}`
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

const friendRequestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

const scoreSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler
});

module.exports = {
  loginLimiter,
  registerLimiter,
  searchLimiter,
  friendRequestLimiter,
  scoreSubmitLimiter
};