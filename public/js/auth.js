window.PS = window.PS || {};

// 모든 API 호출을 감싸는 공통 fetch 래퍼.
// - HTTP-only 쿠키 인증이므로 credentials: "include" 필수
// - 표준 응답 포맷 { success, data } / { success:false, error } 을 그대로 반환
PS.apiFetch = async function (path, options = {}) {
  if (!navigator.onLine) {
    PS.ui.setOfflineBanner(true);
    return { success: false, error: { code: "OFFLINE", message: "온라인 연결이 필요합니다." } };
  }

  try {
    const res = await fetch(`/api${path}`, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    let json;
    try {
      json = await res.json();
    } catch (e) {
      return { success: false, error: { code: "PARSE_ERROR", message: "서버에 연결할 수 없습니다." } };
    }

    PS.ui.setOfflineBanner(false);
    return json;
  } catch (err) {
    PS.ui.setOfflineBanner(true);
    return { success: false, error: { code: "NETWORK_ERROR", message: "서버에 연결할 수 없습니다." } };
  }
};

const PS_AUTH = {};
PS.auth = PS_AUTH;

PS_AUTH.fetchMe = async function () {
  const res = await PS.apiFetch("/auth/me");
  if (res.success) {
    PS.session.user = res.data;
    return true;
  }
  PS.session.user = null;
  return false;
};

PS_AUTH.register = async function (username, password, passwordConfirm) {
  const res = await PS.apiFetch("/auth/register", {
    method: "POST",
    body: { username, password, passwordConfirm }
  });
  if (res.success) PS.session.user = res.data;
  return res;
};

PS_AUTH.login = async function (username, password) {
  const res = await PS.apiFetch("/auth/login", {
    method: "POST",
    body: { username, password }
  });
  if (res.success) PS.session.user = res.data;
  return res;
};

PS_AUTH.logout = async function () {
  await PS.apiFetch("/auth/logout", { method: "POST" });
  PS.session.user = null;
};