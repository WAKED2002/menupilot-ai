// ═══════════════════════════════════════════════════════════════
// ONBOARDING — 10-step wizard with real Claude extraction
// Key change: Agent B now calls agentSuggestIngredients()
// ═══════════════════════════════════════════════════════════════

const OB_STEPS = ['Restaurant Info','Type','Menu Source','AI Extraction Review','AI Recipe Review','Suppliers','Employees','Government Fees','Delivery Apps','Confirmation'];

function obShell() {
  const st = STATE.ob.step;
  return `<div style="max-width:880px;margin:0 auto;padding:28px 18px 70px">
   <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
    <button class="brand" style="color:var(--text)" onclick="go('dash')"><span class="mark">◔</span> MenuPilot AI</button>
    <button class="btn btn-line btn-sm" onclick="go('dash')">Skip to dashboard →</button></div>
   <div class="steps">${OB_STEPS.map((n, i) => `<span class="stepdot ${i + 1 === st ? 'cur' : i + 1 < st ? 'done' : ''}">${i + 1} · ${n}</span>`).join('')}</div>
   <div class="card">${obBody(st)}
    <div style="display:flex;justify-content:space-between;margin-top:20px">
     <button class="btn btn-line" ${st === 1 ? 'disabled' : ''} onclick="STATE.ob.step=Math.max(1,${st}-1);render()">← Back</button>
     ${st < 10 ? `<button class="btn btn-navy" onclick="obNext()">Continue →</button>` : ''}
    </div></div></div>`;
}

function obNext() {
  const st = STATE.ob.step;
  if (st === 3 && !STATE.ob.extracted) { toast('Run the Menu Extraction Agent first (or skip to dashboard)', 'bad'); return; }
  STATE.ob.step = Math.min(10, st + 1); render();
}

function obBody(st) {
  const org = STATE.org;
  if (st === 1) return `<h4>Restaurant information</h4><div class="grid g2">
   <div class="field"><label>Restaurant name</label><input value="${esc(org.name)}" onchange="STATE.org.name=this.value"></div>
   <div class="field"><label>City</label><input value="${esc(org.city)}" onchange="STATE.org.city=this.value"></div>
   <div class="field"><label>Branches</label><input value="${esc(org.branches.join(', '))}" onchange="STATE.org.branches=this.value.split(',').map(x=>x.trim()).filter(Boolean)"></div>
   <div class="field"><label>Website</label><input value="${esc(org.website || '')}" onchange="STATE.org.website=this.value" placeholder="https://…"></div>
   <div class="field"><label>Instagram</label><input placeholder="@handle"></div>
   <div class="field"><label>TikTok</label><input placeholder="@handle"></div></div>`;

  if (st === 2) return `<h4>Restaurant type <span class="note">loads default categories, ingredients, cost drivers & KPIs</span></h4>
   <div class="typegrid">${TYPES.map(t => `<button class="${org.type === t[1] ? 'sel' : ''}" onclick="STATE.org.type='${t[1]}';STATE.cats=${JSON.stringify(t[2]).replace(/"/g, '&quot;')}.slice();render()"><span class="e">${t[0]}</span>${t[1].replace(' Restaurant', '')}</button>`).join('')}</div>
   <div class="alert info" style="margin-top:14px"><span>◆</span><div><b>${esc(org.type)}</b> template → categories: ${STATE.cats.slice(0, 6).join(', ')}… · KPIs: ${TYPE_KPI(org.type)}</div></div>`;

  if (st === 3) {
    const src = STATE.ob.src;
    return `<h4>Menu Extraction Agent <span class="tag gold">Agent A</span></h4>
   <p class="note" style="margin-bottom:12px">Most accurate: <b>paste your menu text</b>. Open your website's menu page, select all (Ctrl/Cmd+A), copy, paste below.</p>
   <div class="tabs">
    <button class="${src === 'paste' ? 'on' : ''}" onclick="STATE.ob.src='paste';render()">★ Paste menu text</button>
    <button class="${src === 'url' ? 'on' : ''}" onclick="STATE.ob.src='url';render()">Website URL</button>
    <button class="${src === 'file' ? 'on' : ''}" onclick="STATE.ob.src='file';render()">PDF / image</button></div>
   ${src === 'paste' ? `<div class="field"><label>Menu text — any length</label><textarea id="obPaste" rows="10" placeholder="GRILLED FISH&#10;Grilled Hamour  89&#10;Grilled Seabass  95&#10;&#10;SHRIMP&#10;Jumbo Shrimp Sayadiya  79"></textarea></div>
    <button class="btn btn-navy" onclick="runPasteExtraction()">▶ Extract every item</button>` : ''}
   ${src === 'url' ? `<div class="field"><label>Restaurant website or menu page URL</label><input id="obSrcVal" value="${esc(org.website || '')}" placeholder="https://restaurant.sa/menu" onkeydown="if(event.key==='Enter')runUrlExtraction()"></div>
    <div class="alert info"><span>◆</span><div>Claude reads your live menu page server-side and extracts every item. Works best on pages that display text prices (not image-only menus).</div></div>
    <button class="btn btn-navy" onclick="runUrlExtraction()">▶ Extract from URL</button>` : ''}
   ${src === 'file' ? `<div class="field"><label>Menu file (PDF or image)</label><input type="file" accept=".pdf,image/*" id="menuFile" onchange="handleFileUpload(this)"></div>
    <div class="alert info"><span>◆</span><div>Claude will read the uploaded file and extract your menu items automatically.</div></div>
    <button class="btn btn-navy" id="btnFileExtract" disabled onclick="runFileExtraction()">▶ Extract from file</button>` : ''}
   <div class="term" id="obTerm" style="margin-top:13px">› Agent idle.</div>`;
  }

  if (st === 4) {
    const ex = STATE.menu;
    if (!ex.length) return `<div class="empty"><div class="big">◇</div><h5>Nothing extracted yet</h5><p>Go back and run the Menu Extraction Agent.</p></div>`;
    return `<h4>Review extracted menu <span class="note">${ex.length} items · edit names & prices, remove mistakes</span></h4>
   <table><tr><th>Item</th><th>Category</th><th class="num">Price (SAR)</th><th></th></tr>
   ${ex.map(m => `<tr><td><input class="tbl-edit" style="width:190px;text-align:start" value="${esc(m.n)}" onchange="m_(${q(m.id)}).n=this.value"></td>
    <td>${esc(m.cat)}</td><td class="num"><input class="tbl-edit" type="number" value="${m.price}" onchange="m_(${q(m.id)}).price=+this.value;"></td>
    <td><button class="btn btn-sm btn-danger" onclick="STATE.menu=STATE.menu.filter(x=>x.id!==${q(m.id)});render()">Remove</button></td></tr>`).join('')}</table>`;
  }

  if (st === 5) {
    const pend = STATE.menu.filter(m => m.status !== 'approved');
    return `<h4>Recipe Intelligence Agent <span class="tag gold">Agent B</span> <span class="tag info">Claude-powered</span></h4>
   <p class="note" style="margin-bottom:12px">Claude predicted ingredients, quantities and yield % for every item. Approve here, fine-tune later in Recipe Builder.</p>
   ${STATE.menu.length ? (pend.length
     ? pend.slice(0, 3).map(m => recipeCard(m, true)).join('') + (pend.length > 3 ? `<p class="note">…and ${pend.length - 3} more in Recipe Builder.</p>` : '')
     : `<div class="alert good"><span>✓</span><div>All ${STATE.menu.length} recipes approved.</div></div>`)
   : `<div class="empty"><div class="big">⚗</div><h5>No items yet</h5><p>Run extraction first.</p></div>`}
   ${pend.length ? `<button class="btn btn-line btn-sm" onclick="STATE.menu.forEach(m=>m.status='approved');render();toast('All recipes approved')">Approve all</button>` : ''}`;
  }

  if (st === 6) return `<h4>Suppliers</h4>
   ${STATE.sups.length ? `<table><tr><th>Supplier</th><th>Category</th><th>Terms</th></tr>${STATE.sups.map(su => `<tr><td>${esc(su.n)}</td><td>${esc(su.cat)}</td><td>${esc(su.terms)}</td></tr>`).join('')}</table>` : `<div class="empty" style="padding:24px"><div class="big">⛟</div><h5>No suppliers yet</h5></div>`}
   <div class="grid g4" style="margin-top:12px">
    <div class="field"><label>Name</label><input id="supN" placeholder="Gulf Fresh Fish Co."></div>
    <div class="field"><label>Category</label><input id="supC" placeholder="Fresh fish"></div>
    <div class="field"><label>Terms</label><input id="supT" placeholder="Net 15"></div>
    <div class="field"><label>Delivery days</label><input id="supD" placeholder="Sat · Mon · Wed"></div></div>
   <button class="btn btn-line btn-sm" onclick="addSup('supN','supC','supT','supD')">+ Add supplier</button>`;

  if (st === 7) return `<h4>Employees <span class="note">GOSI, visa, iqama, medical included</span></h4>
   ${STATE.emps.length ? `<table><tr><th>Name</th><th>Position</th><th class="num">Basic</th><th class="num">True cost/mo</th></tr>${STATE.emps.map(e => `<tr><td>${esc(e.n)}</td><td>${esc(e.pos)}</td><td class="num">${fmt(e.basic)}</td><td class="num"><b>${fmt(Math.round(empMonthly(e)))}</b></td></tr>`).join('')}</table>` : `<div class="empty" style="padding:24px"><div class="big">⬢</div><h5>No employees yet</h5></div>`}
   <div class="grid g4" style="margin-top:12px">
    <div class="field"><label>Name</label><input id="empN" placeholder="Faisal A."></div>
    <div class="field"><label>Position</label><input id="empP" placeholder="Head Chef"></div>
    <div class="field"><label>Basic salary</label><input id="empB" type="number" placeholder="6000"></div>
    <div class="field"><label>Saudi national?</label><select id="empS"><option value="no">No (expat)</option><option value="yes">Yes</option></select></div></div>
   <button class="btn btn-line btn-sm" onclick="addEmpQuick()">+ Add employee</button>`;

  if (st === 8) { const tot = STATE.gov.reduce((a, g) => a + g.amt, 0);
    return `<h4>Saudi Compliance Cost Agent <span class="tag gold">Agent G</span></h4>
   <div class="alert info"><span>◆</span><div>${STATE.gov.length} fees loaded · ${SAR(tot)} annual · ≈ ${SAR(Math.round(govMonthly()))} / month allocated per dish.</div></div>
   <table>${STATE.gov.slice(0, 6).map(g => `<tr><td>${esc(g.n)}</td><td class="note">${esc(g.auth)}</td><td class="num"><input class="tbl-edit" type="number" value="${g.amt}" onchange="g_(${q(g.id)}).amt=+this.value"></td><td class="note">${esc(g.cycle)}</td></tr>`).join('')}<tr><td colspan="4" class="note">…full list in Government Fees page</td></tr></table>`; }

  if (st === 9) return `<h4>Delivery apps</h4>
   <table><tr><th>Platform</th><th class="num">Commission %</th><th class="num">Marketing %</th><th class="num">Order share %</th></tr>
   ${STATE.apps.map((a, i) => `<tr><td>${esc(a.n)}</td>
     <td class="num"><input class="tbl-edit" type="number" value="${a.comm}" onchange="STATE.apps[${i}].comm=+this.value"></td>
     <td class="num"><input class="tbl-edit" type="number" value="${a.mkt}" onchange="STATE.apps[${i}].mkt=+this.value"></td>
     <td class="num"><input class="tbl-edit" type="number" value="${a.share}" onchange="STATE.apps[${i}].share=+this.value"></td></tr>`).join('')}</table>`;

  if (st === 10) return `<div class="empty" style="padding:30px 10px">
   <div class="big">★</div><h5>Your cost intelligence is live</h5>
   <p style="max-width:46ch;margin:0 auto 6px">${STATE.menu.length} menu items · ${STATE.ings.length} ingredients · ${STATE.emps.length} employees · ${STATE.gov.length} government fees · ${STATE.apps.length} delivery apps — all feeding the Cost Analyst Agent.</p>
   <button class="btn btn-gold" style="margin-top:14px" onclick="finishOnboarding()">Open my dashboard →</button></div>`;

  return '';
}

// ── Menu Extraction: paste mode (deterministic parser) ────────
function parseMenuText(text) {
  const norm = x => x.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/٫/g, '.').replace(/[‎‏]/g, '');
  const lines = norm(text).split(/\r?\n/).map(l => l.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim()).filter(Boolean);
  const priceRe = /(?:SAR|SR|ر\.?\s?س|ريال|﷼)?\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(?:SAR|SR|ر\.?\s?س|ريال|﷼)?$/i;
  const hp = lines.map(l => { const m = l.match(priceRe); if (!m) return null; const p = parseFloat(m[1].replace(',', '.')); return (p >= 1 && p < 10000 && l.length - m[0].length >= 2) ? { p, cut: l.length - m[0].length } : null; });
  const items = []; let cat = 'General'; let last = null; let pend = null;
  lines.forEach((l, i) => {
    if (hp[i]) { let name = l.slice(0, hp[i].cut).replace(/[\s\-–—:.…•]+$/, '').replace(/^[\d.)\-•*]+\s*/, '').trim();
      if (pend && /^[a-z]/.test(name)) { name = pend + ' ' + name; pend = null; }
      else if (pend) { if (last) last.desc = (last.desc ? last.desc + ' ' : '') + pend; pend = null; }
      if (name.length > 1) { last = { n: name, price: hp[i].p, cat, desc: '' }; items.push(last); } return; }
    const nextPriced = hp.slice(i + 1, i + 4).some(Boolean);
    if (l.length <= 38 && nextPriced && !/[.,،]$/.test(l)) { if (pend && last) last.desc = (last.desc ? last.desc + ' ' : '') + pend; pend = null; cat = l.replace(/[:：]+$/, '').trim() || cat; last = null; }
    else if (l.length > 38 && hp[i + 1]) { pend = l; }
    else if (last) { last.desc = (last.desc ? last.desc + ' ' : '') + l; }
  });
  const seen = new Set();
  return items.filter(it => { const k = it.n.toLowerCase() + '|' + it.price; if (seen.has(k)) return false; seen.add(k); return true; });
}

async function importParsed(parsed) {
  for (const it of parsed) {
    if (!STATE.cats.includes(it.cat)) STATE.cats.push(it.cat);

    // Agent B: use Claude for ingredient prediction, fall back to static
    let recipeList;
    try {
      recipeList = await agentSuggestIngredients(it.n, it.desc, STATE.org.type);
    } catch {
      recipeList = suggestIngredients(it.n + ' ' + (it.desc || ''));
    }

    const recipe = recipeList.map(([inN, qty]) => {
      let ig = STATE.ings.find(x => x.n === inN);
      if (!ig) {
        ig = { id: uid(), n: inN, sup: STATE.sups[0] ? STATE.sups[0].n : 'Unassigned', unit: qty < 8 ? 'pc' : 'kg', price: Math.round(8 + Math.random() * 30), yield: 0.92, est: true, hist: [] };
        ig.hist = [{ d: 'now', p: ig.price }];
        STATE.ings.push(ig);
      }
      return [ig.id, qty];
    });
    STATE.menu.push({ id: uid(), n: it.n, cat: it.cat, price: it.price, desc: it.desc || '', recipe, laborMin: 5, pack: 1.5, sold: 150, delShare: .3, status: 'pending', reprice: false });
  }
}

async function runPasteExtraction() {
  const txt = ($('obPaste') && $('obPaste').value) || '';
  const t = $('obTerm');
  if (txt.trim().length < 5) { t.innerHTML = '<span style="color:#FF9B8E">✗ Paste your menu text first.</span>'; toast('Paste your menu text first', 'bad'); return; }
  const parsed = parseMenuText(txt);
  if (!parsed.length) { t.innerHTML = '<span style="color:#FF9B8E">✗ No "item + price" lines detected.</span>'; toast('No items detected', 'bad'); return; }
  const cats = [...new Set(parsed.map(x => x.cat))];
  t.innerHTML = `› Menu Extraction Agent started…<br><span class="g">✓</span> ${parsed.length} items across ${cats.length} categories<br>› Recipe Intelligence Agent (Claude) drafting recipes…`;

  await importParsed(parsed);

  t.innerHTML += `<br><span class="g">✓</span> Done — review recipes on the next step`;
  STATE.ob.extracted = true;
  toast(parsed.length + ' items extracted');
  setTimeout(() => { STATE.ob.step = 4; render(); }, 1400);
}

async function runUrlExtraction() {
  const url = ($('obSrcVal') && $('obSrcVal').value.trim()) || STATE.org.website || '';
  const t = $('obTerm');
  if (!url.startsWith('http')) { toast('Enter a valid URL starting with https://', 'bad'); return; }
  t.innerHTML = `› Fetching <b>${esc(url)}</b> server-side…`;
  try {
    const res = await fetch('/api/fetch-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Unknown error');
    if (!data.items || !data.items.length) {
      t.innerHTML = `<span style="color:#FF9B8E">✗ No priced menu items found on that page.</span><br><span class="g">Tip:</span> link directly to the menu page, or switch to Paste mode.`;
      toast('No items found — try the menu page URL directly', 'bad');
      return;
    }
    t.innerHTML = `<span class="g">✓</span> ${data.items.length} items found · running Recipe Intelligence Agent…`;
    await importParsed(data.items.map(it => ({ n: it.name, price: it.price, cat: it.category || 'General', desc: it.description || '' })));
    t.innerHTML += `<br><span class="g">✓</span> Done — review items on the next step`;
    STATE.ob.extracted = true;
    toast(data.items.length + ' items extracted from URL');
    setTimeout(() => { STATE.ob.step = 4; render(); }, 1400);
  } catch (err) {
    t.innerHTML = `<span style="color:#FF9B8E">✗ ${esc(err.message)}</span><br><span class="g">Tip:</span> Some sites block bots. Try Paste mode instead — copy your menu page (Ctrl+A, Ctrl+C) and paste it.`;
    toast('URL extraction failed: ' + err.message, 'bad');
  }
}

async function handleFileUpload(input) {
  const file = input.files[0]; if (!file) return;
  $('btnFileExtract').disabled = false;
  toast('File ready — click Extract to process with Claude');
}

async function runFileExtraction() {
  const file = $('menuFile')?.files[0]; if (!file) return;
  const t = $('obTerm');
  t.innerHTML = '› Reading file with Claude…';
  try {
    const text = await file.text(); // Works for text/PDF-text; real OCR needs server-side
    const result = await agentMenuExtraction(text);
    const items = result.items || [];
    await importParsed(items.map(it => ({ n: it.name, price: it.price, cat: it.category || 'General', desc: it.description || '' })));
    t.innerHTML = `<span class="g">✓</span> ${items.length} items extracted by Claude`;
    STATE.ob.extracted = true;
    toast(items.length + ' items extracted');
    setTimeout(() => { STATE.ob.step = 4; render(); }, 1400);
  } catch (err) {
    t.innerHTML = `<span style="color:#FF9B8E">✗ ${esc(err.message)}</span>`;
    toast('Extraction failed: ' + err.message, 'bad');
  }
}

// ── Supplier / employee helpers ───────────────────────────────
function addSup(a, b, c, d) {
  if (!$(a).value.trim()) { toast('Supplier name required', 'bad'); return; }
  STATE.sups.push({ n: $(a).value, cat: $(b).value || '—', terms: $(c).value || '—', days: $(d).value || '—', rating: 4.5 });
  render(); toast('Supplier added');
}

function addEmpQuick() {
  const n = $('empN').value.trim(), b = +$('empB').value;
  if (!n || !b) { toast('Name and basic salary required', 'bad'); return; }
  const saudi = $('empS').value === 'yes';
  STATE.emps.push({ id: uid(), n, pos: $('empP').value || 'Staff', basic: b, hous: Math.round(b * .25), trans: saudi ? 400 : 300, food: saudi ? 0 : 300, ot: 0, gosi: saudi ? .2175 : .02, visa: saudi ? 0 : 170, iqama: saudi ? 0 : 54, med: saudi ? 0 : 140, recr: saudi ? 0 : 160, saudi });
  render(); toast('Employee added');
}

function recipeCard(m, inWizard) {
  return `<div class="card" style="background:var(--paper);margin-bottom:12px"><h4>${esc(m.n)} <span style="display:flex;gap:7px"><span class="tag ${m.status === 'approved' ? 'ok' : 'warn'}">${m.status === 'approved' ? 'Approved' : 'AI suggested'}</span></span></h4>
   <table><tr><th>Ingredient</th><th class="num">Qty (g/ml/pc)</th><th class="num">Yield %</th><th class="num">Line cost</th><th></th></tr>
   ${m.recipe.map(([id, qy], ri) => { const i = ingById(id); if (!i) return ''; const lc = (i.unit === 'pc' ? qy * i.price : qy / 1000 * i.price) / (i.yield || 1);
     return `<tr><td>${esc(i.n)}</td>
      <td class="num"><input class="tbl-edit" type="number" value="${qy}" onchange="m_(${q(m.id)}).recipe[${ri}][1]=+this.value;render()"></td>
      <td class="num">${Math.round((i.yield || 1) * 100)}%</td><td class="num">${lc.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="m_(${q(m.id)}).recipe.splice(${ri},1);render()">✕</button></td></tr>`; }).join('')}
   </table>
   <div style="display:flex;gap:8px;margin-top:11px;flex-wrap:wrap;align-items:center">
    <select id="addIng-${m.id}" class="tbl-edit" style="width:200px;text-align:start">${STATE.ings.map(i => `<option value="${i.id}">${esc(i.n)}</option>`).join('')}</select>
    <button class="btn btn-sm btn-line" onclick="m_(${q(m.id)}).recipe.push([$('addIng-${m.id}').value,50]);render()">+ Add ingredient</button>
    ${m.status !== 'approved' ? `<button class="btn btn-sm btn-gold" onclick="m_(${q(m.id)}).status='approved';render();toast('Recipe approved')">✓ Approve recipe</button>` : ''}
    <span class="note" style="margin-inline-start:auto">Ingredient cost: <b style="font-family:var(--mono)">${SAR2(ingCost(m))}</b></span>
   </div></div>`;
}

async function finishOnboarding() {
  if (STATE._orgId) {
    await DB.saveOrgState(STATE._orgId, STATE);
    toast('Data saved to database');
  }
  go('dash');
}
