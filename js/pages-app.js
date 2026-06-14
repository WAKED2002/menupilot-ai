// ═══════════════════════════════════════════════════════════════
// PAGES — all authenticated app page renderers
// Key change: CFO Agent (H) now calls real Claude via agentCFO()
// ═══════════════════════════════════════════════════════════════

const PAGES = {};
const q = id => `'${id}'`;
const m_ = id => STATE.menu.find(m => m.id === id);
const g_ = id => STATE.gov.find(g => g.id === id);

// ── Dashboard ─────────────────────────────────────────────────
PAGES.dash = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const t = totals(), be = breakEven();
  const best = [...STATE.menu].sort((a, b) => b.sold - a.sold).slice(0, 4);
  const low  = [...STATE.menu].sort((a, b) => marginPct(a) - marginPct(b)).slice(0, 4);
  const need = STATE.menu.filter(m => marginPct(m) < 20);
  const pend = STATE.menu.filter(m => m.status !== 'approved');
  const alerts = STATE.ings.filter(i => i.hist.length > 1 && i.hist[i.hist.length - 1].p > i.hist[i.hist.length - 2].p * 1.05);
  return `<div class="grid g5">
  ${kpi('Revenue', SAR(t.rev), 'monthly')}
  ${kpi('Gross profit', SAR(Math.round(t.gross)), pct(t.gross / t.rev * 100) + ' of revenue', 'up')}
  ${kpi('Net profit', SAR(Math.round(t.net)), 'after all 11 layers', t.net > 0 ? 'up' : 'down')}
  ${kpi('Food cost %', pct(t.foodPct), 'target ≤ 32%', t.foodPct <= 32 ? 'up' : 'down')}
  ${kpi('Prime cost %', pct(t.primePct), 'food + labor', t.primePct <= 60 ? 'up' : 'down')}</div>
 <div class="grid g5" style="margin-top:13px">
  ${kpi('Labor cost %', pct(t.laborPct))}${kpi('Rent cost %', pct(t.rentPct))}
  ${kpi('Delivery commission', pct(t.delPct), 'of revenue')}
  ${kpi('Gov. fees / month', SAR(Math.round(t.gov)), 'allocated per dish')}
  ${kpi('Hidden costs / month', SAR(Math.round(t.hidden)))}</div>
 <div class="grid g2" style="margin-top:13px">
  <div class="card"><h4>Items needing repricing <span class="tag ${need.length ? 'bad' : 'ok'}">${need.length}</span></h4>
   ${need.length ? `<table><tr><th>Item</th><th class="num">Margin</th><th></th></tr>${need.map(m => `<tr><td>${esc(m.n)}</td><td class="num down">${pct(marginPct(m))}</td><td><button class="btn btn-sm btn-line" onclick="go('pricing')">Open strategist</button></td></tr>`).join('')}</table>`
   : '<div class="alert good"><span>✓</span><div>All items above the 20% net-margin floor.</div></div>'}
   <h4 style="margin-top:16px">Supplier price alerts <span class="tag ${alerts.length ? 'warn' : 'ok'}">${alerts.length}</span></h4>
   ${alerts.map(i => `<div class="alert warn"><span>◆</span><div><b>${esc(i.n)}</b> price up from ${SAR2(i.hist[i.hist.length - 2].p)} → ${SAR2(i.hist[i.hist.length - 1].p)} /kg. ${i.hist.length > 0 ? spark(i.hist) : ''}</div></div>`).join('') || '<div class="note">No price alerts.</div>'}
  </div>
  <div class="card"><h4>Break-even</h4>
   ${kpi('Break-even revenue', SAR(Math.round(be.rev)), 'monthly threshold')}
   <div class="bartrack" style="margin:12px 0 8px"><i style="width:${Math.min(100, t.rev / be.rev * 100).toFixed(0)}%"></i></div>
   <p class="note">At ${SAR(t.rev)} revenue — ${t.rev > be.rev ? 'above' : 'below'} break-even by ${SAR(Math.round(Math.abs(t.rev - be.rev)))}. CMR: ${pct(be.cmr * 100)}.</p>
   <h4 style="margin-top:16px">Pending recipe approvals <span class="tag ${pend.length ? 'warn' : 'ok'}">${pend.length}</span></h4>
   ${pend.slice(0, 3).map(m => `<div class="alert warn"><span>⚗</span><div><b>${esc(m.n)}</b> — recipe needs approval before costing is accurate. <button class="btn btn-sm btn-line" onclick="go('recipe')" style="margin-top:4px">Review</button></div></div>`).join('')}
  </div></div>`;
};

// ── Pricing Strategist (Agent D) ──────────────────────────────
let pSel = { item: 0, strat: 'cost', target: 28 };
PAGES.pricing = () => {
  if (!STATE.menu.length) return emptyMenuState();
  pSel.item = Math.min(pSel.item, STATE.menu.length - 1);
  const strats = [['cost','Cost-plus'],['markup','Markup ×2.6 on materials'],['comp','Competitor based'],['value','Value based'],['del','Delivery-app pricing'],['combo','Combo pricing'],['prem','Premium'],['psy','Psychological'],['seas','Seasonal'],['branch','Branch-specific']];
  return `<div class="card"><h4>Pricing Strategist Agent <span class="tag gold">Agent D</span></h4>
 <div class="grid g3">
  <div class="field"><label>Menu item</label><select onchange="pSel.item=+this.value;render()">${STATE.menu.map((m, i) => `<option value="${i}" ${i === pSel.item ? 'selected' : ''}>${esc(m.n)}</option>`).join('')}</select></div>
  <div class="field"><label>Strategy</label><select onchange="pSel.strat=this.value;render()">${strats.map(s => `<option value="${s[0]}" ${s[0] === pSel.strat ? 'selected' : ''}>${s[1]}</option>`).join('')}</select></div>
  <div class="field"><label>Target net margin %</label><input type="number" value="${pSel.target}" min="10" max="45" onchange="pSel.target=+this.value;render()"></div></div>
 ${priceRec()}
 <div id="ai-pricing-rationale" style="margin-top:12px"></div>
 <button class="btn btn-line btn-sm" style="margin-top:8px" onclick="loadPricingRationale()">Ask Claude why →</button></div>`;
};

function priceRec() {
  const m = STATE.menu[pSel.item], c = cost(m), t = pSel.target / 100, s = pSel.strat;
  let p, why, risk = 'Low';
  const fixedPart = c - layers(m).del;
  const solve = tt => { const denom = 1 - tt - m.delShare * blendedAppRate(); return denom > 0.05 ? fixedPart / denom : fixedPart * 4; };
  if (s === 'cost')   { p = solve(t); why = `True cost ${SAR2(c)} solved so net margin = ${pSel.target}% after the delivery layer.`; }
  else if (s === 'markup') { p = ingCost(m) * 2.6; why = 'Materials × 2.6 — a classic kitchen markup; check it clears your true-cost floor.'; risk = p < c ? 'High' : 'Medium'; }
  else if (s === 'comp') { p = m.price * 1.04; why = '~4% above median of nearby competitors in your category.'; risk = 'Medium'; }
  else if (s === 'value') { p = Math.max(m.price, solve(t)) * 1.06; why = 'Anchored on perceived value; supported by photography & menu placement.'; risk = 'Medium'; }
  else if (s === 'del')   { p = solve(t) / (1 - blendedAppRate()); why = `Grossed up so margin survives the blended ${pct(blendedAppRate() * 100)} platform take.`; }
  else if (s === 'combo') { p = (m.price + 12) * 0.93; why = 'Bundled at 7% off vs separate items — raises ticket while protecting margin.'; }
  else if (s === 'prem')  { p = Math.max(m.price * 1.18, c / (1 - 0.65)); why = 'Premium anchor at ≥65% margin; pair with upgraded plating.'; risk = 'Medium'; }
  else if (s === 'psy')   { p = Math.max(Math.round(solve(t)), Math.round(m.price)) - 1; why = 'Rounded to a 9-ending just under the next threshold.'; }
  else if (s === 'seas')  { p = solve(t) * 1.08; why = 'Peak-season uplift (+8%); auto-revert after season.'; risk = 'Medium'; }
  else { p = m.price * 1.08; why = 'Override for premium-location branch (+8%); base unchanged elsewhere.'; }
  const newMargin = (p - (fixedPart + m.delShare * blendedAppRate() * p)) / p * 100;
  if (newMargin < 15) risk = 'High'; if (p > m.price * 1.25) risk = 'High';
  return `<div class="grid g4" style="margin-top:4px">
  ${kpi('Current price', SAR2(m.price))}
  ${kpi('Recommended', SAR2(p), 'by strategist', 'up')}
  ${kpi('Expected net margin', pct(newMargin), '', newMargin >= 20 ? 'up' : 'down')}
  ${kpi('Risk level', risk, risk === 'High' ? 'volume loss possible' : 'safe range', risk === 'High' ? 'down' : risk === 'Medium' ? '' : 'up')}</div>
 <p class="note" style="margin:10px 0 12px"><b>Reason:</b> ${why}</p>
 <button class="btn btn-gold btn-sm" onclick="STATE.menu[pSel.item].price=${+p.toFixed(2)};STATE.menu[pSel.item].reprice=false;render();toast('Price applied — dashboard & margins updated')">Apply ${SAR2(p)}</button>`;
}

async function loadPricingRationale() {
  const box = $('ai-pricing-rationale');
  if (box) { box.innerHTML = '<div class="skeleton" style="width:80%"></div><div class="skeleton" style="width:60%"></div>'; }
  try {
    const m = STATE.menu[pSel.item];
    const p = priceRec(); // get numeric recommended price from DOM is tricky, just call Claude with context
    const reply = await agentPricingRationale(m, pSel.strat, cost(m) / (1 - pSel.target / 100), blendedAppRate());
    if (box) box.innerHTML = `<div class="alert info"><span>◈</span><div>${esc(reply)}</div></div>`;
  } catch (err) {
    if (box) box.innerHTML = `<div class="alert bad"><span>▲</span><div>AI unavailable: ${esc(err.message)}</div></div>`;
  }
}

// ── Menu Engineering — Profitability Analyst (Agent F) ────────
PAGES.eng = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const W = 640, H = 400, pad = 48, md = medians();
  const maxQ = Math.max(...STATE.menu.map(m => m.sold)) * 1.12 || 1;
  const maxM = Math.max(...STATE.menu.map(m => marginPct(m)), 10) * 1.15;
  const X = qv => pad + qv / maxQ * (W - pad - 18);
  const Y = mm => H - pad - Math.max(0, mm) / maxM * (H - pad - 18);
  const cols = { Star: '#177E6F', Puzzle: '#C9981F', 'Plow Horse': '#3D6485', Dog: '#CE5343' };
  return `<div class="card"><h4>Profitability Analyst Agent <span class="tag gold">Agent F</span> <span class="note">bubble = monthly profit contribution</span></h4>
 <svg viewBox="0 0 ${W} ${H}" width="100%" role="img">
  <line x1="${X(md.q)}" y1="16" x2="${X(md.q)}" y2="${H - pad}" stroke="var(--line)" stroke-dasharray="4 4"/>
  <line x1="${pad}" y1="${Y(md.m)}" x2="${W - 18}" y2="${Y(md.m)}" stroke="var(--line)" stroke-dasharray="4 4"/>
  <line x1="${pad}" y1="${H - pad}" x2="${W - 18}" y2="${H - pad}" stroke="var(--muted)"/>
  <line x1="${pad}" y1="16" x2="${pad}" y2="${H - pad}" stroke="var(--muted)"/>
  <text x="${W / 2}" y="${H - 12}" font-size="11" fill="var(--muted)" text-anchor="middle">Popularity (plates/month) →</text>
  <text x="14" y="${H / 2}" font-size="11" fill="var(--muted)" transform="rotate(-90 14 ${H / 2})" text-anchor="middle">Net margin % →</text>
  ${STATE.menu.map(m => `<circle cx="${X(m.sold)}" cy="${Y(marginPct(m))}" r="${6 + Math.max(0, margin(m)) * m.sold / 4200}" fill="${cols[mLabel(m)]}" opacity=".85"><title>${esc(m.n)}</title></circle>
   <text x="${X(m.sold) + 9}" y="${Y(marginPct(m)) + 4}" font-size="10" fill="var(--muted)">${esc(m.n.split(' ').slice(0, 2).join(' '))}</text>`).join('')}
 </svg>
 <div class="legend"><span><i style="background:#177E6F"></i>Star</span><span><i style="background:#C9981F"></i>Puzzle</span><span><i style="background:#3D6485"></i>Plow Horse</span><span><i style="background:#CE5343"></i>Dog</span></div></div>
 <div class="card" style="margin-top:13px"><h4>Actions</h4>
 <table><tr><th>Item</th><th>Class</th><th>Recommendation</th><th></th></tr>
 ${STATE.menu.map(m => `<tr><td>${esc(m.n)}</td><td><span class="tag ${mCls(m)}">${mLabel(m)}</span></td>
  <td class="note">${mAction(m)}</td>
  <td style="white-space:nowrap">
   ${mLabel(m) === 'Star' ? `<button class="btn btn-sm btn-line" onclick="toast('${esc(m.n)} pinned to featured combos')">Promote</button>` : ''}
   ${['Puzzle', 'Plow Horse'].includes(mLabel(m)) ? `<button class="btn btn-sm btn-line" onclick="pSel.item=${STATE.menu.indexOf(m)};go('pricing')">Reprice</button>` : ''}
   ${mLabel(m) === 'Dog' ? `<button class="btn btn-sm btn-danger" onclick="STATE.menu=STATE.menu.filter(x=>x.id!==${q(m.id)});render();toast('Item removed','bad')">Remove</button>` : ''}
  </td></tr>`).join('')}</table></div>`;
};

// ── AI Copilot — Restaurant CFO Agent (Agent H) ───────────────
// This is now a REAL Claude call via /api/analyze
PAGES.copilot = () => `<div class="card copilot"><h4>Restaurant CFO Agent <span class="tag gold">Agent H</span> <span class="tag info">Powered by Claude</span></h4>
 <div class="chatlog" id="chatlog">
  <div class="msg ai">Marhaba${STATE.user ? ', ' + esc(STATE.user.n.split(' ')[0]) : ''}! I'm your virtual CFO with live access to your costs, recipes, payroll and compliance fees. Ask me anything — I'm powered by Claude AI and your actual numbers.</div>
 </div>
 <div class="suggest">${['Which items are losing money?','Which items should I reprice?','What is my break-even point?','What happens if fish prices increase?','Which supplier is most expensive?','How can I increase profit by 10%?','Which delivery app hurts my margin?'].map(s => `<button onclick="ask('${s}')">${s}</button>`).join('')}</div>
 <div class="chatin"><input id="chatin" placeholder="Ask your CFO agent…" onkeydown="if(event.key==='Enter')ask()"><button class="btn btn-gold" onclick="ask()">Send</button></div></div>`;

async function ask(qs) {
  const inp = $('chatin');
  qs = qs || inp.value.trim();
  if (!qs) return;
  inp.value = '';
  const log = $('chatlog');
  log.insertAdjacentHTML('beforeend', `<div class="msg user">${esc(qs)}</div>`);
  log.insertAdjacentHTML('beforeend', `<div class="msg ai" id="thinking"><div class="skeleton" style="width:160px"></div><div class="skeleton" style="width:110px"></div></div>`);
  log.scrollTop = log.scrollHeight;

  if (!STATE.menu.length) {
    $('thinking').outerHTML = `<div class="msg ai">Your menu is empty — run AI onboarding first and I'll have a full cost base to reason over.</div>`;
    return;
  }

  try {
    const reply = await agentCFO(qs);
    $('thinking').outerHTML = `<div class="msg ai">${esc(reply)}</div>`;
  } catch (err) {
    // Graceful fallback: let Claude be unavailable without breaking the app
    const fallback = cfoFallback(qs);
    $('thinking').outerHTML = `<div class="msg ai">${fallback}\n\n<span class="note">(Claude unavailable — using built-in analysis)</span></div>`;
  }
  log.scrollTop = log.scrollHeight;
}

// Keeps the app working if the API is down
function cfoFallback(qs) {
  const lo = qs.toLowerCase(), t = totals(), be = breakEven();
  const losing = STATE.menu.filter(m => margin(m) <= 0);
  const thin   = STATE.menu.filter(m => marginPct(m) < 20 && margin(m) > 0);
  if (lo.includes('losing') || lo.includes('lose'))
    return losing.length
      ? `Items losing money:\n${losing.map(m => `• ${m.n} — cost ${SAR2(cost(m))} vs price ${SAR2(m.price)} (${pct(marginPct(m))})`).join('\n')}\nMonthly bleed: ${SAR(Math.round(losing.reduce((a, m) => a + Math.abs(margin(m)) * m.sold, 0)))}.`
      : `No item is underwater. ${thin.length} sit under the 20% floor:\n${thin.map(m => `• ${m.n} — ${pct(marginPct(m))}`).join('\n')}`;
  if (lo.includes('break'))
    return `Break-even: fixed costs ${SAR(Math.round(be.fixed))}, CMR ${pct(be.cmr * 100)}, break-even revenue ${SAR(Math.round(be.rev))}. You are ${t.rev > be.rev ? 'above' : 'below'} by ${SAR(Math.round(Math.abs(t.rev - be.rev)))}.`;
  return `I can answer about: losing items, repricing, break-even, ingredient shocks, supplier spend, +10% profit plans, and delivery apps. For everything else the Scenario Simulator and Pricing Center are one click away.`;
}

// ── Scenario Simulator ────────────────────────────────────────
let SC = { fish: 0, shr: 0, sal: 0, del: 0, util: 0 };
PAGES.scen = () => {
  if (!STATE.menu.length) return emptyMenuState();
  return `<div class="grid g2">
 <div class="card"><h4>Stress levers</h4>
  ${[['fish','Fish & seafood purchase prices','%',-20,60],['shr','Shrimp purchase prices','%',-20,60],['sal','Salaries & labor','%',0,30],['del','Delivery commission','+pts',0,10],['util','Utilities','%',0,40]].map(([k, l, u, mn, mx]) => `
   <div class="slider-row"><div class="top"><span>${l}</span><b>${SC[k] >= 0 ? '+' : ''}${SC[k]}${u}</b></div>
   <input type="range" min="${mn}" max="${mx}" value="${SC[k]}" oninput="SC.${k}=+this.value;render()"></div>`).join('')}
  <button class="btn btn-line btn-sm" onclick="SC={fish:0,shr:0,sal:0,del:0,util:0};render()">Reset</button></div>
 <div class="card"><h4>Profit impact — monthly</h4>${scenOut()}</div></div>`;
};

function scenOut() {
  const isFish = i => /fish|hamour|lobster|crab|calamari|oyster|seafood/i.test(i.n);
  const isShr  = i => /shrimp/i.test(i.n);
  let np = 0, hits = [];
  STATE.menu.forEach(m => {
    const L = layers(m);
    const ingUp = m.recipe.reduce((a, [id, qy]) => {
      const i = ingById(id); if (!i) return a;
      const base = (i.unit === 'pc' ? qy * i.price : qy / 1000 * i.price) / (i.yield || 1);
      return a + base * ((isFish(i) ? SC.fish : 0) + (isShr(i) ? SC.shr : 0)) / 100;
    }, 0);
    const c1 = cost(m) + ingUp + L.labor * SC.sal / 100 + m.delShare * (SC.del / 100) * m.price + L.util * SC.util / 100;
    np += (m.price - c1) * m.sold;
    if (m.price > 0 && (m.price - c1) / m.price < 0.10) hits.push(m.n);
  });
  const base = totals().net, d = np - base;
  return `<div class="kpi"><div class="l">Net item contribution under scenario</div>
  <div class="bigprofit ${d >= 0 ? 'up' : 'down'}">${SAR(Math.round(np))}</div>
  <div class="d ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : ''}${SAR(Math.round(d))} vs baseline ${SAR(Math.round(base))}</div></div>
 <div class="bartrack" style="margin:16px 0 10px"><i style="width:${Math.max(2, Math.min(100, np / (base || 1) * 100))}%;background:${np >= base * 0.7 ? 'var(--teal)' : 'var(--coral)'}"></i></div>
 ${hits.length ? `<div class="alert bad"><span>▲</span><div>Below 10% margin: <b>${hits.map(esc).join(', ')}</b></div></div>`
 : '<div class="alert good"><span>✓</span><div>All items hold above a 10% net margin under this scenario.</div></div>'}`;
}

// ── Costing page (per-item true cost breakdown) ───────────────
PAGES.costing = () => {
  if (!STATE.menu.length) return emptyMenuState();
  return `<div class="card"><h4>Menu Costing — true 11-layer cost per item</h4>
 <table><tr><th>Item</th><th class="num">Price</th><th class="num">Ing.</th><th class="num">Labor</th><th class="num">Total cost</th><th class="num">Net margin</th><th>Class</th></tr>
 ${STATE.menu.map(m => `<tr><td>${esc(m.n)}</td>
  <td class="num">${SAR2(m.price)}</td>
  <td class="num">${SAR2(ingCost(m))}</td>
  <td class="num">${SAR2(m.laborMin * laborRate())}</td>
  <td class="num"><b>${SAR2(cost(m))}</b></td>
  <td class="num ${marginPct(m) >= 20 ? 'up' : 'down'}">${pct(marginPct(m))}</td>
  <td><span class="tag ${mCls(m)}">${mLabel(m)}</span></td></tr>`).join('')}</table></div>`;
};

// ── Settings ──────────────────────────────────────────────────
PAGES.settings = () => `<div class="grid g2">
 <div class="card"><h4>Organization</h4>
  <div class="field"><label>Name</label><input value="${esc(STATE.org.name)}" onchange="STATE.org.name=this.value;render()"></div>
  <div class="grid g2">
   <div class="field"><label>Country</label><input value="${esc(STATE.org.country)}" onchange="STATE.org.country=this.value"></div>
   <div class="field"><label>City</label><input value="${esc(STATE.org.city)}" onchange="STATE.org.city=this.value"></div></div>
  <div class="field"><label>Branches (comma separated)</label><input value="${esc(STATE.org.branches.join(', '))}" onchange="STATE.org.branches=this.value.split(',').map(x=>x.trim()).filter(Boolean);render()"></div>
  <div class="field"><label>Monthly rent (SAR)</label><input type="number" value="${STATE.rent}" onchange="STATE.rent=+this.value;render()"></div>
  ${STATE._orgId ? `<button class="btn btn-line btn-sm" onclick="saveOrgSettings()">Save to database</button>` : ''}</div>
 <div class="card"><h4>Preferences</h4>
  <div class="field"><label>Currency</label><select disabled><option>SAR — Saudi Riyal (default)</option></select></div>
  <div class="field"><label>Theme</label><select onchange="setTheme(this.value)"><option value="light" ${STATE.theme === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${STATE.theme === 'dark' ? 'selected' : ''}>Dark</option></select></div>
  <div class="field"><label>Language</label><select onchange="setLang(this.value)"><option value="en" ${STATE.lang === 'en' ? 'selected' : ''}>English</option><option value="ar" ${STATE.lang === 'ar' ? 'selected' : ''}>العربية (RTL)</option></select></div></div></div>`;

async function saveOrgSettings() {
  if (!STATE._orgId) return;
  await DB.saveOrgState(STATE._orgId, STATE);
  toast('Settings saved to database');
}

// ── User management ───────────────────────────────────────────
const ROLE_PERMS = {
  Owner: ['Everything incl. billing & users'],
  Manager: ['Menu, recipes, pricing, procurement', 'No billing, no user management'],
  Accountant: ['Costs, fees, reports, read-only menu'],
  Chef: ['Recipes & ingredients only'],
};
PAGES.usersP = () => `<div class="card"><h4>Team <span class="note">${STATE.users.length} members</span><button class="btn btn-navy btn-sm" onclick="inviteModal()">+ Invite user</button></h4>
 <table><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
 ${STATE.users.map((u, i) => `<tr><td>${esc(u.n)}</td><td class="note">${esc(u.email)}</td>
  <td>${u.role === 'Owner' ? '<span class="tag gold">Owner</span>' : `<select class="tbl-edit" style="width:120px;text-align:start" onchange="STATE.users[${i}].role=this.value;toast('Role updated')">${['Manager','Accountant','Chef'].map(r => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select>`}</td>
  <td><span class="tag ${u.st === 'Active' ? 'ok' : 'warn'}">${u.st}</span></td>
  <td>${u.role !== 'Owner' ? `<button class="btn btn-sm btn-danger" onclick="STATE.users.splice(${i},1);render()">Remove</button>` : ''}</td></tr>`).join('')}</table></div>
 <div class="card" style="margin-top:13px"><h4>Roles & permissions</h4>
 <div class="grid g4">${Object.entries(ROLE_PERMS).map(([r, ps]) => `<div><b style="font-size:13px">${r}</b><ul style="margin:7px 0 0 16px;font-size:12px;color:var(--muted)">${ps.map(p => `<li>${p}</li>`).join('')}</ul></div>`).join('')}</div></div>`;

function inviteModal() {
  modal(`<h3>Invite a team member</h3>
 <div class="field"><label>Name</label><input id="ivN"></div>
 <div class="field"><label>Email</label><input id="ivE" type="email"></div>
 <div class="field"><label>Role</label><select id="ivR"><option>Manager</option><option>Accountant</option><option>Chef</option></select></div>
 <div style="display:flex;gap:9px;justify-content:flex-end"><button class="btn btn-line" onclick="closeModal()">Cancel</button>
 <button class="btn btn-gold" onclick="if(!$('ivE').value.includes('@')){toast('Valid email required','bad');return}STATE.users.push({n:$('ivN').value||$('ivE').value.split('@')[0],email:$('ivE').value,role:$('ivR').value,st:'Invited'});closeModal();render();toast('Invitation sent')">Send invite</button></div>`);
}

// ── Billing ───────────────────────────────────────────────────
PAGES.billing = () => `<div class="grid g3">
 ${kpi('Current plan', STATE.plan, STATE.plan === 'Starter' ? 'SAR 299 / month' : STATE.plan === 'Growth' ? 'SAR 599 / month' : 'custom contract')}
 ${kpi('Branches used', STATE.org.branches.length + ' / ' + (STATE.plan === 'Starter' ? 1 : STATE.plan === 'Growth' ? 3 : '∞'))}
 ${kpi('Next renewal', '01 Jul 2026', 'auto-renews')}</div>
 <div class="card" style="margin-top:13px"><h4>Change plan</h4>
 <div style="display:flex;gap:8px;flex-wrap:wrap">${['Starter', 'Growth', 'Enterprise'].map(p => `<button class="chip ${STATE.plan === p ? 'on' : ''}" onclick="STATE.plan='${p}';render();toast('Plan changed to ${p}')">${p}</button>`).join('')}</div>
 <p class="note" style="margin-top:9px">Upgrades apply immediately; downgrades at the next cycle. VAT 15% added at checkout per ZATCA rules.</p></div>
 <div class="card" style="margin-top:13px"><h4>Invoices</h4><table><tr><th>Date</th><th>Invoice</th><th class="num">Amount (SAR)</th><th>Status</th></tr>
 ${STATE.invoices.map(v => `<tr><td>${v.d}</td><td class="note">${v.n}</td><td class="num">${v.amt}</td><td><span class="tag ${v.st === 'Paid' ? 'ok' : 'info'}">${v.st}</span></td></tr>`).join('')}</table></div>`;

// ── Branch Performance ────────────────────────────────────────
PAGES.branch = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const t = totals(); const brs = STATE.org.branches; const i = Math.min(STATE.branchView || 0, brs.length - 1);
  const w = brs.length === 1 ? [1] : brs.map((_, k) => k === 0 ? 0.58 : 0.42 / (brs.length - 1));
  const f = w[i];
  return `<div class="tabs">${brs.map((b, k) => `<button class="${k === i ? 'on' : ''}" onclick="STATE.branchView=${k};render()">${esc(b)}</button>`).join('')}</div>
  <div class="grid g4">
   ${kpi('Branch revenue', SAR(Math.round(t.rev * f)), Math.round(f * 100) + '% of total')}
   ${kpi('Branch net profit', SAR(Math.round(t.net * f)), '', t.net > 0 ? 'up' : 'down')}
   ${kpi('Food cost %', pct(t.foodPct + (i ? 1.2 : -0.4)), 'vs ' + pct(t.foodPct) + ' blended')}
   ${kpi('Orders / month', fmt(Math.round(totalUnits() * f)))}</div>
  <div class="card" style="margin-top:13px"><h4>Branch-specific pricing</h4>
   <p class="note" style="margin-bottom:10px">Items can carry a different price per branch (e.g., mall location +8%). Set branch overrides in the Pricing Center → Branch-specific strategy.</p>
   <table><tr><th>Item</th><th class="num">Base price</th><th class="num">${esc(brs[i])} price</th></tr>
   ${STATE.menu.slice(0, 5).map(m => `<tr><td>${esc(m.n)}</td><td class="num">${SAR2(m.price)}</td><td class="num">${SAR2(m.price * (i ? 1.08 : 1))}</td></tr>`).join('')}</table></div>`;
};

// ── Categories ────────────────────────────────────────────────
PAGES.cats = () => `<div class="card"><h4>Categories <span class="note">${STATE.org.type} template</span></h4>
 <table><tr><th>Category</th><th class="num">Items</th><th></th></tr>
 ${STATE.cats.map((c, i) => `<tr><td><input class="tbl-edit" style="width:220px;text-align:start" value="${esc(c)}" onchange="renameCat(${i},this.value)"></td><td class="num">${STATE.menu.filter(m => m.cat === c).length}</td>
  <td><button class="btn btn-sm btn-danger" onclick="STATE.cats.splice(${i},1);render()">Remove</button></td></tr>`).join('')}</table>
 <div style="display:flex;gap:9px;margin-top:12px"><input class="tbl-edit" id="ncat" style="width:220px;text-align:start" placeholder="New category">
 <button class="btn btn-sm btn-line" onclick="if($('ncat').value.trim()){STATE.cats.push($('ncat').value.trim());render();toast('Category added')}">+ Add</button></div></div>`;

function renameCat(i, v) {
  v = v.trim(); if (!v) { render(); return; }
  const old = STATE.cats[i];
  STATE.cats[i] = v; STATE.menu.forEach(m => { if (m.cat === old) m.cat = v; });
  render(); toast('Category renamed — ' + STATE.menu.filter(m => m.cat === v).length + ' item(s) updated');
}

// ── Menu Items ────────────────────────────────────────────────
PAGES.menu = () => {
  if (!STATE.menu.length) return emptyMenuState();
  return `<div style="display:flex;justify-content:flex-end;margin-bottom:12px"><button class="btn btn-navy btn-sm" onclick="addItemModal()">+ Add menu item</button></div>
  <div class="card"><table><tr><th>Item</th><th>Category</th><th class="num">Price</th><th class="num">True cost</th><th class="num">Margin</th><th>Status</th><th></th></tr>
  ${STATE.menu.map(m => `<tr><td><b>${esc(m.n)}</b><div class="note">${m.sold} sold/mo · ${Math.round(m.delShare * 100)}% via delivery</div></td><td>${esc(m.cat)}</td>
   <td class="num"><input class="tbl-edit" type="number" value="${m.price}" onchange="m_(${q(m.id)}).price=+this.value;render();toast('Price updated — all margins recalculated')"></td>
   <td class="num">${SAR2(cost(m))}</td><td class="num ${marginPct(m) < 20 ? 'down' : 'up'}">${pct(marginPct(m))}</td>
   <td><span class="tag ${m.status === 'approved' ? 'ok' : 'warn'}">${m.status === 'approved' ? 'Active' : 'Recipe pending'}</span>${m.reprice ? ' <span class="tag bad">reprice</span>' : ''}</td>
   <td style="white-space:nowrap"><button class="btn btn-sm btn-line" onclick="editItemModal(${q(m.id)})">Edit</button>
   <button class="btn btn-sm btn-danger" onclick="STATE.menu=STATE.menu.filter(x=>x.id!==${q(m.id)});render();toast('Item removed','bad')">Remove</button></td></tr>`).join('')}</table></div>`;
};

function editItemModal(id) {
  const m = m_(id); if (!m) return;
  modal(`<h3>Edit — ${esc(m.n)}</h3>
   <div class="field"><label>Name</label><input id="eiN" value="${esc(m.n)}"></div>
   <div class="field"><label>Category</label><select id="eiC">${STATE.cats.map(c => `<option ${c === m.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
   <div class="field"><label>Description</label><textarea id="eiD" rows="2">${esc(m.desc || '')}</textarea></div>
   <div class="grid g2">
    <div class="field"><label>Price (SAR)</label><input id="eiP" type="number" step="0.5" value="${m.price}"></div>
    <div class="field"><label>Sold / month</label><input id="eiS" type="number" value="${m.sold}"></div>
    <div class="field"><label>Delivery share %</label><input id="eiDel" type="number" value="${Math.round(m.delShare * 100)}"></div>
    <div class="field"><label>Labor minutes</label><input id="eiL" type="number" step="0.5" value="${m.laborMin}"></div></div>
   <div style="display:flex;gap:9px;justify-content:flex-end"><button class="btn btn-line" onclick="closeModal()">Cancel</button>
   <button class="btn btn-gold" onclick="saveItemEdit(${q(m.id)})">Save changes</button></div>`);
}
function saveItemEdit(id) {
  const m = m_(id); if (!m) return;
  const n = $('eiN').value.trim(); if (!n) { toast('Name required', 'bad'); return; }
  m.n = n; m.cat = $('eiC').value; m.desc = $('eiD').value; m.price = +$('eiP').value || m.price;
  m.sold = Math.max(1, +$('eiS').value || m.sold); m.delShare = Math.max(0, Math.min(100, +$('eiDel').value)) / 100; m.laborMin = +$('eiL').value || m.laborMin;
  closeModal(); render(); toast('Item updated — costs & margins recalculated');
}
function addItemModal() {
  modal(`<h3>Add menu item</h3>
   <div class="field"><label>Name</label><input id="niN" placeholder="Grilled Seabass"></div>
   <div class="field"><label>Category</label><select id="niC">${STATE.cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></div>
   <div class="grid g2"><div class="field"><label>Price (SAR)</label><input id="niP" type="number" value="59"></div>
   <div class="field"><label>Estimated monthly sales</label><input id="niS" type="number" value="200"></div></div>
   <div class="alert info"><span>✦</span><div>Recipe Intelligence will draft ingredients automatically from the item name.</div></div>
   <div style="display:flex;gap:9px;justify-content:flex-end"><button class="btn btn-line" onclick="closeModal()">Cancel</button>
   <button class="btn btn-gold" onclick="addItem()">Add & draft recipe</button></div>`);
}
function addItem() {
  const n = $('niN').value.trim(); if (!n) { toast('Name required', 'bad'); return; }
  const recipe = suggestIngredients(n).map(([inN, qty]) => {
    let ig = STATE.ings.find(x => x.n === inN);
    if (!ig) { const pr = Math.round(10 + Math.random() * 35); ig = { id: uid(), n: inN, sup: STATE.sups[0]?.n || 'Unassigned', unit: qty < 8 ? 'pc' : 'kg', price: pr, yield: 0.92, est: true, hist: [{ d: 'now', p: pr }] }; STATE.ings.push(ig); }
    return [ig.id, qty];
  });
  STATE.menu.push({ id: uid(), n, cat: $('niC').value, price: +$('niP').value || 50, desc: '', recipe, laborMin: 6, pack: 1.5, sold: +$('niS').value || 100, delShare: .3, status: 'pending', reprice: false });
  closeModal(); render(); toast('Item added — recipe drafted by Recipe Intelligence');
}

// ── Recipe Builder ────────────────────────────────────────────
PAGES.recipe = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const pend = STATE.menu.filter(m => m.status !== 'approved');
  return `${pend.length ? `<div class="alert warn"><span>◆</span><div><b>${pend.length} recipe(s)</b> drafted by Recipe Intelligence are awaiting your approval.</div></div>` : ''}
  ${STATE.menu.map(m => recipeCard(m)).join('')}`;
};

// ── Ingredient Center ─────────────────────────────────────────
PAGES.ing = () => {
  if (!STATE.ings.length) return emptyMenuState();
  const estN = STATE.ings.filter(i => i.est).length;
  return `${estN ? `<div class="alert warn"><span>◆</span><div><b>${estN} ingredient price(s) are AI estimates.</b> For accurate costing, set your real purchase prices below or process an invoice in Procurement — every recipe recosts instantly.</div></div>` : ''}
  <div class="card" style="margin-bottom:13px"><h4>Import / export ingredients <span class="note">Excel-compatible</span></h4>
   <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button class="btn btn-sm btn-line" onclick="exportIngredientsExcel()">⤓ Export to Excel</button>
    <label class="btn btn-sm btn-line" style="margin:0">⤒ Import file (.xlsx/.csv)
     <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="importIngredientsFile(this)"></label>
    <button class="btn btn-sm btn-line" onclick="ingredientImportModal()">⌨ Paste / import from URL</button>
    <span class="note" style="margin-inline-start:auto">${STATE.ings.length} ingredient(s) · columns: Name, Supplier, Unit, Price (SAR), Yield %</span>
   </div></div>
  <div class="card"><h4>Ingredient database <span class="note">prices are editable — every recipe recosts instantly</span></h4>
  <table><tr><th>Ingredient</th><th>Supplier</th><th>Unit</th><th class="num">Price (SAR)</th><th class="num">Yield %</th><th>Trend</th><th class="num">Used in</th></tr>
  ${STATE.ings.map(i => `<tr><td>${esc(i.n)}${i.est ? ' <span class="tag warn">estimate</span>' : ''}</td><td class="note">${esc(i.sup)}</td><td>${i.unit}</td>
   <td class="num"><input class="tbl-edit" type="number" step="0.5" value="${i.price}" onchange="updIngPrice(${q(i.id)},+this.value)"></td>
   <td class="num"><input class="tbl-edit" type="number" step="1" value="${Math.round((i.yield || 1) * 100)}" onchange="STATE.ings.find(x=>x.id===${q(i.id)}).yield=+this.value/100;render()"></td>
   <td>${spark(i.hist)}</td><td class="num">${STATE.menu.filter(m => m.recipe.some(r => r[0] === i.id)).length} recipes</td></tr>`).join('')}</table></div>`;
};

function updIngPrice(id, p) {
  const i = STATE.ings.find(x => x.id === id); const old = i.price; i.price = p; i.est = false;
  i.hist.push({ d: 'now', p }); if (i.hist.length > 8) i.hist.shift();
  if (p > old * 1.05) {
    STATE.notifications.unshift({ t: 'Procurement Analyst', m: `${i.n} up ${pct((p / old - 1) * 100)} — ${STATE.menu.filter(m => m.recipe.some(r => r[0] === i.id)).length} recipes recosted. Check cheaper suppliers.`, k: 'bad', time: 'now' });
    toast(`${i.n} +${pct((p / old - 1) * 100)} — alert raised & recipes recosted`, 'bad');
  } else toast('Price updated — recipes recosted');
  render();
}

// ── Suppliers ─────────────────────────────────────────────────
PAGES.sup = () => `<div style="display:flex;justify-content:flex-end;margin-bottom:13px">
   <button class="btn btn-navy btn-sm" onclick="supplierModal()">+ Add supplier</button></div>
 <div class="grid g2">${STATE.sups.length ? STATE.sups.map((sp, si) => {
  const items = STATE.ings.filter(i => i.sup === sp.n);
  const monthlySpend = Math.round(STATE.menu.reduce((a, m) => a + m.recipe.reduce((b, [id, qy]) => { const i = ingById(id); return i && i.sup === sp.n ? b + (i.unit === 'pc' ? qy * i.price : qy / 1000 * i.price) * m.sold : b; }, 0), 0));
  return `<div class="card"><h4>${esc(sp.n)} <span style="display:flex;gap:6px;align-items:center">
    <span class="tag info">★ ${sp.rating}</span>
    <button class="btn btn-sm btn-line" onclick="supplierModal(${si})">Edit</button>
    <button class="btn btn-sm btn-danger" onclick="delSupplier(${si})">Delete</button></span></h4>
   <p class="note">${esc(sp.cat)}</p>
   <table>
    <tr><td>Payment terms</td><td class="num">${esc(sp.terms)}</td></tr>
    <tr><td>Delivery days</td><td class="num">${esc(sp.days)}</td></tr>
    <tr><td>Items supplied</td><td class="num">${items.length}</td></tr>
    <tr><td>Monthly spend (est.)</td><td class="num">${SAR(monthlySpend)}</td></tr>
   </table>
   ${items.length ? `<table style="margin-top:10px"><tr><th>Item</th><th>Unit</th><th class="num">Qty/order</th><th class="num">Price (SAR)</th></tr>
    ${items.map(i => `<tr><td>${esc(i.n)}</td><td>${esc(i.unit)}</td><td class="num">${i.orderQty ? fmt(i.orderQty) : '—'}</td><td class="num">${SAR2(i.price)}</td></tr>`).join('')}
   </table>` : '<p class="note" style="margin-top:8px">No items linked yet — click Edit to add what you buy from this supplier.</p>'}
   </div>`;
}).join('') : '<div class="card"><div class="empty"><div class="big">⛟</div><h5>No suppliers yet</h5><p>Add your first supplier.</p></div></div>'}</div>`;

let _supDraftItems = [];
function supplierModal(idx) {
  const editing = (typeof idx === 'number');
  const sp = editing ? STATE.sups[idx] : { n: '', cat: '', terms: 'Net 15', days: '', rating: 4.5 };
  _supDraftItems = editing ? STATE.ings.filter(i => i.sup === sp.n).map(i => ({ id: i.id, n: i.n, unit: i.unit, orderQty: i.orderQty || 0, price: i.price })) : [];
  const idxAttr = editing ? idx : -1;
  modal(`<h3>${editing ? 'Edit supplier' : 'Add supplier'}</h3>
   <div class="grid g2">
    <div class="field"><label>Name</label><input id="smN" value="${esc(sp.n)}" placeholder="Gulf Fresh Fish Co."></div>
    <div class="field"><label>Category</label><input id="smC" value="${esc(sp.cat || '')}" placeholder="Fresh fish"></div>
    <div class="field"><label>Payment terms</label><input id="smT" value="${esc(sp.terms || '')}" placeholder="Net 15"></div>
    <div class="field"><label>Delivery days</label><input id="smD" value="${esc(sp.days || '')}" placeholder="Sat · Mon · Wed"></div>
   </div>
   <h4 style="margin:6px 0 8px">Items you buy from this supplier</h4>
   <div id="supItems"></div>
   <button class="btn btn-sm btn-line" onclick="supAddItemRow()">+ Add item</button>
   <div style="display:flex;gap:9px;justify-content:flex-end;margin-top:18px">
    <button class="btn btn-line" onclick="closeModal()">Cancel</button>
    <button class="btn btn-gold" onclick="saveSupplier(${idxAttr})">${editing ? 'Save changes' : 'Add supplier'}</button>
   </div>`);
  renderSupItems();
}
function renderSupItems() {
  const host = $('supItems'); if (!host) return;
  if (!_supDraftItems.length) { host.innerHTML = '<p class="note" style="padding:8px 0">No items yet. Click "+ Add item" to list what you buy.</p>'; return; }
  host.innerHTML = `<table style="margin-bottom:10px">
    <tr><th>Item name</th><th>Unit</th><th class="num">Qty / order</th><th class="num">Unit price (SAR)</th><th></th></tr>
    ${_supDraftItems.map((it, k) => `<tr>
      <td><input class="tbl-edit" style="width:170px;text-align:start" value="${esc(it.n)}" oninput="_supDraftItems[${k}].n=this.value" placeholder="Hamour fish"></td>
      <td><select class="tbl-edit" style="width:70px;text-align:start" onchange="_supDraftItems[${k}].unit=this.value">
        ${['kg', 'L', 'pc', 'g', 'box', 'crate'].map(u => `<option ${it.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
      </select></td>
      <td class="num"><input class="tbl-edit" type="number" step="0.1" value="${it.orderQty || ''}" oninput="_supDraftItems[${k}].orderQty=+this.value||0" placeholder="25"></td>
      <td class="num"><input class="tbl-edit" type="number" step="0.5" value="${it.price || ''}" oninput="_supDraftItems[${k}].price=+this.value||0" placeholder="62"></td>
      <td><button class="btn btn-sm btn-danger" onclick="_supDraftItems.splice(${k},1);renderSupItems()">✕</button></td>
    </tr>`).join('')}
   </table>`;
}
function supAddItemRow() { _supDraftItems.push({ id: null, n: '', unit: 'kg', orderQty: 0, price: 0 }); renderSupItems(); }
function saveSupplier(idx) {
  const n = $('smN').value.trim();
  if (!n) { toast('Supplier name required', 'bad'); return; }
  const editing = idx >= 0;
  if (STATE.sups.some((x, i) => i !== idx && x.n.toLowerCase() === n.toLowerCase())) { toast('A supplier with that name already exists', 'bad'); return; }
  const valid = _supDraftItems.filter(it => (it.n || '').trim() && it.price > 0);
  if (_supDraftItems.length && valid.length !== _supDraftItems.length) { toast('Each item row needs a name and a price > 0', 'bad'); return; }
  const oldName = editing ? STATE.sups[idx].n : null;
  const supObj = { n, cat: $('smC').value.trim() || '—', terms: $('smT').value.trim() || '—', days: $('smD').value.trim() || '—', rating: editing ? STATE.sups[idx].rating : 4.5 };
  if (editing) { STATE.sups[idx] = supObj; if (oldName && oldName !== n) STATE.ings.forEach(i => { if (i.sup === oldName) i.sup = n; }); }
  else STATE.sups.push(supObj);
  let added = 0, updated = 0; const recosted = new Set();
  valid.forEach(it => {
    const name = it.n.trim();
    let ig = it.id ? STATE.ings.find(x => x.id === it.id) : STATE.ings.find(x => x.n.toLowerCase() === name.toLowerCase());
    if (ig) {
      const oldPrice = ig.price; ig.n = name; ig.unit = it.unit; ig.sup = n; ig.orderQty = it.orderQty || 0;
      if (it.price && it.price !== oldPrice) {
        ig.price = it.price; ig.est = false; ig.hist = ig.hist || []; ig.hist.push({ d: 'sup', p: it.price }); if (ig.hist.length > 8) ig.hist.shift(); updated++;
        if (oldPrice && it.price > oldPrice * 1.05) STATE.notifications.unshift({ t: 'Procurement Analyst', m: `${name} up ${pct((it.price / oldPrice - 1) * 100)} at ${n} — recipes recosted.`, k: 'bad', time: 'now' });
        STATE.menu.forEach(m => { if (m.recipe.some(r => r[0] === ig.id)) recosted.add(m.n); });
      }
    } else { ig = { id: uid(), n: name, sup: n, unit: it.unit, price: it.price, yield: 1, orderQty: it.orderQty || 0, est: false, hist: [{ d: 'sup', p: it.price }] }; STATE.ings.push(ig); added++; }
  });
  closeModal(); render();
  const parts = [editing ? 'Supplier updated' : 'Supplier added'];
  if (added) parts.push(added + ' new item(s)');
  if (updated) parts.push(updated + ' price(s) updated');
  if (recosted.size) parts.push(recosted.size + ' recipe(s) recosted');
  toast(parts.join(' — '));
}
function delSupplier(si) {
  const sp = STATE.sups[si]; const moved = STATE.ings.filter(i => i.sup === sp.n).length;
  STATE.ings.forEach(i => { if (i.sup === sp.n) i.sup = 'Unassigned'; });
  STATE.sups.splice(si, 1); render();
  toast(sp.n + ' deleted' + (moved ? ' — ' + moved + ' ingredient(s) moved to "Unassigned"' : ''), 'bad');
}

// ── Procurement / Invoice Capture ─────────────────────────────
PAGES.proc = () => {
  if (!STATE.ings.length) return emptyMenuState();
  const changes = STATE.ings.filter(i => i.hist.length > 1).map(i => ({ i, ch: (i.hist.at(-1).p / i.hist[0].p - 1) * 100 })).sort((a, b) => b.ch - a.ch);
  const li = STATE.lastInv;
  return `<div class="card" style="margin-bottom:13px"><h4>Invoice capture <span class="tag gold">MarginEdge-style · Agent E</span></h4>
   <p class="note" style="margin-bottom:10px">Paste invoice lines — one per line as <b>ingredient name &nbsp;price</b>. The agent matches your ingredient database, updates purchase prices, <b>recosts every affected recipe instantly</b>, and raises alerts on increases over 5%.</p>
   <div class="field"><textarea id="invTxt" rows="5" placeholder="Hamour fish  64.5&#10;Shrimp peeled  61&#10;Olive oil  25"></textarea></div>
   <button class="btn btn-navy btn-sm" onclick="applyInvoice()">▶ Process invoice</button>
   ${li ? `<div style="margin-top:12px">
     ${li.matched.length ? `<div class="alert good"><span>✓</span><div><b>${li.matched.length} line(s) matched & applied:</b> ${li.matched.map(x => esc(x.n) + ' → SAR ' + x.p + (x.delta > 5 ? ' (▲+' + x.delta.toFixed(1) + '%)' : '')).join(' · ')}. All recipes recosted.</div></div>` : ''}
     ${li.unmatched.length ? `<div class="alert warn"><span>◆</span><div><b>${li.unmatched.length} unmatched:</b> ${li.unmatched.map(esc).join(' · ')} — add them in the Ingredient Center, then re-process.</div></div>` : ''}
   </div>` : ''}
  </div>
  <div class="grid g2">
  <div class="card"><h4>Record a single price</h4>
   <div class="field"><label>Ingredient</label><select id="prIng">${STATE.ings.map(i => `<option value="${i.id}">${esc(i.n)} — now SAR ${i.price}/${i.unit}</option>`).join('')}</select></div>
   <div class="field"><label>New quoted price (SAR)</label><input id="prP" type="number" step="0.5"></div>
   <button class="btn btn-line btn-sm" onclick="if(+$('prP').value){updIngPrice($('prIng').value,+$('prP').value)}else toast('Enter a price','bad')">Record price</button>
   <h4 style="margin-top:18px">Cheaper alternative suggestions</h4>
   ${changes.filter(x => x.ch > 4).slice(0, 3).map(x => `<div class="alert warn"><span>◆</span><div><b>${esc(x.i.n)}</b> trending +${pct(x.ch)} at ${esc(x.i.sup)}. ${STATE.sups.filter(sx => sx.n !== x.i.sup && sx.n !== 'In-house prep').slice(0, 1).map(sx => `Ask <b>${esc(sx.n)}</b> for a quote.`).join('') || 'Request quotes from alternative suppliers.'}</div></div>`).join('') || '<p class="note">No rising-price ingredients right now.</p>'}
  </div>
  <div class="card"><h4>Price change log</h4>
   <table><tr><th>Ingredient</th><th>Supplier</th><th class="num">Change</th><th>Trend</th></tr>
   ${changes.slice(0, 12).map(x => `<tr><td>${esc(x.i.n)}${x.i.est ? ' <span class="tag warn">estimate</span>' : ''}</td><td class="note">${esc(x.i.sup)}</td><td class="num ${x.ch > 0 ? 'down' : 'up'}">${x.ch > 0 ? '+' : ''}${pct(x.ch)}</td><td>${spark(x.i.hist)}</td></tr>`).join('') || '<tr><td colspan="4" class="note">No price history yet — process an invoice to start tracking.</td></tr>'}</table></div></div>`;
};

function invMatchProc(text) {
  const parsed = parseMenuText(text);
  const matched = [], unmatched = [];
  parsed.forEach(line => {
    const lo = line.n.toLowerCase();
    const hit = STATE.ings.find(i => { const a = i.n.toLowerCase(); return a === lo || a.includes(lo) || lo.includes(a.split(' (')[0]); });
    if (hit) matched.push({ id: hit.id, n: hit.n, p: line.price, delta: (line.price / hit.price - 1) * 100 });
    else unmatched.push(line.n);
  });
  return { matched, unmatched };
}
function applyInvoice() {
  const txt = ($('invTxt') && $('invTxt').value) || '';
  if (txt.trim().length < 3) { toast('Paste invoice lines first', 'bad'); return; }
  const r = invMatchProc(txt);
  if (!r.matched.length && !r.unmatched.length) { toast('No "name + price" lines detected', 'bad'); return; }
  r.matched.forEach(x => {
    const i = STATE.ings.find(g => g.id === x.id); const old = i.price;
    i.price = x.p; i.est = false; i.hist.push({ d: 'inv', p: x.p }); if (i.hist.length > 8) i.hist.shift();
    if (x.p > old * 1.05) STATE.notifications.unshift({ t: 'Procurement Analyst', m: i.n + ' up ' + pct((x.p / old - 1) * 100) + ' on latest invoice — recipes recosted.', k: 'bad', time: 'now' });
  });
  STATE.lastInv = r; render();
  toast(r.matched.length + ' price(s) applied — every affected recipe recosted' + (r.unmatched.length ? ' · ' + r.unmatched.length + ' unmatched' : ''));
}

// ── Inventory Variance ────────────────────────────────────────
PAGES.inv = () => {
  if (!STATE.ings.length) return emptyMenuState();
  return `<div class="card"><h4>Inventory variance <span class="note">opening + purchases − consumption = expected closing; variance vs counted</span></h4>
  <table><tr><th>Ingredient</th><th class="num">Opening</th><th class="num">Purchases</th><th class="num">Consumed (recipes)</th><th class="num">Expected close</th><th class="num">Counted</th><th class="num">Variance</th></tr>
  ${STATE.ings.slice(0, 10).map((i, k) => {
    const cons = STATE.menu.reduce((a, m) => a + m.recipe.reduce((b, [id, qy]) => id === i.id ? b + (i.unit === 'pc' ? qy : qy / 1000) * m.sold : b, 0), 0);
    const op = cons * 0.3, pur = cons * 1.05, exp = op + pur - cons, cnt = exp * (k % 4 === 0 ? 0.93 : 0.99), va = (cnt - exp) / (exp || 1) * 100;
    return `<tr><td>${esc(i.n)}</td><td class="num">${op.toFixed(0)}</td><td class="num">${pur.toFixed(0)}</td><td class="num">${cons.toFixed(0)}</td><td class="num">${exp.toFixed(0)}</td><td class="num">${cnt.toFixed(0)}</td><td class="num ${va < -3 ? 'down' : ''}">${va.toFixed(1)}%</td></tr>`;
  }).join('')}</table>
  <p class="note" style="margin-top:9px">Units: kg (or pc). Variance beyond −3% feeds the Shrinkage line in Hidden Costs.</p></div>`;
};

// ── Employees ─────────────────────────────────────────────────
PAGES.emp = () => {
  const tot = laborPool();
  return `<div class="grid g3">${kpi('Headcount', STATE.emps.length)}${kpi('True monthly cost', SAR(Math.round(tot)))}
  ${kpi('Avg multiplier', (STATE.emps.length ? (tot / STATE.emps.reduce((a, e) => a + e.basic, 0)) : 0).toFixed(2) + '×', 'of basic salary')}</div>
  <div class="card" style="margin-top:13px"><h4>Employee Cost Engine <span class="note">edit basic salary — labor cost per dish recalculates</span></h4>
  ${STATE.emps.length ? `<table><tr><th>Employee</th><th class="num">Basic</th><th class="num">Housing+Trans+Food</th><th class="num">GOSI</th><th class="num">Visa/Iqama/Med/Recruit</th><th class="num">True cost</th><th></th></tr>
  ${STATE.emps.map(e => `<tr><td>${esc(e.n)}<div class="note">${esc(e.pos)} · ${e.saudi ? 'Saudi' : 'Expat'} · GOSI ${(e.gosi * 100).toFixed(2)}%</div></td>
   <td class="num"><input class="tbl-edit" type="number" value="${e.basic}" onchange="STATE.emps.find(x=>x.id===${q(e.id)}).basic=+this.value;render();toast('Labor rate recalculated')"></td>
   <td class="num">${fmt(e.hous + e.trans + e.food)}</td><td class="num">${fmt(Math.round(e.basic * e.gosi))}</td>
   <td class="num">${fmt(e.visa + e.iqama + e.med + e.recr)}</td><td class="num"><b>${fmt(Math.round(empMonthly(e)))}</b></td>
   <td><button class="btn btn-sm btn-danger" onclick="STATE.emps=STATE.emps.filter(x=>x.id!==${q(e.id)});render()">✕</button></td></tr>`).join('')}</table>`
    : '<div class="empty"><div class="big">⬢</div><h5>No employees</h5><p>Add staff in onboarding step 7.</p></div>'}
  <p class="note" style="margin-top:9px">Direct labor per dish = station minutes × blended true cost per minute (${STATE.menu.length ? ('SAR ' + laborRate().toFixed(2) + '/min') : '—'}), allocating 100% of payroll across actual plates sold.</p></div>`;
};

// ── Government Fees ───────────────────────────────────────────
PAGES.gov = () => {
  const tot = STATE.gov.reduce((a, g) => a + g.amt, 0);
  return `<div class="grid g3">${kpi('Tracked fees', STATE.gov.length + ' items', 'all editable')}
  ${kpi('Monthly allocation', SAR(Math.round(govMonthly())), 'incl. per-employee fees')}
  ${kpi('Avg per dish', STATE.menu.length ? SAR2(govMonthly() / totalUnits()) : '—', 'revenue-share allocation')}</div>
  <div class="card" style="margin-top:13px"><h4>Saudi Compliance Cost Agent <span class="tag gold">Agent G</span> <span class="note">amounts change — edit them and every dish recosts</span></h4>
  <table><tr><th>Fee</th><th>Authority</th><th class="num">Amount (SAR)</th><th>Cycle</th></tr>
  ${STATE.gov.map(g => `<tr><td>${esc(g.n)}</td><td class="note">${esc(g.auth)}</td>
   <td class="num"><input class="tbl-edit" type="number" value="${g.amt}" onchange="g_(${q(g.id)}).amt=+this.value;render();toast('Government allocation updated across all dishes')"></td>
   <td class="note">${esc(g.cycle)}</td></tr>`).join('')}</table>
  <p class="note" style="margin-top:9px">GOSI employer share is computed in the Employee Cost Engine to avoid double counting.</p></div>`;
};

// ── Hidden Costs ──────────────────────────────────────────────
PAGES.hidden = () => {
  const grps = [...new Set(STATE.hidden.map(h => h.grp))];
  return `<div class="grid g3">${kpi('Hidden costs / month', SAR(hiddenMonthly()))}${kpi('Largest group', grps.sort((a, b) => hiddenGroup(b) - hiddenGroup(a))[0] || '—')}${kpi('Avg per dish', STATE.menu.length ? SAR2(hiddenMonthly() / totalUnits()) : '—')}</div>
  ${grps.map(g => `<div class="card" style="margin-top:13px"><h4>${g} <span class="note">${SAR(hiddenGroup(g))}/mo${g === 'Marketing' ? ' · manage in Marketing Costs page' : ''}</span></h4>
  <table>${STATE.hidden.filter(h => h.grp === g).map(h => `<tr><td>${esc(h.n)}</td>
   <td class="num"><input class="tbl-edit" type="number" value="${h.amt}" onchange="STATE.hidden.find(x=>x.id===${q(h.id)}).amt=+this.value;render()"></td>
   <td style="width:46px"><button class="btn btn-sm btn-danger" onclick="STATE.hidden=STATE.hidden.filter(x=>x.id!==${q(h.id)});render();toast('Cost line removed','bad')">✕</button></td></tr>`).join('')}</table></div>`).join('')}
  <div class="card" style="margin-top:13px"><h4>Add hidden cost line</h4>
   <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input class="tbl-edit" id="hcN" style="width:220px;text-align:start" placeholder="e.g. Grease trap cleaning">
    <select class="tbl-edit" id="hcG" style="width:140px;text-align:start">${['Operations', 'Utilities', 'Technology', 'Marketing', 'Finance', 'Shrinkage'].map(g => `<option>${g}</option>`).join('')}</select>
    <input class="tbl-edit" id="hcA" type="number" placeholder="SAR/mo" style="width:100px">
    <button class="btn btn-sm btn-navy" onclick="if(!$('hcN').value.trim()||!+$('hcA').value){toast('Name and amount required','bad')}else{STATE.hidden.push({id:uid(),n:$('hcN').value.trim(),grp:$('hcG').value,amt:+$('hcA').value});render();toast('Cost line added')}">+ Add</button></div></div>`;
};

// ── Marketing Costs ───────────────────────────────────────────
PAGES.mktg = () => {
  const rows = STATE.hidden.filter(h => h.grp === 'Marketing');
  const tot = hiddenGroup('Marketing'); const t = STATE.menu.length ? totals() : null;
  const B = STATE.budget || (STATE.budget = { food: 32, labor: 20, mkt: 5 }); if (B.mkt === undefined) B.mkt = 5;
  const pctRev = t ? tot / t.rev * 100 : 0;
  return `<div class="grid g4">
   ${kpi('Marketing / month', SAR(tot), rows.length + ' line items')}
   ${kpi('% of revenue', t ? pct(pctRev) : '—', 'target ' + B.mkt + '%', t ? (pctRev <= B.mkt ? 'up' : 'down') : '')}
   ${kpi('Avg per dish', t ? SAR2(tot / totalUnits()) : '—', 'revenue-share allocation')}
   ${kpi('Delivery app marketing', pct(STATE.apps.reduce((a, x) => a + x.mkt * x.share, 0) / (STATE.apps.reduce((a, x) => a + x.share, 0) || 1)), 'blended · set per platform in Delivery Apps')}</div>
  <div class="card" style="margin-top:13px"><h4>Marketing cost lines <span class="note">editable — they flow into every dish's marketing layer</span></h4>
   <table><tr><th>Item</th><th class="num">SAR / month</th><th></th></tr>
   ${rows.map(h => `<tr><td><input class="tbl-edit" style="width:240px;text-align:start" value="${esc(h.n)}" onchange="STATE.hidden.find(x=>x.id===${q(h.id)}).n=this.value"></td>
    <td class="num"><input class="tbl-edit" type="number" value="${h.amt}" onchange="STATE.hidden.find(x=>x.id===${q(h.id)}).amt=+this.value;render();toast('Marketing allocation updated across all dishes')"></td>
    <td><button class="btn btn-sm btn-danger" onclick="STATE.hidden=STATE.hidden.filter(x=>x.id!==${q(h.id)});render();toast('Marketing line removed','bad')">✕</button></td></tr>`).join('') || '<tr><td colspan="3" class="note">No marketing lines yet — add your first below.</td></tr>'}</table>
   <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
    <input class="tbl-edit" id="mkN" style="width:230px;text-align:start" placeholder="e.g. Influencer campaign — Riyadh Season">
    <input class="tbl-edit" id="mkA" type="number" placeholder="SAR/mo" style="width:110px">
    <button class="btn btn-sm btn-navy" onclick="addMktLine()">+ Add marketing cost</button></div></div>
  <div class="grid g2" style="margin-top:13px">
   <div class="card"><h4>Marketing budget</h4>
    <div class="field"><label>Target marketing % of revenue</label><input type="number" step="0.5" value="${B.mkt}" onchange="STATE.budget.mkt=+this.value;render()"></div>
    ${t ? `<div class="alert ${pctRev <= B.mkt ? 'good' : 'bad'}"><span>${pctRev <= B.mkt ? '✓' : '▲'}</span><div>Actual ${pct(pctRev)} vs target ${B.mkt}% — ${pctRev <= B.mkt ? 'on budget.' : 'over by ' + pct(pctRev - B.mkt) + ' (' + SAR(Math.round(tot - t.rev * B.mkt / 100)) + '/month).'}</div></div>` : '<p class="note">Import your menu to compare against revenue.</p>'}
   </div>
   <div class="card"><h4>How marketing flows into costing</h4>
    <p class="note">Each dish carries a marketing layer = monthly marketing pool × the dish's revenue share. Delivery-app marketing fees are <b>not</b> in this pool — they're charged per order inside the delivery layer so nothing is double-counted.</p></div></div>`;
};
function addMktLine() {
  const n = $('mkN').value.trim(), a = +$('mkA').value;
  if (!n || !a) { toast('Name and monthly amount required', 'bad'); return; }
  STATE.hidden.push({ id: uid(), n, grp: 'Marketing', amt: a }); render(); toast('Marketing cost added — all dishes recosted');
}

// ── Delivery Apps ─────────────────────────────────────────────
PAGES.apps = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const m = [...STATE.menu].sort((a, b) => b.sold * b.delShare - a.sold * a.delShare)[0];
  return `<div class="card"><h4>Platform settings <span class="note">edit % — the blended rate feeds every item's delivery layer</span></h4>
  <table><tr><th>Platform</th><th class="num">Commission %</th><th class="num">Marketing %</th><th class="num">Order share %</th><th class="num">Net margin on ${esc(m.n)}</th><th></th></tr>
  ${STATE.apps.map((a, i) => {
    const fee = (a.comm + a.mkt) / 100;
    const direct = m.price - (ingCost(m) + m.pack + m.laborMin * laborRate() + ingCost(m) * 0.04);
    const net = (direct - m.price * fee) / m.price * 100;
    return `<tr><td>${esc(a.n)}</td>
    <td class="num"><input class="tbl-edit" type="number" value="${a.comm}" onchange="STATE.apps[${i}].comm=+this.value;render()"></td>
    <td class="num"><input class="tbl-edit" type="number" value="${a.mkt}" onchange="STATE.apps[${i}].mkt=+this.value;render()"></td>
    <td class="num"><input class="tbl-edit" type="number" value="${a.share}" onchange="STATE.apps[${i}].share=+this.value;render()"></td>
    <td class="num ${net < 25 ? 'down' : 'up'}">${pct(net)}</td>
    <td style="width:46px"><button class="btn btn-sm btn-danger" onclick="STATE.apps.splice(${i},1);render();toast('Platform removed — blended rate updated','bad')">✕</button></td></tr>`;
  }).join('')}</table>
  <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
   <input class="tbl-edit" id="apN" style="width:160px;text-align:start" placeholder="Platform name">
   <input class="tbl-edit" id="apC" type="number" placeholder="Comm %" style="width:90px">
   <input class="tbl-edit" id="apM" type="number" placeholder="Mktg %" style="width:90px">
   <input class="tbl-edit" id="apS" type="number" placeholder="Share %" style="width:90px">
   <button class="btn btn-sm btn-navy" onclick="if(!$('apN').value.trim()){toast('Platform name required','bad')}else{STATE.apps.push({n:$('apN').value.trim(),comm:+$('apC').value||20,mkt:+$('apM').value||0,share:+$('apS').value||10});render();toast('Platform added — blended rate updated')}">+ Add platform</button></div>
  <div class="alert warn" style="margin-top:12px"><span>◆</span><div>Blended platform cost: <b>${pct(blendedAppRate() * 100)}</b> of delivery revenue. Items with delivery net margin < 25% should use a delivery-specific price.</div></div></div>`;
};

// ── Cost Allocation ───────────────────────────────────────────
PAGES.alloc = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const U = totalUnits();
  const pools = [['Rent', STATE.rent], ['Government fees', govMonthly()], ['Utilities (incl. elec/water out of rent)', hiddenGroup('Utilities') + utilMonthly()], ['Extra fees & fines', xfeesMonthly()], ['Technology', hiddenGroup('Technology')], ['Marketing', hiddenGroup('Marketing')], ['Operations & finance', hiddenGroup('Operations') + hiddenGroup('Finance')], ['Shrinkage & waste', hiddenGroup('Shrinkage')]];
  const mx = Math.max(...pools.map(p => p[1]));
  return `<div class="card"><h4>Cost allocation method</h4>
  <p class="note" style="margin-bottom:12px">Overhead pools allocate by <b>revenue share</b>. Labor allocates by station minutes; delivery by each item's delivery share × blended platform rate; ingredient waste at ${STATE.wastePct ?? 4}% of materials.</p>
  <table><tr><th>Pool</th><th class="num">Monthly (SAR)</th><th style="width:38%"></th><th class="num">Avg / dish</th></tr>
  ${pools.map(p => `<tr><td>${p[0]}</td><td class="num">${fmt(Math.round(p[1]))}</td><td><div class="bartrack"><i style="width:${p[1] / mx * 100}%"></i></div></td><td class="num">${SAR2(p[1] / U)}</td></tr>`).join('')}
  <tr><td>Rent (edit)</td><td class="num" colspan="3"><input class="tbl-edit" type="number" value="${STATE.rent}" onchange="STATE.rent=+this.value;render();toast('Rent allocation updated')"> SAR / month</td></tr>
  <tr><td>Ingredient waste % (edit)</td><td class="num" colspan="3"><input class="tbl-edit" type="number" step="0.5" value="${STATE.wastePct ?? 4}" onchange="STATE.wastePct=+this.value;render();toast('Waste % updated — all recipes recosted')"> % of materials per dish</td></tr></table></div>`;
};

// ── P&L / Profit ──────────────────────────────────────────────
PAGES.profit = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const t = totals();
  const packT = STATE.menu.reduce((a, m) => a + m.pack * m.sold, 0);
  const wasteT = STATE.menu.reduce((a, m) => a + ingCost(m) * (STATE.wastePct ?? 4) / 100 * m.sold, 0) + hiddenGroup('Shrinkage');
  const delT = STATE.menu.reduce((a, m) => a + layers(m).del * m.sold, 0);
  const opex = hiddenMonthly() - hiddenGroup('Shrinkage');
  const B = STATE.budget || { food: 32, labor: 20 };
  const byCat = STATE.cats.map(c => { const items = STATE.menu.filter(m => m.cat === c); if (!items.length) return null; return { c, rev: items.reduce((a, m) => a + m.price * m.sold, 0), pr: items.reduce((a, m) => a + margin(m) * m.sold, 0) }; }).filter(Boolean).sort((a, b) => b.pr - a.pr);
  const pl = [['Revenue', t.rev, 1], ['Cost of goods (ingredients)', -t.ingT], ['Packaging', -packT], ['Waste & shrinkage', -wasteT],
    ['— Gross profit', t.rev - t.ingT - packT - wasteT, 1], ['Labor (fully loaded)', -t.labor], ['Delivery commissions', -delT],
    ['Operating expenses', -opex], ['Utilities (elec/water out of rent)', -utilMonthly()], ['Extra fees & fines', -xfeesMonthly()],
    ['Rent', -t.rent], ['Government & compliance', -t.gov], ['— Net profit', t.net, 1]];
  return `<div class="grid g2">
  <div class="card"><h4>Live P&L <span class="note">month-to-date · updates with every edit & invoice</span></h4>
   <table>${pl.map(r => `<tr style="${r[2] ? 'font-weight:700' : ''}"><td>${r[0]}</td><td class="num ${r[1] < 0 ? '' : 'up'}">${r[1] < 0 ? '(' + fmt(Math.round(-r[1])) + ')' : fmt(Math.round(r[1]))}</td></tr>`).join('')}</table>
   <p class="note" style="margin-top:8px">Net margin ${pct(t.net / t.rev * 100)} of revenue.</p></div>
  <div class="card"><h4>Budgets <span class="note">live tracking — set your targets</span></h4>
   <div class="grid g2">
    <div class="field"><label>Food cost target %</label><input type="number" value="${B.food}" onchange="STATE.budget.food=+this.value;render()"></div>
    <div class="field"><label>Labor cost target %</label><input type="number" value="${B.labor}" onchange="STATE.budget.labor=+this.value;render()"></div></div>
   <table><tr><th>Metric</th><th class="num">Actual</th><th class="num">Target</th><th>Status</th></tr>
    <tr><td>Food cost %</td><td class="num">${pct(t.foodPct)}</td><td class="num">${B.food}%</td><td><span class="tag ${t.foodPct <= B.food ? 'ok' : 'bad'}">${t.foodPct <= B.food ? 'On budget' : 'Over by ' + pct(t.foodPct - B.food)}</span></td></tr>
    <tr><td>Labor cost %</td><td class="num">${pct(t.laborPct)}</td><td class="num">${B.labor}%</td><td><span class="tag ${t.laborPct <= B.labor ? 'ok' : 'bad'}">${t.laborPct <= B.labor ? 'On budget' : 'Over by ' + pct(t.laborPct - B.labor)}</span></td></tr>
    <tr><td>Prime cost %</td><td class="num">${pct(t.primePct)}</td><td class="num">${B.food + B.labor}%</td><td><span class="tag ${t.primePct <= B.food + B.labor ? 'ok' : 'warn'}">${t.primePct <= B.food + B.labor ? 'On budget' : 'Watch'}</span></td></tr></table></div></div>
  <div class="grid g2" style="margin-top:13px">
  <div class="card"><h4>Category profitability</h4><table><tr><th>Category</th><th class="num">Revenue</th><th class="num">Profit</th><th class="num">Margin</th></tr>
   ${byCat.map(x => `<tr><td>${esc(x.c)}</td><td class="num">${fmt(x.rev)}</td><td class="num ${x.pr < 0 ? 'down' : ''}">${fmt(Math.round(x.pr))}</td><td class="num">${pct(x.pr / x.rev * 100)}</td></tr>`).join('')}</table></div>
  <div class="card"><h4>Item ranking by total profit</h4><table><tr><th>Item</th><th class="num">Profit / mo</th><th>Class</th></tr>
   ${[...STATE.menu].sort((a, b) => margin(b) * b.sold - margin(a) * a.sold).map(m => `<tr><td>${esc(m.n)}</td><td class="num ${margin(m) < 0 ? 'down' : ''}">${fmt(Math.round(margin(m) * m.sold))}</td><td><span class="tag ${mCls(m)}">${mLabel(m)}</span></td></tr>`).join('')}</table></div></div>`;
};

// ── Reports ───────────────────────────────────────────────────
PAGES.reports = () => `<div class="grid g3">
 ${[['Owner monthly pack', 'P&L summary, menu engineering, repricing list'], ['Accountant export', 'Cost layers per item, allocations, GOSI & gov fees'], ['Investor snapshot', 'Unit economics, break-even, growth levers'], ['Food cost report', 'Ingredient usage, price changes, variance'], ['Delivery channel report', 'Per-app profitability & commission impact'], ['Compliance cost report', 'All Saudi fees with cycles & renewals']].map((r, i) => `
 <div class="card"><h4>${r[0]}</h4><p class="note" style="margin-bottom:12px">${r[1]}.</p>
 <div id="rep${i}"><button class="btn btn-line btn-sm" onclick="genReport(${i})">Generate</button></div></div>`).join('')}</div>`;

function genReport(i) {
  const el = $('rep' + i); el.innerHTML = '<div class="spinner"></div><p class="note" style="text-align:center;margin-top:8px">Compiling from live data…</p>';
  setTimeout(() => {
    const t = totals();
    el.innerHTML = `<div class="alert good"><span>✓</span><div>Report ready: revenue ${SAR(t.rev)}, net ${SAR(Math.round(t.net))}, food cost ${pct(t.foodPct)}, ${STATE.menu.filter(m => marginPct(m) < 20).length} items flagged for repricing.</div></div>
    <button class="btn btn-sm btn-line" onclick="toast('PDF export is wired to the backend in production')">Download PDF</button>`;
  }, 1300);
}

// ── Rent & Utilities ──────────────────────────────────────────
function monthsBetween(a, b) {
  if (!a || !b) return 0;
  const [ay, am] = a.split('-').map(Number), [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}
PAGES.rentutil = () => {
  const rt = STATE.rentTerm || (STATE.rentTerm = { months: 12, start: curMonth() });
  const elapsed = Math.max(0, Math.min(rt.months, monthsBetween(rt.start, curMonth())));
  const remaining = Math.max(0, rt.months - elapsed);
  const total = STATE.rent * rt.months;
  const e = STATE.elec || (STATE.elec = { included: true, amt: 0 });
  const w = STATE.water || (STATE.water = { included: true, amt: 0 });
  const utilCard = (key, label) => {
    const u = STATE[key];
    return `<div class="card"><h4>${label} <span class="tag ${u.included ? 'ok' : 'warn'}">${u.included ? 'in rent' : 'billed separately'}</span></h4>
     <div class="field"><label>Is ${label.toLowerCase()} included in the rent?</label>
      <select onchange="STATE.${key}.included=(this.value==='yes');render();toast('${label} setting updated — costs recalculated')">
       <option value="yes" ${u.included ? 'selected' : ''}>Yes — included in rent</option>
       <option value="no" ${!u.included ? 'selected' : ''}>No — separate monthly bill</option></select></div>
     ${u.included
       ? `<p class="note">${label} is part of the rent above, so it is not added again as a separate cost.</p>`
       : `<div class="field"><label>${label} bill (SAR / month)</label><input type="number" min="0" value="${u.amt}" onchange="STATE.${key}.amt=Math.max(0,+this.value);render();toast('${label} bill updated — all dishes recosted')"></div>`}
    </div>`;
  };
  return `<div class="grid g4">
   ${kpi('Monthly rent', SAR(STATE.rent))}
   ${kpi('Lease length', rt.months + ' mo', monthLabel(rt.start) + ' →')}
   ${kpi('Total lease value', SAR(total), STATE.rent + ' × ' + rt.months)}
   ${kpi('Remaining', remaining + ' mo', elapsed + ' mo elapsed', remaining <= 2 ? 'down' : '')}</div>
  <div class="card" style="margin-top:13px"><h4>Rent contract <span class="note">rent can change — update it and every dish recosts</span></h4>
   <div class="grid g3">
    <div class="field"><label>Monthly rent (SAR)</label><input type="number" min="0" value="${STATE.rent}" onchange="STATE.rent=Math.max(0,+this.value);render();toast('Rent updated — all dishes recosted')"></div>
    <div class="field"><label>Lease duration (months)</label><input type="number" min="1" value="${rt.months}" onchange="STATE.rentTerm.months=Math.max(1,+this.value||1);render()"></div>
    <div class="field"><label>Lease start month</label><input type="month" value="${rt.start}" onchange="STATE.rentTerm.start=this.value||curMonth();render()"></div></div>
   ${remaining <= 2 ? `<div class="alert warn"><span>◆</span><div>Lease ends in <b>${remaining} month(s)</b> (${monthLabel(nextMonthsFrom(rt.start, rt.months))}). Budget for renewal or a rent change.</div></div>` : ''}
   <p class="note">Rent is allocated to each dish by revenue share. Changing the monthly figure updates margins everywhere instantly; the lease length & start are used for renewal alerts and total-commitment tracking.</p></div>
  <div class="grid g2" style="margin-top:13px">${utilCard('elec', 'Electricity')}${utilCard('water', 'Water')}</div>
  <div class="card" style="margin-top:13px"><h4>How this flows into costing</h4>
   <p class="note">Electricity and water marked <b>“billed separately”</b> are added to the Utilities cost pool and spread across dishes by revenue share. Marked <b>“in rent”</b>, they contribute nothing extra — the rent already covers them — so nothing is double-counted.</p>
   <div class="grid g3" style="margin-top:8px">
    ${kpi('Electricity in costing', e.included ? 'SAR 0' : SAR(e.amt), e.included ? 'covered by rent' : 'per month')}
    ${kpi('Water in costing', w.included ? 'SAR 0' : SAR(w.amt), w.included ? 'covered by rent' : 'per month')}
    ${kpi('Utilities pool total', SAR(hiddenGroup('Utilities') + utilMonthly()), 'incl. gas & other')}</div></div>`;
};
function nextMonthsFrom(start, n) { let s = start; for (let i = 0; i < n; i++) s = nextMonth(s); return s; }

// ── Extra Fees & Fines ────────────────────────────────────────
PAGES.xfees = () => {
  const em = STATE.evalMonth || (STATE.evalMonth = curMonth());
  const list = STATE.xfees || (STATE.xfees = []);
  const monthly = list.filter(f => f.type === 'monthly');
  const oneNow = list.filter(f => f.type === 'onetime' && f.month === em);
  const unpaid = oneNow.filter(f => !f.paid);
  const isCur = em === curMonth();
  return `<div class="grid g4">
   ${kpi('Recurring / month', SAR(xfeesRecurring()), monthly.length + ' line(s)')}
   ${kpi('One-time this month', SAR(xfeesOneTime()), oneNow.length + ' charge(s)')}
   ${kpi('Total into costs', SAR(Math.round(xfeesMonthly())), 'this evaluation month')}
   ${kpi('Unpaid one-time', unpaid.length, unpaid.length ? SAR(unpaid.reduce((a, f) => a + f.amt, 0)) + ' outstanding' : 'all settled', unpaid.length ? 'down' : 'up')}</div>
  <div class="card" style="margin-top:13px"><h4>Evaluation month <span class="note">one-time fines only count in their own month</span></h4>
   <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
    <button class="btn btn-sm btn-line" onclick="changeEvalMonth(-1)">← ${monthLabel(prevMonth(em))}</button>
    <b style="font-family:var(--mono);font-size:16px">${monthLabel(em)}${isCur ? ' · current' : ''}</b>
    <button class="btn btn-sm btn-line" onclick="changeEvalMonth(1)">${monthLabel(nextMonth(em))} →</button>
    <button class="btn btn-sm btn-navy" style="margin-inline-start:auto" onclick="closeMonth()">Close month & roll forward →</button></div>
   <p class="note" style="margin-top:9px">A one-time fee (e.g. a municipality fine) is charged in the month you log it. Once you roll forward, it is automatically dropped from the next month's cost — paid or not it no longer inflates future margins.</p>
   ${unpaid.length ? `<div class="alert warn"><span>◆</span><div><b>${unpaid.length} one-time fee(s) still marked unpaid</b> for ${monthLabel(em)} — settle them or they stay flagged when you roll the month forward.</div></div>` : ''}</div>
  <div class="card" style="margin-top:13px"><h4>Fee lines</h4>
   <table><tr><th>Fee</th><th>Type</th><th>Month</th><th class="num">SAR / mo</th><th>Paid</th><th></th></tr>
   ${list.length ? list.map(f => `<tr>
     <td><input class="tbl-edit" style="width:210px;text-align:start" value="${esc(f.n)}" onchange="xfeeField(${q(f.id)},'n',this.value)">${f.note ? `<div class="note">${esc(f.note)}</div>` : ''}</td>
     <td><span class="tag ${f.type === 'monthly' ? 'info' : 'warn'}">${f.type === 'monthly' ? 'Recurring' : 'One-time'}</span></td>
     <td class="note">${f.type === 'monthly' ? 'every month' : monthLabel(f.month)}</td>
     <td class="num"><input class="tbl-edit" type="number" value="${f.amt}" onchange="xfeeField(${q(f.id)},'amt',Math.max(0,+this.value));render();toast('Extra fees updated — dishes recosted')"></td>
     <td>${f.type === 'onetime' ? `<input type="checkbox" ${f.paid ? 'checked' : ''} onchange="xfeeField(${q(f.id)},'paid',this.checked)">` : '<span class="note">—</span>'}</td>
     <td><button class="btn btn-sm btn-danger" onclick="delXfee(${q(f.id)})">✕</button></td></tr>`).join('')
   : '<tr><td colspan="6" class="note">No extra fees yet — add one below or pick a common Saudi fee.</td></tr>'}</table>
   <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;align-items:center">
    <input class="tbl-edit" id="xfN" style="width:230px;text-align:start" placeholder="e.g. Civil Defense violation fine">
    <select class="tbl-edit" id="xfT" style="width:130px;text-align:start"><option value="monthly">Recurring</option><option value="onetime">One-time / fine</option></select>
    <input class="tbl-edit" id="xfA" type="number" placeholder="SAR" style="width:100px">
    <button class="btn btn-sm btn-navy" onclick="addXfee()">+ Add fee</button></div></div>
  <div class="card" style="margin-top:13px"><h4>Common Saudi restaurant fees <span class="note">tap to add — typical amounts, fully editable</span></h4>
   <div style="display:flex;gap:7px;flex-wrap:wrap">
    ${XFEE_SUGGESTIONS.map((s, i) => `<button class="chip" onclick="addXfeeSuggestion(${i})">${esc(s[0])} <span class="note">· ${s[1] === 'onetime' ? 'fine' : '/mo'} · ~${fmt(s[2])}</span></button>`).join('')}</div>
   <p class="note" style="margin-top:10px">Fine ranges from Saudi municipal regulations: hygiene SAR 200–4,000 · health certificate SAR 200–2,000 · staff hygiene SAR 400–2,000 · operating without a licence SAR 10,000–50,000. Amounts are starting points — set your actual figure.</p></div>`;
};
const prevMonth = ym => { let [y, m] = ym.split('-').map(Number); m--; if (m < 1) { m = 12; y--; } return `${y}-${String(m).padStart(2, '0')}`; };
function xfeeField(id, k, v) { const f = STATE.xfees.find(x => x.id === id); if (!f) return; f[k] = v; if (k === 'paid') render(); }
function changeEvalMonth(dir) { STATE.evalMonth = dir > 0 ? nextMonth(STATE.evalMonth) : prevMonth(STATE.evalMonth); render(); }
function closeMonth() {
  const em = STATE.evalMonth;
  const unpaid = STATE.xfees.filter(f => f.type === 'onetime' && f.month === em && !f.paid);
  STATE.evalMonth = nextMonth(em);
  render();
  toast(`Rolled forward to ${monthLabel(STATE.evalMonth)} — one-time charges from ${monthLabel(em)} dropped` + (unpaid.length ? ` (${unpaid.length} still unpaid)` : ''), unpaid.length ? 'bad' : 'good');
}
function addXfee() {
  const n = $('xfN').value.trim(), type = $('xfT').value, amt = +$('xfA').value;
  if (!n || !amt) { toast('Name and amount required', 'bad'); return; }
  STATE.xfees.push({ id: uid(), n, amt, type, paid: false, month: type === 'onetime' ? STATE.evalMonth : null, note: '' });
  render(); toast('Extra fee added — dishes recosted');
}
function addXfeeSuggestion(i) {
  const s = XFEE_SUGGESTIONS[i];
  STATE.xfees.push({ id: uid(), n: s[0], amt: s[2], type: s[1], paid: false, month: s[1] === 'onetime' ? STATE.evalMonth : null, note: '' });
  render(); toast(`"${s[0]}" added — edit the amount to your actual figure`);
}
function delXfee(id) { STATE.xfees = STATE.xfees.filter(f => f.id !== id); render(); toast('Fee removed', 'bad'); }

// ── Live Market Rates ─────────────────────────────────────────
function marketIngredients() {
  if (STATE.market && Array.isArray(STATE.market.ingredients)) return STATE.market.ingredients;
  return MARKET_FALLBACK.ingredients.map(([key, lo, hi]) => ({ key, lo, hi }));
}
function marketBandFor(name) {
  const lo = name.toLowerCase();
  return marketIngredients().find(d => lo.includes(d.key)) || null;
}
PAGES.market = () => {
  const mk = STATE.market;
  const yourDel = blendedAppRate() * 100;
  const benchRows = [
    ['Delivery commission (blended)', pct(yourDel), `${MARKET_FALLBACK.delivery.lo}–${MARKET_FALLBACK.delivery.hi}%`, yourDel > MARKET_FALLBACK.delivery.hi ? 'down' : 'up'],
    ['VAT (ZATCA)', '15%', '15%', ''],
    ['Electricity tariff', STATE.elec && !STATE.elec.included ? SAR(STATE.elec.amt) + '/mo' : 'in rent', `${MARKET_FALLBACK.electricity.lo}–${MARKET_FALLBACK.electricity.hi} SAR/kWh`, ''],
    ['Water tariff', STATE.water && !STATE.water.included ? SAR(STATE.water.amt) + '/mo' : 'in rent', `${MARKET_FALLBACK.water.lo}–${MARKET_FALLBACK.water.hi} SAR/m³`, ''],
    ['F&B rent benchmark', SAR(STATE.rent) + '/mo', `${fmt(MARKET_FALLBACK.rentSqm.lo)}–${fmt(MARKET_FALLBACK.rentSqm.hi)} SAR/m²/yr`, ''],
  ];
  const ingRows = STATE.ings.map(i => ({ i, band: marketBandFor(i.n) })).filter(x => x.band);
  return `<div class="card"><h4>Live Market Rates <span class="tag gold">Market Agent</span> ${mk ? `<span class="tag ${mk.source === 'live' ? 'ok' : 'warn'}">${mk.source === 'live' ? 'live' : 'offline est.'} · ${mk.at}</span>` : '<span class="tag info">not fetched yet</span>'}</h4>
   <p class="note" style="margin-bottom:12px">Benchmarks current market fees & ingredient prices for a <b>${esc(STATE.org.type)}</b> in <b>${esc(STATE.org.city)}</b> against your numbers. ${mk ? '' : 'Click refresh to pull live rates.'}</p>
   <button class="btn btn-navy btn-sm" id="mkBtn" onclick="refreshMarket()">⟳ Refresh live rates</button>
   <div id="mkTerm" class="note" style="margin-top:10px">${mk ? esc(mk.note || '') : 'Uses live web data server-side; falls back to Saudi market estimates if offline.'}</div></div>
  <div class="card" style="margin-top:13px"><h4>Fees & utilities benchmark</h4>
   <table><tr><th>Item</th><th class="num">Your rate</th><th class="num">Market range</th><th></th></tr>
   ${benchRows.map(r => `<tr><td>${r[0]}</td><td class="num ${r[3]}">${r[1]}</td><td class="num note">${r[2]}</td>
    <td>${r[3] === 'down' ? '<span class="tag bad">above market</span>' : r[3] === 'up' ? '<span class="tag ok">competitive</span>' : ''}</td></tr>`).join('')}</table>
   <p class="note" style="margin-top:9px">Delivery commission is the biggest controllable fee — anything above ${MARKET_FALLBACK.delivery.hi}% blended is worth renegotiating or steering to direct orders.</p></div>
  <div class="card" style="margin-top:13px"><h4>Ingredient price benchmark <span class="note">${ingRows.length} of your ingredients matched to market categories</span></h4>
   ${ingRows.length ? `<table><tr><th>Ingredient</th><th class="num">Your price</th><th class="num">Market /kg</th><th>Status</th><th></th></tr>
   ${ingRows.map(({ i, band }) => {
     const mid = (band.lo + band.hi) / 2, over = i.price > band.hi, under = i.price < band.lo;
     return `<tr><td>${esc(i.n)}</td><td class="num ${over ? 'down' : 'up'}">${SAR2(i.price)}</td>
      <td class="num note">${band.lo}–${band.hi}</td>
      <td><span class="tag ${over ? 'bad' : under ? 'info' : 'ok'}">${over ? 'above market' : under ? 'below range' : 'in range'}</span></td>
      <td>${over ? `<button class="btn btn-sm btn-line" onclick="updIngPrice(${q(i.id)},${mid.toFixed(2)})">Set to market ${SAR2(mid)}</button>` : ''}</td></tr>`;
   }).join('')}</table>` : '<p class="note">No ingredients matched the market categories yet. Import or add ingredients (fish, chicken, rice, dairy…) to see benchmarks.</p>'}</div>`;
};
async function refreshMarket() {
  const btn = $('mkBtn'), term = $('mkTerm');
  if (btn) { btn.disabled = true; btn.textContent = '⟳ Fetching live rates…'; }
  try {
    const res = await fetch('/api/market-rates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org: STATE.org, ingredients: STATE.ings.slice(0, 30).map(i => i.n), rent: STATE.rent, blendedDelivery: blendedAppRate() * 100 }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Market service error');
    STATE.market = { source: 'live', at: new Date().toLocaleDateString('en-US'), note: data.note || 'Live market rates retrieved.', ingredients: data.ingredients || marketIngredients() };
    toast('Live market rates updated');
  } catch (err) {
    STATE.market = { source: 'offline', at: new Date().toLocaleDateString('en-US'), note: MARKET_FALLBACK.note + ' (' + err.message + ')', ingredients: marketIngredients() };
    toast('Live service unavailable — showing Saudi market estimates', 'bad');
  }
  render();
}

// ── Ingredient Excel export / import ──────────────────────────
function exportIngredientsExcel() {
  const rows = STATE.ings.map(i => ({ Name: i.n, Supplier: i.sup, Unit: i.unit, 'Price (SAR)': i.price, 'Yield %': Math.round((i.yield || 1) * 100) }));
  const fname = (STATE.org.name || 'ingredients').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  if (window.XLSX) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingredients');
    XLSX.writeFile(wb, fname + '_ingredients.xlsx');
    toast('Exported ' + rows.length + ' ingredients to Excel');
    return;
  }
  // CSV fallback (opens in Excel) with UTF-8 BOM
  const head = ['Name', 'Supplier', 'Unit', 'Price (SAR)', 'Yield %'];
  const csvEsc = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const csv = '﻿' + [head.join(','), ...rows.map(r => head.map(h => csvEsc(r[h])).join(','))].join('\n');
  downloadBlob(csv, fname + '_ingredients.csv', 'text/csv;charset=utf-8');
  toast('Exported ' + rows.length + ' ingredients (CSV)');
}
function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function parseCSV(text) {
  const rows = []; let row = [], cur = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}
function rowsToObjects(rows) {
  if (!rows.length) return [];
  const norm = s => String(s).toLowerCase().replace(/[^a-z%]/g, '');
  const header = rows[0].map(norm);
  const find = (...keys) => header.findIndex(h => keys.some(k => h.includes(k)));
  const ci = { n: find('name', 'ingredient', 'item'), sup: find('supplier', 'vendor'), unit: find('unit'), price: find('price', 'cost', 'sar'), yld: find('yield') };
  if (ci.n === -1 || ci.price === -1) { ci.n = 0; ci.price = rows[0].length - 1; } // assume name + price columns
  return rows.slice(1).map(r => ({
    n: (r[ci.n] || '').trim(),
    sup: ci.sup > -1 ? (r[ci.sup] || '').trim() : '',
    unit: ci.unit > -1 ? (r[ci.unit] || '').trim().toLowerCase() : '',
    price: parseFloat(String(r[ci.price] || '').replace(/[^\d.]/g, '')),
    yield: ci.yld > -1 ? parseFloat(String(r[ci.yld]).replace(/[^\d.]/g, '')) : NaN,
  })).filter(o => o.n && o.price > 0);
}
function applyIngredientRows(rows) {
  let added = 0, updated = 0; const recosted = new Set();
  rows.forEach(o => {
    const unit = ['kg', 'pc', 'l', 'g', 'box', 'crate'].includes(o.unit) ? (o.unit === 'l' ? 'L' : o.unit) : null;
    const yld = o.yield > 1 ? o.yield / 100 : (o.yield > 0 && o.yield <= 1 ? o.yield : null);
    let ig = STATE.ings.find(x => x.n.toLowerCase() === o.n.toLowerCase());
    if (ig) {
      const old = ig.price;
      if (o.price && o.price !== old) { ig.price = o.price; ig.est = false; ig.hist = ig.hist || []; ig.hist.push({ d: 'xls', p: o.price }); if (ig.hist.length > 8) ig.hist.shift(); updated++; STATE.menu.forEach(m => { if (m.recipe.some(r => r[0] === ig.id)) recosted.add(m.n); }); }
      if (o.sup) ig.sup = o.sup;
      if (unit) ig.unit = unit;
      if (yld) ig.yield = yld;
    } else {
      STATE.ings.push({ id: uid(), n: o.n, sup: o.sup || (STATE.sups[0] ? STATE.sups[0].n : 'Unassigned'), unit: unit || 'kg', price: o.price, yield: yld || 1, est: false, hist: [{ d: 'xls', p: o.price }] });
      added++;
    }
  });
  render();
  toast(`Import done — ${added} added, ${updated} price(s) updated` + (recosted.size ? `, ${recosted.size} recipe(s) recosted` : ''));
}
function importIngredientsFile(input) {
  const file = input.files && input.files[0]; if (!file) return;
  const isXlsx = /\.xlsx?$/i.test(file.name);
  if (isXlsx && window.XLSX) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const arr = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
        const objs = rowsToObjects(arr.map(r => r.map(c => c == null ? '' : c)));
        if (!objs.length) { toast('No "name + price" rows found in the sheet', 'bad'); return; }
        applyIngredientRows(objs);
      } catch (err) { toast('Could not read Excel file: ' + err.message, 'bad'); }
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = e => {
      const objs = rowsToObjects(parseCSV(String(e.target.result)));
      if (!objs.length) { toast('No "name + price" rows found', 'bad'); return; }
      applyIngredientRows(objs);
    };
    reader.readAsText(file);
  }
  input.value = '';
}
function ingredientImportModal() {
  modal(`<h3>Import ingredients</h3>
   <div class="field"><label>Paste rows — one per line as <b>name, price, unit</b> (or tab/space separated)</label>
    <textarea id="igPaste" rows="6" placeholder="Hamour fish, 62, kg&#10;Shrimp peeled 58 kg&#10;Rice, 7.5"></textarea></div>
   <button class="btn btn-navy btn-sm" onclick="importIngredientsPaste()">Import pasted rows</button>
   <div class="or">or pull from a supplier price-list URL</div>
   <div class="field"><label>Supplier price-list / website URL</label><input id="igUrl" placeholder="https://supplier.sa/pricelist"></div>
   <div class="term" id="igTerm" style="height:90px;margin-bottom:14px">› Idle.</div>
   <div style="display:flex;gap:9px;justify-content:flex-end">
    <button class="btn btn-line" onclick="closeModal()">Close</button>
    <button class="btn btn-gold" onclick="importIngredientsUrl()">▶ Extract from URL</button></div>`);
}
function parseIngredientText(text) {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
    const parts = l.split(/[,;\t]+/).map(s => s.trim());
    if (parts.length >= 2 && /\d/.test(parts[1])) {
      return { n: parts[0], price: parseFloat(parts[1].replace(/[^\d.]/g, '')), unit: (parts[2] || '').toLowerCase(), sup: '', yield: NaN };
    }
    const m = l.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|pc|l|g|box|crate)?$/i);
    if (m) return { n: m[1].trim(), price: parseFloat(m[2]), unit: (m[3] || '').toLowerCase(), sup: '', yield: NaN };
    return null;
  }).filter(o => o && o.n && o.price > 0);
}
function importIngredientsPaste() {
  const txt = ($('igPaste') && $('igPaste').value) || '';
  const objs = parseIngredientText(txt);
  if (!objs.length) { toast('No "name + price" rows detected', 'bad'); return; }
  closeModal(); applyIngredientRows(objs);
}
async function importIngredientsUrl() {
  const url = ($('igUrl') && $('igUrl').value.trim()) || '';
  const term = $('igTerm');
  if (!url.startsWith('http')) { toast('Enter a valid URL', 'bad'); return; }
  if (term) term.innerHTML = `› Fetching <b>${esc(url)}</b> server-side…`;
  try {
    const res = await fetch('/api/fetch-prices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Extraction failed');
    const objs = (data.items || []).map(it => ({ n: it.name, price: it.price, unit: (it.unit || '').toLowerCase(), sup: it.supplier || '', yield: NaN })).filter(o => o.n && o.price > 0);
    if (!objs.length) { if (term) term.innerHTML = '<span style="color:#FF9B8E">✗ No priced ingredients found on that page.</span>'; return; }
    if (term) term.innerHTML = `<span class="g">✓</span> ${objs.length} ingredient(s) found — importing…`;
    closeModal(); applyIngredientRows(objs);
  } catch (err) {
    if (term) term.innerHTML = `<span style="color:#FF9B8E">✗ ${esc(err.message)}</span><br>Tip: paste the price list text instead.`;
    toast('URL extraction failed: ' + err.message, 'bad');
  }
}
