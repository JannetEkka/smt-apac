// SMT World — built on the Stitch "Market Ocean" design, made REAL.
// The visuals (fbm water shader, three.js lighthouse, glass islands, orbit forces)
// are from the Stitch export; everything is now data-driven from decisions.json
// (the daemon's live output) with an embedded fallback, and the bot's line is the
// actual SMT "why" — not a random quote. Never throws into the UI.

// ── Persona → world element (taught once, in the Tutorial) ────────────────
// "personas" is SMT's canonical jargon for the 6 signals; the ocean/lighthouse
// art is just the visual metaphor on top — the words the user reads stay "persona"
// and "Judge" (operator 2026-06-30).
const PERSONAS = {
  flow:      {n:"Flow",      icon:"cyclone",      tx:0,    ty:-210},
  regime:    {n:"Regime",    icon:"storm",        tx:182,  ty:-105},
  whale:     {n:"Whale",     icon:"water_drop",   tx:182,  ty:105},
  sentiment: {n:"Sentiment", icon:"mood",         tx:0,    ty:210},
  onchain:   {n:"OnChain",   icon:"link",         tx:-182, ty:105},
  technical: {n:"Technical", icon:"query_stats",  tx:-182, ty:-105},
};
const PERSONA_KEYS = ["flow","regime","whale","sentiment","onchain","technical"];

// island positions (from the Stitch layout — orbital scatter around the lighthouse)
const POS = {
  BTC:{x:-220,y:-180}, ETH:{x:220,y:-150}, SOL:{x:-300,y:50}, BNB:{x:280,y:120},
  LTC:{x:-110,y:235}, XRP:{x:150,y:255}, ADA:{x:-380,y:-110}, DOGE:{x:360,y:-230},
};
const PAIRS = Object.keys(POS);
const cls = a => a==="LONG"?"long":a==="SHORT"?"short":a==="BLOCK"?"block":"wait";
const pct = c => Math.round((c||0)*100)+"%";

// ── Embedded fallback (same shape as decisions.json) ──────────────────────
let DECISIONS = {
  BTC:{action:"LONG",conf:.74,drivers:["flow","technical"],votes:{flow:["LONG",.9,"Order book's stacking bids — buyers in control."],technical:["LONG",.8,"Reclaimed the 4H structure; clean higher-low."],whale:["LONG",.62,"Wallets quietly accumulating off-exchange."],onchain:["NEUTRAL",0,""],sentiment:["SHORT",.55,"Bearish as always — but I only get a veto."],regime:["NEUTRAL",0,""]},why:"Long — Flow & Technical carried it; the rest agreed or got vetoed."},
  ETH:{action:"WAIT",conf:.29,drivers:["flow"],votes:{flow:["LONG",.5,"Mild bid, nothing convincing."],technical:["NEUTRAL",0,""],whale:["NEUTRAL",0,""],onchain:["LONG",.4,"Slight Lido inflow uptick."],sentiment:["SHORT",.6,"Still doom, always doom."],regime:["NEUTRAL",0,""]},why:"Sitting out — under my conviction floor, not worth the fees."},
  BNB:{action:"SHORT",conf:.76,drivers:["flow","technical"],votes:{flow:["SHORT",.85,"Asks heavy — sellers leaning on it."],technical:["SHORT",.7,"Rejected the range high; wick city."],whale:["SHORT",.74,"Big wallet sent to an exchange — distribution."],onchain:["NEUTRAL",0,""],sentiment:["LONG",.4,"BNB? I mostly stay quiet."],regime:["NEUTRAL",0,""]},why:"Short — Flow & Technical carried it; the rest agreed or got vetoed."},
  SOL:{action:"LONG",conf:.7,drivers:["flow","technical"],votes:{flow:["LONG",.72,"Tape's lifting offers."],technical:["LONG",.88,"Textbook breakout retest."],whale:["NEUTRAL",0,""],onchain:["LONG",.45,"DEX volume above the 30d 80th pct."],sentiment:["NEUTRAL",0,""],regime:["LONG",.55,"Trending up."]},why:"Long — Flow & Technical carried it; it holds while the move clears fees."},
  XRP:{action:"WAIT",conf:.32,drivers:["flow"],votes:{flow:["LONG",.5,"Slight bid."],technical:["NEUTRAL",0,""],whale:["NEUTRAL",0,""],onchain:["NEUTRAL",0,""],sentiment:["NEUTRAL",0,"Regulatory pair — I abstain."],regime:["NEUTRAL",0,""]},why:"Sitting out — not worth the fees yet."},
  LTC:{action:"WAIT",conf:.2,drivers:["technical"],votes:{flow:["NEUTRAL",0,""],technical:["LONG",.45,"Minor coil."],whale:["NEUTRAL",0,""],onchain:["NEUTRAL",0,""],sentiment:["NEUTRAL",0,""],regime:["NEUTRAL",0,""]},why:"Sitting out — nothing lined up."},
  ADA:{action:"WAIT",conf:.3,drivers:["flow","whale"],votes:{flow:["LONG",.48,"Light bid."],technical:["NEUTRAL",0,""],whale:["LONG",.4,"Small accumulation."],onchain:["NEUTRAL",0,""],sentiment:["SHORT",.55,"Contra-pair: euphoria = top."],regime:["NEUTRAL",0,""]},why:"Sitting out — below the floor."},
  DOGE:{action:"BLOCK",conf:0,drivers:[],votes:{flow:["LONG",.55,"Thin meme bid trying to lift."],technical:["NEUTRAL",0,""],whale:["LONG",.4,"Small retail accumulation."],onchain:["NEUTRAL",0,""],sentiment:["NEUTRAL",0,""],regime:["NEUTRAL",0,""]},why:"Off the table — a safety rule learned from past losses."},
};

async function loadDecisions(){
  // smt-apac serves /world → {pairs:{PAIR:{action,conf,why,drivers,votes,risk_score}}, source}.
  // Same dashboard_dict shape as decisions.json, so map j.pairs straight into DECISIONS.
  try{ const ctl = new AbortController(); const to = setTimeout(()=>ctl.abort(), 4000);
    const r = await fetch("/world",{cache:"no-store", signal:ctl.signal}); clearTimeout(to);
    if(r.ok){ const j = await r.json();
      const pairs = j && j.pairs ? j.pairs : j;
      if(pairs && typeof pairs==="object" && Object.keys(pairs).length) DECISIONS = pairs; } }
  catch(e){ /* keep fallback — offline / no API / slow fetch (aborts at 4s) */ }
}
// first-timer? (no completed onboarding on this device yet)
const isFirstVisit = () => !localStorage.getItem("smt_onboarded");

// ── Enter the world ───────────────────────────────────────────────────────
async function enter(){
  // Capture first-visit state up front, and drive the tutorial off it INDEPENDENTLY
  // of the decisions fetch — a slow/blocked feed must never stop a newcomer from
  // landing on the tutorial (issue: "first time they should land on tutorial").
  const firstTime = isFirstVisit();
  const lz = document.getElementById("landing");
  lz.style.transition = "opacity 1s ease, transform 1.2s ease";
  lz.style.opacity = "0"; lz.style.transform = "scale(1.08)";
  setTimeout(()=>{ lz.classList.add("hidden"); }, 1000);
  document.getElementById("ocean").classList.remove("hidden");
  if(firstTime){ setTimeout(openGate, 700); }   // scheduled before any await — feed can't block it
  await loadDecisions();
  renderIslands();   // lighthouse is now the webp centerpiece (#lighthouseArt)
  startIslandDrift(); // gentle orbit around each island's base spot (paused while focusing)
}

// ── Gentle orbital drift — the islands slowly circle their home spot, like the 3D world.
// Each island offsets from its base POS by a small per-island ellipse; paused while a pair
// is focused so focus-centering isn't disturbed. Pure CSS-var nudge — no layout churn.
let _driftStarted = false;
function startIslandDrift(){
  if(_driftStarted) return; _driftStarted = true;
  const islandsEl = document.getElementById("islands");
  function frame(t){
    if(islandsEl && !islandsEl.classList.contains("focusing")){
      PAIRS.forEach((p,i)=>{
        const node = document.getElementById("isle-"+p);
        // don't drift a focused/selected island — keep it pinned (e.g. under the
        // walkthrough spotlight, and steadier when its detail panel is open)
        if(!node || node.classList.contains("focused") || node.classList.contains("sel")) return;
        const ph = i * 0.8;                                  // per-island phase offset
        const ox = Math.cos(t/4200 + ph) * 13;               // px, slow horizontal sway
        const oy = Math.sin(t/3600 + ph) * 11;               // px, slower vertical bob
        node.style.setProperty("--ix", (POS[p].x + ox).toFixed(1) + "px");
        node.style.setProperty("--iy", (POS[p].y + oy).toFixed(1) + "px");
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ── Islands (appearance = verdict) ────────────────────────────────────────
function renderIslands(){
  document.getElementById("islands").innerHTML = PAIRS.map((p,i)=>{
    const d = DECISIONS[p] || {action:"WAIT"}; const a = d.action; const c = cls(a);
    const caret = a==="LONG"?"▲":a==="SHORT"?"▼":"";
    const tip = a==="BLOCK"?"BLOCKED":a==="WAIT"?"WAIT":`${a} ${pct(d.conf)}`;
    const lock = a==="BLOCK"?`<span class="isle-lock">🔒</span>`:"";
    return `<div class="island-node ${c}" id="isle-${p}" onclick="focusIsland('${p}')"
              style="--ix:${POS[p].x}px;--iy:${POS[p].y}px">
        <div class="isle-inner" style="animation-delay:${(i*0.4).toFixed(1)}s">
          <div class="caret">${caret}</div>${lock}
          <img class="isle-art" src="assets/island_${c}.webp" alt="${p}" draggable="false"/>
          <div class="isle-label">${p}</div>
          <div class="isle-tip tip-${c}">${p} · ${tip}</div>
        </div>
      </div>`;
  }).join("");
}

// ── Focus: open the right-side detail panel (island + 6 personas + why) ────
let focused = null;
function focusIsland(p){
  if(didPan){ didPan=false; return; }     // the click that ends a drag shouldn't open a panel
  const d = DECISIONS[p]; if(!d) return;
  document.getElementById("account")?.classList.add("hidden");   // account + detail share the right slot
  document.getElementById("navAccount")?.classList.remove("active");
  if(focused) document.getElementById("isle-"+focused)?.classList.remove("sel");
  focused = p;
  document.getElementById("isle-"+p)?.classList.add("sel");

  const a = d.action, c = cls(a);
  document.getElementById("dArt").src = "assets/island_"+c+".webp";
  document.getElementById("dPair").textContent = p;
  const dv = document.getElementById("dVerdict"); dv.className = "dverdict "+c;
  dv.textContent = a==="BLOCK" ? "BLOCKED" : a==="WAIT" ? ("WAIT · "+pct(d.conf)) : (a+" · "+pct(d.conf));

  document.getElementById("dForces").innerHTML = PERSONA_KEYS.map(k=>{
    const f = PERSONAS[k]; const v = (d.votes||{})[k] || ["NEUTRAL",0,""];
    const vc = v[0]==="LONG"?"long":v[0]==="SHORT"?"short":"neutral";
    const lead = (d.drivers||[]).includes(k);
    const say = v[2] || "Quiet on this one.";
    return `<div class="dforce ${vc} ${lead?'lead':''}">
      <div class="ico"><span class="material-symbols-outlined">${f.icon}</span></div>
      <div class="meta"><div class="row1"><span class="nm">${f.n}</span>
        ${lead?'<span class="lead-tag">carried it</span>':''}<span class="vt">${v[0]}</span></div>
        <div class="say">${say}</div></div></div>`;
  }).join("");
  document.getElementById("dWhy").textContent = d.why || "";
  document.getElementById("detail").classList.remove("hidden");
}
function exitFocus(){
  if(focused){ document.getElementById("isle-"+focused)?.classList.remove("sel"); focused = null; }
  const det = document.getElementById("detail");
  det.classList.remove("walk-lit");   // drop any walkthrough panel-lift
  det.classList.add("hidden");
}

// ══════════════════════════════════════════════════════════════════════════
//  ONBOARDING — meet a zero-knowledge user at the door.
//  Gate (3 buttons) → Tutor chat (crash course) → World walkthrough.
//  The chat is GUIDED today (staged ELI5 + follow-up chips + keyword FAQ for
//  free text). The seam `answerFree()` is the single place to later swap in a
//  live LLM (Gemini proxy) without touching the rest.
// ══════════════════════════════════════════════════════════════════════════
function blurWorld(on){ document.getElementById("stage").classList.toggle("blurred", on);
  document.getElementById("sea").classList.toggle("blurred", on); }
// bottom-nav active tab (gold). "world" while exploring, "tutorial" while onboarding.
function setNav(view){
  document.getElementById("navWorld")?.classList.toggle("active", view==="world");
  document.getElementById("navTutorial")?.classList.toggle("active", view==="tutorial");
}
function openGate(){ exitFocus(); closeTutor(); document.getElementById("walk").classList.add("hidden");
  blurWorld(true); document.getElementById("gate").classList.remove("hidden"); setNav("tutorial"); }
function closeGate(){ document.getElementById("gate").classList.add("hidden"); }
// leave any onboarding overlay and return to the live world (World tab goes gold)
function backToWorld(){ closeGate(); closeTutor(); document.getElementById("walk").classList.add("hidden");
  blurWorld(false); exitFocus(); setNav("world"); }
function goWorld(){ backToWorld(); }   // bottom-nav "World" tab

// ── Crash-course content (SMT voice, ELI5) ────────────────────────────────
const TUTOR = {
  crypto:{ title:"Crypto, from scratch", lessons:[
    {say:["Crypto is just <b>money that lives on the internet</b> — not in any bank. Instead of one company keeping the record of who owns what, thousands of computers around the world keep it <b>together</b>, so no one can quietly change it."],
     chips:[["Why does it have value?","value"],["Who controls it?","control"],["Is it real money?","real"]]},
    {say:["Each crypto is a <b>coin</b> or <b>token</b> — like BTC (Bitcoin) or ETH (Ethereum). Think of them as different currencies, each with its own community and use."],
     chips:[["Why are there so many?","many"],["Coin vs token?","token"]]},
    {say:["Prices <b>move</b> when more people want to buy than sell (up) — or the reverse (down). News, big buyers, and overall mood shove them around, fast."],
     chips:[["What's a whale?","whale"],["Why so volatile?","volatile"]]},
    {say:["And it's not just individuals — <b>big institutions</b>, funds and companies trade too. They move serious money, so watching what they do matters. That's most of the picture."],
     chips:[["What's an institution?","institution"]]},
  ], bridgeSay:"That's crypto in a nutshell 🎉 Want me to show you how <b>trading</b> it works next — buying, selling, and reading the moves? Or jump straight into my world?",
     bridge:[["Teach me trading →","go:trading","act"],["I'm ready — dive in ⛵","go:walk","act"]] },

  trading:{ title:"Trading, from scratch", lessons:[
    {say:["Trading is making money from a price <b>moving</b>. I trade crypto <b>futures</b> — contracts that track a coin's price — so I never actually buy the coins; I just bet on the move, up <i>or</i> down."],
     chips:[["Profit when it falls?","short"],["Isn't this gambling?","gambling"]]},
    {say:["Going <b>long</b> = I bet the price rises. Going <b>short</b> = I bet it falls. Futures let me do <b>both</b>, on the 8 pairs I watch — depending on what I read."],
     chips:[["I already know stocks — same thing?","stock"]]},
    {say:["<b>Leverage</b> lets you trade with more than you put in — like sailing a bigger boat. 10× turns $100 into a $1,000 position: bigger wins, but it sinks faster if you're wrong. The cash you put down is your <b>margin</b>."],
     chips:[["What if I'm wrong?","liquidation"],["What's a pool?","pool"]]},
  ], bridgeSay:"Now you've got the basics 🙌 Ready to see how I read all of this — live — for eight coins at once?",
     bridge:[["Yes — dive in ⛵","go:walk","act"],["Wait, crypto basics first","go:crypto","act"]] },
};

// keyword FAQ for free-text questions (the one place to later swap for a live LLM)
const FAQ = [
  {k:["value","worth","backed","why valuable"], a:"Good one. Value comes from <b>scarcity + usefulness + trust</b> — same as gold or a currency. If lots of people want it and there's a limited supply (only 21M Bitcoin will ever exist), it holds value. No promise from a bank behind it."},
  {k:["control","who runs","government","owns it"], a:"<b>No single owner.</b> The network is run by thousands of independent computers agreeing on the record. That's the whole point — nobody can secretly print more or freeze your funds."},
  {k:["real","scam","fake"], a:"It's as real as the people and money using it — billions trade daily, and big institutions hold it. It's volatile and there are scams to avoid, but the technology itself is real and here to stay."},
  {k:["many","so many","thousands of coins"], a:"Most are experiments; a handful actually matter. I only watch 8 serious ones (BTC, ETH, BNB, SOL, LTC, XRP, ADA, DOGE) — the liquid, established names."},
  {k:["token","coin difference"], a:"Loosely: a <b>coin</b> has its own blockchain (Bitcoin, Ethereum); a <b>token</b> lives on top of someone else's chain. For trading, the distinction rarely matters — both just move in price."},
  {k:["whale"], a:"A <b>whale</b> is someone holding a huge amount — enough that when they buy or sell, the price visibly moves. I literally watch their wallets; that's my Whale persona. 🐋"},
  {k:["volatile","swings","risky","up and down"], a:"Crypto is young and trades 24/7 with no 'closing bell,' so it swings hard. That's risk — and also the opportunity I'm built to read."},
  {k:["institution","funds","companies"], a:"Banks, hedge funds and public companies now trade and hold crypto. They move size, so their flows leave footprints — which my Whale and OnChain personas try to catch."},
  {k:["short","fall","sell first","don't own"], a:"With futures, <b>shorting</b> just means opening a contract that <i>gains</i> when the price drops — no borrowing or owning coins needed. It's how I profit when prices fall, and I do it whenever my read says down."},
  {k:["gambl","luck","casino"], a:"Fair question — and honestly, trading <b>without</b> a process IS gambling. The difference is edge: I only act when several independent signals agree and the expected gain beats the fees. No edge → I wait."},
  {k:["stock","stocks","shares","equit"], a:"Smart question — not a silly one. The <b>idea</b> is the same (buy low, sell high), but crypto trades <b>24/7</b> with no earnings reports, is far more volatile, lets you short with leverage easily, and its value comes from usage + scarcity + sentiment rather than company profits. So the reflexes differ even if the instinct carries over."},
  {k:["leverage"], a:"Leverage = trading with borrowed size. 10× turns $100 into $1,000 of position. Multiplies wins AND losses — powerful, and the fastest way to get hurt if you over-do it."},
  {k:["margin"], a:"Margin is the cash you put down as collateral to open a leveraged trade. If the trade moves against you too far and your margin can't cover it, it gets <b>liquidated</b> (force-closed)."},
  {k:["liquidat","wrong","lose"], a:"If a leveraged trade moves against you past your margin, it's <b>liquidated</b> — auto-closed at a loss so you can't owe more. Higher leverage = liquidation hits sooner. It's why I size carefully."},
  {k:["pool","liquidity"], a:"A <b>liquidity pool</b> is a shared pot of coins that lets trades happen instantly without a matching buyer/seller. You don't need to manage one to follow me — just good to know the word."},
];

// ── Live Gemini chat (set CHAT_ENDPOINT once the function is deployed) ─────
// Cloudflare Pages (same origin): "/api/chat". GCP Cloud Function: its full URL.
// Empty → the chat runs the offline scripted course below (used as fallback too).
const CHAT_ENDPOINT = "https://smt-world-chat-259192424287.us-central1.run.app";
const useGemini = () => !!CHAT_ENDPOINT;
let chatHist = [];                 // [{role:"user"|"model", content}] for Gemini
function mdToHtml(s){ return String(s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")        // **bold**
  .replace(/\*(.+?)\*/g,"<i>$1</i>")            // *italic*
  .replace(/^\s*[*-]\s+/gm,"• ")                // stray list markers → bullet
  .replace(/\*/g,"")                            // drop any lone/truncated asterisk
  .replace(/\n/g,"<br>"); }
async function askSMT(){
  try{
    const r = await fetch(CHAT_ENDPOINT, {method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({track:tutorTrack, messages:chatHist})});
    const j = await r.json(); return j && j.reply ? j.reply : null;
  }catch(e){ return null; }
}
// one entry point for chip taps, free text and "next" — routes to Gemini or script
async function askGuide(userText, opts){
  opts = opts||{};
  if(userText && !opts.silent){ bubble("user", userText); }
  if(userText){ chatHist.push({role:"user", content:userText}); }
  if(useGemini()){
    const t = typingBubble();
    const reply = await askSMT();
    t.remove();
    const text = reply || "Hmm, my line to shore dropped for a second — ask me again? (Meanwhile: it's a simulated, risk-free world to learn in.)";
    if(reply) chatHist.push({role:"model", content:reply});
    bubble("smt", mdToHtml(text));
    geminiChips();
  } else {
    if(userText) bubble("smt", answerFree(userText));   // offline FAQ
  }
}
function typingBubble(){ const b=document.createElement("div"); b.className="bub smt"; b.textContent="…";
  const log=document.getElementById("chatlog"); log.appendChild(b); log.scrollTop=log.scrollHeight; return b; }
// Chips under a Gemini reply. Track-aware so the crypto course still offers the
// trading step (and vice-versa) instead of only ever jumping to the world walk.
function geminiChips(){
  const cross = tutorTrack==="crypto"
    ? ["Teach me trading →","go:trading","act"]      // crypto → trading (next step)
    : ["Wait, crypto basics first","go:crypto","act"];
  setChips([["Give me an example","ex"], cross, ["I'm ready — dive in ⛵","go:walk","act"]]);
}

let tutorTrack=null, lessonIdx=0;
function startTutor(track){
  closeGate(); tutorTrack=track; lessonIdx=-1; chatHist=[];
  document.getElementById("tutorTitle").textContent = TUTOR[track].title;
  document.getElementById("chatlog").innerHTML = "";
  document.getElementById("gotIt").style.display = "";
  document.getElementById("tutor").classList.remove("hidden");
  if(useGemini()){
    bubble("smt", track==="crypto" ? "Perfect — we'll start at zero, no jargon. Ask me anything. 🌊"
                                   : "Great — let's demystify trading. Curiosity is welcome.");
    askGuide(track==="crypto" ? "I'm brand new to crypto. Start me from the very beginning."
                              : "I'm new to trading. Start me from the very beginning.", {silent:true});
  } else {
    bubble("smt", track==="crypto"
      ? "Perfect — we'll start at zero, no jargon. Ask me anything as we go. 🌊"
      : "Great — let's demystify trading. Curiosity is welcome; interrupt me any time.");
    nextLesson();
  }
}
function closeTutor(){ document.getElementById("tutor").classList.add("hidden"); }
function bubble(who, html){
  const b=document.createElement("div"); b.className="bub "+who; b.innerHTML=html;
  const log=document.getElementById("chatlog"); log.appendChild(b); log.scrollTop=log.scrollHeight;
}
function setChips(list){
  document.getElementById("chips").innerHTML = (list||[]).map((c,i)=>
    `<button class="chip2 ${c[2]||''}" onclick="chipTap(${i})">${c[0]}</button>`).join("");
  window._chips = list||[];
}
function chipTap(i){
  const c = window._chips[i]; if(!c) return;
  if(c[1] && c[1].startsWith("go:")){ const dest=c[1].slice(3);
    bubble("user", c[0]);
    if(dest==="walk"){ closeTutor(); startWalk(); } else { startTutor(dest); } return; }
  if(useGemini()){ askGuide(c[0]); return; }
  bubble("user", c[0]);
  bubble("smt", answerFree(c[1]));
}
function nextLesson(){
  if(useGemini()){ askGuide("Got it — what's the next small step?"); return; }
  const t = TUTOR[tutorTrack]; lessonIdx++;
  if(lessonIdx < t.lessons.length){
    const l = t.lessons[lessonIdx];
    l.say.forEach(s=>bubble("smt", s));
    setChips(l.chips);
    document.getElementById("gotIt").textContent = lessonIdx===t.lessons.length-1 ? "Makes sense →" : "I've got it →";
  } else {
    bubble("smt", t.bridgeSay); setChips(t.bridge);
    document.getElementById("gotIt").style.display="none";
  }
}
// free-text answer — TODAY: keyword FAQ. LATER: replace body with a Gemini call.
function answerFree(keyOrText){
  const q = String(keyOrText).toLowerCase();
  for(const f of FAQ){ if(f.k.some(kw=>q.includes(kw))) return f.a; }
  return "Love the curiosity — that one's a bit deeper than my starter notes go. The honest best answer: watch me actually trade it in a minute and it'll click. (Soon I'll answer anything here directly.) Anything else for now?";
}
function sendUser(){
  const inp=document.getElementById("tutorInput"); const t=(inp.value||"").trim(); if(!t) return;
  inp.value="";
  if(useGemini()){ askGuide(t); return; }
  bubble("user", t); bubble("smt", answerFree(t));
}

// ── World walkthrough (guided coachmarks over the REAL elements) ──────────
const WALK = [
  {text:"Welcome to my world. This whole ocean is the <b>live crypto market</b> — always moving."},
  {sel:"#lighthouseArt", center:true, r:110, text:"That lighthouse at the centre is <b>me — the Judge</b>. I weigh every signal and ring the verdict."},
  {sel:"#isle-BTC", text:"Each island is a <b>coin</b>. Its look is my call: <b style='color:#52ddb4'>green &amp; rising</b> = buying, <b style='color:#ffb4ab'>red</b> = selling, dim = waiting."},
  {sel:"#isle-DOGE", text:"A <b>locked</b> island means a safety rule forbids that trade — even a loud signal can't open it. 🔒"},
  {action:"focusBTC", sel:"#isle-BTC", text:"Tap an island — say <b>BTC</b> here — and the panel on the right lights up with my <b>six personas</b>: each a reason, coloured by its vote (green = bullish, red = bearish, faded = quiet). The <b>gold</b> one carried the call, and you get the plain-English why."},
  {action:"exitFocus", text:"That's the whole idea — every call, every reason, in the open. It's a <b>simulated, risk-free</b> account. Go read the water. ⛵"},
];
let walkIdx=-1;
function startWalk(){ closeGate(); closeTutor(); blurWorld(false);
  document.getElementById("walk").classList.remove("hidden"); walkIdx=-1; walkNext(); }
function walkNext(){
  walkIdx++;
  if(walkIdx>=WALK.length){ endWalk(); return; }
  const step = WALK[walkIdx];
  if(step.action==="focusBTC"){ didPan=false; focusIsland("BTC");
    // raise the detail panel above the walkthrough dim so it reads as "focused"
    // (otherwise the spotlight overlay greys it out — issue: "side panel not focused")
    document.getElementById("detail")?.classList.add("walk-lit"); }
  if(step.action==="exitFocus") exitFocus();
  document.getElementById("coachText").innerHTML = step.text;
  document.getElementById("coachDots").innerHTML = WALK.map((_,i)=>`<i class="${i===walkIdx?'on':''}"></i>`).join("");
  document.querySelector("#walk .coach-nav button").textContent = walkIdx===WALK.length-1 ? "Explore ⛵" : "Next →";
  positionCoach(step);
}
function positionCoach(step){
  const spot=document.getElementById("spot"), coach=document.getElementById("coach");
  let cx=innerWidth/2, cy=innerHeight/2, r=step.r||0, rect=null;
  if(step.sel){ const el=document.querySelector(step.sel); if(el){ rect=el.getBoundingClientRect();
    cx=rect.left+rect.width/2; cy=rect.top+rect.height/2; r=step.center?(step.r||90):Math.max(rect.width,rect.height)/2+14; } }
  if((step.sel||step.center) && r){ spot.style.opacity="1"; spot.style.width=spot.style.height=(r*2)+"px";
    spot.style.left=(cx-r)+"px"; spot.style.top=(cy-r)+"px"; }
  else { spot.style.opacity="0"; }
  // place the coach card clear of the spotlight (below if room, else above; clamp on screen)
  const cw=300, ch=150, below=cy+r+16;
  let top = (below+ch<innerHeight) ? below : Math.max(16, cy-r-ch-16);
  if(!step.sel && !step.center) top = innerHeight/2 - ch/2;
  let left = Math.min(Math.max(16, cx-cw/2), innerWidth-cw-16);
  coach.style.top=top+"px"; coach.style.left=left+"px";
}
function endWalk(){ document.getElementById("walk").classList.add("hidden"); blurWorld(false); exitFocus();
  setNav("world"); localStorage.setItem("smt_onboarded","1"); }
addEventListener("resize", ()=>{ if(!document.getElementById("walk").classList.contains("hidden") && walkIdx>=0) positionCoach(WALK[walkIdx]); });

document.getElementById("tutorInput")?.addEventListener("keydown", e=>{ if(e.key==="Enter") sendUser(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape"){ backToWorld(); } });

// ── Movable map: drag-to-pan + gentle parallax + responsive scale ─────────
let panX=0, panY=0, parX=0, parY=0;            // pan = drag offset · par = mouse parallax
let dragging=false, didPan=false, dragSX=0, dragSY=0, panSX=0, panSY=0;
const isTouch = matchMedia("(pointer:coarse)").matches;
function mapScale(){ return Math.max(.5, Math.min(1, innerWidth/1080)); }    // shrink archipelago on small screens
function clampPan(){ const lim = innerWidth<700 ? 240 : 460;                // keep the map from flying off-screen
  panX=Math.max(-lim,Math.min(lim,panX)); panY=Math.max(-lim,Math.min(lim,panY)); }
function applyMap(){ const el=document.getElementById("islands");
  if(el) el.style.transform=`translate(${panX+parX}px,${panY+parY}px) scale(${mapScale()})`; }

function onDown(e){ if(focused) return; dragging=true; didPan=false;
  dragSX=e.clientX; dragSY=e.clientY; panSX=panX; panSY=panY; }
function onMove(e){
  if(dragging){ const dx=e.clientX-dragSX, dy=e.clientY-dragSY;
    if(Math.abs(dx)+Math.abs(dy)>6) didPan=true;                           // distinguish a pan from a tap
    panX=panSX+dx; panY=panSY+dy; clampPan(); applyMap(); return; }
  if(!isTouch && !focused){ parX=(e.clientX-innerWidth/2)/60; parY=(e.clientY-innerHeight/2)/60; applyMap(); }
}
(function initMap(){
  const stage=document.getElementById("stage"); if(!stage) return;
  stage.style.touchAction="none"; stage.style.cursor="grab";
  stage.addEventListener("pointerdown", e=>{ onDown(e); if(!focused) stage.style.cursor="grabbing"; });
  addEventListener("pointermove", onMove);
  addEventListener("pointerup", ()=>{ dragging=false; stage.style.cursor="grab"; });
  addEventListener("resize", applyMap); applyMap();
  if(innerWidth<640) document.getElementById("legend")?.classList.add("collapsed");  // declutter on phones
})();

// ── three.js lighthouse (from the Stitch export) ──────────────────────────
function initLighthouse(){
  const container = document.getElementById("lighthouse3d");
  if(!container || typeof THREE==="undefined" || container.dataset.init) return;
  container.dataset.init = "1";
  const w = innerWidth, h = innerHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
  renderer.setSize(w, h); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  container.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff,0.6));
  const dir = new THREE.DirectionalLight(0xffffff,0.8); dir.position.set(5,10,5); scene.add(dir);
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.7,2,8), new THREE.MeshPhongMaterial({color:0x253b53}));
  g.add(base);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.4,12,12), new THREE.MeshPhongMaterial({color:0xd4af37,emissive:0xd4af37}));
  top.position.y = 1.2; g.add(top);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(2,10,32), new THREE.MeshBasicMaterial({color:0xd4af37,transparent:true,opacity:0.28,side:THREE.DoubleSide}));
  beam.rotation.x = Math.PI/2; beam.position.z = 5; g.add(beam);
  scene.add(g);
  camera.position.set(0,9,15); camera.lookAt(0,0,0);
  (function loop(){ requestAnimationFrame(loop); g.rotation.y += 0.01; renderer.render(scene,camera); })();
  addEventListener("resize", ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
}

// ── fbm water shader (from the Stitch export) ─────────────────────────────
(function initSea(){
  const canvas = document.getElementById("sea"); if(!canvas) return;
  function size(){ const dpr=Math.min(devicePixelRatio,2), w=Math.floor(innerWidth*dpr), h=Math.floor(innerHeight*dpr);
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w; canvas.height=h; } }
  addEventListener("resize", size); size();
  const gl = canvas.getContext("webgl")||canvas.getContext("experimental-webgl"); if(!gl) return;
  const vs=`attribute vec2 a_position;varying vec2 v;void main(){v=a_position*0.5+0.5;gl_Position=vec4(a_position,0.0,1.0);}`;
  const fs=`precision highp float;varying vec2 v;uniform float u_time;
  float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
  float sn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    float a=noise(i),b=noise(i+vec2(1,0)),c=noise(i+vec2(0,1)),d=noise(i+vec2(1,1));
    return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
  float fbm(vec2 p){float val=0.0,a=0.5;for(int i=0;i<5;i++){val+=a*sn(p);p*=2.0;a*=0.5;}return val;}
  void main(){vec2 uv=v;vec2 p=uv*3.0;
    float n1=fbm(p+u_time*0.1);float n2=fbm(p-u_time*0.05+n1);
    vec3 c1=vec3(0.031,0.102,0.204);vec3 c2=vec3(0.05,0.15,0.3);
    vec3 col=mix(c1,c2,n2);
    float rays=pow(sn(uv*1.5+u_time*0.02),5.0)*0.1;col+=rays*vec3(0.83,0.69,0.22);
    float vig=smoothstep(0.85,0.2,length(uv-0.5));col*=vig+0.25;
    gl_FragColor=vec4(col,1.0);}`;
  function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;}
  const prog=gl.createProgram();
  gl.attachShader(prog,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(prog,"a_position"); gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const uTime=gl.getUniformLocation(prog,"u_time");
  (function render(t){ size(); gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform1f(uTime,t*0.001); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); requestAnimationFrame(render); })(0);
})();

// ══════════════════════════════════════════════════════════════════════════
//  LOGIN / CONNECT + ACCOUNT (copy-trade) — smt-apac submission layer.
//  Guest = paper account · WEEX connect = sandbox account (mock login, any input).
//  Positions mirror SMT's live LONG/SHORT calls, marked live on REAL prices (/prices).
//  All client-side (localStorage), no PII, no real orders.
// ══════════════════════════════════════════════════════════════════════════
const ACCT_KEY = "smt_account";
const ACCT_START = 10000;
const acct = () => { try{ return JSON.parse(localStorage.getItem(ACCT_KEY)); }catch{ return null; } };
const saveAcct = a => localStorage.setItem(ACCT_KEY, JSON.stringify(a));
function ensureAcct(mode){
  let a = acct();
  if(!a){ a = {mode: mode||"guest", balance: ACCT_START, positions: []}; saveAcct(a); }
  else if(mode && a.mode !== mode){ a.mode = mode; saveAcct(a); }
  return a;
}
function openLogin(){ document.getElementById("login").classList.remove("hidden"); }
function closeLogin(){ document.getElementById("login").classList.add("hidden"); }
function enterGuest(){ ensureAcct("guest"); closeLogin(); if(typeof enter==="function") enter(); }
function doWeexConnect(){   // demo: any input connects (bogus password fine); nothing leaves the page
  ensureAcct("weex"); closeLogin(); if(typeof enter==="function") enter();
}

let _px=null, _pxT=0;
async function fetchPrices(){
  if(_px && Date.now()-_pxT < 25000) return _px;
  try{ const r = await fetch("/prices"); const j = await r.json(); _px=j; _pxT=Date.now(); return j; }
  catch(e){ return _px; }
}
const fmtN = n => Number(n).toLocaleString(undefined,{maximumFractionDigits: n<10?4:2});

function openAccount(){
  exitFocus();
  const a = ensureAcct();
  document.getElementById("account").classList.remove("hidden");
  document.getElementById("navWorld")?.classList.remove("active");
  document.getElementById("navTutorial")?.classList.remove("active");
  document.getElementById("navAccount")?.classList.add("active");
  const weex = a.mode==="weex";
  const modeEl = document.getElementById("acctMode");
  modeEl.textContent = weex ? "WEEX · sandbox" : "Guest · paper";
  modeEl.classList.toggle("paper", !weex);
  document.getElementById("acctAvatar").textContent = weex ? "🟢" : "🧭";
  markAccount();
}
function closeAccount(){ document.getElementById("account").classList.add("hidden");
  document.getElementById("navAccount")?.classList.remove("active"); setNav("world"); }

async function copySMT(){
  const a = ensureAcct();
  const active = PAIRS.filter(p => { const d=DECISIONS[p]; return d && (d.action==="LONG"||d.action==="SHORT"); });
  if(!active.length){ bubbleAlert("SMT is WAITing on every pair right now — nothing to copy. That's a valid call. ⛵"); return; }
  const px = await fetchPrices();
  const notional = a.balance / active.length;
  a.positions = active.map(p => {
    const d = DECISIONS[p]; const pr = (px && px.pairs) ? px.pairs[p] : null;
    const price = pr ? pr.price : null; const chg = pr ? pr.change24h : 0;
    return { pair:p, side:d.action, notional, entry: price!=null ? price/(1+chg/100) : null };
  });
  saveAcct(a); markAccount();
}
function flattenAll(){ const a = ensureAcct(); a.positions = []; saveAcct(a); markAccount(); }

async function markAccount(){
  const a = acct(); if(!a) return;
  const has = a.positions && a.positions.length;
  document.getElementById("acctIntro").style.display = has ? "none" : "";
  document.getElementById("acctPosHdr").style.display = has ? "" : "none";
  document.getElementById("acctActions").style.display = has ? "flex" : "none";
  const px = await fetchPrices();
  let uPnl = 0;
  const rows = (a.positions||[]).map(p => {
    const pr = (px && px.pairs) ? px.pairs[p.pair] : null;
    const cur = pr ? pr.price : null;
    let pnl=0, pc=0;
    if(cur!=null && p.entry){ const dir = p.side==="LONG"?1:-1; pc = dir*(cur-p.entry)/p.entry; pnl = p.notional*pc; }
    uPnl += pnl;
    const col = pnl>=0 ? "#73fad0" : "#ffb4ab";
    return `<li><div class="acct-pp"><b>${p.pair}</b><span class="sd ${p.side.toLowerCase()}">${p.side}</span></div>
      <span class="acct-px">${p.entry?fmtN(p.entry):"—"} → ${cur?fmtN(cur):"—"}</span>
      <span class="acct-up" style="color:${col}">${(pc*100).toFixed(2)}%</span></li>`;
  }).join("");
  document.getElementById("acctPositions").innerHTML = rows;
  const equity = a.balance + uPnl;
  const unit = a.mode==="weex" ? "SUSDT" : "units";
  document.getElementById("acctBal").textContent = fmtN(a.balance)+" "+unit;
  document.getElementById("acctEq").textContent = fmtN(equity)+" "+unit;
  const pnlEl = document.getElementById("acctPnl");
  pnlEl.textContent = (uPnl>=0?"+":"")+fmtN(uPnl)+" ("+((uPnl/a.balance)*100).toFixed(2)+"%)";
  pnlEl.style.color = uPnl>=0 ? "#73fad0" : "#ffb4ab";
  const note = document.getElementById("acctNote");
  note.innerHTML = (px && px.live===false) ? "⚠ price feed offline — showing approx (PnL paused)."
    : (a.mode==="weex" ? "WEEX sandbox · demo signals · <b>real prices</b> — not financial advice."
                       : "Simulated paper · demo signals · <b>real prices</b> — not financial advice.");
}
function bubbleAlert(msg){ alert(msg); }
setInterval(()=>{ const el=document.getElementById("account"); if(el && !el.classList.contains("hidden")) markAccount(); }, 20000);
