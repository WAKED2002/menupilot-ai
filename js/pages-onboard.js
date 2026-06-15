// ═══════════════════════════════════════════════════════════════
// ONBOARDING — 10-step wizard with real Claude extraction
// Key change: Agent B now calls agentSuggestIngredients()
// ═══════════════════════════════════════════════════════════════

const OB_STEPS = ['Restaurant Info','Type','Menu Source','AI Extraction Review','AI Recipe Review','Suppliers','Employees','Government Fees','Delivery Apps','Confirmation'];
const OB_STEPS_AR = ['معلومات المطعم','النوع','مصدر القائمة','مراجعة الاستخراج','مراجعة الوصفات','الموردون','الموظفون','الرسوم الحكومية','تطبيقات التوصيل','التأكيد'];

function obShell() {
  const st = STATE.ob.step;
  const steps = isAr() ? OB_STEPS_AR : OB_STEPS;
  return `<div style="max-width:880px;margin:0 auto;padding:28px 18px 70px">
   <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
    <button class="brand" style="color:var(--text)" onclick="go('dash')"><span class="mark">◔</span> MenuPilot AI</button>
    <button class="btn btn-line btn-sm" onclick="go('dash')">${L('Skip to dashboard →', 'تخطٍّ إلى اللوحة →')}</button></div>
   <div class="steps">${steps.map((n, i) => `<span class="stepdot ${i + 1 === st ? 'cur' : i + 1 < st ? 'done' : ''}">${i + 1} · ${n}</span>`).join('')}</div>
   <div class="card">${obBody(st)}
    <div style="display:flex;justify-content:space-between;margin-top:20px">
     <button class="btn btn-line" ${st === 1 ? 'disabled' : ''} onclick="STATE.ob.step=Math.max(1,${st}-1);render()">${L('← Back', '→ رجوع')}</button>
     ${st < 10 ? `<button class="btn btn-navy" onclick="obNext()">${L('Continue →', 'متابعة ←')}</button>` : ''}
    </div></div></div>`;
}

function obNext() {
  const st = STATE.ob.step;
  if (st === 3 && !STATE.ob.extracted) { toast(L('Run the Menu Extraction Agent first (or skip to dashboard)', 'شغّل وكيل استخراج القائمة أولاً (أو تخطّ إلى اللوحة)'), 'bad'); return; }
  STATE.ob.step = Math.min(10, st + 1); render();
}

function obBody(st) {
  const org = STATE.org;
  if (st === 1) return `<h4>${L('Restaurant information', 'معلومات المطعم')}</h4><div class="grid g2">
   <div class="field"><label>${L('Restaurant name', 'اسم المطعم')}</label><input value="${esc(org.name)}" onchange="STATE.org.name=this.value"></div>
   <div class="field"><label>${L('City', 'المدينة')}</label><input value="${esc(org.city)}" onchange="STATE.org.city=this.value"></div>
   <div class="field"><label>${L('Branches', 'الفروع')}</label><input value="${esc(org.branches.join(', '))}" onchange="STATE.org.branches=this.value.split(',').map(x=>x.trim()).filter(Boolean)"></div>
   <div class="field"><label>${L('Website', 'الموقع الإلكتروني')}</label><input value="${esc(org.website || '')}" onchange="STATE.org.website=this.value" placeholder="https://…"></div>
   <div class="field"><label>Instagram</label><input placeholder="@handle"></div>
   <div class="field"><label>TikTok</label><input placeholder="@handle"></div></div>`;

  if (st === 2) return `<h4>${L('Restaurant type', 'نوع المطعم')} <span class="note">${L('loads default categories, ingredients, cost drivers & KPIs', 'يحمّل التصنيفات والمكونات ومحركات التكلفة والمؤشرات الافتراضية')}</span></h4>
   <div class="typegrid">${TYPES.map(t => `<button class="${org.type === t[1] ? 'sel' : ''}" onclick="STATE.org.type='${t[1]}';STATE.cats=${JSON.stringify(t[2]).replace(/"/g, '&quot;')}.slice();render()"><span class="e">${t[0]}</span>${t[1].replace(' Restaurant', '')}</button>`).join('')}</div>
   <div class="alert info" style="margin-top:14px"><span>◆</span><div><b>${esc(org.type)}</b> ${L('template → categories:', 'القالب ← التصنيفات:')} ${STATE.cats.slice(0, 6).join(', ')}… · ${L('KPIs:', 'المؤشرات:')} ${TYPE_KPI(org.type)}</div></div>`;

  if (st === 3) {
    const src = STATE.ob.src;
    return `<h4>${L('Menu Extraction Agent', 'وكيل استخراج القائمة')} <span class="tag gold">${L('Agent A', 'الوكيل A')}</span></h4>
   <p class="note" style="margin-bottom:12px">${L('Most accurate: <b>paste your menu text</b>. Open your website menu page, select all (Ctrl/Cmd+A), copy, paste below.', 'الأدق: <b>الصق نص قائمتك</b>. افتح صفحة قائمة موقعك، حدّد الكل (Ctrl/Cmd+A)، انسخ، والصق بالأسفل.')}</p>
   <div class="tabs">
    <button class="${src === 'paste' ? 'on' : ''}" onclick="STATE.ob.src='paste';render()">${L('★ Paste menu text', '★ لصق نص القائمة')}</button>
    <button class="${src === 'url' ? 'on' : ''}" onclick="STATE.ob.src='url';render()">${L('Website URL', 'رابط الموقع')}</button>
    <button class="${src === 'file' ? 'on' : ''}" onclick="STATE.ob.src='file';render()">${L('PDF / image', 'PDF / صورة')}</button></div>
   ${src === 'paste' ? `<div class="field"><label>${L('Menu text — any length', 'نص القائمة — أي طول')}</label><textarea id="obPaste" rows="10" placeholder="GRILLED FISH&#10;Grilled Hamour  89&#10;Grilled Seabass  95&#10;&#10;SHRIMP&#10;Jumbo Shrimp Sayadiya  79"></textarea></div>
    <button class="btn btn-navy" onclick="runPasteExtraction()">${L('▶ Extract every item', '▶ استخراج كل الأصناف')}</button>` : ''}
   ${src === 'url' ? `<div class="field"><label>${L('Restaurant website or menu page URL', 'رابط موقع المطعم أو صفحة القائمة')}</label><input id="obSrcVal" value="${esc(org.website || '')}" placeholder="https://restaurant.sa/menu" onkeydown="if(event.key==='Enter')runUrlExtraction()"></div>
    <div class="alert info"><span>◆</span><div>${L('Claude reads your live menu page server-side and extracts every item. Works best on pages that display text prices (not image-only menus).', 'يقرأ Claude صفحة قائمتك مباشرة من الخادم ويستخرج كل صنف. يعمل أفضل مع الصفحات التي تعرض أسعاراً نصية (لا قوائم صور فقط).')}</div></div>
    <button class="btn btn-navy" onclick="runUrlExtraction()">${L('▶ Extract from URL', '▶ استخراج من الرابط')}</button>` : ''}
   ${src === 'file' ? `<div class="field"><label>${L('Menu file (PDF or image)', 'ملف القائمة (PDF أو صورة)')}</label><input type="file" accept=".pdf,image/*" id="menuFile" onchange="handleFileUpload(this)"></div>
    <div class="alert info"><span>◆</span><div>${L('Claude will read the uploaded file and extract your menu items automatically.', 'سيقرأ Claude الملف المرفوع ويستخرج أصناف قائمتك تلقائياً.')}</div></div>
    <button class="btn btn-navy" id="btnFileExtract" disabled onclick="runFileExtraction()">${L('▶ Extract from file', '▶ استخراج من الملف')}</button>` : ''}
   <div class="term" id="obTerm" style="margin-top:13px">${L('› Agent idle.', '› الوكيل في وضع الانتظار.')}</div>`;
  }

  if (st === 4) {
    const ex = STATE.menu;
    if (!ex.length) return `<div class="empty"><div class="big">◇</div><h5>${L('Nothing extracted yet', 'لم يُستخرج شيء بعد')}</h5><p>${L('Go back and run the Menu Extraction Agent.', 'ارجع وشغّل وكيل استخراج القائمة.')}</p></div>`;
    return `<h4>${L('Review extracted menu', 'مراجعة القائمة المستخرجة')} <span class="note">${ex.length} ${L('items · edit names & prices, remove mistakes', 'صنف · عدّل الأسماء والأسعار، واحذف الأخطاء')}</span></h4>
   <table><tr><th>${L('Item', 'الصنف')}</th><th>${L('Category', 'التصنيف')}</th><th class="num">${L('Price (SAR)', 'السعر (ر.س)')}</th><th></th></tr>
   ${ex.map(m => `<tr><td><input class="tbl-edit" style="width:190px;text-align:start" value="${esc(m.n)}" onchange="m_(${q(m.id)}).n=this.value"></td>
    <td>${esc(m.cat)}</td><td class="num"><input class="tbl-edit" type="number" value="${m.price}" onchange="m_(${q(m.id)}).price=+this.value;"></td>
    <td><button class="btn btn-sm btn-danger" onclick="STATE.menu=STATE.menu.filter(x=>x.id!==${q(m.id)});render()">${L('Remove', 'حذف')}</button></td></tr>`).join('')}</table>`;
  }

  if (st === 5) {
    const pend = STATE.menu.filter(m => m.status !== 'approved');
    return `<h4>${L('Recipe Intelligence Agent', 'وكيل ذكاء الوصفات')} <span class="tag gold">${L('Agent B', 'الوكيل B')}</span> <span class="tag info">${L('Claude-powered', 'مدعوم بـ Claude')}</span></h4>
   <p class="note" style="margin-bottom:12px">${L('Claude predicted ingredients, quantities and yield % for every item. Approve here, fine-tune later in Recipe Builder.', 'توقّع Claude المكونات والكميات ونسبة الإنتاجية لكل صنف. اعتمدها هنا، واضبطها لاحقاً في منشئ الوصفات.')}</p>
   ${STATE.menu.length ? (pend.length
     ? pend.slice(0, 3).map(m => recipeCard(m, true)).join('') + (pend.length > 3 ? `<p class="note">${L('…and ' + (pend.length - 3) + ' more in Recipe Builder.', '…و' + (pend.length - 3) + ' أخرى في منشئ الوصفات.')}</p>` : '')
     : `<div class="alert good"><span>✓</span><div>${L('All ' + STATE.menu.length + ' recipes approved.', 'تم اعتماد كل الوصفات الـ' + STATE.menu.length + '.')}</div></div>`)
   : `<div class="empty"><div class="big">⚗</div><h5>${L('No items yet', 'لا توجد أصناف بعد')}</h5><p>${L('Run extraction first.', 'شغّل الاستخراج أولاً.')}</p></div>`}
   ${pend.length ? `<button class="btn btn-line btn-sm" onclick="approveAllRecipes()">${L('Approve all', 'اعتماد الكل')}</button>` : ''}`;
  }

  if (st === 6) return `<h4>${L('Suppliers', 'الموردون')}</h4>
   ${STATE.sups.length ? `<table><tr><th>${L('Supplier', 'المورّد')}</th><th>${L('Category', 'التصنيف')}</th><th>${L('Terms', 'الشروط')}</th></tr>${STATE.sups.map(su => `<tr><td>${esc(su.n)}</td><td>${esc(su.cat)}</td><td>${esc(su.terms)}</td></tr>`).join('')}</table>` : `<div class="empty" style="padding:24px"><div class="big">⛟</div><h5>${L('No suppliers yet', 'لا يوجد موردون بعد')}</h5></div>`}
   <div class="grid g4" style="margin-top:12px">
    <div class="field"><label>${L('Name', 'الاسم')}</label><input id="supN" placeholder="${L('Gulf Fresh Fish Co.', 'شركة الخليج للأسماك')}"></div>
    <div class="field"><label>${L('Category', 'التصنيف')}</label><input id="supC" placeholder="${L('Fresh fish', 'أسماك طازجة')}"></div>
    <div class="field"><label>${L('Terms', 'الشروط')}</label><input id="supT" placeholder="Net 15"></div>
    <div class="field"><label>${L('Delivery days', 'أيام التوريد')}</label><input id="supD" placeholder="${L('Sat · Mon · Wed', 'سبت · إثنين · أربعاء')}"></div></div>
   <button class="btn btn-line btn-sm" onclick="addSup('supN','supC','supT','supD')">${L('+ Add supplier', '+ إضافة مورّد')}</button>`;

  if (st === 7) return `<h4>${L('Employees', 'الموظفون')} <span class="note">${L('GOSI, visa, iqama, medical included', 'شاملاً التأمينات والتأشيرة والإقامة والطبي')}</span></h4>
   ${STATE.emps.length ? `<table><tr><th>${L('Name', 'الاسم')}</th><th>${L('Position', 'الوظيفة')}</th><th class="num">${L('Basic', 'الأساسي')}</th><th class="num">${L('True cost/mo', 'التكلفة الحقيقية/شهر')}</th></tr>${STATE.emps.map(e => `<tr><td>${esc(e.n)}</td><td>${esc(e.pos)}</td><td class="num">${fmt(e.basic)}</td><td class="num"><b>${fmt(Math.round(empMonthly(e)))}</b></td></tr>`).join('')}</table>` : `<div class="empty" style="padding:24px"><div class="big">⬢</div><h5>${L('No employees yet', 'لا يوجد موظفون بعد')}</h5></div>`}
   <div class="grid g4" style="margin-top:12px">
    <div class="field"><label>${L('Name', 'الاسم')}</label><input id="empN" placeholder="${L('Faisal A.', 'فيصل ع.')}"></div>
    <div class="field"><label>${L('Position', 'الوظيفة')}</label><input id="empP" placeholder="${L('Head Chef', 'رئيس الطهاة')}"></div>
    <div class="field"><label>${L('Basic salary', 'الراتب الأساسي')}</label><input id="empB" type="number" placeholder="6000"></div>
    <div class="field"><label>${L('Saudi national?', 'سعودي الجنسية؟')}</label><select id="empS"><option value="no">${L('No (expat)', 'لا (وافد)')}</option><option value="yes">${L('Yes', 'نعم')}</option></select></div></div>
   <button class="btn btn-line btn-sm" onclick="addEmpQuick()">${L('+ Add employee', '+ إضافة موظف')}</button>`;

  if (st === 8) { const tot = STATE.gov.reduce((a, g) => a + g.amt, 0);
    return `<h4>${L('Saudi Compliance Cost Agent', 'وكيل تكاليف الامتثال السعودي')} <span class="tag gold">${L('Agent G', 'الوكيل G')}</span></h4>
   <div class="alert info"><span>◆</span><div>${STATE.gov.length} ${L('fees loaded · ', 'رسم محمّل · ')}${SAR(tot)} ${L('annual · ≈ ', 'سنوي · ≈ ')}${SAR(Math.round(govMonthly()))} ${L('/ month allocated per dish.', '/ شهر موزعة على كل صنف.')}</div></div>
   <table>${STATE.gov.slice(0, 6).map(g => `<tr><td>${esc(g.n)}</td><td class="note">${esc(g.auth)}</td><td class="num"><input class="tbl-edit" type="number" value="${g.amt}" onchange="g_(${q(g.id)}).amt=+this.value"></td><td class="note">${esc(g.cycle)}</td></tr>`).join('')}<tr><td colspan="4" class="note">${L('…full list in Government Fees page', '…القائمة الكاملة في صفحة الرسوم الحكومية')}</td></tr></table>`; }

  if (st === 9) return `<h4>${L('Delivery apps', 'تطبيقات التوصيل')}</h4>
   <table><tr><th>${L('Platform', 'المنصة')}</th><th class="num">${L('Commission %', 'العمولة %')}</th><th class="num">${L('Marketing %', 'التسويق %')}</th><th class="num">${L('Order share %', 'حصة الطلبات %')}</th></tr>
   ${STATE.apps.map((a, i) => `<tr><td>${esc(a.n)}</td>
     <td class="num"><input class="tbl-edit" type="number" value="${a.comm}" onchange="STATE.apps[${i}].comm=+this.value"></td>
     <td class="num"><input class="tbl-edit" type="number" value="${a.mkt}" onchange="STATE.apps[${i}].mkt=+this.value"></td>
     <td class="num"><input class="tbl-edit" type="number" value="${a.share}" onchange="STATE.apps[${i}].share=+this.value"></td></tr>`).join('')}</table>`;

  if (st === 10) return `<div class="empty" style="padding:30px 10px">
   <div class="big">★</div><h5>${L('Your cost intelligence is live', 'ذكاء تكاليفك أصبح جاهزاً')}</h5>
   <p style="max-width:46ch;margin:0 auto 6px">${STATE.menu.length} ${L('menu items · ', 'صنف · ')}${STATE.ings.length} ${L('ingredients · ', 'مكوّن · ')}${STATE.emps.length} ${L('employees · ', 'موظف · ')}${STATE.gov.length} ${L('government fees · ', 'رسم حكومي · ')}${STATE.apps.length} ${L('delivery apps — all feeding the Cost Analyst Agent.', 'تطبيق توصيل — كلها تغذّي وكيل تحليل التكلفة.')}</p>
   <button class="btn btn-gold" style="margin-top:14px" onclick="finishOnboarding()">${L('Open my dashboard →', 'افتح لوحتي ←')}</button></div>`;

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

    const recipe = recipeList.map(([inN, qty, unit]) => {
      let ig = STATE.ings.find(x => x.n === inN);
      if (!ig) {
        // 'pc' = sold by piece; 'g' or 'ml' = weight/volume, stored as 'kg' (cost = qty/1000 * price_per_kg)
        const storedUnit = unit === 'pc' ? 'pc' : 'kg';
        ig = { id: uid(), n: inN, sup: STATE.sups[0] ? STATE.sups[0].n : 'Unassigned', unit: storedUnit, price: Math.round(8 + Math.random() * 30), yield: 0.92, est: true, hist: [] };
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
  if (txt.trim().length < 5) { t.innerHTML = `<span style="color:#FF9B8E">${L('✗ Paste your menu text first.', '✗ الصق نص قائمتك أولاً.')}</span>`; toast(L('Paste your menu text first', 'الصق نص قائمتك أولاً'), 'bad'); return; }
  const parsed = parseMenuText(txt);
  if (!parsed.length) { t.innerHTML = `<span style="color:#FF9B8E">${L('✗ No "item + price" lines detected.', '✗ لم تُكتشف سطور "صنف + سعر".')}</span>`; toast(L('No items detected', 'لم تُكتشف أصناف'), 'bad'); return; }
  const cats = [...new Set(parsed.map(x => x.cat))];
  t.innerHTML = `${L('› Menu Extraction Agent started…', '› بدأ وكيل استخراج القائمة…')}<br><span class="g">✓</span> ${L(parsed.length + ' items across ' + cats.length + ' categories', parsed.length + ' صنف عبر ' + cats.length + ' تصنيف')}<br>${L('› Recipe Intelligence Agent (Claude) drafting recipes…', '› وكيل ذكاء الوصفات (Claude) يصوغ الوصفات…')}`;

  await importParsed(parsed);

  t.innerHTML += `<br><span class="g">✓</span> ${L('Done — review recipes on the next step', 'تم — راجع الوصفات في الخطوة التالية')}`;
  STATE.ob.extracted = true;
  toast(L(parsed.length + ' items extracted', 'استُخرج ' + parsed.length + ' صنف'));
  setTimeout(() => { STATE.ob.step = 4; render(); }, 1400);
}

async function runUrlExtraction() {
  const url = ($('obSrcVal') && $('obSrcVal').value.trim()) || STATE.org.website || '';
  const t = $('obTerm');
  if (!url.startsWith('http')) { toast(L('Enter a valid URL starting with https://', 'أدخل رابطاً صحيحاً يبدأ بـ https://'), 'bad'); return; }
  t.innerHTML = `${L('› Fetching', '› يجري جلب')} <b>${esc(url)}</b> ${L('server-side…', 'من الخادم…')}`;
  try {
    const res = await fetch('/api/fetch-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Unknown error');
    if (!data.items || !data.items.length) {
      t.innerHTML = `<span style="color:#FF9B8E">${L('✗ No priced menu items found on that page.', '✗ لم يُعثر على أصناف مُسعّرة في تلك الصفحة.')}</span><br><span class="g">${L('Tip:', 'نصيحة:')}</span> ${L('link directly to the menu page, or switch to Paste mode.', 'اربط مباشرة بصفحة القائمة، أو انتقل لوضع اللصق.')}`;
      toast(L('No items found — try the menu page URL directly', 'لم يُعثر على أصناف — جرّب رابط صفحة القائمة مباشرة'), 'bad');
      return;
    }
    t.innerHTML = `<span class="g">✓</span> ${L(data.items.length + ' items found · running Recipe Intelligence Agent…', data.items.length + ' صنف · يجري تشغيل وكيل ذكاء الوصفات…')}`;
    await importParsed(data.items.map(it => ({ n: it.name, price: it.price, cat: it.category || 'General', desc: it.description || '' })));
    t.innerHTML += `<br><span class="g">✓</span> ${L('Done — review items on the next step', 'تم — راجع الأصناف في الخطوة التالية')}`;
    STATE.ob.extracted = true;
    toast(L(data.items.length + ' items extracted from URL', 'استُخرج ' + data.items.length + ' صنف من الرابط'));
    setTimeout(() => { STATE.ob.step = 4; render(); }, 1400);
  } catch (err) {
    t.innerHTML = `<span style="color:#FF9B8E">✗ ${esc(err.message)}</span><br><span class="g">${L('Tip:', 'نصيحة:')}</span> ${L('Some sites block bots. Try Paste mode instead — copy your menu page (Ctrl+A, Ctrl+C) and paste it.', 'بعض المواقع تحجب الروبوتات. جرّب وضع اللصق بدلاً من ذلك — انسخ صفحة قائمتك (Ctrl+A, Ctrl+C) والصقها.')}`;
    toast(L('URL extraction failed: ', 'فشل الاستخراج من الرابط: ') + err.message, 'bad');
  }
}

async function handleFileUpload(input) {
  const file = input.files[0]; if (!file) return;
  $('btnFileExtract').disabled = false;
  toast(L('File ready — click Extract to process with Claude', 'الملف جاهز — انقر استخراج للمعالجة بـ Claude'));
}

async function runFileExtraction() {
  const file = $('menuFile')?.files[0]; if (!file) return;
  const t = $('obTerm');
  t.innerHTML = L('› Reading file with Claude…', '› قراءة الملف بـ Claude…');
  try {
    const text = await file.text(); // Works for text/PDF-text; real OCR needs server-side
    const result = await agentMenuExtraction(text);
    const items = result.items || [];
    await importParsed(items.map(it => ({ n: it.name, price: it.price, cat: it.category || 'General', desc: it.description || '' })));
    t.innerHTML = `<span class="g">✓</span> ${L(items.length + ' items extracted by Claude', 'استخرج Claude ' + items.length + ' صنف')}`;
    STATE.ob.extracted = true;
    toast(L(items.length + ' items extracted', 'استُخرج ' + items.length + ' صنف'));
    setTimeout(() => { STATE.ob.step = 4; render(); }, 1400);
  } catch (err) {
    t.innerHTML = `<span style="color:#FF9B8E">✗ ${esc(err.message)}</span>`;
    toast(L('Extraction failed: ', 'فشل الاستخراج: ') + err.message, 'bad');
  }
}

// ── Supplier / employee helpers ───────────────────────────────
function addSup(a, b, c, d) {
  if (!$(a).value.trim()) { toast(L('Supplier name required', 'اسم المورّد مطلوب'), 'bad'); return; }
  STATE.sups.push({ n: $(a).value, cat: $(b).value || '—', terms: $(c).value || '—', days: $(d).value || '—', rating: 4.5 });
  render(); toast(L('Supplier added', 'تمت إضافة المورّد'));
}

function addEmpQuick() {
  const n = $('empN').value.trim(), b = +$('empB').value;
  if (!n || !b) { toast(L('Name and basic salary required', 'الاسم والراتب الأساسي مطلوبان'), 'bad'); return; }
  const saudi = $('empS').value === 'yes';
  STATE.emps.push({ id: uid(), n, pos: $('empP').value || 'Staff', basic: b, hous: Math.round(b * .25), trans: saudi ? 400 : 300, food: saudi ? 0 : 300, ot: 0, gosi: saudi ? .2175 : .02, visa: saudi ? 0 : 170, iqama: saudi ? 0 : 54, med: saudi ? 0 : 140, recr: saudi ? 0 : 160, saudi });
  render(); toast(L('Employee added', 'تمت إضافة الموظف'));
}

function recipeCard(m, inWizard) {
  const cf = confidence(m);
  return `<div class="card" style="background:var(--paper);margin-bottom:12px"><h4>${esc(m.n)} <span style="display:flex;gap:7px;align-items:center">
   <span class="tag ${cf.score >= 85 ? 'ok' : cf.score >= 65 ? 'warn' : 'bad'}" title="${esc(cf.reasons.join(' · ') || L('Confirmed inputs.', 'مدخلات مؤكدة.'))}">${L('Confidence', 'الثقة')} ${cf.score}%</span>
   <span class="tag ${m.status === 'approved' ? 'ok' : 'warn'}">${m.status === 'approved' ? L('Approved', 'معتمدة') : L('AI suggested', 'مقترحة بالذكاء')}</span></span></h4>
   ${cf.reasons.length ? `<p class="note" style="margin:-2px 0 10px"><b>${L('Why not 100%:', 'لماذا ليست 100%:')}</b> ${cf.reasons.map(esc).join(' · ')}</p>` : ''}
   <table><tr><th>${L('Ingredient', 'المكوّن')}</th><th class="num">${L('Qty (g/ml/pc)', 'الكمية (جم/مل/قطعة)')}</th><th class="num">${L('Yield %', 'الإنتاجية %')}</th><th class="num">${L('Line cost', 'تكلفة السطر')}</th><th></th></tr>
   ${m.recipe.map(([id, qy], ri) => { const i = ingById(id); if (!i) return ''; const lc = (i.unit === 'pc' ? qy * i.price : qy / 1000 * i.price) / (i.yield || 1);
     return `<tr><td>${esc(i.n)}${i.est ? ` <span class="tag warn" style="font-size:9px">${L('est', 'تقدير')}</span>` : ''}</td>
      <td class="num"><input class="tbl-edit" type="number" value="${qy}" onchange="m_(${q(m.id)}).recipe[${ri}][1]=+this.value;render()"></td>
      <td class="num">${Math.round((i.yield || 1) * 100)}%</td><td class="num">${lc.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="m_(${q(m.id)}).recipe.splice(${ri},1);render()">✕</button></td></tr>`; }).join('')}
   </table>
   <div style="display:flex;gap:8px;margin-top:11px;flex-wrap:wrap;align-items:center">
    <select id="addIng-${m.id}" class="tbl-edit" style="width:200px;text-align:start">${STATE.ings.map(i => `<option value="${i.id}">${esc(i.n)}</option>`).join('')}</select>
    <button class="btn btn-sm btn-line" onclick="m_(${q(m.id)}).recipe.push([$('addIng-${m.id}').value,50]);render()">${L('+ Add ingredient', '+ إضافة مكوّن')}</button>
    ${inWizard ? '' : `<button class="btn btn-sm btn-line" onclick="saveRecipeVersion(${q(m.id)})">${L('⎘ Save version', '⎘ حفظ نسخة')}</button>`}
    ${m.status !== 'approved' ? `<button class="btn btn-sm btn-gold" onclick="approveRecipe(${q(m.id)})">${L('✓ Approve recipe', '✓ اعتماد الوصفة')}</button>` : ''}
    <span class="note" style="margin-inline-start:auto">${L('Ingredient cost:', 'تكلفة المكونات:')} <b style="font-family:var(--mono)">${SAR2(ingCost(m))}</b></span>
   </div>
   ${inWizard ? '' : recipeHistory(m)}</div>`;
}

// ── Recipe versioning (spec §3) ──────────────────────────────
// A version is a frozen snapshot of the recipe with its cost & margin at the
// time, plus who changed it and why — so the impact of a change is auditable.
function snapshotRecipe(m, reason) {
  if (!m.versions) m.versions = [];
  m.versions.push({
    ts: new Date().toISOString(),
    by: (STATE.user && STATE.user.n) || L('System', 'النظام'),
    reason: reason || L('Manual save', 'حفظ يدوي'),
    recipe: m.recipe.map(r => r.slice()),
    ingCost: +ingCost(m).toFixed(2),
    cost: +cost(m).toFixed(2),
    marginPct: +marginPct(m).toFixed(1),
  });
}

function approveAllRecipes() {
  STATE.menu.forEach(m => {
    if (m.status === 'approved') return;
    m.status = 'approved';
    snapshotRecipe(m, L('Approved (bulk)', 'اعتماد (جماعي)'));
  });
  render();
  toast(L('All recipes approved & versions saved', 'تم اعتماد كل الوصفات وحفظ النسخ'));
}

function approveRecipe(id) {
  const m = m_(id); if (!m) return;
  const first = !m.versions || !m.versions.length;
  m.status = 'approved';
  snapshotRecipe(m, first ? L('Initial approved recipe', 'الوصفة المعتمدة الأولى') : L('Re-approved after edits', 'إعادة اعتماد بعد التعديل'));
  render();
  toast(L('Recipe approved & version saved', 'تم اعتماد الوصفة وحفظ النسخة'));
}

function saveRecipeVersion(id) {
  const m = m_(id); if (!m) return;
  modal(`<h3>${L('Save recipe version', 'حفظ نسخة من الوصفة')}</h3>
   <div class="sub">${esc(m.n)} — ${L('current ingredient cost', 'تكلفة المكونات الحالية')} <b>${SAR2(ingCost(m))}</b>, ${L('net margin', 'الهامش الصافي')} <b>${pct(marginPct(m))}</b></div>
   <div class="field"><label>${L('Reason for change', 'سبب التغيير')}</label><input id="rvReason" placeholder="${L('e.g. Reduced shrimp 180g → 160g', 'مثال: تقليل الجمبري 180جم ← 160جم')}"></div>
   <div style="display:flex;gap:9px;justify-content:flex-end"><button class="btn btn-line" onclick="closeModal()">${L('Cancel', 'إلغاء')}</button>
   <button class="btn btn-gold" onclick="(function(){var mm=m_(${q(id)});snapshotRecipe(mm,$('rvReason').value.trim()||L('Manual save','حفظ يدوي'));closeModal();render();toast(L('Version saved','تم حفظ النسخة'))})()">${L('Save version', 'حفظ النسخة')}</button></div>`);
}

function recipeHistory(m) {
  const vs = m.versions || [];
  if (!vs.length) return `<p class="note" style="margin-top:10px">${L('No saved versions yet — approve the recipe or click “Save version” to start a change history.', 'لا توجد نسخ محفوظة بعد — اعتمد الوصفة أو انقر "حفظ نسخة" لبدء سجل التغييرات.')}</p>`;
  return `<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:13px">${L('Version history', 'سجل النسخ')} (${vs.length})</summary>
   <table style="margin-top:8px"><tr><th>#</th><th>${L('Date', 'التاريخ')}</th><th>${L('By', 'بواسطة')}</th><th>${L('Reason', 'السبب')}</th><th class="num">${L('Ing. cost', 'تكلفة المكونات')}</th><th class="num">${L('Margin', 'الهامش')}</th><th class="num">${L('Δ cost', 'فرق التكلفة')}</th></tr>
   ${vs.map((v, i) => { const prev = vs[i - 1]; const dC = prev ? v.ingCost - prev.ingCost : 0;
     return `<tr><td>v${i + 1}</td><td class="note">${new Date(v.ts).toLocaleDateString(isAr() ? 'ar' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
      <td class="note">${esc(v.by)}</td><td>${esc(v.reason)}</td><td class="num">${SAR2(v.ingCost)}</td>
      <td class="num ${v.marginPct >= 20 ? 'up' : 'down'}">${pct(v.marginPct)}</td>
      <td class="num ${dC > 0 ? 'down' : dC < 0 ? 'up' : ''}">${prev ? (dC >= 0 ? '+' : '') + SAR2(dC) : '—'}</td></tr>`; }).join('')}
   </table></details>`;
}

async function finishOnboarding() {
  if (STATE._orgId) {
    await DB.saveOrgState(STATE._orgId, STATE);
    toast(L('Data saved to database', 'تم حفظ البيانات في قاعدة البيانات'));
  }
  go('dash');
}
