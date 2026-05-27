const app = document.getElementById("app");

const routes = [
  { key: "login", label: "تسجيل الدخول", public: true },
  { key: "register", label: "إنشاء حساب", public: true },
  { key: "dashboard", label: "لوحة التحكم" },
  { key: "courses", label: "الكورسات" },
  { key: "my-courses", label: "كورساتي" },
  { key: "wallet", label: "المحفظة" },
  { key: "exam-results", label: "النتائج" },
  { key: "admin", label: "الأدمن" },
];

const state = {
  route: location.hash.replace("#/", "") || "login",
  session: JSON.parse(sessionStorage.getItem("vanilla-session") || "null"),
  courses: [],
};

function saveSession(session) {
  state.session = session;
  sessionStorage.setItem("vanilla-session", JSON.stringify(session));
}

function clearSession() {
  state.session = null;
  sessionStorage.removeItem("vanilla-session");
}

function setRoute(route) {
  const allowed = new Set(routes.map((r) => r.key));
  const safeRoute = allowed.has(route) ? route : "dashboard";
  location.hash = `/${safeRoute}`;
}

window.addEventListener("hashchange", () => {
  state.route = location.hash.replace("#/", "") || "login";
  render();
});

async function api(path, { method = "GET", body } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const headers = { "Content-Type": "application/json" };
  try {
    const res = await fetch(path, {
      method,
      headers,
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "حدث خطأ في الطلب");
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("انتهت مهلة الطلب، حاول مرة أخرى");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function mount(html) {
  app.innerHTML = html;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidPhone(phone) {
  return /^01\d{9}$/.test(String(phone).trim());
}

function navTemplate() {
  const privateRoutes = routes.filter((r) => !r.public);
  return `
    <header class="nav">
      <div class="container nav-inner">
        <strong>منصة الجوهري — Vanilla</strong>
        <div class="tabs">
          ${privateRoutes
            .map(
              (r) => `
              <a class="tab ${state.route === r.key ? "active" : ""}" href="#/${r.key}">
                ${r.label}
              </a>`
            )
            .join("")}
        </div>
        <button class="btn secondary" id="logoutBtn">تسجيل خروج</button>
      </div>
    </header>
  `;
}

function authGuard() {
  const open = ["login", "register"];
  if (!state.session && !open.includes(state.route)) {
    setRoute("login");
    return false;
  }
  if (state.session && open.includes(state.route)) {
    setRoute("dashboard");
    return false;
  }
  return true;
}

function attachLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;
  logoutBtn.onclick = () => {
    clearSession();
    setRoute("login");
  };
}

function authShell(inner) {
  mount(`<section class="auth-wrap"><div class="card auth-card">${inner}</div></section>`);
}

function dashboardView() {
  const name = escapeHtml(state.session?.user?.name || "الطالب");
  return `
    ${navTemplate()}
    <main class="layout container">
      <section class="card">
        <h2 class="title">أهلاً ${name}</h2>
        <p class="muted">نسخة خفيفة وسريعة باستخدام HTML/CSS/JS فقط.</p>
      </section>
      <section class="grid cols-3">
        <article class="card"><h3>الكورسات</h3><p class="muted">استعراض والاشتراك في المواد.</p></article>
        <article class="card"><h3>المحفظة</h3><p class="muted">شحن ومتابعة الرصيد.</p></article>
        <article class="card"><h3>النتائج</h3><p class="muted">متابعة تقدمك ودرجاتك.</p></article>
      </section>
    </main>
  `;
}

function coursesView() {
  return `
    ${navTemplate()}
    <main class="layout container">
      <section class="card row">
        <div>
          <h2 class="title">الكورسات</h2>
          <p class="muted">جاري التحميل من API...</p>
        </div>
        <button class="btn" id="refreshCourses">تحديث</button>
      </section>
      <section class="grid cols-3" id="coursesGrid"></section>
      <div id="coursesMsg"></div>
    </main>
  `;
}

function myCoursesView() {
  return `
    ${navTemplate()}
    <main class="layout container">
      <section class="card">
        <h2 class="title">كورساتي</h2>
        <p class="muted">قائمة اشتراكاتك الحالية.</p>
        <div id="myCourses"></div>
      </section>
    </main>
  `;
}

function walletView() {
  const safeBalance = Number(state.session?.user?.balance ?? 0) || 0;
  return `
    ${navTemplate()}
    <main class="layout container">
      <section class="grid cols-3">
        <article class="card">
          <h2 class="title">شحن بكود السنتر</h2>
          <form id="centerCodeForm" class="form-grid">
            <label>الكود</label>
            <input name="code" placeholder="GHRXXXXXXXX" required />
            <button class="btn" type="submit">استرداد</button>
          </form>
        </article>
        <article class="card">
          <h2 class="title">شحن فوري</h2>
          <form id="fawryForm" class="form-grid">
            <label>المبلغ</label>
            <input name="amount" type="number" min="10" required />
            <button class="btn" type="submit">إنشاء عملية</button>
          </form>
        </article>
        <article class="card">
          <h2 class="title">الرصيد</h2>
          <p class="muted">المتوفر حاليًا</p>
          <div class="pill">${safeBalance} جنيه</div>
        </article>
      </section>
      <div id="walletMsg"></div>
    </main>
  `;
}

function examResultsView() {
  return `
    ${navTemplate()}
    <main class="layout container">
      <section class="card">
        <h2 class="title">نتائج الاختبارات</h2>
        <p class="muted">يمكن ربط هذه الصفحة مباشرة بواجهة نتائجك الفعلية.</p>
      </section>
    </main>
  `;
}

function adminView() {
  return `
    ${navTemplate()}
    <main class="layout container">
      <section class="card">
        <h2 class="title">إدارة الأكواد</h2>
        <form id="adminCodeForm" class="form-grid">
          <label>عدد الأكواد</label>
          <input name="count" type="number" min="1" value="5" />
          <label>القيمة (جنيه)</label>
          <input name="amount" type="number" min="10" value="100" />
          <button class="btn" type="submit">توليد الأكواد</button>
        </form>
        <div id="adminMsg"></div>
      </section>
    </main>
  `;
}

function loginView() {
  authShell(`
    <h1 class="title">تسجيل الدخول</h1>
    <p class="muted">نسخة Vanilla متوافقة مع نفس الباك-إند.</p>
    <form id="loginForm" class="form-grid">
      <label>رقم الهاتف</label>
      <input name="phone" dir="ltr" placeholder="01012345678" required />
      <label>كلمة المرور</label>
      <input name="password" type="password" required />
      <button class="btn" type="submit">دخول</button>
      <a class="tab" href="#/register">إنشاء حساب جديد</a>
    </form>
    <div id="loginMsg"></div>
  `);
}

function registerView() {
  authShell(`
    <h1 class="title">إنشاء حساب</h1>
    <p class="muted">تسجيل سريع باستخدام واجهة API الحالية.</p>
    <form id="registerForm" class="form-grid">
      <label>الاسم</label>
      <input name="name" required />
      <label>رقم الهاتف</label>
      <input name="phone" dir="ltr" placeholder="01012345678" required />
      <label>كلمة المرور</label>
      <input name="password" type="password" minlength="6" required />
      <button class="btn" type="submit">إنشاء الحساب</button>
      <a class="tab" href="#/login">لديك حساب بالفعل؟</a>
    </form>
    <div id="registerMsg"></div>
  `);
}

function formDataObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function message(target, text, type = "error") {
  const el = document.getElementById(target);
  if (!el) return;
  const safeType = type === "success" ? "success" : "error";
  el.innerHTML = `<div class="${safeType}">${escapeHtml(text)}</div>`;
}

async function bindLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const body = formDataObject(form);
      if (!isValidPhone(body.phone)) throw new Error("رقم الهاتف غير صحيح");
      if (String(body.password || "").length < 6) throw new Error("كلمة المرور قصيرة");
      const res = await api("/api/auth/signin", { method: "POST", body });
      saveSession({
        user: res.user || { name: body.phone, balance: 0 },
      });
      setRoute("dashboard");
    } catch (err) {
      message("loginMsg", err.message);
    }
  };
}

async function bindRegister() {
  const form = document.getElementById("registerForm");
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const body = formDataObject(form);
      if (!body.name || String(body.name).trim().length < 2) throw new Error("الاسم قصير جدًا");
      if (!isValidPhone(body.phone)) throw new Error("رقم الهاتف غير صحيح");
      if (String(body.password || "").length < 6) throw new Error("كلمة المرور قصيرة");
      await api("/api/auth/register", { method: "POST", body });
      message("registerMsg", "تم إنشاء الحساب بنجاح", "success");
      setTimeout(() => setRoute("login"), 500);
    } catch (err) {
      message("registerMsg", err.message);
    }
  };
}

async function bindCourses() {
  const grid = document.getElementById("coursesGrid");
  const msg = document.getElementById("coursesMsg");
  if (!grid || !msg) return;

  async function load() {
    try {
      const res = await api("/api/courses");
      state.courses = Array.isArray(res) ? res : res.courses || [];
      if (!state.courses.length) {
        msg.innerHTML = `<div class="error">لا توجد كورسات متاحة الآن.</div>`;
        grid.innerHTML = "";
        return;
      }
      grid.innerHTML = state.courses
        .map(
          (c) => `
          <article class="card">
            <div class="row">
              <h3>${escapeHtml(c.title || "بدون عنوان")}</h3>
              <span class="pill">${Number(c.price ?? 0) || 0} جنيه</span>
            </div>
            <p class="muted">${escapeHtml(c.description || "")}</p>
            <button class="btn subscribeBtn" data-id="${encodeURIComponent(String(c.id))}">اشترك الآن</button>
          </article>
      `
        )
        .join("");
      msg.innerHTML = "";
      document.querySelectorAll(".subscribeBtn").forEach((btn) => {
        btn.onclick = async () => {
          try {
            const courseId = btn.dataset.id || "";
            if (!courseId) throw new Error("معرف الكورس غير صالح");
            await api(`/api/courses/${courseId}/subscribe`, { method: "POST" });
            message("coursesMsg", "تم الاشتراك بنجاح", "success");
          } catch (err) {
            message("coursesMsg", err.message);
          }
        };
      });
    } catch (err) {
      msg.innerHTML = `<div class="error">${err.message}</div>`;
    }
  }

  document.getElementById("refreshCourses").onclick = load;
  await load();
}

function bindWallet() {
  const centerCodeForm = document.getElementById("centerCodeForm");
  const fawryForm = document.getElementById("fawryForm");
  if (centerCodeForm) {
    centerCodeForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const body = formDataObject(centerCodeForm);
        if (!/^[A-Za-z0-9-]{6,32}$/.test(String(body.code || "").trim())) {
          throw new Error("كود السنتر غير صالح");
        }
        const res = await api("/api/wallet/center-code", { method: "POST", body });
        message("walletMsg", `تمت إضافة ${res.amount || 0} جنيه`, "success");
      } catch (err) {
        message("walletMsg", err.message);
      }
    };
  }
  if (fawryForm) {
    fawryForm.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const body = formDataObject(fawryForm);
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount < 10 || amount > 100000) {
          throw new Error("المبلغ غير صالح");
        }
        const res = await api("/api/wallet/fawry", { method: "POST", body });
        message("walletMsg", `تم إنشاء العملية: ${res.referenceNumber || "تم"}`, "success");
      } catch (err) {
        message("walletMsg", err.message);
      }
    };
  }
}

function bindAdmin() {
  const form = document.getElementById("adminCodeForm");
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const body = formDataObject(form);
      const count = Number(body.count);
      const amount = Number(body.amount);
      if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error("عدد أكواد غير صالح");
      if (!Number.isFinite(amount) || amount < 10 || amount > 100000) throw new Error("قيمة غير صالحة");
      const res = await api("/admin/api/center-codes", { method: "POST", body });
      message("adminMsg", `تم توليد ${res.created || body.count} كود`, "success");
    } catch (err) {
      message("adminMsg", err.message);
    }
  };
}

async function bindMyCourses() {
  const target = document.getElementById("myCourses");
  if (!target) return;
  try {
    const res = await api("/api/user/stats");
    const courses = res?.courses || [];
    if (!courses.length) {
      target.innerHTML = `<div class="error">لا توجد اشتراكات بعد.</div>`;
      return;
    }
    target.innerHTML = `<div class="grid">${courses
      .map(
        (c) =>
          `<div class="card row"><strong>${escapeHtml(c.title)}</strong><span class="pill">${Number(c.progress || 0) || 0}%</span></div>`
      )
      .join("")}</div>`;
  } catch (err) {
    target.innerHTML = `<div class="error">${err.message}</div>`;
  }
}

async function render() {
  if (!authGuard()) return;
  switch (state.route) {
    case "login":
      loginView();
      await bindLogin();
      break;
    case "register":
      registerView();
      await bindRegister();
      break;
    case "dashboard":
      mount(dashboardView());
      attachLogout();
      break;
    case "courses":
      mount(coursesView());
      attachLogout();
      await bindCourses();
      break;
    case "wallet":
      mount(walletView());
      attachLogout();
      bindWallet();
      break;
    case "my-courses":
      mount(myCoursesView());
      attachLogout();
      await bindMyCourses();
      break;
    case "exam-results":
      mount(examResultsView());
      attachLogout();
      break;
    case "admin":
      mount(adminView());
      attachLogout();
      bindAdmin();
      break;
    default:
      setRoute("dashboard");
  }
}

render();
