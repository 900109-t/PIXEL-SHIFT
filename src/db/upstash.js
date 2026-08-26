const { Redis } = require("@upstash/redis");

let redis = null;

// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 이 둘 다 있어야 활성화된다.
// 로컬 개발에서 Upstash 계정이 없어도 서버가 죽지 않도록 없으면 null로 둔다.
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  });
} else {
  console.warn(
    "[upstash] UPSTASH_REDIS_REST_URL / TOKEN 이 설정되지 않아 Rate Limit이 인메모리 방식으로 동작합니다."
  );
}

module.exports = { redis, isEnabled: !!redis };