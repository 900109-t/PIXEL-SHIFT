const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// 필수 환경변수 체크 (production에서 누락 시 바로 실패시켜 원인 파악을 쉽게 함)
if (process.env.NODE_ENV === "production") {
  const required = ["DATABASE_URL", "JWT_SECRET", "COOKIE_SECRET"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[FATAL] 필수 환경변수 누락: ${missing.join(", ")}`);
    process.exit(1);
  }
}

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser(process.env.COOKIE_SECRET || "dev-cookie-secret"));

// 정적 파일 (게임 클라이언트)
app.use(express.static(path.join(__dirname, "public")));

// API 라우트
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/users", require("./src/routes/users"));
app.use("/api/friends", require("./src/routes/friends"));
app.use("/api/ranking", require("./src/routes/ranking"));
app.use("/api/stages", require("./src/routes/stages"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok", devMode: process.env.DEV_MODE === "true" } });
});

// SPA fallback: /api가 아닌 모든 경로는 index.html 반환
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 (API 전용)
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "존재하지 않는 API입니다." }
  });
});

// 전역 오류 처리 - 화면이 하얗게 멈추지 않도록 항상 JSON으로 응답
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({
    success: false,
    error: { code: "SERVER_ERROR", message: "서버 오류가 발생했습니다." }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PIXEL SHIFT server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
});
