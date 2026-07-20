// SMT World — UI glue: onboarding, decision card, education, chat, live tape, paper copy-trade.
const API = window.SMT_API || "";
const DIRCOLOR = { LONG: "#35d07f", SHORT: "#ff5c6c", WAIT: "#9aa3b2", BLOCK: "#6b7280" };

// ─────────────────────────────────────────────────────────────────────────────
// Decision card (called by world.js when a pair node is clicked).
// ─────────────────────────────────────────────────────────────────────────────
window.renderDecision = function (d) {
  const color = DIRCOLOR[d.action] || "#9aa3b2";
  const votes = Object.entries(d.votes || {})
    .map(([name, v]) => `<li><span>${name}</span><b style="color:${DIRCOLOR[v[0]] || "#9aa3b2"}">${v[0]}</b> ${Math.round(v[1] * 100)}%</li>`)
    .join("");
  document.getElementById("decisionCard").innerHTML = `
    <div class="dhead"><h2>${d.pair}</h2>
      <span class="pill" style="background:${color}">${d.action} · ${Math.round(d.conf * 100)}%</span></div>
    <div class="risk">Risk score <b>${d.risk_score}</b>/100</div>
    <p class="why">${d.why}</p>
    <div class="muted small">What drove it (faithful):</div>
    <ul class="votes">${votes}</ul>`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Live world poll — app.js OWNS this (no CDN deps), so the tape + copy-trade work
// even if the 3D module (three.js from a CDN) fails to load. The 3D is an optional
// consumer via window.renderWorld3D.
// ─────────────────────────────────────────────────────────────────────────────
window.SMT_WORLD = null;
let adminMode = false;
let _worldBooted = false;

function applyWorld(data) {
  if (!data?.pairs) return;
  window.SMT_WORLD = data;
  document.getElementById("brainSource").textContent = adminMode ? "admin · demo" : (data.source || "demo");
  renderTape(data);
  window.renderWorld3D?.(data);            // 3D is optional; never block the journey on it
  if (!_worldBooted) { _worldBooted = true; window.renderDecision?.(Object.values(data.pairs)[0]); }
  markCopyTrade();                         // re-mark paper positions on each refresh
  pingLive();
  const start = document.getElementById("ctStart");
  if (start) start.disabled = false;
}

function pollWorld() {
  fetch(`${API}/world`).then((r) => r.json()).then(applyWorld).catch((err) => {
    if (!_worldBooted) document.getElementById("decisionCard").innerHTML =
      `<div class="muted">Could not reach the API (${err}). Is the service running?</div>`;
  });
}
pollWorld();
setInterval(pollWorld, 20000);             // keep the world + tape live

function renderTape(data) {
  const tape = document.getElementById("tape");
  if (!tape || !data?.pairs) return;
  tape.innerHTML = Object.entries(data.pairs).map(([p, d]) =>
    `<button class="tape-item" data-pair="${p}" title="see why">
       <span class="tk">${p}</span>
       <span class="tv" style="color:${DIRCOLOR[d.action] || "#9aa3b2"}">${d.action}</span>
       <span class="tc">${Math.round(d.conf * 100)}%</span>
     </button>`).join("");
  tape.querySelectorAll(".tape-item").forEach((b) =>
    b.addEventListener("click", () => window.renderDecision?.(data.pairs[b.dataset.pair])));
}

let _liveT = null;
function pingLive() {
  const dot = document.getElementById("liveDot");
  if (!dot) return;
  dot.classList.add("on");
  clearTimeout(_liveT);
  _liveT = setTimeout(() => dot.classList.remove("on"), 22000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding gate — first visit only (persisted). Routes into the education ladder.
// ─────────────────────────────────────────────────────────────────────────────
(function onboarding() {
  const seen = localStorage.getItem("smt_onboarded");
  const ob = document.getElementById("onboard");
  if (!ob) return;
  if (!seen) ob.classList.remove("hidden");
  ob.querySelectorAll(".ob-opt").forEach((btn) =>
    btn.addEventListener("click", () => {
      localStorage.setItem("smt_onboarded", "1");
      ob.classList.add("hidden");
      if (btn.dataset.level) loadLesson(btn.dataset.level);
    }));
})();

// ─────────────────────────────────────────────────────────────────────────────
// Education ladder.
// ─────────────────────────────────────────────────────────────────────────────
async function loadLesson(level) {
  const el = document.getElementById("lesson");
  el.textContent = "…";
  try {
    const r = await fetch(`${API}/education/${level}`);
    const j = await r.json();
    el.innerHTML = mdLite(j.lesson || "");
  } catch (e) {
    el.textContent = "Could not load lesson.";
  }
}
document.querySelectorAll(".ladder button").forEach((btn) =>
  btn.addEventListener("click", () => loadLesson(btn.dataset.level)));

// ─────────────────────────────────────────────────────────────────────────────
// Chat-with-SMT.
// ─────────────────────────────────────────────────────────────────────────────
document.getElementById("chatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("chatInput");
  const log = document.getElementById("chatlog");
  const msg = input.value.trim();
  if (!msg) return;
  log.insertAdjacentHTML("beforeend", `<div class="me">${escapeHtml(msg)}</div>`);
  input.value = "";
  log.insertAdjacentHTML("beforeend", `<div class="smt" id="pending">…</div>`);
  log.scrollTop = log.scrollHeight;
  try {
    const r = await fetch(`${API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    });
    const j = await r.json();
    document.getElementById("pending").outerHTML = `<div class="smt">${mdLite(j.reply)}</div>`;
  } catch (e) {
    document.getElementById("pending").outerHTML = `<div class="smt">I'm offline right now.</div>`;
  }
  log.scrollTop = log.scrollHeight;
});

// ─────────────────────────────────────────────────────────────────────────────
// Simulated copy-trade — a working paper portfolio marked on REAL prices.
//   entry = price 24h ago (so P&L is immediately meaningful), marked live going forward.
//   Only LONG/SHORT calls are copied; WAIT is skipped by design. All client-side, no PII.
// ─────────────────────────────────────────────────────────────────────────────
const CT_KEY = "smt_copytrade";
const CT_START = 10000;

const ctState = () => { try { return JSON.parse(localStorage.getItem(CT_KEY)); } catch { return null; } };

async function fetchPrices() {
  try { return await (await fetch(`${API}/prices`)).json(); }
  catch { return null; }
}

document.getElementById("ctStart").addEventListener("click", async () => {
  const world = window.SMT_WORLD;
  if (!world?.pairs) return;
  const px = await fetchPrices();
  const positions = [];
  const perName = Object.entries(world.pairs).filter(([, d]) => d.action === "LONG" || d.action === "SHORT");
  if (!perName.length) { alert("SMT is WAITing on every pair right now — nothing to copy. That's a valid call!"); return; }
  const notional = CT_START / perName.length;
  for (const [pair, d] of perName) {
    const pr = px?.pairs?.[pair];
    const price = pr?.price ?? null;
    const chg = pr?.change24h ?? 0;
    const entry = price != null ? price / (1 + chg / 100) : null;   // ~price 24h ago
    positions.push({ pair, side: d.action, notional, entry });
  }
  localStorage.setItem(CT_KEY, JSON.stringify({ started: Date.now(), balance: CT_START, positions, live: !!px?.live }));
  showPortfolio();
  markCopyTrade();
});

document.getElementById("ctStop").addEventListener("click", () => {
  localStorage.removeItem(CT_KEY);
  document.getElementById("ctPortfolio").classList.add("hidden");
  document.getElementById("ctIntro").classList.remove("hidden");
});

function showPortfolio() {
  const has = !!ctState();
  document.getElementById("ctIntro").classList.toggle("hidden", has);
  document.getElementById("ctPortfolio").classList.toggle("hidden", !has);
}

async function markCopyTrade() {
  const st = ctState();
  if (!st) return;
  showPortfolio();
  const px = await fetchPrices();
  let totalPnl = 0;
  const rows = st.positions.map((p) => {
    const pr = px?.pairs?.[p.pair];
    const cur = pr?.price ?? null;
    let pnl = 0, pnlPct = 0;
    if (cur != null && p.entry) {
      const dir = p.side === "LONG" ? 1 : -1;
      pnlPct = dir * (cur - p.entry) / p.entry;
      pnl = p.notional * pnlPct;
    }
    totalPnl += pnl;
    const col = pnl >= 0 ? "#35d07f" : "#ff5c6c";
    return `<li>
      <span class="ctp-pair">${p.pair} <b style="color:${DIRCOLOR[p.side]}">${p.side}</b></span>
      <span class="ctp-mid muted small">${p.entry ? fmt(p.entry) : "—"} → ${cur ? fmt(cur) : "—"}</span>
      <span class="ctp-pnl" style="color:${col}">${(pnlPct * 100).toFixed(2)}%</span>
    </li>`;
  }).join("");
  const value = st.balance + totalPnl;
  const pnlPctTot = totalPnl / st.balance;
  const col = totalPnl >= 0 ? "#35d07f" : "#ff5c6c";
  document.getElementById("ctValue").textContent = fmt(value) + " units";
  const pnlEl = document.getElementById("ctPnl");
  pnlEl.textContent = `${totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)} (${(pnlPctTot * 100).toFixed(2)}%)`;
  pnlEl.style.color = col;
  document.getElementById("ctPositions").innerHTML = rows;
  document.getElementById("ctNote").innerHTML = px?.live === false
    ? "⚠ price feed offline — showing approx prices (P&amp;L paused)."
    : "Marked on real prices, updating live. Simulated · demo signals — not financial advice.";
}

function fmt(n) { return Number(n).toLocaleString(undefined, { maximumFractionDigits: n < 10 ? 4 : 2 }); }

// Re-mark on load + on a steady interval (prices tick even when the world is stable).
showPortfolio();
markCopyTrade();
setInterval(markCopyTrade, 30000);

// ─────────────────────────────────────────────────────────────────────────────
// Operator (admin) login — honest boundary demo. Real auth lives server-side in the
// private deployment; the public build has no real book to show, so we say so.
// ─────────────────────────────────────────────────────────────────────────────
document.getElementById("adminLink").addEventListener("click", (e) => {
  e.preventDefault();
  const pass = prompt("Operator login (sim account). In the private deployment this unlocks the real book behind auth.");
  if (pass === null) return;
  adminMode = true;
  document.getElementById("brainSource").textContent = "admin · demo";
  let banner = document.getElementById("adminBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "adminBanner";
    banner.className = "admin-banner";
    document.querySelector("header.topbar").after(banner);
  }
  banner.innerHTML = `<b>Operator view.</b> In SMT's private deployment this same UI serves the
    <b>real book</b> — live per-pair calls + PnL from the running daemon — behind authentication.
    This public build shows <b>demo signals on real prices</b> (the moat boundary is the auth line).`;
});

// ─────────────────────────────────────────────────────────────────────────────
function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
// Tiny markdown: headings, bold, line breaks. Enough for the corpus lessons.
function mdLite(s) {
  return escapeHtml(s)
    .replace(/^#{1,6}\s*(.+)$/gm, "<b>$1</b>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n{2,}/g, "<br><br>")
    .replace(/\n/g, "<br>");
}
