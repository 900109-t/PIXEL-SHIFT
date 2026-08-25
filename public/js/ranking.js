window.PS = window.PS || {};

const PS_RANKING = { tab: "global", page: 1, totalPages: 1, stageId: 1 };
PS.rankingUI = PS_RANKING;

function escapeText(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function medal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank;
}

PS_RANKING.render = async function () {
  const listEl = document.getElementById("ranking-list");
  const pager = document.getElementById("ranking-pagination");
  listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">불러오는 중...</div>`;

  if (!PS.session.user) {
    listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">로그인이 필요합니다.</div>`;
    pager.style.display = "none";
    document.getElementById("my-rank-bar").textContent = "";
    return;
  }

  let path;
  if (PS_RANKING.tab === "global") path = `/ranking/global?page=${PS_RANKING.page}`;
  else if (PS_RANKING.tab === "weekly") path = `/ranking/weekly?page=${PS_RANKING.page}`;
  else if (PS_RANKING.tab === "stage") path = `/ranking/stage/${PS_RANKING.stageId}?page=${PS_RANKING.page}`;
  else path = `/ranking/friends`;

  const res = await PS.apiFetch(path);
  if (!res.success) {
    listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">${res.error.message}</div>`;
    return;
  }

  const entries = res.data.entries || [];
  pager.style.display = PS_RANKING.tab === "friends" ? "none" : "flex";
  if (PS_RANKING.tab !== "friends") {
    PS_RANKING.totalPages = res.data.totalPages || 1;
    document.getElementById("rank-page-label").textContent = `${res.data.page} / ${PS_RANKING.totalPages}`;
  }

  if (entries.length === 0) {
    listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">기록이 없습니다.</div>`;
  } else {
    listEl.innerHTML = entries
      .map(
        (e) => `
      <div class="list-row ${e.isMe ? "me-row" : ""}">
        <span class="rank">${medal(e.rank)}</span>
        <span class="name">${escapeText(e.username)}</span>
        <span class="score">${e.score}${e.bestTimeMs ? ` · ${(e.bestTimeMs / 1000).toFixed(2)}s` : ""}</span>
      </div>`
      )
      .join("");
  }

  if (PS_RANKING.tab !== "friends") {
    const meRes = await PS.apiFetch("/ranking/me");
    if (meRes.success) {
      document.getElementById(
        "my-rank-bar"
      ).textContent = `내 순위: #${meRes.data.rank} · 내 점수: ${meRes.data.score}`;
    }
  } else {
    document.getElementById("my-rank-bar").textContent = "";
  }
};

PS_RANKING.changePage = function (delta) {
  const next = PS_RANKING.page + delta;
  if (next < 1 || next > PS_RANKING.totalPages) return;
  PS_RANKING.page = next;
  PS_RANKING.render();
};