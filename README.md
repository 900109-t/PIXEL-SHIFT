# PIXEL SHIFT

> "눈에 보이는 공간과 실제 공간은 다르다."

모바일 전용 픽셀풍 3D 착시 퍼즐 게임. Three.js 프론트엔드 + Node.js/Express/PostgreSQL(Prisma) 백엔드로 구성된 실제 동작하는 풀스택 웹게임입니다.

---

## 1. 프로젝트 소개

플레이어는 픽셀풍 3D 공간에서 카메라 각도, 원근, 가짜 벽 등 다양한 착시를 이용해 출구를 찾아야 합니다. 착시는 장식이 아니라 실제 충돌/이동 판정에 영향을 주는 핵심 게임 메커니즘입니다.

**참고 (범위 안내):** 요청하신 20개 스테이지 대신, 데이터 기반 구조 위에서 카메라 정렬(4~6), 가짜 벽(7~9), 숨겨진 길(10), 복합 착시(11~12) 스테이지를 포함한 **12개 스테이지**로 우선 구현했습니다. `public/js/levels.js`에 스테이지 객체를 추가하기만 하면 되므로 20개까지 확장하기 쉽습니다.

## 2. 주요 기능

- 모바일 세로 전용 UI, 가상 조이스틱 + 드래그 카메라 (Pointer Events, 멀티터치 안전)
- 착시 시스템: 카메라 정렬 다리, 가짜 벽, 숨겨진 길
- 12개 스테이지, 5단계 실습형 튜토리얼
- 회원가입/로그인/로그아웃 (bcrypt + HTTP-only 쿠키 세션)
- 스테이지별 최고 기록 저장, 서버 측 점수 계산/위변조 방지
- 전체/주간/스테이지/친구 랭킹 (DB 페이지네이션)
- 친구 검색/요청/수락/거절/삭제
- Rate Limit (Upstash Redis 기반, 키 없으면 인메모리로 자동 fallback), 입력 검증, 오프라인 안내, 전역 오류 처리

## 3. 기술 스택

- Frontend: HTML5, CSS3, Vanilla JS, Three.js (CDN)
- Backend: Node.js, Express.js
- DB: PostgreSQL + Prisma ORM
- Auth: bcryptjs, JWT + HTTP-only Cookie
- Rate Limit: Upstash Redis (`@upstash/ratelimit`), 인메모리 fallback
- Deploy: Railway

## 4. 프로젝트 구조

```
pixel-shift/
├── server.js
├── package.json
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── public/
│   ├── index.html
│   ├── css/ (reset, style, mobile)
│   └── js/  (main, game, renderer, camera, player, levels, illusion, input, ui, auth, friends, ranking)
└── src/
    ├── routes/ (auth, users, friends, ranking, stages)
    ├── middleware/ (auth, rateLimit)
    ├── db/ (prisma client)
    └── utils/ (validation, stageConfig)
```

## 5. 설치 방법

```bash
git clone <your-repo-url>
cd pixel-shift
npm install
cp .env.example .env
```

`.env`를 채웁니다:

```
DATABASE_URL=postgresql://user:password@localhost:5432/pixelshift
JWT_SECRET=아무-랜덤-문자열
COOKIE_SECRET=아무-랜덤-문자열
NODE_ENV=development
PORT=3000
DEV_MODE=true
```

## 6. 로컬 실행

```bash
npm run db:generate
npm run db:migrate:dev
npm run db:seed      # demo1~demo5 계정 생성 (비밀번호: demo1234)
npm run dev
```

`http://localhost:3000` 을 모바일 브라우저 창 크기(예: 390x844)로 열어 확인합니다. `DEV_MODE=true`일 때 스테이지 선택 화면에서 전체 스테이지가 해금됩니다.

## 7. Prisma 설정

`prisma/schema.prisma`가 `DATABASE_URL` 환경변수를 사용합니다. 모델: `User`, `StageScore`, `Friendship`, `Session`.

## 8. DB Migration

```bash
npx prisma migrate dev      # 개발
npx prisma migrate deploy   # production
```

## 9. 개발용 Seed

```bash
npm run db:seed
```

`NODE_ENV=production`에서는 자동으로 아무 것도 하지 않도록 막혀 있습니다.

## 10. 환경변수

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | PostgreSQL 연결 문자열 (Railway는 자동 제공) |
| `JWT_SECRET` | 세션 토큰 서명 키 |
| `COOKIE_SECRET` | 쿠키 서명 키 |
| `PORT` | 서버 포트 (Railway는 자동 주입) |
| `NODE_ENV` | development / production |
| `DEV_MODE` | true일 때 전체 스테이지 해금 등 개발 기능 활성화 |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (Rate Limit용, 비우면 인메모리로 자동 전환) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token |

## 11. Railway 배포

**STEP 1** GitHub Repository 생성 후 push
**STEP 2** [railway.app](https://railway.app) 접속 → New Project
**STEP 3** "Deploy from GitHub repo" 선택, 이 저장소 연결 (App Service 생성)
**STEP 4** 같은 프로젝트에 "New" → "Database" → "PostgreSQL" 추가
**STEP 5** [Upstash](https://upstash.com) 에서 무료 Redis 데이터베이스를 하나 만들고, "REST API" 탭에서 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` 값을 복사 (Railway Marketplace에도 Upstash Redis 템플릿이 있어 프로젝트 안에서 바로 추가할 수 있습니다)
**STEP 6** App Service → Variables 탭에서 아래 입력:

```
NODE_ENV=production
JWT_SECRET=...
COOKIE_SECRET=...
DEV_MODE=false
DATABASE_URL=${{Postgres.DATABASE_URL}}
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

(`Postgres`는 실제 DB 서비스 이름에 맞게 수정. Upstash를 Railway Marketplace로 추가했다면 `${{Upstash.UPSTASH_REDIS_REST_URL}}` 형태의 변수 참조도 가능합니다)

**STEP 7** Deploy 실행 (자동 트리거 또는 수동 Deploy)
**STEP 8** Deployments 탭에서 로그 확인
**STEP 9** App Service → Settings → Networking → "Generate Domain"으로 Public Domain 생성
**STEP 10** 최초 배포 후 마이그레이션 실행 (Railway CLI 사용):

```bash
railway login
railway link
railway run npx prisma migrate deploy
```

## 12. Railway PostgreSQL 연결

Postgres 서비스 추가 후, App Service의 `DATABASE_URL` 변수 값을 `${{Postgres.DATABASE_URL}}` 형태의 서비스 변수 참조로 설정하면 접속 정보가 바뀌어도 자동으로 반영됩니다.

## 13. Railway 변수 참조

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

값을 직접 복사-붙여넣기 하지 말고 참조 문법을 사용하는 것을 권장합니다.

## 14. Railway Public Domain

App Service → Settings → Networking에서 "Generate Domain" 클릭 시 `*.up.railway.app` 형태의 공개 URL이 생성됩니다.

## 15. 문제 해결

| 증상 | 원인/해결 |
|---|---|
| Build 실패 | `npm install` 로그 확인, Node 버전 18+ 확인 |
| Start 실패 | `package.json`의 `start` 스크립트가 `node server.js`인지 확인 |
| PORT 문제 | 코드에 포트를 하드코딩하지 말 것 — `process.env.PORT` 사용 확인 (이미 적용됨) |
| DATABASE_URL 문제 | Postgres 서비스 추가 여부, 변수 참조 문법 확인 |
| Prisma migration 실패 | `railway run npx prisma migrate deploy`로 Railway 환경변수 주입 후 재실행 |
| 환경변수 누락 | 서버가 production에서 필수 변수 누락 시 즉시 종료하며 로그에 누락 목록 출력 |
| 서비스 Crash | Deployments → 로그 확인, DB 연결/환경변수 우선 점검 |
| Public Domain 없음 | Networking 탭에서 수동으로 Generate Domain 필요 |
| Rate Limit이 인스턴스마다 따로 도는 것 같음 | `UPSTASH_REDIS_REST_URL`/`TOKEN` 미설정 시 인메모리로 동작 — Railway에서 인스턴스가 여러 개면 반드시 Upstash 연결 필요 |

## 16. API 목록

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/users/search?q=
GET    /api/users/:id

GET    /api/friends
GET    /api/friends/requests
POST   /api/friends/request
POST   /api/friends/:id/accept
POST   /api/friends/:id/reject
DELETE /api/friends/:id

GET    /api/ranking/global?page=
GET    /api/ranking/weekly?page=
GET    /api/ranking/stage/:stageId?page=
GET    /api/ranking/friends
GET    /api/ranking/me

POST   /api/stages/:stageId/complete
GET    /api/stages/:stageId/score
POST   /api/stages/tutorial-complete
```

모든 응답은 `{ success, data }` 또는 `{ success:false, error:{code,message} }` 형식입니다.

## 17. 테스트 방법

수동 API 테스트 예시 (curl, 쿠키 저장 필요):

```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"tester1","password":"password1","passwordConfirm":"password1"}'

curl -b cookies.txt http://localhost:3000/api/auth/me

curl -b cookies.txt -X POST http://localhost:3000/api/stages/1/complete \
  -H "Content-Type: application/json" \
  -d '{"elapsedMs":5000,"attempts":1}'

curl -b cookies.txt "http://localhost:3000/api/ranking/global"
```

앱 내 체크리스트: 회원가입 → 로그인 → 튜토리얼 → 스테이지 클리어 → 랭킹 확인 → 사용자 검색 → 친구 요청/수락 → 친구 랭킹 비교 → 로그아웃.
