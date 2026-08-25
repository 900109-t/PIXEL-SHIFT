window.PS = window.PS || {};

const PS_FRIENDS = { tab: "list" };
PS.friendsUI = PS_FRIENDS;

function timeAgo(dateStr) {
  if (!dateStr) return "오프라인";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 5) return "🟢 온라인";
  if (mins < 60) return `⚪ ${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `⚪ ${hours}시간 전`;
  return `⚪ ${Math.floor(hours / 24)}일 전`;
}

PS_FRIENDS.render = async function () {
  const listEl = document.getElementById("friends-list");
  const searchBox = document.getElementById("friend-search-box");
  searchBox.style.display = PS_FRIENDS.tab === "search" ? "block" : "none";
  listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">불러오는 중...</div>`;

  if (!PS.session.user) {
    listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">로그인이 필요합니다.</div>`;
    return;
  }

  if (PS_FRIENDS.tab === "list") {
    const res = await PS.apiFetch("/friends");
    if (!res.success) {
      listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">${res.error.message}</div>`;
      return;
    }
    if (res.data.friends.length === 0) {
      listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">아직 친구가 없습니다.</div>`;
      return;
    }
    listEl.innerHTML = res.data.friends
      .map(
        (f) => `
      <div class="list-row">
        <span class="name">${timeAgo(f.lastLoginAt)} ${escapeText(f.username)}</span>
        <span class="score">${f.totalScore}점</span>
      </div>`
      )
      .join("");
  } else if (PS_FRIENDS.tab === "requests") {
    const res = await PS.apiFetch("/friends/requests");
    if (!res.success) {
      listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">${res.error.message}</div>`;
      return;
    }
    if (res.data.requests.length === 0) {
      listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">대기 중인 요청이 없습니다.</div>`;
      return;
    }
    listEl.innerHTML = res.data.requests
      .map(
        (r) => `
      <div class="list-row">
        <span class="name">${escapeText(r.user.username)}</span>
        <button class="btn small primary" data-accept="${r.id}">수락</button>
        <button class="btn small danger" data-reject="${r.id}" style="margin-left:6px;">거절</button>
      </div>`
      )
      .join("");

    listEl.querySelectorAll("[data-accept]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await PS.apiFetch(`/friends/${btn.dataset.accept}/accept`, { method: "POST" });
        PS_FRIENDS.render();
      });
    });
    listEl.querySelectorAll("[data-reject]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await PS.apiFetch(`/friends/${btn.dataset.reject}/reject`, { method: "POST" });
        PS_FRIENDS.render();
      });
    });
  } else if (PS_FRIENDS.tab === "search") {
    listEl.innerHTML = "";
  }
};

function escapeText(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

PS_FRIENDS.doSearch = async function () {
  const q = document.getElementById("friend-search-input").value.trim();
  const listEl = document.getElementById("friends-list");
  if (q.length < 2) {
    PS.ui.toast("2자 이상 입력해주세요.");
    return;
  }
  const res = await PS.apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
  if (!res.success) {
    listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">${res.error.message}</div>`;
    return;
  }
  if (res.data.users.length === 0) {
    listEl.innerHTML = `<div class="pixel-sub" style="padding:20px;">검색 결과가 없습니다.</div>`;
    return;
  }
  listEl.innerHTML = res.data.users
    .map(
      (u) => `
    <div class="list-row">
      <span class="name">${escapeText(u.username)} · ${u.totalScore}점</span>
      <button class="btn small primary" data-request="${escapeText(u.username)}">친구 요청</button>
    </div>`
    )
    .join("");

  listEl.querySelectorAll("[data-request]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const res2 = await PS.apiFetch("/friends/request", {
        method: "POST",
        body: { receiverUsername: btn.dataset.request }
      });
      PS.ui.toast(res2.success ? "친구 요청을 보냈습니다." : res2.error.message);
    });
  });
};