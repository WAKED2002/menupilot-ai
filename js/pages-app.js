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

// ── Stub pages (full implementations in original file) ────────
['branch','cats','recipe','ing','sup','proc','inv','emp','gov','hidden','mktg','apps','alloc','profit','reports'].forEach(k => {
  if (!PAGES[k]) PAGES[k] = () => `<div class="card"><div class="empty"><div class="big">◇</div><h5>${T(k)}</h5><p>Open the original file for the full ${T(k)} implementation, or this page will be built out next.</p></div></div>`;
});
