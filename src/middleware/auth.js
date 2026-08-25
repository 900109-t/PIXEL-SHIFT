const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../db/prisma");

const COOKIE_NAME = "pixelshift_session";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueSession(res, user) {
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
    }
  });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_TTL_MS,
    path: "/"
  });
}

async function clearSession(req, res) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (token) {
    try {
      await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    } catch (e) {
      // 세션이 이미 없어도 로그아웃은 성공으로 처리
    }
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

// 인증 필요 라우트에서 사용. 실패 시 401.
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." }
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "세션이 만료되었습니다. 다시 로그인해주세요." }
      });
    }

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: { code: "SESSION_EXPIRED", message: "세션이 만료되었습니다. 다시 로그인해주세요." }
      });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." }
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// 인증이 있으면 req.user를 채우지만 없어도 통과시킴 (선택적 인증)
async function optionalAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) } });
    if (session && session.expiresAt >= new Date()) {
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (user) req.user = user;
    }
  } catch (e) {
    // 무시하고 비로그인 상태로 진행
  }
  next();
}

module.exports = { requireAuth, optionalAuth, issueSession, clearSession, COOKIE_NAME };