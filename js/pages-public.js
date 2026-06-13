// ═══════════════════════════════════════════════════════════════
// PUBLIC PAGES — landing, features, pricing, auth pages
// Exactly as in the original HTML, extracted to its own file.
// ═══════════════════════════════════════════════════════════════

const PUB = {};

function pubNav() {
  return `<nav class="pub-nav">
  <button class="brand" onclick="go('landing')"><span class="mark">◔</span> MenuPilot AI</button>
  <div class="links">
    <button onclick="go('features')">Features</button>
    <button onclick="go('pricingPub')">Pricing</button>
    <button onclick="go('login')">Log in</button>
  </div>
  <div style="display:flex;gap:9px">
    <button class="btn btn-ghost btn-sm" onclick="enterDemo()">Live demo</button>
    <button class="btn btn-gold btn-sm" onclick="go('signup')">Get started</button>
  </div></nav>`;
}
function pubFoot() {
  return `<div class="pub-foot"><span>MenuPilot AI</span><span>Saudi-first · SAR · ZATCA-aware · Arabic ready</span></div>`;
}

PUB.landing = () => `<div class="pub">${pubNav()}
 <div class="hero">
  <div>
   <div class="eyebrow">Restaurant Financial Intelligence · Saudi Arabia → GCC</div>
   <h1>Know the <em>true cost</em> of every dish on your menu.</h1>
   <div class="ar">اعرف التكلفة الحقيقية لكل طبق في قائمتك — وسعّره بثقة</div>
   <p class="lead">8 AI agents read your menu, rebuild your recipes, layer in every Saudi cost — GOSI, Balady, ZATCA, delivery commissions, hidden overheads — and tell you what to charge, what to promote, and what to remove.</p>
   <div style="display:flex;gap:12px;flex-wrap:wrap">
    <button class="btn btn-gold" onclick="go('signup')">Start free — set up in 10 minutes</button>
    <button class="btn btn-ghost" onclick="enterDemo()">Explore demo restaurant</button>
   </div>
   <div class="hero-stats">
    <div class="hstat"><div class="n">8</div><div class="l">AI agents working for you</div></div>
    <div class="hstat"><div class="n">20+</div><div class="l">Saudi government fees tracked</div></div>
    <div class="hstat"><div class="n">11</div><div class="l">cost layers per menu item</div></div>
   </div>
  </div>
  <div class="dishcard">
   <h3>Grilled Hamour <span class="price">SAR 89.00</span></h3>
   <div class="sub">True cost · live from the Cost Analyst Agent</div>
   ${[['Ingredients',92,'24.50'],['Direct labor',24,'6.18'],['Delivery alloc.',11,'2.85'],['Rent alloc.',26,'6.84'],['Utilities',9,'2.39'],['Gov. fees',13,'3.46'],['Marketing',4,'0.94'],['Waste alloc.',7,'1.64']].map((x, i) => `
   <div class="layer"><span class="lbl">${x[0]}</span><div class="bar"><i style="width:${x[1]}%;animation-delay:.${i}s"></i></div><span class="val">${x[2]}</span></div>`).join('')}
   <div class="dish-foot"><span>True cost <b style="color:#fff">SAR 49.62</b></span><span class="g">Net margin 44.2% ✓</span></div>
  </div>
 </div>
 <div class="pub-section"><div class="inner">
  <h2>Built like a CFO. Priced like an app.</h2>
  <p class="sub2">From AI menu extraction to break-even analysis — one system for owners who want answers, not spreadsheets.</p>
  <div class="grid g3">
   ${[['✦','AI onboarding','Paste your website or upload a menu — agents extract items, predict recipes, and build your cost base.'],
      ['⬡','11-layer true costing','Ingredients with yield %, labor minutes, rent, GOSI, ZATCA, delivery commissions, waste — per dish.'],
      ['◈','Pricing that defends margin','10 strategies with risk levels, including delivery-app pricing that survives 30% commissions.']].map(f => `
   <div class="card"><div style="font-size:22px;color:var(--gold)">${f[0]}</div><h4 style="margin:8px 0 6px">${f[1]}</h4><p class="note">${f[2]}</p></div>`).join('')}
  </div></div></div>
 ${pubFoot()}</div>`;

PUB.features = () => `<div class="pub">${pubNav()}
 <div class="pub-section" style="flex:1"><div class="inner">
  <h2>Eight agents. One P&L brain.</h2>
  <p class="sub2">Each agent is now powered by Claude AI — not a label, not a demo. Open an account to use every one of them on your real data.</p>
  <div class="grid g2">
  ${[['Menu Extraction Agent','Reads your pasted menu text, extracts every item','Categories, items, prices, descriptions — saved into your Menu dashboard instantly.'],
     ['Recipe Intelligence Agent','Predicts ingredients from item name & cuisine using Claude','Suggested ingredients, quantities, yield % — you approve, edit, or reject.'],
     ['Cost Analyst Agent','Computes true cost per item, live','11 layers: materials, labor, packaging, utilities, rent, government, delivery, marketing, hidden, waste.'],
     ['Pricing Strategist Agent','Recommends prices with risk levels + Claude rationale','Cost-plus, markup, competitor, value, delivery-app, combo, premium, psychological, seasonal, branch-specific.'],
     ['Procurement Analyst Agent','Invoice capture + supplier price tracking','Paste invoice lines → Claude parses them → prices update → every recipe recosts.'],
     ['Profitability Analyst Agent','Menu engineering on autopilot','Stars, Puzzles, Plow Horses, Dogs — with promote / reprice / redesign / remove actions.'],
     ['Saudi Compliance Cost Agent','Every government & compliance fee, editable','Balady, ZATCA, Qiwa, Mudad, Muqeem, GOSI, iqama, visas, Saudization, SFDA — allocated per dish.'],
     ['Restaurant CFO Agent','Real Claude AI in chat — your actual numbers','Losing items, break-even point, +10% profit plans, supplier and delivery-app verdicts. Powered by Claude.']].map((a, i) => `
   <div class="card"><h4>${a[0]} <span class="tag gold">Agent ${'ABCDEFGH'[i]}</span></h4>
   <p style="font-size:13px;margin-bottom:8px">${a[1]}.</p><p class="note">${a[2]}</p></div>`).join('')}
  </div>
  <div style="margin-top:26px"><button class="btn btn-gold" onclick="enterDemo()">Use the agents in the live demo →</button></div>
 </div></div>${pubFoot()}</div>`;

PUB.pricingPub = () => `<div class="pub">${pubNav()}
 <div class="pub-section" style="flex:1"><div class="inner">
  <h2>Simple pricing in SAR.</h2><p class="sub2">Start free for 14 days on any plan. Cancel anytime.</p>
  <div class="grid g3">
   ${[['Starter',299,'1 branch',['1 branch','Menu costing & recipes','Menu engineering','Saudi government fee database','Email support'],false],
      ['Growth',599,'Up to 3 branches',['Everything in Starter','All 8 AI agents (Claude-powered)','Scenario simulator & break-even','Delivery app profitability','Procurement price alerts','Priority support'],true],
      ['Enterprise',0,'Multi-brand groups',['Unlimited branches & brands','Custom cost models','API & POS integrations','Dedicated success manager','SLA & onboarding team'],false]].map(p => `
   <div class="card plan ${p[4] ? 'feat' : ''}"><div class="pname">${p[0]} ${p[4] ? '<span class="tag gold">Most popular</span>' : ''}</div>
    <div class="pprice">${p[1] ? 'SAR ' + p[1] : 'Custom'} ${p[1] ? '<span>/ month / brand</span>' : ''}</div>
    <div class="note">${p[2]}</div><ul>${p[3].map(x => `<li>${x}</li>`).join('')}</ul>
    <button class="btn ${p[4] ? 'btn-gold' : 'btn-line'}" onclick="STATE.plan='${p[0]}';go('signup')">${p[1] ? 'Choose ' + p[0] : 'Contact sales'}</button></div>`).join('')}
  </div></div></div>${pubFoot()}</div>`;

PUB.forgot = () => authShell(`
  <h3>Reset password</h3><div class="sub">Enter your email — we'll send a reset link.</div>
  <div class="field" id="f-femail"><label>Email</label><input id="femail" type="email" placeholder="owner@restaurant.sa"><div class="err">Valid email required.</div></div>
  <button class="btn btn-navy" style="width:100%" onclick="doReset()">Send reset link</button>
  <div class="or"></div><button class="btn btn-line" style="width:100%" onclick="go('login')">Back to login</button>`);

async function doReset() {
  const e = $('femail').value.trim().toLowerCase();
  $('f-femail').classList.toggle('bad', !e.includes('@'));
  if (!e.includes('@')) return;
  // Supabase handles the reset email
  const { error } = await sb.auth.resetPasswordForEmail(e, {
    redirectTo: window.location.origin + '/reset',
  });
  if (error) { toast(error.message, 'bad'); return; }
  toast('Reset link sent — check your email.');
  go('login');
}

PUB.verify = () => authShell(`
  <h3>Check your email</h3>
  <div class="sub">We sent a confirmation link to <b>${esc(STATE.pendingSignup?.email || 'your email')}</b>. Click it to verify your account, then log in.</div>
  <button class="btn btn-navy" style="width:100%;margin-top:18px" onclick="go('login')">Go to login</button>`);

PUB.orgsetup = () => authShell(`
  <h3>Almost there</h3><div class="sub">Your account was created. Log in to finish setting up your restaurant workspace.</div>
  <button class="btn btn-gold" style="width:100%;margin-top:18px" onclick="go('login')">Log in now →</button>`);
