// SMT World — UI glue: decision card, education ladder, chat, copy-trade waitlist.
const API = window.SMT_API || "";

// Called by world.js when a pair node is clicked.
window.renderDecision = function (d) {
  const color = { LONG: "#35d07f", SHORT: "#ff5c6c", WAIT: "#9aa3b2", BLOCK: "#6b7280" }[d.action] || "#9aa3b2";
  const votes = Object.entries(d.votes || {})
    .map(([name, v]) => `<li><span>${name}</span><b style="color:${v[0] === "LONG" ? "#35d07f" : v[0] === "SHORT" ? "#ff5c6c" : "#9aa3b2"}">${v[0]}</b> ${Math.round(v[1] * 100)}%</li>`)
    .join("");
  document.getElementById("decisionCard").innerHTML = `
    <div class="dhead"><h2>${d.pair}</h2>
      <span class="pill" style="background:${color}">${d.action} · ${Math.round(d.conf * 100)}%</span></div>
    <div class="risk">Risk score <b>${d.risk_score}</b>/100</div>
    <p class="why">${d.why}</p>
    <div class="muted small">What drove it (faithful):</div>
    <ul class="votes">${votes}</ul>`;
};

// Education ladder.
document.querySelectorAll(".ladder button").forEach((btn) =>
  btn.addEventListener("click", async () => {
    const el = document.getElementById("lesson");
    el.textContent = "…";
    try {
      const r = await fetch(`${API}/education/${btn.dataset.level}`);
      const j = await r.json();
      el.innerHTML = mdLite(j.lesson || "");
    } catch (e) {
      el.textContent = "Could not load lesson.";
    }
  })
);

// Chat-with-SMT.
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

// Copy-trade waitlist (client-only stub — no PII leaves the page in the demo).
document.getElementById("waitlist").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  document.getElementById("waitlistMsg").textContent = email
    ? `You're on the list — we'll ping you when WEEX copy-trade opens.`
    : "Enter an email to join.";
});

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
