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
  ${kpi(L('Revenue', 'الإيرادات'), SAR(t.rev), L('monthly', 'شهري'))}
  ${kpi(L('Gross profit', 'إجمالي الربح'), SAR(Math.round(t.gross)), pct(t.gross / t.rev * 100) + L(' of revenue', ' من الإيرادات'), 'up')}
  ${kpi(L('Net profit', 'صافي الربح'), SAR(Math.round(t.net)), L('after all 11 layers', 'بعد كل الطبقات الـ11'), t.net > 0 ? 'up' : 'down')}
  ${kpi(L('Food cost %', 'نسبة تكلفة الطعام %'), pct(t.foodPct), L('target ≤ 32%', 'الهدف ≤ 32%'), t.foodPct <= 32 ? 'up' : 'down')}
  ${kpi(L('Prime cost %', 'نسبة التكلفة الأولية %'), pct(t.primePct), L('food + labor', 'الطعام + العمالة'), t.primePct <= 60 ? 'up' : 'down')}</div>
 <div class="grid g5" style="margin-top:13px">
  ${kpi(L('Labor cost %', 'نسبة العمالة %'), pct(t.laborPct))}${kpi(L('Rent cost %', 'نسبة الإيجار %'), pct(t.rentPct))}
  ${kpi(L('Delivery commission', 'عمولة التوصيل'), pct(t.delPct), L('of revenue', 'من الإيرادات'))}
  ${kpi(L('Gov. fees / month', 'الرسوم الحكومية / شهر'), SAR(Math.round(t.gov)), L('allocated per dish', 'موزعة على كل صنف'))}
  ${kpi(L('Hidden costs / month', 'التكاليف الخفية / شهر'), SAR(Math.round(t.hidden)))}</div>
 <div class="grid g2" style="margin-top:13px">
  <div class="card"><h4>${L('Items needing repricing', 'أصناف تحتاج إعادة تسعير')} <span class="tag ${need.length ? 'bad' : 'ok'}">${need.length}</span></h4>
   ${need.length ? `<table><tr><th>${L('Item', 'الصنف')}</th><th class="num">${L('Margin', 'الهامش')}</th><th></th></tr>${need.map(m => `<tr><td>${esc(m.n)}</td><td class="num down">${pct(marginPct(m))}</td><td><button class="btn btn-sm btn-line" onclick="go('pricing')">${L('Open strategist', 'فتح المُسعّر')}</button></td></tr>`).join('')}</table>`
   : `<div class="alert good"><span>✓</span><div>${L('All items above the 20% net-margin floor.', 'كل الأصناف فوق حد الهامش الصافي 20%.')}</div></div>`}
   <h4 style="margin-top:16px">${L('Supplier price alerts', 'تنبيهات أسعار الموردين')} <span class="tag ${alerts.length ? 'warn' : 'ok'}">${alerts.length}</span></h4>
   ${alerts.map(i => `<div class="alert warn"><span>◆</span><div><b>${esc(i.n)}</b> ${L('price up from', 'ارتفع السعر من')} ${SAR2(i.hist[i.hist.length - 2].p)} → ${SAR2(i.hist[i.hist.length - 1].p)} ${L('/kg.', '/كجم.')} ${i.hist.length > 0 ? spark(i.hist) : ''}</div></div>`).join('') || `<div class="note">${L('No price alerts.', 'لا توجد تنبيهات أسعار.')}</div>`}
  </div>
  <div class="card"><h4>${L('Break-even', 'نقطة التعادل')}</h4>
   ${kpi(L('Break-even revenue', 'إيرادات التعادل'), SAR(Math.round(be.rev)), L('monthly threshold', 'الحد الشهري'))}
   <div class="bartrack" style="margin:12px 0 8px"><i style="width:${Math.min(100, t.rev / be.rev * 100).toFixed(0)}%"></i></div>
   <p class="note">${L('At', 'عند')} ${SAR(t.rev)} ${L('revenue —', 'إيرادات —')} ${t.rev > be.rev ? L('above', 'فوق') : L('below', 'تحت')} ${L('break-even by', 'التعادل بمقدار')} ${SAR(Math.round(Math.abs(t.rev - be.rev)))}. ${L('CMR:', 'نسبة هامش المساهمة:')} ${pct(be.cmr * 100)}.</p>
   <h4 style="margin-top:16px">${L('Pending recipe approvals', 'وصفات بانتظار الاعتماد')} <span class="tag ${pend.length ? 'warn' : 'ok'}">${pend.length}</span></h4>
   ${pend.slice(0, 3).map(m => `<div class="alert warn"><span>⚗</span><div><b>${esc(m.n)}</b> — ${L('recipe needs approval before costing is accurate.', 'تحتاج الوصفة إلى اعتماد قبل أن تكون التكلفة دقيقة.')} <button class="btn btn-sm btn-line" onclick="go('recipe')" style="margin-top:4px">${L('Review', 'مراجعة')}</button></div></div>`).join('')}
  </div></div>`;
};

// ── Pricing Strategist (Agent D) ──────────────────────────────
let pSel = { item: 0, strat: 'cost', target: 28 };
PAGES.pricing = () => {
  if (!STATE.menu.length) return emptyMenuState();
  pSel.item = Math.min(pSel.item, STATE.menu.length - 1);
  const strats = [['cost',L('Cost-plus','التكلفة زائد هامش')],['markup',L('Markup ×2.6 on materials','ترميز ×2.6 على المواد')],['comp',L('Competitor based','مبني على المنافسين')],['value',L('Value based','مبني على القيمة')],['del',L('Delivery-app pricing','تسعير تطبيقات التوصيل')],['combo',L('Combo pricing','تسعير الكومبو')],['prem',L('Premium','مميّز')],['psy',L('Psychological','نفسي')],['seas',L('Seasonal','موسمي')],['branch',L('Branch-specific','خاص بالفرع')]];
  return `<div class="card"><h4>${L('Pricing Strategist Agent', 'وكيل استراتيجية التسعير')} <span class="tag gold">${L('Agent D', 'الوكيل D')}</span></h4>
 <div class="grid g3">
  <div class="field"><label>${L('Menu item', 'صنف القائمة')}</label><select onchange="pSel.item=+this.value;render()">${STATE.menu.map((m, i) => `<option value="${i}" ${i === pSel.item ? 'selected' : ''}>${esc(m.n)}</option>`).join('')}</select></div>
  <div class="field"><label>${L('Strategy', 'الاستراتيجية')}</label><select onchange="pSel.strat=this.value;render()">${strats.map(s => `<option value="${s[0]}" ${s[0] === pSel.strat ? 'selected' : ''}>${s[1]}</option>`).join('')}</select></div>
  <div class="field"><label>${L('Target net margin %', 'الهامش الصافي المستهدف %')}</label><input type="number" value="${pSel.target}" min="10" max="45" onchange="pSel.target=+this.value;render()"></div></div>
 ${priceRec()}
 <div id="ai-pricing-rationale" style="margin-top:12px"></div>
 <button class="btn btn-line btn-sm" style="margin-top:8px" onclick="loadPricingRationale()">${L('Ask Claude why →', 'اسأل Claude عن السبب →')}</button></div>`;
};

function priceRec() {
  const m = STATE.menu[pSel.item], c = cost(m), t = pSel.target / 100, s = pSel.strat;
  let p, why, risk = 'Low';
  const fixedPart = c - layers(m).del;
  const solve = tt => { const denom = 1 - tt - m.delShare * blendedAppRate(); return denom > 0.05 ? fixedPart / denom : fixedPart * 4; };
  if (s === 'cost')   { p = solve(t); why = L(`True cost ${SAR2(c)} solved so net margin = ${pSel.target}% after the delivery layer.`, `حُلّت التكلفة الحقيقية ${SAR2(c)} ليصبح الهامش الصافي = ${pSel.target}% بعد طبقة التوصيل.`); }
  else if (s === 'markup') { p = ingCost(m) * 2.6; why = L('Materials × 2.6 — a classic kitchen markup; check it clears your true-cost floor.', 'المواد × 2.6 — ترميز مطبخي تقليدي؛ تأكد أنه يتجاوز حد التكلفة الحقيقية.'); risk = p < c ? 'High' : 'Medium'; }
  else if (s === 'comp') { p = m.price * 1.04; why = L('~4% above median of nearby competitors in your category.', 'أعلى بنحو 4% من وسيط المنافسين القريبين في فئتك.'); risk = 'Medium'; }
  else if (s === 'value') { p = Math.max(m.price, solve(t)) * 1.06; why = L('Anchored on perceived value; supported by photography & menu placement.', 'مبني على القيمة المُدركة؛ مدعوم بالتصوير وموضع الصنف في القائمة.'); risk = 'Medium'; }
  else if (s === 'del')   { p = solve(t) / (1 - blendedAppRate()); why = L(`Grossed up so margin survives the blended ${pct(blendedAppRate() * 100)} platform take.`, `مرفوع ليصمد الهامش أمام عمولة المنصات المدمجة ${pct(blendedAppRate() * 100)}.`); }
  else if (s === 'combo') { p = (m.price + 12) * 0.93; why = L('Bundled at 7% off vs separate items — raises ticket while protecting margin.', 'مجمّع بخصم 7% مقارنة بالأصناف المنفصلة — يرفع قيمة الفاتورة مع حماية الهامش.'); }
  else if (s === 'prem')  { p = Math.max(m.price * 1.18, c / (1 - 0.65)); why = L('Premium anchor at ≥65% margin; pair with upgraded plating.', 'تثبيت مميّز بهامش ≥65%؛ اقرنه بتقديم مُطوّر.'); risk = 'Medium'; }
  else if (s === 'psy')   { p = Math.max(Math.round(solve(t)), Math.round(m.price)) - 1; why = L('Rounded to a 9-ending just under the next threshold.', 'مُقرّب لينتهي بالرقم 9 أسفل العتبة التالية مباشرة.'); }
  else if (s === 'seas')  { p = solve(t) * 1.08; why = L('Peak-season uplift (+8%); auto-revert after season.', 'زيادة موسم الذروة (+8%)؛ تعود تلقائياً بعد الموسم.'); risk = 'Medium'; }
  else { p = m.price * 1.08; why = L('Override for premium-location branch (+8%); base unchanged elsewhere.', 'تجاوز لفرع الموقع المميّز (+8%)؛ السعر الأساسي يبقى كما هو في غيره.'); }
  const newMargin = (p - (fixedPart + m.delShare * blendedAppRate() * p)) / p * 100;
  if (newMargin < 15) risk = 'High'; if (p > m.price * 1.25) risk = 'High';
  const riskD = { Low: L('Low', 'منخفض'), Medium: L('Medium', 'متوسط'), High: L('High', 'مرتفع') }[risk];
  return `<div class="grid g4" style="margin-top:4px">
  ${kpi(L('Current price', 'السعر الحالي'), SAR2(m.price))}
  ${kpi(L('Recommended', 'المُوصى به'), SAR2(p), L('by strategist', 'حسب المُسعّر'), 'up')}
  ${kpi(L('Expected net margin', 'الهامش الصافي المتوقع'), pct(newMargin), '', newMargin >= 20 ? 'up' : 'down')}
  ${kpi(L('Risk level', 'مستوى المخاطرة'), riskD, risk === 'High' ? L('volume loss possible', 'احتمال فقدان حجم المبيعات') : L('safe range', 'نطاق آمن'), risk === 'High' ? 'down' : risk === 'Medium' ? '' : 'up')}</div>
 <p class="note" style="margin:10px 0 8px"><b>${L('Reason:', 'السبب:')}</b> ${why}</p>
 ${(() => { const cf = confidence(m); return `<div class="alert ${cf.score >= 85 ? 'info' : cf.score >= 65 ? 'warn' : 'bad'}" style="margin:0 0 12px"><span>${cf.score >= 85 ? '✓' : '◆'}</span><div><b>${L('Cost-basis confidence:', 'ثقة أساس التكلفة:')} ${cf.score}% (${confWord(cf.score)})</b>${cf.reasons.length ? '<br><span class="note">' + cf.reasons.map(esc).join(' · ') + '</span>' : ' <span class="note">' + L('confirmed inputs', 'مدخلات مؤكدة') + '</span>'}</div></div>`; })()}
 <button class="btn btn-gold btn-sm" onclick="STATE.menu[pSel.item].price=${+p.toFixed(2)};STATE.menu[pSel.item].reprice=false;render();toast(L('Price applied — dashboard & margins updated','تم تطبيق السعر — حُدّثت اللوحة والهوامش'))">${L('Apply', 'تطبيق')} ${SAR2(p)}</button>`;
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
  return `<div class="card"><h4>${L('Profitability Analyst Agent', 'وكيل تحليل الربحية')} <span class="tag gold">${L('Agent F', 'الوكيل F')}</span> <span class="note">${L('bubble = monthly profit contribution', 'الفقاعة = مساهمة الربح الشهري')}</span></h4>
 <svg viewBox="0 0 ${W} ${H}" width="100%" role="img">
  <line x1="${X(md.q)}" y1="16" x2="${X(md.q)}" y2="${H - pad}" stroke="var(--line)" stroke-dasharray="4 4"/>
  <line x1="${pad}" y1="${Y(md.m)}" x2="${W - 18}" y2="${Y(md.m)}" stroke="var(--line)" stroke-dasharray="4 4"/>
  <line x1="${pad}" y1="${H - pad}" x2="${W - 18}" y2="${H - pad}" stroke="var(--muted)"/>
  <line x1="${pad}" y1="16" x2="${pad}" y2="${H - pad}" stroke="var(--muted)"/>
  <text x="${W / 2}" y="${H - 12}" font-size="11" fill="var(--muted)" text-anchor="middle">${L('Popularity (plates/month) →', 'الرواج (أطباق/شهر) ←')}</text>
  <text x="14" y="${H / 2}" font-size="11" fill="var(--muted)" transform="rotate(-90 14 ${H / 2})" text-anchor="middle">${L('Net margin % →', 'الهامش الصافي % ←')}</text>
  ${STATE.menu.map(m => `<circle cx="${X(m.sold)}" cy="${Y(marginPct(m))}" r="${6 + Math.max(0, margin(m)) * m.sold / 4200}" fill="${cols[mLabel(m)]}" opacity=".85"><title>${esc(m.n)}</title></circle>
   <text x="${X(m.sold) + 9}" y="${Y(marginPct(m)) + 4}" font-size="10" fill="var(--muted)">${esc(m.n.split(' ').slice(0, 2).join(' '))}</text>`).join('')}
 </svg>
 <div class="legend"><span><i style="background:#177E6F"></i>${L('Star', 'نجم')}</span><span><i style="background:#C9981F"></i>${L('Puzzle', 'لغز')}</span><span><i style="background:#3D6485"></i>${L('Plow Horse', 'حصان جرّار')}</span><span><i style="background:#CE5343"></i>${L('Dog', 'كلب')}</span></div></div>
 <div class="card" style="margin-top:13px"><h4>${L('Actions', 'الإجراءات')}</h4>
 <table><tr><th>${L('Item', 'الصنف')}</th><th>${L('Class', 'الفئة')}</th><th>${L('Recommendation', 'التوصية')}</th><th></th></tr>
 ${STATE.menu.map(m => `<tr><td>${esc(m.n)}</td><td><span class="tag ${mCls(m)}">${mLabelD(m)}</span></td>
  <td class="note">${mActionD(m)}</td>
  <td style="white-space:nowrap">
   ${mLabel(m) === 'Star' ? `<button class="btn btn-sm btn-line" onclick="toast(L('${esc(m.n)} pinned to featured combos','تم تثبيت ${esc(m.n)} ضمن الوجبات المميزة'))">${L('Promote', 'روّج')}</button>` : ''}
   ${['Puzzle', 'Plow Horse'].includes(mLabel(m)) ? `<button class="btn btn-sm btn-line" onclick="pSel.item=${STATE.menu.indexOf(m)};go('pricing')">${L('Reprice', 'أعد التسعير')}</button>` : ''}
   ${mLabel(m) === 'Dog' ? `<button class="btn btn-sm btn-danger" onclick="STATE.menu=STATE.menu.filter(x=>x.id!==${q(m.id)});render();toast(L('Item removed','تم حذف الصنف'),'bad')">${L('Remove', 'حذف')}</button>` : ''}
  </td></tr>`).join('')}</table></div>`;
};

// ── AI Copilot — Restaurant CFO Agent (Agent H) ───────────────
// This is now a REAL Claude call via /api/analyze
PAGES.copilot = () => `<div class="card copilot"><h4>${L('Restaurant CFO Agent', 'وكيل المدير المالي للمطعم')} <span class="tag gold">${L('Agent H', 'الوكيل H')}</span> <span class="tag info">${L('Powered by Claude', 'مدعوم بـ Claude')}</span></h4>
 <div class="chatlog" id="chatlog">
  <div class="msg ai">${L('Marhaba' + (STATE.user ? ', ' + esc(STATE.user.n.split(' ')[0]) : '') + '! I am your virtual CFO with live access to your costs, recipes, payroll and compliance fees. Ask me anything — I am powered by Claude AI and your actual numbers.', 'مرحباً' + (STATE.user ? ' ' + esc(STATE.user.n.split(' ')[0]) : '') + '! أنا مديرك المالي الافتراضي مع وصول مباشر لتكاليفك ووصفاتك ورواتبك ورسوم الامتثال. اسألني أي شيء — أنا مدعوم بـ Claude وأرقامك الفعلية.')}</div>
 </div>
 <div class="suggest">${(isAr() ? ['أي الأصناف تخسر؟','أي الأصناف يجب أن أعيد تسعيرها؟','ما نقطة التعادل؟','ماذا لو ارتفعت أسعار السمك؟','أي مورّد هو الأغلى؟','كيف أزيد الربح 10%؟','أي تطبيق توصيل يضر بهامشي؟'] : ['Which items are losing money?','Which items should I reprice?','What is my break-even point?','What happens if fish prices increase?','Which supplier is most expensive?','How can I increase profit by 10%?','Which delivery app hurts my margin?']).map(s => `<button onclick="ask('${s}')">${s}</button>`).join('')}</div>
 <div class="chatin"><input id="chatin" placeholder="${L('Ask your CFO agent…', 'اسأل وكيلك المالي…')}" onkeydown="if(event.key==='Enter')ask()"><button class="btn btn-gold" onclick="ask()">${L('Send', 'إرسال')}</button></div></div>`;

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
    $('thinking').outerHTML = `<div class="msg ai">${L('Your menu is empty — run AI onboarding first and I will have a full cost base to reason over.', 'قائمتك فارغة — شغّل الإعداد الذكي أولاً ليتوفر لديّ قاعدة تكاليف كاملة للتحليل.')}</div>`;
    return;
  }

  try {
    const reply = await agentCFO(qs);
    $('thinking').outerHTML = `<div class="msg ai">${esc(reply)}</div>`;
  } catch (err) {
    // Graceful fallback: let Claude be unavailable without breaking the app
    const fallback = cfoFallback(qs);
    $('thinking').outerHTML = `<div class="msg ai">${fallback}\n\n<span class="note">${L('(Claude unavailable — using built-in analysis)', '(Claude غير متاح — يُستخدم التحليل المدمج)')}</span></div>`;
  }
  log.scrollTop = log.scrollHeight;
}

// Keeps the app working if the API is down
function cfoFallback(qs) {
  const lo = qs.toLowerCase(), t = totals(), be = breakEven();
  const losing = STATE.menu.filter(m => margin(m) <= 0);
  const thin   = STATE.menu.filter(m => marginPct(m) < 20 && margin(m) > 0);
  if (lo.includes('losing') || lo.includes('lose') || qs.includes('تخسر') || qs.includes('خسار'))
    return losing.length
      ? `${L('Items losing money:', 'أصناف تخسر:')}\n${losing.map(m => `• ${m.n} — ${L('cost', 'التكلفة')} ${SAR2(cost(m))} ${L('vs price', 'مقابل السعر')} ${SAR2(m.price)} (${pct(marginPct(m))})`).join('\n')}\n${L('Monthly bleed:', 'النزيف الشهري:')} ${SAR(Math.round(losing.reduce((a, m) => a + Math.abs(margin(m)) * m.sold, 0)))}.`
      : `${L('No item is underwater.', 'لا يوجد صنف يخسر.')} ${L(thin.length + ' sit under the 20% floor:', thin.length + ' أصناف تحت حد 20%:')}\n${thin.map(m => `• ${m.n} — ${pct(marginPct(m))}`).join('\n')}`;
  if (lo.includes('break') || qs.includes('تعادل'))
    return `${L('Break-even:', 'نقطة التعادل:')} ${L('fixed costs', 'التكاليف الثابتة')} ${SAR(Math.round(be.fixed))}, ${L('CMR', 'نسبة هامش المساهمة')} ${pct(be.cmr * 100)}, ${L('break-even revenue', 'إيرادات التعادل')} ${SAR(Math.round(be.rev))}. ${t.rev > be.rev ? L('You are above by', 'أنت فوقها بمقدار') : L('You are below by', 'أنت تحتها بمقدار')} ${SAR(Math.round(Math.abs(t.rev - be.rev)))}.`;
  return L('I can answer about: losing items, repricing, break-even, ingredient shocks, supplier spend, +10% profit plans, and delivery apps. For everything else the Scenario Simulator and Pricing Center are one click away.', 'يمكنني الإجابة عن: الأصناف الخاسرة، إعادة التسعير، نقطة التعادل، صدمات أسعار المكونات، إنفاق الموردين، خطط زيادة الربح 10%، وتطبيقات التوصيل. ولكل ما عدا ذلك، محاكي السيناريوهات ومركز التسعير على بُعد نقرة.');
}

// ── Scenario Simulator ────────────────────────────────────────
let SC = { fish: 0, shr: 0, sal: 0, del: 0, util: 0 };
PAGES.scen = () => {
  if (!STATE.menu.length) return emptyMenuState();
  return `<div class="grid g2">
 <div class="card"><h4>${L('Stress levers', 'روافع الضغط')}</h4>
  ${[['fish',L('Fish & seafood purchase prices','أسعار شراء السمك والمأكولات البحرية'),'%',-20,60],['shr',L('Shrimp purchase prices','أسعار شراء الروبيان'),'%',-20,60],['sal',L('Salaries & labor','الرواتب والعمالة'),'%',0,30],['del',L('Delivery commission','عمولة التوصيل'),'+pts',0,10],['util',L('Utilities','المرافق'),'%',0,40]].map(([k, l, u, mn, mx]) => `
   <div class="slider-row"><div class="top"><span>${l}</span><b>${SC[k] >= 0 ? '+' : ''}${SC[k]}${u}</b></div>
   <input type="range" min="${mn}" max="${mx}" value="${SC[k]}" oninput="SC.${k}=+this.value;render()"></div>`).join('')}
  <button class="btn btn-line btn-sm" onclick="SC={fish:0,shr:0,sal:0,del:0,util:0};render()">${L('Reset', 'إعادة تعيين')}</button></div>
 <div class="card"><h4>${L('Profit impact — monthly', 'أثر الربح — شهري')}</h4>${scenOut()}</div></div>`;
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
  return `<div class="kpi"><div class="l">${L('Net item contribution under scenario', 'صافي مساهمة الأصناف ضمن السيناريو')}</div>
  <div class="bigprofit ${d >= 0 ? 'up' : 'down'}">${SAR(Math.round(np))}</div>
  <div class="d ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : ''}${SAR(Math.round(d))} ${L('vs baseline', 'مقابل الأساس')} ${SAR(Math.round(base))}</div></div>
 <div class="bartrack" style="margin:16px 0 10px"><i style="width:${Math.max(2, Math.min(100, np / (base || 1) * 100))}%;background:${np >= base * 0.7 ? 'var(--teal)' : 'var(--coral)'}"></i></div>
 ${hits.length ? `<div class="alert bad"><span>▲</span><div>${L('Below 10% margin:', 'تحت هامش 10%:')} <b>${hits.map(esc).join(', ')}</b></div></div>`
 : `<div class="alert good"><span>✓</span><div>${L('All items hold above a 10% net margin under this scenario.', 'كل الأصناف تبقى فوق هامش صافٍ 10% ضمن هذا السيناريو.')}</div></div>`}`;
}

// ── Costing page (per-item true cost breakdown) ───────────────
PAGES.costing = () => {
  if (!STATE.menu.length) return emptyMenuState();
  return `<div class="card"><h4>${L('Menu Costing — true 11-layer cost per item', 'تكلفة القائمة — التكلفة الحقيقية بـ11 طبقة لكل صنف')}</h4>
 <p class="note" style="margin:-4px 0 11px">${L('Confidence reflects how much of each cost is from confirmed data vs AI estimates — hover the badge for the breakdown.', 'تعكس الثقة مقدار ما في كل تكلفة من بيانات مؤكدة مقابل تقديرات الذكاء — مرّر فوق الشارة لرؤية التفصيل.')}</p>
 <table><tr><th>${L('Item', 'الصنف')}</th><th class="num">${L('Price', 'السعر')}</th><th class="num">${L('Ing.', 'المكوّنات')}</th><th class="num">${L('Labor', 'العمالة')}</th><th class="num">${L('Total cost', 'إجمالي التكلفة')}</th><th class="num">${L('Net margin', 'الهامش الصافي')}</th><th>${L('Class', 'الفئة')}</th><th class="num">${L('Confidence', 'الثقة')}</th></tr>
 ${STATE.menu.map(m => `<tr><td>${esc(m.n)}</td>
  <td class="num">${SAR2(m.price)}</td>
  <td class="num">${SAR2(ingCost(m))}</td>
  <td class="num">${SAR2(m.laborMin * laborRate())}</td>
  <td class="num"><b>${SAR2(cost(m))}</b></td>
  <td class="num ${marginPct(m) >= 20 ? 'up' : 'down'}">${pct(marginPct(m))}</td>
  <td><span class="tag ${mCls(m)}">${mLabelD(m)}</span></td>
  <td class="num">${confBadge(m)}</td></tr>`).join('')}</table></div>`;
};

// ── Settings ──────────────────────────────────────────────────
PAGES.settings = () => `<div class="grid g2">
 <div class="card"><h4>${L('Organization', 'المنشأة')}</h4>
  <div class="field"><label>${L('Name', 'الاسم')}</label><input value="${esc(STATE.org.name)}" onchange="STATE.org.name=this.value;render()"></div>
  <div class="grid g2">
   <div class="field"><label>${L('Country', 'الدولة')}</label><input value="${esc(STATE.org.country)}" onchange="STATE.org.country=this.value"></div>
   <div class="field"><label>${L('City', 'المدينة')}</label><input value="${esc(STATE.org.city)}" onchange="STATE.org.city=this.value"></div></div>
  <div class="field"><label>${L('Branches (comma separated)', 'الفروع (مفصولة بفواصل)')}</label><input value="${esc(STATE.org.branches.join(', '))}" onchange="STATE.org.branches=this.value.split(',').map(x=>x.trim()).filter(Boolean);render()"></div>
  <div class="field"><label>${L('Monthly rent (SAR)', 'الإيجار الشهري (ر.س)')}</label><input type="number" value="${STATE.rent}" onchange="STATE.rent=+this.value;render()"></div>
  ${STATE._orgId ? `<button class="btn btn-line btn-sm" onclick="saveOrgSettings()">${L('Save to database', 'حفظ في قاعدة البيانات')}</button>` : ''}</div>
 <div class="card"><h4>${L('Preferences', 'التفضيلات')}</h4>
  <div class="field"><label>${L('Currency', 'العملة')}</label><select disabled><option>${L('SAR — Saudi Riyal (default)', 'ر.س — الريال السعودي (افتراضي)')}</option></select></div>
  <div class="field"><label>${L('Theme', 'المظهر')}</label><select onchange="setTheme(this.value)"><option value="light" ${STATE.theme === 'light' ? 'selected' : ''}>${L('Light', 'فاتح')}</option><option value="dark" ${STATE.theme === 'dark' ? 'selected' : ''}>${L('Dark', 'داكن')}</option></select></div>
  <div class="field"><label>${L('Language', 'اللغة')}</label><select onchange="setLang(this.value)"><option value="en" ${STATE.lang === 'en' ? 'selected' : ''}>English</option><option value="ar" ${STATE.lang === 'ar' ? 'selected' : ''}>العربية</option></select></div></div></div>`;

async function saveOrgSettings() {
  if (!STATE._orgId) return;
  await DB.saveOrgState(STATE._orgId, STATE);
  toast(L('Settings saved to database', 'تم حفظ الإعدادات في قاعدة البيانات'));
}

// ── User management ───────────────────────────────────────────
const ROLE_PERMS = {
  Owner: ['Everything incl. billing & users'],
  Manager: ['Menu, recipes, pricing, procurement', 'No billing, no user management'],
  Accountant: ['Costs, fees, reports, read-only menu'],
  Chef: ['Recipes & ingredients only'],
};
const ROLE_PERMS_AR = {
  Owner: ['كل شيء بما في ذلك الفوترة والمستخدمين'],
  Manager: ['القائمة، الوصفات، التسعير، المشتريات', 'بدون فوترة أو إدارة مستخدمين'],
  Accountant: ['التكاليف، الرسوم، التقارير، القائمة للعرض فقط'],
  Chef: ['الوصفات والمكونات فقط'],
};
const ROLE_AR = { Owner: 'المالك', Manager: 'مدير', Accountant: 'محاسب', Chef: 'طاهٍ' };
const roleName = r => isAr() ? (ROLE_AR[r] || r) : r;
const rolePerms = r => (isAr() ? ROLE_PERMS_AR[r] : ROLE_PERMS[r]) || [];
const statusD = st => isAr() ? ({ Active: 'نشط', Invited: 'مدعو', Paid: 'مدفوع', Pending: 'معلّق' }[st] || st) : st;
const GROUP_AR = { Operations: 'العمليات', Utilities: 'المرافق', Technology: 'التقنية', Marketing: 'التسويق', Finance: 'المالية', Shrinkage: 'الهدر' };
const groupD = g => isAr() ? (GROUP_AR[g] || g) : g;
PAGES.usersP = () => `<div class="card"><h4>${L('Team', 'الفريق')} <span class="note">${STATE.users.length} ${L('members', 'عضو')}</span><button class="btn btn-navy btn-sm" onclick="inviteModal()">${L('+ Invite user', '+ دعوة مستخدم')}</button></h4>
 <table><tr><th>${L('Name', 'الاسم')}</th><th>${L('Email', 'البريد')}</th><th>${L('Role', 'الدور')}</th><th>${L('Status', 'الحالة')}</th><th></th></tr>
 ${STATE.users.map((u, i) => `<tr><td>${esc(u.n)}</td><td class="note">${esc(u.email)}</td>
  <td>${u.role === 'Owner' ? `<span class="tag gold">${L('Owner', 'المالك')}</span>` : `<select class="tbl-edit" style="width:120px;text-align:start" onchange="STATE.users[${i}].role=this.value;toast(L('Role updated','تم تحديث الدور'))">${['Manager','Accountant','Chef'].map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${roleName(r)}</option>`).join('')}</select>`}</td>
  <td><span class="tag ${u.st === 'Active' ? 'ok' : 'warn'}">${statusD(u.st)}</span></td>
  <td>${u.role !== 'Owner' ? `<button class="btn btn-sm btn-danger" onclick="STATE.users.splice(${i},1);render()">${L('Remove', 'حذف')}</button>` : ''}</td></tr>`).join('')}</table></div>
 <div class="card" style="margin-top:13px"><h4>${L('Roles & permissions', 'الأدوار والصلاحيات')}</h4>
 <div class="grid g4">${Object.keys(ROLE_PERMS).map(r => `<div><b style="font-size:13px">${roleName(r)}</b><ul style="margin:7px 0 0 16px;font-size:12px;color:var(--muted)">${rolePerms(r).map(p => `<li>${p}</li>`).join('')}</ul></div>`).join('')}</div></div>`;

function inviteModal() {
  modal(`<h3>${L('Invite a team member', 'دعوة عضو للفريق')}</h3>
 <div class="field"><label>${L('Name', 'الاسم')}</label><input id="ivN"></div>
 <div class="field"><label>${L('Email', 'البريد الإلكتروني')}</label><input id="ivE" type="email"></div>
 <div class="field"><label>${L('Role', 'الدور')}</label><select id="ivR"><option value="Manager">${roleName('Manager')}</option><option value="Accountant">${roleName('Accountant')}</option><option value="Chef">${roleName('Chef')}</option></select></div>
 <div style="display:flex;gap:9px;justify-content:flex-end"><button class="btn btn-line" onclick="closeModal()">${L('Cancel', 'إلغاء')}</button>
 <button class="btn btn-gold" onclick="if(!$('ivE').value.includes('@')){toast(L('Valid email required','بريد صحيح مطلوب'),'bad');return}STATE.users.push({n:$('ivN').value||$('ivE').value.split('@')[0],email:$('ivE').value,role:$('ivR').value,st:'Invited'});closeModal();render();toast(L('Invitation sent','تم إرسال الدعوة'))">${L('Send invite', 'إرسال الدعوة')}</button></div>`);
}

// ── Billing ───────────────────────────────────────────────────
PAGES.billing = () => `<div class="grid g3">
 ${kpi(L('Current plan', 'الباقة الحالية'), STATE.plan, STATE.plan === 'Starter' ? L('SAR 299 / month', '299 ر.س / شهر') : STATE.plan === 'Growth' ? L('SAR 599 / month', '599 ر.س / شهر') : L('custom contract', 'عقد مخصص'))}
 ${kpi(L('Branches used', 'الفروع المستخدمة'), STATE.org.branches.length + ' / ' + (STATE.plan === 'Starter' ? 1 : STATE.plan === 'Growth' ? 3 : '∞'))}
 ${kpi(L('Next renewal', 'التجديد القادم'), L('01 Jul 2026', '01 يوليو 2026'), L('auto-renews', 'يتجدد تلقائياً'))}</div>
 <div class="card" style="margin-top:13px"><h4>${L('Change plan', 'تغيير الباقة')}</h4>
 <div style="display:flex;gap:8px;flex-wrap:wrap">${['Starter', 'Growth', 'Enterprise'].map(p => `<button class="chip ${STATE.plan === p ? 'on' : ''}" onclick="STATE.plan='${p}';render();toast(L('Plan changed to ${p}','تم تغيير الباقة إلى ${p}'))">${p}</button>`).join('')}</div>
 <p class="note" style="margin-top:9px">${L('Upgrades apply immediately; downgrades at the next cycle. VAT 15% added at checkout per ZATCA rules.', 'الترقيات تُطبّق فوراً؛ والتخفيضات في الدورة التالية. تُضاف ضريبة القيمة المضافة 15% عند الدفع وفق أنظمة زاتكا.')}</p></div>
 <div class="card" style="margin-top:13px"><h4>${L('Invoices', 'الفواتير')}</h4><table><tr><th>${L('Date', 'التاريخ')}</th><th>${L('Invoice', 'الفاتورة')}</th><th class="num">${L('Amount (SAR)', 'المبلغ (ر.س)')}</th><th>${L('Status', 'الحالة')}</th></tr>
 ${STATE.invoices.map(v => `<tr><td>${v.d}</td><td class="note">${v.n}</td><td class="num">${v.amt}</td><td><span class="tag ${v.st === 'Paid' ? 'ok' : 'info'}">${statusD(v.st)}</span></td></tr>`).join('')}</table></div>`;

// ── Branch Performance ────────────────────────────────────────
PAGES.branch = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const t = totals(); const brs = STATE.org.branches; const i = Math.min(STATE.branchView || 0, brs.length - 1);
  const w = brs.length === 1 ? [1] : brs.map((_, k) => k === 0 ? 0.58 : 0.42 / (brs.length - 1));
  const f = w[i];
  return `<div class="tabs">${brs.map((b, k) => `<button class="${k === i ? 'on' : ''}" onclick="STATE.branchView=${k};render()">${esc(b)}</button>`).join('')}</div>
  <div class="grid g4">
   ${kpi(L('Branch revenue', 'إيرادات الفرع'), SAR(Math.round(t.rev * f)), Math.round(f * 100) + L('% of total', '% من الإجمالي'))}
   ${kpi(L('Branch net profit', 'صافي ربح الفرع'), SAR(Math.round(t.net * f)), '', t.net > 0 ? 'up' : 'down')}
   ${kpi(L('Food cost %', 'نسبة تكلفة الطعام %'), pct(t.foodPct + (i ? 1.2 : -0.4)), L('vs ', 'مقابل ') + pct(t.foodPct) + L(' blended', ' مدمجة'))}
   ${kpi(L('Orders / month', 'الطلبات / شهر'), fmt(Math.round(totalUnits() * f)))}</div>
  <div class="card" style="margin-top:13px"><h4>${L('Branch-specific pricing', 'تسعير خاص بالفرع')}</h4>
   <p class="note" style="margin-bottom:10px">${L('Items can carry a different price per branch (e.g., mall location +8%). Set branch overrides in the Pricing Center → Branch-specific strategy.', 'يمكن أن يحمل الصنف سعراً مختلفاً لكل فرع (مثلاً موقع المول +8%). اضبط تجاوزات الفروع في مركز التسعير ← استراتيجية خاصة بالفرع.')}</p>
   <table><tr><th>${L('Item', 'الصنف')}</th><th class="num">${L('Base price', 'السعر الأساسي')}</th><th class="num">${L(esc(brs[i]) + ' price', 'سعر ' + esc(brs[i]))}</th></tr>
   ${STATE.menu.slice(0, 5).map(m => `<tr><td>${esc(m.n)}</td><td class="num">${SAR2(m.price)}</td><td class="num">${SAR2(m.price * (i ? 1.08 : 1))}</td></tr>`).join('')}</table></div>`;
};

// ── Categories ────────────────────────────────────────────────
PAGES.cats = () => `<div class="card"><h4>${L('Categories', 'التصنيفات')} <span class="note">${L(STATE.org.type + ' template', 'قالب ' + STATE.org.type)}</span></h4>
 <table><tr><th>${L('Category', 'التصنيف')}</th><th class="num">${L('Items', 'الأصناف')}</th><th></th></tr>
 ${STATE.cats.map((c, i) => `<tr><td><input class="tbl-edit" style="width:220px;text-align:start" value="${esc(c)}" onchange="renameCat(${i},this.value)"></td><td class="num">${STATE.menu.filter(m => m.cat === c).length}</td>
  <td><button class="btn btn-sm btn-danger" onclick="STATE.cats.splice(${i},1);render()">${L('Remove', 'حذف')}</button></td></tr>`).join('')}</table>
 <div style="display:flex;gap:9px;margin-top:12px"><input class="tbl-edit" id="ncat" style="width:220px;text-align:start" placeholder="${L('New category', 'تصنيف جديد')}">
 <button class="btn btn-sm btn-line" onclick="if($('ncat').value.trim()){STATE.cats.push($('ncat').value.trim());render();toast(L('Category added','تمت إضافة التصنيف'))}">${L('+ Add', '+ إضافة')}</button></div></div>`;

function renameCat(i, v) {
  v = v.trim(); if (!v) { render(); return; }
  const old = STATE.cats[i];
  STATE.cats[i] = v; STATE.menu.forEach(m => { if (m.cat === old) m.cat = v; });
  render(); toast(L('Category renamed — ' + STATE.menu.filter(m => m.cat === v).length + ' item(s) updated', 'تمت إعادة تسمية التصنيف — حُدّث ' + STATE.menu.filter(m => m.cat === v).length + ' صنف'));
}

// ── Menu Items ────────────────────────────────────────────────
PAGES.menu = () => {
  if (!STATE.menu.length) return emptyMenuState();
  return `<div style="display:flex;justify-content:flex-end;margin-bottom:12px"><button class="btn btn-navy btn-sm" onclick="addItemModal()">${L('+ Add menu item', '+ إضافة صنف')}</button></div>
  <div class="card"><table><tr><th>${L('Item', 'الصنف')}</th><th>${L('Category', 'التصنيف')}</th><th class="num">${L('Price', 'السعر')}</th><th class="num">${L('True cost', 'التكلفة الحقيقية')}</th><th class="num">${L('Margin', 'الهامش')}</th><th>${L('Status', 'الحالة')}</th><th></th></tr>
  ${STATE.menu.map(m => `<tr><td><b>${esc(m.n)}</b><div class="note">${L(m.sold + ' sold/mo · ' + Math.round(m.delShare * 100) + '% via delivery', m.sold + ' مباع/شهر · ' + Math.round(m.delShare * 100) + '% عبر التوصيل')}</div></td><td>${esc(m.cat)}</td>
   <td class="num"><input class="tbl-edit" type="number" value="${m.price}" onchange="m_(${q(m.id)}).price=+this.value;render();toast(L('Price updated — all margins recalculated','تم تحديث السعر — أُعيد حساب كل الهوامش'))"></td>
   <td class="num">${SAR2(cost(m))}</td><td class="num ${marginPct(m) < 20 ? 'down' : 'up'}">${pct(marginPct(m))}</td>
   <td><span class="tag ${m.status === 'approved' ? 'ok' : 'warn'}">${m.status === 'approved' ? L('Active', 'نشط') : L('Recipe pending', 'الوصفة معلّقة')}</span>${m.reprice ? ` <span class="tag bad">${L('reprice', 'إعادة تسعير')}</span>` : ''}</td>
   <td style="white-space:nowrap"><button class="btn btn-sm btn-line" onclick="editItemModal(${q(m.id)})">${L('Edit', 'تعديل')}</button>
   <button class="btn btn-sm btn-danger" onclick="STATE.menu=STATE.menu.filter(x=>x.id!==${q(m.id)});render();toast(L('Item removed','تم حذف الصنف'),'bad')">${L('Remove', 'حذف')}</button></td></tr>`).join('')}</table></div>`;
};

function editItemModal(id) {
  const m = m_(id); if (!m) return;
  modal(`<h3>${L('Edit — ', 'تعديل — ')}${esc(m.n)}</h3>
   <div class="field"><label>${L('Name', 'الاسم')}</label><input id="eiN" value="${esc(m.n)}"></div>
   <div class="field"><label>${L('Category', 'التصنيف')}</label><select id="eiC">${STATE.cats.map(c => `<option ${c === m.cat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
   <div class="field"><label>${L('Description', 'الوصف')}</label><textarea id="eiD" rows="2">${esc(m.desc || '')}</textarea></div>
   <div class="grid g2">
    <div class="field"><label>${L('Price (SAR)', 'السعر (ر.س)')}</label><input id="eiP" type="number" step="0.5" value="${m.price}"></div>
    <div class="field"><label>${L('Sold / month', 'المباع / شهر')}</label><input id="eiS" type="number" value="${m.sold}"></div>
    <div class="field"><label>${L('Delivery share %', 'حصة التوصيل %')}</label><input id="eiDel" type="number" value="${Math.round(m.delShare * 100)}"></div>
    <div class="field"><label>${L('Labor minutes', 'دقائق العمالة')}</label><input id="eiL" type="number" step="0.5" value="${m.laborMin}"></div></div>
   <div style="display:flex;gap:9px;justify-content:flex-end"><button class="btn btn-line" onclick="closeModal()">${L('Cancel', 'إلغاء')}</button>
   <button class="btn btn-gold" onclick="saveItemEdit(${q(m.id)})">${L('Save changes', 'حفظ التغييرات')}</button></div>`);
}
function saveItemEdit(id) {
  const m = m_(id); if (!m) return;
  const n = $('eiN').value.trim(); if (!n) { toast(L('Name required', 'الاسم مطلوب'), 'bad'); return; }
  m.n = n; m.cat = $('eiC').value; m.desc = $('eiD').value; m.price = +$('eiP').value || m.price;
  m.sold = Math.max(1, +$('eiS').value || m.sold); m.delShare = Math.max(0, Math.min(100, +$('eiDel').value)) / 100; m.laborMin = +$('eiL').value || m.laborMin;
  closeModal(); render(); toast(L('Item updated — costs & margins recalculated', 'تم تحديث الصنف — أُعيد حساب التكاليف والهوامش'));
}
function addItemModal() {
  modal(`<h3>${L('Add menu item', 'إضافة صنف للقائمة')}</h3>
   <div class="field"><label>${L('Name', 'الاسم')}</label><input id="niN" placeholder="${L('Grilled Seabass', 'قاروص مشوي')}"></div>
   <div class="field"><label>${L('Category', 'التصنيف')}</label><select id="niC">${STATE.cats.map(c => `<option>${esc(c)}</option>`).join('')}</select></div>
   <div class="grid g2"><div class="field"><label>${L('Price (SAR)', 'السعر (ر.س)')}</label><input id="niP" type="number" value="59"></div>
   <div class="field"><label>${L('Estimated monthly sales', 'المبيعات الشهرية التقديرية')}</label><input id="niS" type="number" value="200"></div></div>
   <div class="alert info"><span>✦</span><div>${L('Recipe Intelligence will draft ingredients automatically from the item name.', 'سيقوم ذكاء الوصفات بصياغة المكونات تلقائياً من اسم الصنف.')}</div></div>
   <div style="display:flex;gap:9px;justify-content:flex-end"><button class="btn btn-line" onclick="closeModal()">${L('Cancel', 'إلغاء')}</button>
   <button class="btn btn-gold" onclick="addItem()">${L('Add & draft recipe', 'إضافة وصياغة الوصفة')}</button></div>`);
}
function addItem() {
  const n = $('niN').value.trim(); if (!n) { toast(L('Name required', 'الاسم مطلوب'), 'bad'); return; }
  const recipe = suggestIngredients(n).map(([inN, qty]) => {
    let ig = STATE.ings.find(x => x.n === inN);
    if (!ig) { const pr = Math.round(10 + Math.random() * 35); ig = { id: uid(), n: inN, sup: STATE.sups[0]?.n || 'Unassigned', unit: qty < 8 ? 'pc' : 'kg', price: pr, yield: 0.92, est: true, hist: [{ d: 'now', p: pr }] }; STATE.ings.push(ig); }
    return [ig.id, qty];
  });
  STATE.menu.push({ id: uid(), n, cat: $('niC').value, price: +$('niP').value || 50, desc: '', recipe, laborMin: 6, pack: 1.5, sold: +$('niS').value || 100, delShare: .3, status: 'pending', reprice: false });
  closeModal(); render(); toast(L('Item added — recipe drafted by Recipe Intelligence', 'تمت إضافة الصنف — صيغت الوصفة بواسطة ذكاء الوصفات'));
}

// ── Recipe Builder ────────────────────────────────────────────
PAGES.recipe = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const pend = STATE.menu.filter(m => m.status !== 'approved');
  return `${pend.length ? `<div class="alert warn"><span>◆</span><div><b>${L(pend.length + ' recipe(s)', pend.length + ' وصفة')}</b> ${L('drafted by Recipe Intelligence are awaiting your approval.', 'صاغها ذكاء الوصفات وتنتظر موافقتك.')}</div></div>` : ''}
  ${STATE.menu.map(m => recipeCard(m)).join('')}`;
};

// ── Ingredient Center ─────────────────────────────────────────
PAGES.ing = () => {
  if (!STATE.ings.length) return emptyMenuState();
  const estN = STATE.ings.filter(i => i.est).length;
  return `${estN ? `<div class="alert warn"><span>◆</span><div><b>${L(estN + ' ingredient price(s) are AI estimates.', estN + ' من أسعار المكونات تقديرات ذكاء اصطناعي.')}</b> ${L('For accurate costing, set your real purchase prices below or process an invoice in Procurement — every recipe recosts instantly.', 'لتكلفة دقيقة، اضبط أسعار الشراء الفعلية بالأسفل أو عالج فاتورة في المشتريات — تُعاد تكلفة كل وصفة فوراً.')}</div></div>` : ''}
  <div class="card" style="margin-bottom:13px"><h4>${L('Import / export ingredients', 'استيراد / تصدير المكونات')} <span class="note">${L('Excel-compatible', 'متوافق مع Excel')}</span></h4>
   <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button class="btn btn-sm btn-line" onclick="exportIngredientsExcel()">${L('⤓ Export to Excel', '⤓ تصدير إلى Excel')}</button>
    <label class="btn btn-sm btn-line" style="margin:0">${L('⤒ Import file (.xlsx/.csv)', '⤒ استيراد ملف (.xlsx/.csv)')}
     <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="importIngredientsFile(this)"></label>
    <button class="btn btn-sm btn-line" onclick="ingredientImportModal()">${L('⌨ Paste / import from URL', '⌨ لصق / استيراد من رابط')}</button>
    <span class="note" style="margin-inline-start:auto">${STATE.ings.length} ${L('ingredient(s) · columns: Name, Supplier, Unit, Price (SAR), Yield %', 'مكوّن · الأعمدة: الاسم، المورّد، الوحدة، السعر (ر.س)، نسبة الإنتاجية %')}</span>
   </div></div>
  <div class="card"><h4>${L('Ingredient database', 'قاعدة بيانات المكونات')} <span class="note">${L('prices are editable — every recipe recosts instantly', 'الأسعار قابلة للتعديل — تُعاد تكلفة كل وصفة فوراً')}</span></h4>
  <table><tr><th>${L('Ingredient', 'المكوّن')}</th><th>${L('Supplier', 'المورّد')}</th><th>${L('Unit', 'الوحدة')}</th><th class="num">${L('Price (SAR)', 'السعر (ر.س)')}</th><th class="num">${L('Yield %', 'الإنتاجية %')}</th><th>${L('Trend', 'الاتجاه')}</th><th class="num">${L('Used in', 'مستخدم في')}</th></tr>
  ${STATE.ings.map(i => `<tr><td>${esc(i.n)}${i.est ? ` <span class="tag warn">${L('estimate', 'تقدير')}</span>` : ''}</td><td class="note">${esc(i.sup)}</td><td>${i.unit}</td>
   <td class="num"><input class="tbl-edit" type="number" step="0.5" value="${i.price}" onchange="updIngPrice(${q(i.id)},+this.value)"></td>
   <td class="num"><input class="tbl-edit" type="number" step="1" value="${Math.round((i.yield || 1) * 100)}" onchange="STATE.ings.find(x=>x.id===${q(i.id)}).yield=+this.value/100;render()"></td>
   <td>${spark(i.hist)}</td><td class="num">${STATE.menu.filter(m => m.recipe.some(r => r[0] === i.id)).length} ${L('recipes', 'وصفة')}</td></tr>`).join('')}</table></div>`;
};

function updIngPrice(id, p) {
  const i = STATE.ings.find(x => x.id === id); const old = i.price; i.price = p; i.est = false;
  i.hist.push({ d: 'now', p }); if (i.hist.length > 8) i.hist.shift();
  if (p > old * 1.05) {
    STATE.notifications.unshift({ t: L('Procurement Analyst', 'محلل المشتريات'), m: L(`${i.n} up ${pct((p / old - 1) * 100)} — ${STATE.menu.filter(m => m.recipe.some(r => r[0] === i.id)).length} recipes recosted. Check cheaper suppliers.`, `${i.n} ارتفع ${pct((p / old - 1) * 100)} — أُعيد حساب ${STATE.menu.filter(m => m.recipe.some(r => r[0] === i.id)).length} وصفة. ابحث عن موردين أرخص.`), k: 'bad', time: 'now' });
    toast(L(`${i.n} +${pct((p / old - 1) * 100)} — alert raised & recipes recosted`, `${i.n} +${pct((p / old - 1) * 100)} — تم رفع تنبيه وإعادة حساب الوصفات`), 'bad');
  } else toast(L('Price updated — recipes recosted', 'تم تحديث السعر — أُعيد حساب الوصفات'));
  render();
}

// ── Suppliers ─────────────────────────────────────────────────
PAGES.sup = () => `<div style="display:flex;justify-content:flex-end;margin-bottom:13px">
   <button class="btn btn-navy btn-sm" onclick="supplierModal()">${L('+ Add supplier', '+ إضافة مورّد')}</button></div>
 <div class="grid g2">${STATE.sups.length ? STATE.sups.map((sp, si) => {
  const items = STATE.ings.filter(i => i.sup === sp.n);
  const monthlySpend = Math.round(STATE.menu.reduce((a, m) => a + m.recipe.reduce((b, [id, qy]) => { const i = ingById(id); return i && i.sup === sp.n ? b + (i.unit === 'pc' ? qy * i.price : qy / 1000 * i.price) * m.sold : b; }, 0), 0));
  return `<div class="card"><h4>${esc(sp.n)} <span style="display:flex;gap:6px;align-items:center">
    <span class="tag info">★ ${sp.rating}</span>
    <button class="btn btn-sm btn-line" onclick="supplierModal(${si})">${L('Edit', 'تعديل')}</button>
    <button class="btn btn-sm btn-danger" onclick="delSupplier(${si})">${L('Delete', 'حذف')}</button></span></h4>
   <p class="note">${esc(sp.cat)}</p>
   <table>
    <tr><td>${L('Payment terms', 'شروط الدفع')}</td><td class="num">${esc(sp.terms)}</td></tr>
    <tr><td>${L('Delivery days', 'أيام التوريد')}</td><td class="num">${esc(sp.days)}</td></tr>
    <tr><td>${L('Items supplied', 'الأصناف المورّدة')}</td><td class="num">${items.length}</td></tr>
    <tr><td>${L('Monthly spend (est.)', 'الإنفاق الشهري (تقديري)')}</td><td class="num">${SAR(monthlySpend)}</td></tr>
   </table>
   ${items.length ? `<table style="margin-top:10px"><tr><th>${L('Item', 'الصنف')}</th><th>${L('Unit', 'الوحدة')}</th><th class="num">${L('Qty/order', 'الكمية/طلب')}</th><th class="num">${L('Price (SAR)', 'السعر (ر.س)')}</th></tr>
    ${items.map(i => `<tr><td>${esc(i.n)}</td><td>${esc(i.unit)}</td><td class="num">${i.orderQty ? fmt(i.orderQty) : '—'}</td><td class="num">${SAR2(i.price)}</td></tr>`).join('')}
   </table>` : `<p class="note" style="margin-top:8px">${L('No items linked yet — click Edit to add what you buy from this supplier.', 'لا توجد أصناف مرتبطة بعد — انقر تعديل لإضافة ما تشتريه من هذا المورّد.')}</p>`}
   </div>`;
}).join('') : `<div class="card"><div class="empty"><div class="big">⛟</div><h5>${L('No suppliers yet', 'لا يوجد موردون بعد')}</h5><p>${L('Add your first supplier.', 'أضف أول مورّد.')}</p></div></div>`}</div>`;

let _supDraftItems = [];
function supplierModal(idx) {
  const editing = (typeof idx === 'number');
  const sp = editing ? STATE.sups[idx] : { n: '', cat: '', terms: 'Net 15', days: '', rating: 4.5 };
  _supDraftItems = editing ? STATE.ings.filter(i => i.sup === sp.n).map(i => ({ id: i.id, n: i.n, unit: i.unit, orderQty: i.orderQty || 0, price: i.price })) : [];
  const idxAttr = editing ? idx : -1;
  modal(`<h3>${editing ? L('Edit supplier', 'تعديل المورّد') : L('Add supplier', 'إضافة مورّد')}</h3>
   <div class="grid g2">
    <div class="field"><label>${L('Name', 'الاسم')}</label><input id="smN" value="${esc(sp.n)}" placeholder="${L('Gulf Fresh Fish Co.', 'شركة الخليج للأسماك الطازجة')}"></div>
    <div class="field"><label>${L('Category', 'التصنيف')}</label><input id="smC" value="${esc(sp.cat || '')}" placeholder="${L('Fresh fish', 'أسماك طازجة')}"></div>
    <div class="field"><label>${L('Payment terms', 'شروط الدفع')}</label><input id="smT" value="${esc(sp.terms || '')}" placeholder="Net 15"></div>
    <div class="field"><label>${L('Delivery days', 'أيام التوريد')}</label><input id="smD" value="${esc(sp.days || '')}" placeholder="${L('Sat · Mon · Wed', 'سبت · إثنين · أربعاء')}"></div>
   </div>
   <h4 style="margin:6px 0 8px">${L('Items you buy from this supplier', 'الأصناف التي تشتريها من هذا المورّد')}</h4>
   <div id="supItems"></div>
   <button class="btn btn-sm btn-line" onclick="supAddItemRow()">${L('+ Add item', '+ إضافة صنف')}</button>
   <div style="display:flex;gap:9px;justify-content:flex-end;margin-top:18px">
    <button class="btn btn-line" onclick="closeModal()">${L('Cancel', 'إلغاء')}</button>
    <button class="btn btn-gold" onclick="saveSupplier(${idxAttr})">${editing ? L('Save changes', 'حفظ التغييرات') : L('Add supplier', 'إضافة مورّد')}</button>
   </div>`);
  renderSupItems();
}
function renderSupItems() {
  const host = $('supItems'); if (!host) return;
  if (!_supDraftItems.length) { host.innerHTML = `<p class="note" style="padding:8px 0">${L('No items yet. Click "+ Add item" to list what you buy.', 'لا توجد أصناف بعد. انقر "+ إضافة صنف" لإدراج ما تشتريه.')}</p>`; return; }
  host.innerHTML = `<table style="margin-bottom:10px">
    <tr><th>${L('Item name', 'اسم الصنف')}</th><th>${L('Unit', 'الوحدة')}</th><th class="num">${L('Qty / order', 'الكمية / طلب')}</th><th class="num">${L('Unit price (SAR)', 'سعر الوحدة (ر.س)')}</th><th></th></tr>
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
  if (!n) { toast(L('Supplier name required', 'اسم المورّد مطلوب'), 'bad'); return; }
  const editing = idx >= 0;
  if (STATE.sups.some((x, i) => i !== idx && x.n.toLowerCase() === n.toLowerCase())) { toast(L('A supplier with that name already exists', 'يوجد مورّد بهذا الاسم بالفعل'), 'bad'); return; }
  const valid = _supDraftItems.filter(it => (it.n || '').trim() && it.price > 0);
  if (_supDraftItems.length && valid.length !== _supDraftItems.length) { toast(L('Each item row needs a name and a price > 0', 'كل صف صنف يحتاج اسماً وسعراً أكبر من 0'), 'bad'); return; }
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
        if (oldPrice && it.price > oldPrice * 1.05) STATE.notifications.unshift({ t: L('Procurement Analyst', 'محلل المشتريات'), m: L(`${name} up ${pct((it.price / oldPrice - 1) * 100)} at ${n} — recipes recosted.`, `${name} ارتفع ${pct((it.price / oldPrice - 1) * 100)} لدى ${n} — أُعيد حساب الوصفات.`), k: 'bad', time: 'now' });
        STATE.menu.forEach(m => { if (m.recipe.some(r => r[0] === ig.id)) recosted.add(m.n); });
      }
    } else { ig = { id: uid(), n: name, sup: n, unit: it.unit, price: it.price, yield: 1, orderQty: it.orderQty || 0, est: false, hist: [{ d: 'sup', p: it.price }] }; STATE.ings.push(ig); added++; }
  });
  closeModal(); render();
  const parts = [editing ? L('Supplier updated', 'تم تحديث المورّد') : L('Supplier added', 'تمت إضافة المورّد')];
  if (added) parts.push(L(added + ' new item(s)', added + ' صنف جديد'));
  if (updated) parts.push(L(updated + ' price(s) updated', 'حُدّث ' + updated + ' سعر'));
  if (recosted.size) parts.push(L(recosted.size + ' recipe(s) recosted', 'أُعيد حساب ' + recosted.size + ' وصفة'));
  toast(parts.join(' — '));
}
function delSupplier(si) {
  const sp = STATE.sups[si]; const moved = STATE.ings.filter(i => i.sup === sp.n).length;
  STATE.ings.forEach(i => { if (i.sup === sp.n) i.sup = 'Unassigned'; });
  STATE.sups.splice(si, 1); render();
  toast(L(sp.n + ' deleted' + (moved ? ' — ' + moved + ' ingredient(s) moved to "Unassigned"' : ''), 'تم حذف ' + sp.n + (moved ? ' — نُقل ' + moved + ' مكوّن إلى "غير مُعيّن"' : '')), 'bad');
}

// ── Procurement / Invoice Capture ─────────────────────────────
PAGES.proc = () => {
  if (!STATE.ings.length) return emptyMenuState();
  const changes = STATE.ings.filter(i => i.hist.length > 1).map(i => ({ i, ch: (i.hist.at(-1).p / i.hist[0].p - 1) * 100 })).sort((a, b) => b.ch - a.ch);
  const li = STATE.lastInv;
  return `<div class="card" style="margin-bottom:13px"><h4>${L('Invoice capture', 'التقاط الفواتير')} <span class="tag gold">${L('MarginEdge-style · Agent E', 'الوكيل E')}</span></h4>
   <p class="note" style="margin-bottom:10px">${L('Paste invoice lines — one per line as <b>ingredient name &nbsp;price</b>. The agent matches your ingredient database, updates purchase prices, <b>recosts every affected recipe instantly</b>, and raises alerts on increases over 5%.', 'الصق سطور الفاتورة — سطر لكل بند بصيغة <b>اسم المكوّن &nbsp;السعر</b>. يطابق الوكيل قاعدة مكوناتك، ويحدّث أسعار الشراء، و<b>يعيد حساب كل وصفة متأثرة فوراً</b>، ويرفع تنبيهات عند الزيادات فوق 5%.')}</p>
   <div class="field"><textarea id="invTxt" rows="5" placeholder="Hamour fish  64.5&#10;Shrimp peeled  61&#10;Olive oil  25"></textarea></div>
   <button class="btn btn-navy btn-sm" onclick="applyInvoice()">${L('▶ Process invoice', '▶ معالجة الفاتورة')}</button>
   ${li ? `<div style="margin-top:12px">
     ${li.matched.length ? `<div class="alert good"><span>✓</span><div><b>${L(li.matched.length + ' line(s) matched & applied:', 'طُوبق وطُبّق ' + li.matched.length + ' سطر:')}</b> ${li.matched.map(x => esc(x.n) + ' → ' + SAR2(x.p) + (x.delta > 5 ? ' (▲+' + x.delta.toFixed(1) + '%)' : '')).join(' · ')}. ${L('All recipes recosted.', 'أُعيد حساب كل الوصفات.')}</div></div>` : ''}
     ${li.unmatched.length ? `<div class="alert warn"><span>◆</span><div><b>${L(li.unmatched.length + ' unmatched:', li.unmatched.length + ' غير مطابق:')}</b> ${li.unmatched.map(esc).join(' · ')} — ${L('add them in the Ingredient Center, then re-process.', 'أضفها في مركز المكونات، ثم أعد المعالجة.')}</div></div>` : ''}
   </div>` : ''}
  </div>
  <div class="grid g2">
  <div class="card"><h4>${L('Record a single price', 'تسجيل سعر مفرد')}</h4>
   <div class="field"><label>${L('Ingredient', 'المكوّن')}</label><select id="prIng">${STATE.ings.map(i => `<option value="${i.id}">${esc(i.n)} — ${L('now', 'الآن')} ${SAR2(i.price)}/${i.unit}</option>`).join('')}</select></div>
   <div class="field"><label>${L('New quoted price (SAR)', 'السعر الجديد المعروض (ر.س)')}</label><input id="prP" type="number" step="0.5"></div>
   <button class="btn btn-line btn-sm" onclick="if(+$('prP').value){updIngPrice($('prIng').value,+$('prP').value)}else toast(L('Enter a price','أدخل سعراً'),'bad')">${L('Record price', 'تسجيل السعر')}</button>
   <h4 style="margin-top:18px">${L('Cheaper alternative suggestions', 'اقتراحات بدائل أرخص')}</h4>
   ${changes.filter(x => x.ch > 4).slice(0, 3).map(x => `<div class="alert warn"><span>◆</span><div><b>${esc(x.i.n)}</b> ${L('trending +', 'يرتفع +')}${pct(x.ch)} ${L('at', 'لدى')} ${esc(x.i.sup)}. ${STATE.sups.filter(sx => sx.n !== x.i.sup && sx.n !== 'In-house prep').slice(0, 1).map(sx => L(`Ask <b>${esc(sx.n)}</b> for a quote.`, `اطلب عرض سعر من <b>${esc(sx.n)}</b>.`)).join('') || L('Request quotes from alternative suppliers.', 'اطلب عروض أسعار من موردين بدلاء.')}</div></div>`).join('') || `<p class="note">${L('No rising-price ingredients right now.', 'لا توجد مكونات مرتفعة السعر حالياً.')}</p>`}
  </div>
  <div class="card"><h4>${L('Price change log', 'سجل تغيّر الأسعار')}</h4>
   <table><tr><th>${L('Ingredient', 'المكوّن')}</th><th>${L('Supplier', 'المورّد')}</th><th class="num">${L('Change', 'التغيّر')}</th><th>${L('Trend', 'الاتجاه')}</th></tr>
   ${changes.slice(0, 12).map(x => `<tr><td>${esc(x.i.n)}${x.i.est ? ` <span class="tag warn">${L('estimate', 'تقدير')}</span>` : ''}</td><td class="note">${esc(x.i.sup)}</td><td class="num ${x.ch > 0 ? 'down' : 'up'}">${x.ch > 0 ? '+' : ''}${pct(x.ch)}</td><td>${spark(x.i.hist)}</td></tr>`).join('') || `<tr><td colspan="4" class="note">${L('No price history yet — process an invoice to start tracking.', 'لا يوجد سجل أسعار بعد — عالج فاتورة لبدء التتبع.')}</td></tr>`}</table></div></div>`;
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
  if (txt.trim().length < 3) { toast(L('Paste invoice lines first', 'الصق سطور الفاتورة أولاً'), 'bad'); return; }
  const r = invMatchProc(txt);
  if (!r.matched.length && !r.unmatched.length) { toast(L('No "name + price" lines detected', 'لم تُكتشف سطور "اسم + سعر"'), 'bad'); return; }
  r.matched.forEach(x => {
    const i = STATE.ings.find(g => g.id === x.id); const old = i.price;
    i.price = x.p; i.est = false; i.hist.push({ d: 'inv', p: x.p }); if (i.hist.length > 8) i.hist.shift();
    if (x.p > old * 1.05) STATE.notifications.unshift({ t: L('Procurement Analyst', 'محلل المشتريات'), m: L(i.n + ' up ' + pct((x.p / old - 1) * 100) + ' on latest invoice — recipes recosted.', i.n + ' ارتفع ' + pct((x.p / old - 1) * 100) + ' في آخر فاتورة — أُعيد حساب الوصفات.'), k: 'bad', time: 'now' });
  });
  STATE.lastInv = r; render();
  toast(L(r.matched.length + ' price(s) applied — every affected recipe recosted' + (r.unmatched.length ? ' · ' + r.unmatched.length + ' unmatched' : ''), 'طُبّق ' + r.matched.length + ' سعر — أُعيد حساب كل وصفة متأثرة' + (r.unmatched.length ? ' · ' + r.unmatched.length + ' غير مطابق' : '')));
}

// ── Inventory Variance ────────────────────────────────────────
PAGES.inv = () => {
  if (!STATE.ings.length) return emptyMenuState();
  return `<div class="card"><h4>${L('Inventory variance', 'فروقات المخزون')} <span class="note">${L('opening + purchases − consumption = expected closing; variance vs counted', 'الافتتاحي + المشتريات − الاستهلاك = الختامي المتوقع؛ الفرق مقابل المعدود')}</span></h4>
  <table><tr><th>${L('Ingredient', 'المكوّن')}</th><th class="num">${L('Opening', 'افتتاحي')}</th><th class="num">${L('Purchases', 'مشتريات')}</th><th class="num">${L('Consumed (recipes)', 'مستهلك (وصفات)')}</th><th class="num">${L('Expected close', 'الختامي المتوقع')}</th><th class="num">${L('Counted', 'المعدود')}</th><th class="num">${L('Variance', 'الفرق')}</th></tr>
  ${STATE.ings.slice(0, 10).map((i, k) => {
    const cons = STATE.menu.reduce((a, m) => a + m.recipe.reduce((b, [id, qy]) => id === i.id ? b + (i.unit === 'pc' ? qy : qy / 1000) * m.sold : b, 0), 0);
    const op = cons * 0.3, pur = cons * 1.05, exp = op + pur - cons, cnt = exp * (k % 4 === 0 ? 0.93 : 0.99), va = (cnt - exp) / (exp || 1) * 100;
    return `<tr><td>${esc(i.n)}</td><td class="num">${op.toFixed(0)}</td><td class="num">${pur.toFixed(0)}</td><td class="num">${cons.toFixed(0)}</td><td class="num">${exp.toFixed(0)}</td><td class="num">${cnt.toFixed(0)}</td><td class="num ${va < -3 ? 'down' : ''}">${va.toFixed(1)}%</td></tr>`;
  }).join('')}</table>
  <p class="note" style="margin-top:9px">${L('Units: kg (or pc). Variance beyond −3% feeds the Shrinkage line in Hidden Costs.', 'الوحدات: كجم (أو قطعة). الفرق الذي يتجاوز −3% يغذّي بند الهدر في التكاليف الخفية.')}</p></div>`;
};

// ── Employees ─────────────────────────────────────────────────
PAGES.emp = () => {
  const tot = laborPool();
  return `<div class="grid g3">${kpi(L('Headcount', 'عدد الموظفين'), STATE.emps.length)}${kpi(L('True monthly cost', 'التكلفة الشهرية الحقيقية'), SAR(Math.round(tot)))}
  ${kpi(L('Avg multiplier', 'المضاعف المتوسط'), (STATE.emps.length ? (tot / STATE.emps.reduce((a, e) => a + e.basic, 0)) : 0).toFixed(2) + '×', L('of basic salary', 'من الراتب الأساسي'))}</div>
  <div class="card" style="margin-top:13px"><h4>${L('Employee Cost Engine', 'محرّك تكلفة الموظفين')} <span class="note">${L('edit basic salary — labor cost per dish recalculates', 'عدّل الراتب الأساسي — تُعاد حساب تكلفة العمالة لكل صنف')}</span></h4>
  ${STATE.emps.length ? `<table><tr><th>${L('Employee', 'الموظف')}</th><th class="num">${L('Basic', 'الأساسي')}</th><th class="num">${L('Housing+Trans+Food', 'سكن+نقل+طعام')}</th><th class="num">${L('GOSI', 'التأمينات')}</th><th class="num">${L('Visa/Iqama/Med/Recruit', 'تأشيرة/إقامة/طبي/توظيف')}</th><th class="num">${L('True cost', 'التكلفة الحقيقية')}</th><th></th></tr>
  ${STATE.emps.map(e => `<tr><td>${esc(e.n)}<div class="note">${esc(e.pos)} · ${e.saudi ? L('Saudi', 'سعودي') : L('Expat', 'وافد')} · ${L('GOSI', 'التأمينات')} ${(e.gosi * 100).toFixed(2)}%</div></td>
   <td class="num"><input class="tbl-edit" type="number" value="${e.basic}" onchange="STATE.emps.find(x=>x.id===${q(e.id)}).basic=+this.value;render();toast(L('Labor rate recalculated','أُعيد حساب معدّل العمالة'))"></td>
   <td class="num">${fmt(e.hous + e.trans + e.food)}</td><td class="num">${fmt(Math.round(e.basic * e.gosi))}</td>
   <td class="num">${fmt(e.visa + e.iqama + e.med + e.recr)}</td><td class="num"><b>${fmt(Math.round(empMonthly(e)))}</b></td>
   <td><button class="btn btn-sm btn-danger" onclick="STATE.emps=STATE.emps.filter(x=>x.id!==${q(e.id)});render()">✕</button></td></tr>`).join('')}</table>`
    : `<div class="empty"><div class="big">⬢</div><h5>${L('No employees', 'لا يوجد موظفون')}</h5><p>${L('Add staff in onboarding step 7.', 'أضف الموظفين في الخطوة 7 من الإعداد.')}</p></div>`}
  <p class="note" style="margin-top:9px">${L('Direct labor per dish = station minutes × blended true cost per minute', 'العمالة المباشرة لكل صنف = دقائق المحطة × التكلفة الحقيقية المدمجة للدقيقة')} (${STATE.menu.length ? (L('SAR ', '') + laborRate().toFixed(2) + L('/min', ' ر.س/دقيقة')) : '—'})${L(', allocating 100% of payroll across actual plates sold.', '، بتوزيع 100% من الرواتب على الأطباق المباعة فعلياً.')}</p></div>`;
};

// ── Government Fees ───────────────────────────────────────────
PAGES.gov = () => {
  const tot = STATE.gov.reduce((a, g) => a + g.amt, 0);
  return `<div class="grid g3">${kpi(L('Tracked fees', 'الرسوم المتتبَّعة'), STATE.gov.length + L(' items', ' بند'), L('all editable', 'كلها قابلة للتعديل'))}
  ${kpi(L('Monthly allocation', 'التوزيع الشهري'), SAR(Math.round(govMonthly())), L('incl. per-employee fees', 'شاملاً رسوم كل موظف'))}
  ${kpi(L('Avg per dish', 'المتوسط لكل صنف'), STATE.menu.length ? SAR2(govMonthly() / totalUnits()) : '—', L('revenue-share allocation', 'توزيع حسب حصة الإيرادات'))}</div>
  <div class="card" style="margin-top:13px"><h4>${L('Saudi Compliance Cost Agent', 'وكيل تكاليف الامتثال السعودي')} <span class="tag gold">${L('Agent G', 'الوكيل G')}</span> <span class="note">${L('amounts change — edit them and every dish recosts', 'المبالغ تتغير — عدّلها ليُعاد حساب كل صنف')}</span></h4>
  <table><tr><th>${L('Fee', 'الرسم')}</th><th>${L('Authority', 'الجهة')}</th><th class="num">${L('Amount (SAR)', 'المبلغ (ر.س)')}</th><th>${L('Cycle', 'الدورة')}</th></tr>
  ${STATE.gov.map(g => `<tr><td>${esc(g.n)}</td><td class="note">${esc(g.auth)}</td>
   <td class="num"><input class="tbl-edit" type="number" value="${g.amt}" onchange="g_(${q(g.id)}).amt=+this.value;render();toast(L('Government allocation updated across all dishes','تم تحديث التوزيع الحكومي على كل الأصناف'))"></td>
   <td class="note">${esc(g.cycle)}</td></tr>`).join('')}</table>
  <p class="note" style="margin-top:9px">${L('GOSI employer share is computed in the Employee Cost Engine to avoid double counting.', 'حصة صاحب العمل في التأمينات تُحتسب في محرّك تكلفة الموظفين لتجنّب الاحتساب المزدوج.')}</p></div>`;
};

// ── Hidden Costs ──────────────────────────────────────────────
PAGES.hidden = () => {
  const grps = [...new Set(STATE.hidden.map(h => h.grp))];
  return `<div class="grid g3">${kpi(L('Hidden costs / month', 'التكاليف الخفية / شهر'), SAR(hiddenMonthly()))}${kpi(L('Largest group', 'أكبر مجموعة'), groupD(grps.sort((a, b) => hiddenGroup(b) - hiddenGroup(a))[0]) || '—')}${kpi(L('Avg per dish', 'المتوسط لكل صنف'), STATE.menu.length ? SAR2(hiddenMonthly() / totalUnits()) : '—')}</div>
  ${grps.map(g => `<div class="card" style="margin-top:13px"><h4>${groupD(g)} <span class="note">${SAR(hiddenGroup(g))}${L('/mo', '/شهر')}${g === 'Marketing' ? L(' · manage in Marketing Costs page', ' · تُدار في صفحة التسويق') : ''}</span></h4>
  <table>${STATE.hidden.filter(h => h.grp === g).map(h => `<tr><td>${esc(h.n)}</td>
   <td class="num"><input class="tbl-edit" type="number" value="${h.amt}" onchange="STATE.hidden.find(x=>x.id===${q(h.id)}).amt=+this.value;render()"></td>
   <td style="width:46px"><button class="btn btn-sm btn-danger" onclick="STATE.hidden=STATE.hidden.filter(x=>x.id!==${q(h.id)});render();toast(L('Cost line removed','تم حذف بند التكلفة'),'bad')">✕</button></td></tr>`).join('')}</table></div>`).join('')}
  <div class="card" style="margin-top:13px"><h4>${L('Add hidden cost line', 'إضافة بند تكلفة خفية')}</h4>
   <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <input class="tbl-edit" id="hcN" style="width:220px;text-align:start" placeholder="${L('e.g. Grease trap cleaning', 'مثال: تنظيف مصيدة الشحوم')}">
    <select class="tbl-edit" id="hcG" style="width:140px;text-align:start">${['Operations', 'Utilities', 'Technology', 'Marketing', 'Finance', 'Shrinkage'].map(g => `<option value="${g}">${groupD(g)}</option>`).join('')}</select>
    <input class="tbl-edit" id="hcA" type="number" placeholder="${L('SAR/mo', 'ر.س/شهر')}" style="width:100px">
    <button class="btn btn-sm btn-navy" onclick="if(!$('hcN').value.trim()||!+$('hcA').value){toast(L('Name and amount required','الاسم والمبلغ مطلوبان'),'bad')}else{STATE.hidden.push({id:uid(),n:$('hcN').value.trim(),grp:$('hcG').value,amt:+$('hcA').value});render();toast(L('Cost line added','تمت إضافة بند التكلفة'))}">${L('+ Add', '+ إضافة')}</button></div></div>`;
};

// ── Marketing & Packaging ─────────────────────────────────────
PAGES.mktg = () => {
  const rows = STATE.hidden.filter(h => h.grp === 'Marketing');
  const tot = hiddenGroup('Marketing'); const t = STATE.menu.length ? totals() : null;
  const B = STATE.budget || (STATE.budget = { food: 32, labor: 20, mkt: 5 }); if (B.mkt === undefined) B.mkt = 5;
  const pctRev = t ? tot / t.rev * 100 : 0;
  const packTotal = STATE.menu.reduce((a, m) => a + (m.pack || 0) * m.sold, 0);
  return `<div class="grid g4">
   ${kpi(L('Marketing / month', 'التسويق / شهر'), SAR(tot), rows.length + L(' line items', ' بند'))}
   ${kpi(L('% of revenue', '% من الإيرادات'), t ? pct(pctRev) : '—', L('target ', 'الهدف ') + B.mkt + '%', t ? (pctRev <= B.mkt ? 'up' : 'down') : '')}
   ${kpi(L('Packaging / month', 'التغليف / شهر'), t ? SAR(Math.round(packTotal)) : '—', L('across all dishes', 'لكل الأصناف'))}
   ${kpi(L('Delivery app marketing', 'تسويق تطبيقات التوصيل'), pct(STATE.apps.reduce((a, x) => a + x.mkt * x.share, 0) / (STATE.apps.reduce((a, x) => a + x.share, 0) || 1)), L('blended · set per platform in Delivery Apps', 'مدمج · يُضبط لكل منصة في تطبيقات التوصيل'))}</div>
  <div class="card" style="margin-top:13px"><h4>${L('Marketing cost lines', 'بنود تكاليف التسويق')} <span class="note">${L('editable — they flow into every dish marketing layer', 'قابلة للتعديل — تتوزع على طبقة التسويق لكل صنف')}</span></h4>
   <table><tr><th>${L('Item', 'البند')}</th><th class="num">${L('SAR / month', 'ر.س / شهر')}</th><th></th></tr>
   ${rows.map(h => `<tr><td><input class="tbl-edit" style="width:240px;text-align:start" value="${esc(h.n)}" onchange="STATE.hidden.find(x=>x.id===${q(h.id)}).n=this.value"></td>
    <td class="num"><input class="tbl-edit" type="number" value="${h.amt}" onchange="STATE.hidden.find(x=>x.id===${q(h.id)}).amt=+this.value;render();toast(L('Marketing allocation updated across all dishes','تم تحديث توزيع التسويق على كل الأصناف'))"></td>
    <td><button class="btn btn-sm btn-danger" onclick="STATE.hidden=STATE.hidden.filter(x=>x.id!==${q(h.id)});render();toast(L('Marketing line removed','تم حذف بند التسويق'),'bad')">✕</button></td></tr>`).join('') || `<tr><td colspan="3" class="note">${L('No marketing lines yet — add your first below.', 'لا توجد بنود تسويق بعد — أضف أول بند بالأسفل.')}</td></tr>`}</table>
   <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
    <input class="tbl-edit" id="mkN" style="width:230px;text-align:start" placeholder="${L('e.g. Influencer campaign — Riyadh Season', 'مثال: حملة مؤثرين — موسم الرياض')}">
    <input class="tbl-edit" id="mkA" type="number" placeholder="${L('SAR/mo', 'ر.س/شهر')}" style="width:110px">
    <button class="btn btn-sm btn-navy" onclick="addMktLine()">${L('+ Add marketing cost', '+ إضافة تكلفة تسويق')}</button></div></div>
  <div class="card" style="margin-top:13px"><h4>${L('Packaging cost per item', 'تكلفة التغليف لكل صنف')} <span class="note">${L('box / bag / cup cost per dish — flows into the packaging layer', 'تكلفة العلبة / الكيس / الكوب لكل صنف — تدخل في طبقة التغليف')}</span></h4>
   ${STATE.menu.length ? `<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
     <span class="note">${L('Set all items to:', 'ضبط كل الأصناف على:')}</span>
     <input class="tbl-edit" id="packAll" type="number" step="0.1" placeholder="${L('SAR', 'ر.س')}" style="width:100px">
     <button class="btn btn-sm btn-line" onclick="setAllPackaging()">${L('Apply to all', 'تطبيق على الكل')}</button></div>
    <table><tr><th>${L('Item', 'الصنف')}</th><th>${L('Category', 'التصنيف')}</th><th class="num">${L('Packaging (SAR)', 'التغليف (ر.س)')}</th><th class="num">${L('Sold/mo', 'المباع/شهر')}</th><th class="num">${L('Monthly packaging', 'التغليف الشهري')}</th></tr>
    ${STATE.menu.map(m => `<tr><td>${esc(m.n)}</td><td class="note">${esc(m.cat)}</td>
      <td class="num"><input class="tbl-edit" type="number" step="0.1" value="${m.pack}" onchange="m_(${q(m.id)}).pack=Math.max(0,+this.value);render();toast(L('Packaging cost updated — dish recosted','تم تحديث تكلفة التغليف — أُعيد حساب الصنف'))"></td>
      <td class="num">${fmt(m.sold)}</td><td class="num">${SAR2((m.pack || 0) * m.sold)}</td></tr>`).join('')}</table>`
    : `<p class="note">${L('Add menu items first to manage packaging costs.', 'أضف أصناف القائمة أولاً لإدارة تكاليف التغليف.')}</p>`}</div>
  <div class="grid g2" style="margin-top:13px">
   <div class="card"><h4>${L('Marketing budget', 'ميزانية التسويق')}</h4>
    <div class="field"><label>${L('Target marketing % of revenue', 'نسبة التسويق المستهدفة من الإيرادات %')}</label><input type="number" step="0.5" value="${B.mkt}" onchange="STATE.budget.mkt=+this.value;render()"></div>
    ${t ? `<div class="alert ${pctRev <= B.mkt ? 'good' : 'bad'}"><span>${pctRev <= B.mkt ? '✓' : '▲'}</span><div>${L('Actual', 'الفعلي')} ${pct(pctRev)} ${L('vs target', 'مقابل الهدف')} ${B.mkt}% — ${pctRev <= B.mkt ? L('on budget.', 'ضمن الميزانية.') : L('over by ', 'تجاوز بمقدار ') + pct(pctRev - B.mkt) + ' (' + SAR(Math.round(tot - t.rev * B.mkt / 100)) + L('/month).', '/شهر).')}</div></div>` : `<p class="note">${L('Import your menu to compare against revenue.', 'استورد قائمتك لمقارنتها بالإيرادات.')}</p>`}
   </div>
   <div class="card"><h4>${L('How these flow into costing', 'كيف تدخل هذه في حساب التكلفة')}</h4>
    <p class="note">${L('Each dish carries a marketing layer = monthly marketing pool × the dish revenue share, plus a packaging cost charged per plate sold. Delivery-app marketing fees are <b>not</b> in the marketing pool — they are charged per order inside the delivery layer so nothing is double-counted.', 'يحمل كل صنف طبقة تسويق = إجمالي التسويق الشهري × حصة الصنف من الإيرادات، بالإضافة إلى تكلفة تغليف تُحتسب لكل طبق مُباع. رسوم تسويق تطبيقات التوصيل <b>ليست</b> ضمن مجمع التسويق — تُحتسب لكل طلب داخل طبقة التوصيل حتى لا يتكرر الاحتساب.')}</p></div></div>`;
};
function addMktLine() {
  const n = $('mkN').value.trim(), a = +$('mkA').value;
  if (!n || !a) { toast(L('Name and monthly amount required', 'الاسم والمبلغ الشهري مطلوبان'), 'bad'); return; }
  STATE.hidden.push({ id: uid(), n, grp: 'Marketing', amt: a }); render(); toast(L('Marketing cost added — all dishes recosted', 'تمت إضافة تكلفة التسويق — أُعيد حساب كل الأصناف'));
}
function setAllPackaging() {
  const v = +$('packAll').value;
  if (!(v >= 0) || $('packAll').value === '') { toast(L('Enter a packaging amount', 'أدخل مبلغ التغليف'), 'bad'); return; }
  STATE.menu.forEach(m => { m.pack = v; });
  render(); toast(L('Packaging set for all ' + STATE.menu.length + ' items', 'تم ضبط التغليف لكل ' + STATE.menu.length + ' صنف'));
}

// ── Delivery Apps ─────────────────────────────────────────────
PAGES.apps = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const m = [...STATE.menu].sort((a, b) => b.sold * b.delShare - a.sold * a.delShare)[0];
  return `<div class="card"><h4>${L('Platform settings', 'إعدادات المنصات')} <span class="note">${L('edit % — the blended rate feeds every item delivery layer', 'عدّل النسب — المعدّل المدمج يغذّي طبقة التوصيل لكل صنف')}</span></h4>
  <table><tr><th>${L('Platform', 'المنصة')}</th><th class="num">${L('Commission %', 'العمولة %')}</th><th class="num">${L('Marketing %', 'التسويق %')}</th><th class="num">${L('Order share %', 'حصة الطلبات %')}</th><th class="num">${L('Net margin on ', 'الهامش الصافي على ')}${esc(m.n)}</th><th></th></tr>
  ${STATE.apps.map((a, i) => {
    const fee = (a.comm + a.mkt) / 100;
    const direct = m.price - (ingCost(m) + m.pack + m.laborMin * laborRate() + ingCost(m) * 0.04);
    const net = (direct - m.price * fee) / m.price * 100;
    return `<tr><td>${esc(a.n)}</td>
    <td class="num"><input class="tbl-edit" type="number" value="${a.comm}" onchange="STATE.apps[${i}].comm=+this.value;render()"></td>
    <td class="num"><input class="tbl-edit" type="number" value="${a.mkt}" onchange="STATE.apps[${i}].mkt=+this.value;render()"></td>
    <td class="num"><input class="tbl-edit" type="number" value="${a.share}" onchange="STATE.apps[${i}].share=+this.value;render()"></td>
    <td class="num ${net < 25 ? 'down' : 'up'}">${pct(net)}</td>
    <td style="width:46px"><button class="btn btn-sm btn-danger" onclick="STATE.apps.splice(${i},1);render();toast(L('Platform removed — blended rate updated','تم حذف المنصة — حُدّث المعدّل المدمج'),'bad')">✕</button></td></tr>`;
  }).join('')}</table>
  <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
   <input class="tbl-edit" id="apN" style="width:160px;text-align:start" placeholder="${L('Platform name', 'اسم المنصة')}">
   <input class="tbl-edit" id="apC" type="number" placeholder="${L('Comm %', 'عمولة %')}" style="width:90px">
   <input class="tbl-edit" id="apM" type="number" placeholder="${L('Mktg %', 'تسويق %')}" style="width:90px">
   <input class="tbl-edit" id="apS" type="number" placeholder="${L('Share %', 'حصة %')}" style="width:90px">
   <button class="btn btn-sm btn-navy" onclick="if(!$('apN').value.trim()){toast(L('Platform name required','اسم المنصة مطلوب'),'bad')}else{STATE.apps.push({n:$('apN').value.trim(),comm:+$('apC').value||20,mkt:+$('apM').value||0,share:+$('apS').value||10});render();toast(L('Platform added — blended rate updated','تمت إضافة المنصة — حُدّث المعدّل المدمج'))}">${L('+ Add platform', '+ إضافة منصة')}</button></div>
  <div class="alert warn" style="margin-top:12px"><span>◆</span><div>${L('Blended platform cost:', 'تكلفة المنصات المدمجة:')} <b>${pct(blendedAppRate() * 100)}</b> ${L('of delivery revenue. Items with delivery net margin < 25% should use a delivery-specific price.', 'من إيرادات التوصيل. الأصناف التي هامش توصيلها الصافي أقل من 25% يُفضّل أن تستخدم سعراً خاصاً بالتوصيل.')}</div></div></div>`;
};

// ── Cost Allocation ───────────────────────────────────────────
PAGES.alloc = () => {
  if (!STATE.menu.length) return emptyMenuState();
  const U = totalUnits();
  const pools = [[L('Rent', 'الإيجار'), STATE.rent], [L('Government fees', 'الرسوم الحكومية'), govMonthly()], [L('Utilities (incl. elec/water out of rent)', 'المرافق (شاملاً كهرباء/ماء خارج الإيجار)'), hiddenGroup('Utilities') + utilMonthly()], [L('Extra fees & fines', 'رسوم وغرامات إضافية'), xfeesMonthly()], [L('Technology', 'التقنية'), hiddenGroup('Technology')], [L('Marketing', 'التسويق'), hiddenGroup('Marketing')], [L('Operations & finance', 'العمليات والمالية'), hiddenGroup('Operations') + hiddenGroup('Finance')], [L('Shrinkage & waste', 'الهدر والفاقد'), hiddenGroup('Shrinkage')]];
  const mx = Math.max(...pools.map(p => p[1]));
  return `<div class="card"><h4>${L('Cost allocation method', 'طريقة توزيع التكاليف')}</h4>
  <p class="note" style="margin-bottom:12px">${L('Overhead pools allocate by <b>revenue share</b>. Labor allocates by station minutes; delivery by each item delivery share × blended platform rate; ingredient waste at ', 'مجمعات المصاريف تُوزّع حسب <b>حصة الإيرادات</b>. العمالة حسب دقائق المحطة؛ والتوصيل حسب حصة توصيل كل صنف × معدّل المنصات المدمج؛ وهدر المكونات بنسبة ')}${STATE.wastePct ?? 4}${L('% of materials.', '% من المواد.')}</p>
  <table><tr><th>${L('Pool', 'المجمع')}</th><th class="num">${L('Monthly (SAR)', 'شهري (ر.س)')}</th><th style="width:38%"></th><th class="num">${L('Avg / dish', 'المتوسط / صنف')}</th></tr>
  ${pools.map(p => `<tr><td>${p[0]}</td><td class="num">${fmt(Math.round(p[1]))}</td><td><div class="bartrack"><i style="width:${p[1] / mx * 100}%"></i></div></td><td class="num">${SAR2(p[1] / U)}</td></tr>`).join('')}
  <tr><td>${L('Rent (edit)', 'الإيجار (تعديل)')}</td><td class="num" colspan="3"><input class="tbl-edit" type="number" value="${STATE.rent}" onchange="STATE.rent=+this.value;render();toast(L('Rent allocation updated','تم تحديث توزيع الإيجار'))"> ${L('SAR / month', 'ر.س / شهر')}</td></tr>
  <tr><td>${L('Ingredient waste % (edit)', 'نسبة هدر المكونات % (تعديل)')}</td><td class="num" colspan="3"><input class="tbl-edit" type="number" step="0.5" value="${STATE.wastePct ?? 4}" onchange="STATE.wastePct=+this.value;render();toast(L('Waste % updated — all recipes recosted','تم تحديث نسبة الهدر — أُعيد حساب كل الوصفات'))"> ${L('% of materials per dish', '% من المواد لكل صنف')}</td></tr></table></div>`;
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
  const pl = [[L('Revenue', 'الإيرادات'), t.rev, 1], [L('Cost of goods (ingredients)', 'تكلفة البضاعة (المكونات)'), -t.ingT], [L('Packaging', 'التغليف'), -packT], [L('Waste & shrinkage', 'الهدر والفاقد'), -wasteT],
    [L('— Gross profit', '— إجمالي الربح'), t.rev - t.ingT - packT - wasteT, 1], [L('Labor (fully loaded)', 'العمالة (محمّلة بالكامل)'), -t.labor], [L('Delivery commissions', 'عمولات التوصيل'), -delT],
    [L('Operating expenses', 'المصاريف التشغيلية'), -opex], [L('Utilities (elec/water out of rent)', 'المرافق (كهرباء/ماء خارج الإيجار)'), -utilMonthly()], [L('Extra fees & fines', 'رسوم وغرامات إضافية'), -xfeesMonthly()],
    [L('Rent', 'الإيجار'), -t.rent], [L('Government & compliance', 'الحكومية والامتثال'), -t.gov], [L('— Net profit', '— صافي الربح'), t.net, 1]];
  return `<div class="grid g2">
  <div class="card"><h4>${L('Live P&L', 'قائمة الدخل المباشرة')} <span class="note">${L('month-to-date · updates with every edit & invoice', 'منذ بداية الشهر · تتحدث مع كل تعديل وفاتورة')}</span></h4>
   <table>${pl.map(r => `<tr style="${r[2] ? 'font-weight:700' : ''}"><td>${r[0]}</td><td class="num ${r[1] < 0 ? '' : 'up'}">${r[1] < 0 ? '(' + fmt(Math.round(-r[1])) + ')' : fmt(Math.round(r[1]))}</td></tr>`).join('')}</table>
   <p class="note" style="margin-top:8px">${L('Net margin', 'الهامش الصافي')} ${pct(t.net / t.rev * 100)} ${L('of revenue.', 'من الإيرادات.')}</p></div>
  <div class="card"><h4>${L('Budgets', 'الميزانيات')} <span class="note">${L('live tracking — set your targets', 'تتبّع مباشر — اضبط أهدافك')}</span></h4>
   <div class="grid g2">
    <div class="field"><label>${L('Food cost target %', 'هدف تكلفة الطعام %')}</label><input type="number" value="${B.food}" onchange="STATE.budget.food=+this.value;render()"></div>
    <div class="field"><label>${L('Labor cost target %', 'هدف تكلفة العمالة %')}</label><input type="number" value="${B.labor}" onchange="STATE.budget.labor=+this.value;render()"></div></div>
   <table><tr><th>${L('Metric', 'المؤشر')}</th><th class="num">${L('Actual', 'الفعلي')}</th><th class="num">${L('Target', 'الهدف')}</th><th>${L('Status', 'الحالة')}</th></tr>
    <tr><td>${L('Food cost %', 'تكلفة الطعام %')}</td><td class="num">${pct(t.foodPct)}</td><td class="num">${B.food}%</td><td><span class="tag ${t.foodPct <= B.food ? 'ok' : 'bad'}">${t.foodPct <= B.food ? L('On budget', 'ضمن الميزانية') : L('Over by ', 'تجاوز ') + pct(t.foodPct - B.food)}</span></td></tr>
    <tr><td>${L('Labor cost %', 'تكلفة العمالة %')}</td><td class="num">${pct(t.laborPct)}</td><td class="num">${B.labor}%</td><td><span class="tag ${t.laborPct <= B.labor ? 'ok' : 'bad'}">${t.laborPct <= B.labor ? L('On budget', 'ضمن الميزانية') : L('Over by ', 'تجاوز ') + pct(t.laborPct - B.labor)}</span></td></tr>
    <tr><td>${L('Prime cost %', 'التكلفة الأولية %')}</td><td class="num">${pct(t.primePct)}</td><td class="num">${B.food + B.labor}%</td><td><span class="tag ${t.primePct <= B.food + B.labor ? 'ok' : 'warn'}">${t.primePct <= B.food + B.labor ? L('On budget', 'ضمن الميزانية') : L('Watch', 'انتبه')}</span></td></tr></table></div></div>
  <div class="grid g2" style="margin-top:13px">
  <div class="card"><h4>${L('Category profitability', 'ربحية التصنيفات')}</h4><table><tr><th>${L('Category', 'التصنيف')}</th><th class="num">${L('Revenue', 'الإيرادات')}</th><th class="num">${L('Profit', 'الربح')}</th><th class="num">${L('Margin', 'الهامش')}</th></tr>
   ${byCat.map(x => `<tr><td>${esc(x.c)}</td><td class="num">${fmt(x.rev)}</td><td class="num ${x.pr < 0 ? 'down' : ''}">${fmt(Math.round(x.pr))}</td><td class="num">${pct(x.pr / x.rev * 100)}</td></tr>`).join('')}</table></div>
  <div class="card"><h4>${L('Item ranking by total profit', 'ترتيب الأصناف حسب إجمالي الربح')}</h4><table><tr><th>${L('Item', 'الصنف')}</th><th class="num">${L('Profit / mo', 'الربح / شهر')}</th><th>${L('Class', 'الفئة')}</th></tr>
   ${[...STATE.menu].sort((a, b) => margin(b) * b.sold - margin(a) * a.sold).map(m => `<tr><td>${esc(m.n)}</td><td class="num ${margin(m) < 0 ? 'down' : ''}">${fmt(Math.round(margin(m) * m.sold))}</td><td><span class="tag ${mCls(m)}">${mLabelD(m)}</span></td></tr>`).join('')}</table></div></div>`;
};

// ── Reports ───────────────────────────────────────────────────
PAGES.reports = () => `<div class="grid g3">
 ${[[L('Owner monthly pack', 'حزمة المالك الشهرية'), L('P&L summary, menu engineering, repricing list', 'ملخص قائمة الدخل، هندسة القائمة، قائمة إعادة التسعير')], [L('Accountant export', 'تصدير المحاسب'), L('Cost layers per item, allocations, GOSI & gov fees', 'طبقات التكلفة لكل صنف، التوزيعات، التأمينات والرسوم الحكومية')], [L('Investor snapshot', 'لمحة المستثمر'), L('Unit economics, break-even, growth levers', 'اقتصاديات الوحدة، نقطة التعادل، روافع النمو')], [L('Food cost report', 'تقرير تكلفة الطعام'), L('Ingredient usage, price changes, variance', 'استهلاك المكونات، تغيّر الأسعار، الفروقات')], [L('Delivery channel report', 'تقرير قنوات التوصيل'), L('Per-app profitability & commission impact', 'ربحية كل تطبيق وأثر العمولة')], [L('Compliance cost report', 'تقرير تكاليف الامتثال'), L('All Saudi fees with cycles & renewals', 'كل الرسوم السعودية بدوراتها وتجديداتها')]].map((r, i) => `
 <div class="card"><h4>${r[0]}</h4><p class="note" style="margin-bottom:12px">${r[1]}.</p>
 <div id="rep${i}"><button class="btn btn-line btn-sm" onclick="genReport(${i})">${L('Generate', 'إنشاء')}</button></div></div>`).join('')}</div>`;

function genReport(i) {
  const el = $('rep' + i); el.innerHTML = `<div class="spinner"></div><p class="note" style="text-align:center;margin-top:8px">${L('Compiling from live data…', 'يجري التجميع من البيانات المباشرة…')}</p>`;
  setTimeout(() => {
    const t = totals();
    el.innerHTML = `<div class="alert good"><span>✓</span><div>${L('Report ready: revenue ', 'التقرير جاهز: الإيرادات ')}${SAR(t.rev)}${L(', net ', '، الصافي ')}${SAR(Math.round(t.net))}${L(', food cost ', '، تكلفة الطعام ')}${pct(t.foodPct)}${L(', ', '، ')}${STATE.menu.filter(m => marginPct(m) < 20).length}${L(' items flagged for repricing.', ' صنف موسوم لإعادة التسعير.')}</div></div>
    <button class="btn btn-sm btn-line" onclick="toast(L('PDF export is wired to the backend in production','تصدير PDF موصول بالخادم في الإنتاج'))">${L('Download PDF', 'تنزيل PDF')}</button>`;
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
  const utilCard = (key, label, arLabel) => {
    const u = STATE[key];
    return `<div class="card"><h4>${L(label, arLabel)} <span class="tag ${u.included ? 'ok' : 'warn'}">${u.included ? L('in rent', 'ضمن الإيجار') : L('billed separately', 'فاتورة منفصلة')}</span></h4>
     <div class="field"><label>${L('Is ' + label.toLowerCase() + ' included in the rent?', 'هل ' + arLabel + ' مشمولة في الإيجار؟')}</label>
      <select onchange="STATE.${key}.included=(this.value==='yes');render();toast(L('${label} setting updated — costs recalculated','تم تحديث إعداد ${arLabel} — أُعيد حساب التكاليف'))">
       <option value="yes" ${u.included ? 'selected' : ''}>${L('Yes — included in rent', 'نعم — مشمولة في الإيجار')}</option>
       <option value="no" ${!u.included ? 'selected' : ''}>${L('No — separate monthly bill', 'لا — فاتورة شهرية منفصلة')}</option></select></div>
     ${u.included
       ? `<p class="note">${L(label + ' is part of the rent above, so it is not added again as a separate cost.', arLabel + ' جزء من الإيجار أعلاه، لذلك لا تُضاف مرة أخرى كتكلفة منفصلة.')}</p>`
       : `<div class="field"><label>${L(label + ' bill (SAR / month)', 'فاتورة ' + arLabel + ' (ر.س / شهر)')}</label><input type="number" min="0" value="${u.amt}" onchange="STATE.${key}.amt=Math.max(0,+this.value);render();toast(L('${label} bill updated — all dishes recosted','تم تحديث فاتورة ${arLabel} — أُعيد حساب كل الأصناف'))"></div>`}
    </div>`;
  };
  return `<div class="grid g4">
   ${kpi(L('Monthly rent', 'الإيجار الشهري'), SAR(STATE.rent))}
   ${kpi(L('Lease length', 'مدة العقد'), rt.months + L(' mo', ' شهر'), monthLabel(rt.start) + ' →')}
   ${kpi(L('Total lease value', 'إجمالي قيمة العقد'), SAR(total), STATE.rent + ' × ' + rt.months)}
   ${kpi(L('Remaining', 'المتبقي'), remaining + L(' mo', ' شهر'), elapsed + L(' mo elapsed', ' شهر مضت'), remaining <= 2 ? 'down' : '')}</div>
  <div class="card" style="margin-top:13px"><h4>${L('Rent contract', 'عقد الإيجار')} <span class="note">${L('rent can change — update it and every dish recosts', 'الإيجار قابل للتغيير — حدّثه ليُعاد حساب كل صنف')}</span></h4>
   <div class="grid g3">
    <div class="field"><label>${L('Monthly rent (SAR)', 'الإيجار الشهري (ر.س)')}</label><input type="number" min="0" value="${STATE.rent}" onchange="STATE.rent=Math.max(0,+this.value);render();toast(L('Rent updated — all dishes recosted','تم تحديث الإيجار — أُعيد حساب كل الأصناف'))"></div>
    <div class="field"><label>${L('Lease duration (months)', 'مدة العقد (أشهر)')}</label><input type="number" min="1" value="${rt.months}" onchange="STATE.rentTerm.months=Math.max(1,+this.value||1);render()"></div>
    <div class="field"><label>${L('Lease start month', 'شهر بداية العقد')}</label><input type="month" value="${rt.start}" onchange="STATE.rentTerm.start=this.value||curMonth();render()"></div></div>
   ${remaining <= 2 ? `<div class="alert warn"><span>◆</span><div>${L('Lease ends in', 'ينتهي العقد خلال')} <b>${remaining} ${L('month(s)', 'شهر')}</b> (${monthLabel(nextMonthsFrom(rt.start, rt.months))}). ${L('Budget for renewal or a rent change.', 'خصّص ميزانية للتجديد أو لتغيير الإيجار.')}</div></div>` : ''}
   <p class="note">${L('Rent is allocated to each dish by revenue share. Changing the monthly figure updates margins everywhere instantly; the lease length & start are used for renewal alerts and total-commitment tracking.', 'يُوزّع الإيجار على كل صنف حسب حصته من الإيرادات. تغيير المبلغ الشهري يُحدّث الهوامش فوراً في كل مكان؛ وتُستخدم مدة العقد وبدايته لتنبيهات التجديد وتتبع إجمالي الالتزام.')}</p></div>
  <div class="grid g2" style="margin-top:13px">${utilCard('elec', 'Electricity', 'الكهرباء')}${utilCard('water', 'Water', 'المياه')}</div>
  <div class="card" style="margin-top:13px"><h4>${L('How this flows into costing', 'كيف يدخل هذا في حساب التكلفة')}</h4>
   <p class="note">${L('Electricity and water marked <b>“billed separately”</b> are added to the Utilities cost pool and spread across dishes by revenue share. Marked <b>“in rent”</b>, they contribute nothing extra — the rent already covers them — so nothing is double-counted.', 'الكهرباء والمياه المحددة كـ<b>«فاتورة منفصلة»</b> تُضاف إلى مجمع تكاليف المرافق وتُوزّع على الأصناف حسب حصة الإيرادات. أما المحددة كـ<b>«ضمن الإيجار»</b> فلا تضيف شيئاً — الإيجار يغطيها — فلا يتكرر الاحتساب.')}</p>
   <div class="grid g3" style="margin-top:8px">
    ${kpi(L('Electricity in costing', 'الكهرباء في التكلفة'), e.included ? L('SAR 0', '0 ر.س') : SAR(e.amt), e.included ? L('covered by rent', 'مغطاة بالإيجار') : L('per month', 'شهرياً'))}
    ${kpi(L('Water in costing', 'المياه في التكلفة'), w.included ? L('SAR 0', '0 ر.س') : SAR(w.amt), w.included ? L('covered by rent', 'مغطاة بالإيجار') : L('per month', 'شهرياً'))}
    ${kpi(L('Utilities pool total', 'إجمالي مجمع المرافق'), SAR(hiddenGroup('Utilities') + utilMonthly()), L('incl. gas & other', 'شاملاً الغاز وغيره'))}</div></div>`;
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
   ${kpi(L('Recurring / month', 'متكرر / شهر'), SAR(xfeesRecurring()), monthly.length + L(' line(s)', ' بند'))}
   ${kpi(L('One-time this month', 'لمرة واحدة هذا الشهر'), SAR(xfeesOneTime()), oneNow.length + L(' charge(s)', ' رسم'))}
   ${kpi(L('Total into costs', 'الإجمالي في التكاليف'), SAR(Math.round(xfeesMonthly())), L('this evaluation month', 'شهر التقييم الحالي'))}
   ${kpi(L('Unpaid one-time', 'غير مدفوعة لمرة واحدة'), unpaid.length, unpaid.length ? SAR(unpaid.reduce((a, f) => a + f.amt, 0)) + L(' outstanding', ' مستحقة') : L('all settled', 'كلها مسددة'), unpaid.length ? 'down' : 'up')}</div>
  <div class="card" style="margin-top:13px"><h4>${L('Evaluation month', 'شهر التقييم')} <span class="note">${L('one-time fines only count in their own month', 'الغرامات لمرة واحدة تُحتسب في شهرها فقط')}</span></h4>
   <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
    <button class="btn btn-sm btn-line" onclick="changeEvalMonth(-1)">← ${monthLabel(prevMonth(em))}</button>
    <b style="font-family:var(--mono);font-size:16px">${monthLabel(em)}${isCur ? L(' · current', ' · الحالي') : ''}</b>
    <button class="btn btn-sm btn-line" onclick="changeEvalMonth(1)">${monthLabel(nextMonth(em))} →</button>
    <button class="btn btn-sm btn-navy" style="margin-inline-start:auto" onclick="closeMonth()">${L('Close month & roll forward →', 'إغلاق الشهر والانتقال للتالي →')}</button></div>
   <p class="note" style="margin-top:9px">${L('A one-time fee (e.g. a municipality fine) is charged in the month you log it. Once you roll forward, it is automatically dropped from the next month cost — paid or not it no longer inflates future margins.', 'الرسم لمرة واحدة (مثل غرامة بلدية) يُحتسب في الشهر الذي تسجله فيه. وبمجرد الانتقال للشهر التالي يُسقط تلقائياً من تكلفة الشهر التالي — سواء سُدّد أو لا، لن يضخّم الهوامش مستقبلاً.')}</p>
   ${unpaid.length ? `<div class="alert warn"><span>◆</span><div><b>${unpaid.length} ${L('one-time fee(s) still marked unpaid', 'رسم لمرة واحدة لا يزال غير مدفوع')}</b> ${L('for', 'لشهر')} ${monthLabel(em)} — ${L('settle them or they stay flagged when you roll the month forward.', 'سدّدها أو ستبقى موسومة عند الانتقال للشهر التالي.')}</div></div>` : ''}</div>
  <div class="card" style="margin-top:13px"><h4>${L('Fee lines', 'بنود الرسوم')}</h4>
   <table><tr><th>${L('Fee', 'الرسم')}</th><th>${L('Type', 'النوع')}</th><th>${L('Month', 'الشهر')}</th><th class="num">${L('SAR / mo', 'ر.س / شهر')}</th><th>${L('Paid', 'مدفوع')}</th><th></th></tr>
   ${list.length ? list.map(f => `<tr>
     <td><input class="tbl-edit" style="width:210px;text-align:start" value="${esc(f.n)}" onchange="xfeeField(${q(f.id)},'n',this.value)">${f.note ? `<div class="note">${esc(f.note)}</div>` : ''}</td>
     <td><span class="tag ${f.type === 'monthly' ? 'info' : 'warn'}">${f.type === 'monthly' ? L('Recurring', 'متكرر') : L('One-time', 'لمرة واحدة')}</span></td>
     <td class="note">${f.type === 'monthly' ? L('every month', 'كل شهر') : monthLabel(f.month)}</td>
     <td class="num"><input class="tbl-edit" type="number" value="${f.amt}" onchange="xfeeField(${q(f.id)},'amt',Math.max(0,+this.value));render();toast(L('Extra fees updated — dishes recosted','تم تحديث الرسوم الإضافية — أُعيد حساب الأصناف'))"></td>
     <td>${f.type === 'onetime' ? `<input type="checkbox" ${f.paid ? 'checked' : ''} onchange="xfeeField(${q(f.id)},'paid',this.checked)">` : '<span class="note">—</span>'}</td>
     <td><button class="btn btn-sm btn-danger" onclick="delXfee(${q(f.id)})">✕</button></td></tr>`).join('')
   : `<tr><td colspan="6" class="note">${L('No extra fees yet — add one below or pick a common Saudi fee.', 'لا توجد رسوم إضافية بعد — أضف واحداً بالأسفل أو اختر رسماً سعودياً شائعاً.')}</td></tr>`}</table>
   <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;align-items:center">
    <input class="tbl-edit" id="xfN" style="width:230px;text-align:start" placeholder="${L('e.g. Civil Defense violation fine', 'مثال: غرامة مخالفة الدفاع المدني')}">
    <select class="tbl-edit" id="xfT" style="width:130px;text-align:start"><option value="monthly">${L('Recurring', 'متكرر')}</option><option value="onetime">${L('One-time / fine', 'لمرة واحدة / غرامة')}</option></select>
    <input class="tbl-edit" id="xfA" type="number" placeholder="${L('SAR', 'ر.س')}" style="width:100px">
    <button class="btn btn-sm btn-navy" onclick="addXfee()">${L('+ Add fee', '+ إضافة رسم')}</button></div></div>
  <div class="card" style="margin-top:13px"><h4>${L('Common Saudi restaurant fees', 'رسوم مطاعم سعودية شائعة')} <span class="note">${L('tap to add — typical amounts, fully editable', 'انقر للإضافة — مبالغ تقريبية قابلة للتعديل')}</span></h4>
   <div style="display:flex;gap:7px;flex-wrap:wrap">
    ${XFEE_SUGGESTIONS.map((s, i) => `<button class="chip" onclick="addXfeeSuggestion(${i})">${esc(L(s[0], s[3]))} <span class="note">· ${s[1] === 'onetime' ? L('fine', 'غرامة') : L('/mo', '/شهر')} · ~${fmt(s[2])}</span></button>`).join('')}</div>
   <p class="note" style="margin-top:10px">${L('Fine ranges from Saudi municipal regulations: hygiene SAR 200–4,000 · health certificate SAR 200–2,000 · staff hygiene SAR 400–2,000 · operating without a licence SAR 10,000–50,000. Amounts are starting points — set your actual figure.', 'نطاقات الغرامات من الأنظمة البلدية السعودية: النظافة 200–4,000 ر.س · الشهادة الصحية 200–2,000 ر.س · النظافة الشخصية للموظفين 400–2,000 ر.س · العمل بدون ترخيص 10,000–50,000 ر.س. المبالغ نقاط بداية — اضبط رقمك الفعلي.')}</p></div>`;
};
const prevMonth = ym => { let [y, m] = ym.split('-').map(Number); m--; if (m < 1) { m = 12; y--; } return `${y}-${String(m).padStart(2, '0')}`; };
function xfeeField(id, k, v) { const f = STATE.xfees.find(x => x.id === id); if (!f) return; f[k] = v; if (k === 'paid') render(); }
function changeEvalMonth(dir) { STATE.evalMonth = dir > 0 ? nextMonth(STATE.evalMonth) : prevMonth(STATE.evalMonth); render(); }
function closeMonth() {
  const em = STATE.evalMonth;
  const unpaid = STATE.xfees.filter(f => f.type === 'onetime' && f.month === em && !f.paid);
  STATE.evalMonth = nextMonth(em);
  render();
  toast(L(`Rolled forward to ${monthLabel(STATE.evalMonth)} — one-time charges from ${monthLabel(em)} dropped`, `تم الانتقال إلى ${monthLabel(STATE.evalMonth)} — أُسقطت رسوم مرة واحدة من ${monthLabel(em)}`) + (unpaid.length ? L(` (${unpaid.length} still unpaid)`, ` (${unpaid.length} غير مدفوعة)`) : ''), unpaid.length ? 'bad' : 'good');
}
function addXfee() {
  const n = $('xfN').value.trim(), type = $('xfT').value, amt = +$('xfA').value;
  if (!n || !amt) { toast(L('Name and amount required', 'الاسم والمبلغ مطلوبان'), 'bad'); return; }
  STATE.xfees.push({ id: uid(), n, amt, type, paid: false, month: type === 'onetime' ? STATE.evalMonth : null, note: '' });
  render(); toast(L('Extra fee added — dishes recosted', 'تمت إضافة رسم إضافي — أُعيد حساب الأصناف'));
}
function addXfeeSuggestion(i) {
  const s = XFEE_SUGGESTIONS[i];
  STATE.xfees.push({ id: uid(), n: L(s[0], s[3]), amt: s[2], type: s[1], paid: false, month: s[1] === 'onetime' ? STATE.evalMonth : null, note: '' });
  render(); toast(L(`"${s[0]}" added — edit the amount to your actual figure`, `تمت إضافة "${s[3]}" — عدّل المبلغ إلى رقمك الفعلي`));
}
function delXfee(id) { STATE.xfees = STATE.xfees.filter(f => f.id !== id); render(); toast(L('Fee removed', 'تم حذف الرسم'), 'bad'); }

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
    [L('Delivery commission (blended)', 'عمولة التوصيل (المدمجة)'), pct(yourDel), `${MARKET_FALLBACK.delivery.lo}–${MARKET_FALLBACK.delivery.hi}%`, yourDel > MARKET_FALLBACK.delivery.hi ? 'down' : 'up'],
    [L('VAT (ZATCA)', 'ضريبة القيمة المضافة (زاتكا)'), '15%', '15%', ''],
    [L('Electricity tariff', 'تعرفة الكهرباء'), STATE.elec && !STATE.elec.included ? SAR(STATE.elec.amt) + L('/mo', '/شهر') : L('in rent', 'ضمن الإيجار'), `${MARKET_FALLBACK.electricity.lo}–${MARKET_FALLBACK.electricity.hi}${L(' SAR/kWh', ' ر.س/ك.و.س')}`, ''],
    [L('Water tariff', 'تعرفة المياه'), STATE.water && !STATE.water.included ? SAR(STATE.water.amt) + L('/mo', '/شهر') : L('in rent', 'ضمن الإيجار'), `${MARKET_FALLBACK.water.lo}–${MARKET_FALLBACK.water.hi}${L(' SAR/m³', ' ر.س/م³')}`, ''],
    [L('F&B rent benchmark', 'مرجع إيجار المطاعم'), SAR(STATE.rent) + L('/mo', '/شهر'), `${fmt(MARKET_FALLBACK.rentSqm.lo)}–${fmt(MARKET_FALLBACK.rentSqm.hi)}${L(' SAR/m²/yr', ' ر.س/م²/سنة')}`, ''],
  ];
  const ingRows = STATE.ings.map(i => ({ i, band: marketBandFor(i.n) })).filter(x => x.band);
  return `<div class="card"><h4>${L('Live Market Rates', 'أسعار السوق المباشرة')} <span class="tag gold">${L('Market Agent', 'وكيل السوق')}</span> ${mk ? `<span class="tag ${mk.source === 'live' ? 'ok' : 'warn'}">${mk.source === 'live' ? L('live', 'مباشر') : L('offline est.', 'تقدير غير متصل')} · ${mk.at}</span>` : `<span class="tag info">${L('not fetched yet', 'لم تُجلب بعد')}</span>`}</h4>
   <p class="note" style="margin-bottom:12px">${L('Benchmarks current market fees & ingredient prices for a', 'يقارن رسوم السوق وأسعار المكونات الحالية لـ')} <b>${esc(STATE.org.type)}</b> ${L('in', 'في')} <b>${esc(STATE.org.city)}</b> ${L('against your numbers.', 'بأرقامك.')} ${mk ? '' : L('Click refresh to pull live rates.', 'انقر تحديث لجلب الأسعار المباشرة.')}</p>
   <button class="btn btn-navy btn-sm" id="mkBtn" onclick="refreshMarket()">${L('⟳ Refresh live rates', '⟳ تحديث الأسعار المباشرة')}</button>
   <div id="mkTerm" class="note" style="margin-top:10px">${mk ? esc(mk.note || '') : L('Uses live web data server-side; falls back to Saudi market estimates if offline.', 'يستخدم بيانات الويب المباشرة من الخادم؛ ويعود لتقديرات السوق السعودي عند عدم التوفر.')}</div></div>
  <div class="card" style="margin-top:13px"><h4>${L('Fees & utilities benchmark', 'مرجع الرسوم والمرافق')}</h4>
   <table><tr><th>${L('Item', 'البند')}</th><th class="num">${L('Your rate', 'سعرك')}</th><th class="num">${L('Market range', 'نطاق السوق')}</th><th></th></tr>
   ${benchRows.map(r => `<tr><td>${r[0]}</td><td class="num ${r[3]}">${r[1]}</td><td class="num note">${r[2]}</td>
    <td>${r[3] === 'down' ? `<span class="tag bad">${L('above market', 'أعلى من السوق')}</span>` : r[3] === 'up' ? `<span class="tag ok">${L('competitive', 'تنافسي')}</span>` : ''}</td></tr>`).join('')}</table>
   <p class="note" style="margin-top:9px">${L('Delivery commission is the biggest controllable fee — anything above', 'عمولة التوصيل أكبر رسم يمكن التحكم به — أي قيمة أعلى من')} ${MARKET_FALLBACK.delivery.hi}% ${L('blended is worth renegotiating or steering to direct orders.', 'مدمجة تستحق إعادة التفاوض أو التوجيه للطلبات المباشرة.')}</p></div>
  <div class="card" style="margin-top:13px"><h4>${L('Ingredient price benchmark', 'مرجع أسعار المكونات')} <span class="note">${L(ingRows.length + ' of your ingredients matched to market categories', ingRows.length + ' من مكوناتك مطابقة لفئات السوق')}</span></h4>
   ${ingRows.length ? `<table><tr><th>${L('Ingredient', 'المكوّن')}</th><th class="num">${L('Your price', 'سعرك')}</th><th class="num">${L('Market /kg', 'السوق /كجم')}</th><th>${L('Status', 'الحالة')}</th><th></th></tr>
   ${ingRows.map(({ i, band }) => {
     const mid = (band.lo + band.hi) / 2, over = i.price > band.hi, under = i.price < band.lo;
     return `<tr><td>${esc(i.n)}</td><td class="num ${over ? 'down' : 'up'}">${SAR2(i.price)}</td>
      <td class="num note">${band.lo}–${band.hi}</td>
      <td><span class="tag ${over ? 'bad' : under ? 'info' : 'ok'}">${over ? L('above market', 'أعلى من السوق') : under ? L('below range', 'أقل من النطاق') : L('in range', 'ضمن النطاق')}</span></td>
      <td>${over ? `<button class="btn btn-sm btn-line" onclick="updIngPrice(${q(i.id)},${mid.toFixed(2)})">${L('Set to market', 'ضبط على السوق')} ${SAR2(mid)}</button>` : ''}</td></tr>`;
   }).join('')}</table>` : `<p class="note">${L('No ingredients matched the market categories yet. Import or add ingredients (fish, chicken, rice, dairy…) to see benchmarks.', 'لا توجد مكونات مطابقة لفئات السوق بعد. استورد أو أضف مكونات (سمك، دجاج، أرز، ألبان…) لرؤية المراجع.')}</p>`}</div>`;
};
async function refreshMarket() {
  const btn = $('mkBtn'), term = $('mkTerm');
  if (btn) { btn.disabled = true; btn.textContent = L('⟳ Fetching live rates…', '⟳ جلب الأسعار المباشرة…'); }
  try {
    const res = await fetch('/api/market-rates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org: STATE.org, ingredients: STATE.ings.slice(0, 30).map(i => i.n), rent: STATE.rent, blendedDelivery: blendedAppRate() * 100 }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Market service error');
    STATE.market = { source: 'live', at: new Date().toLocaleDateString(isAr() ? 'ar-SA' : 'en-US'), note: data.note || L('Live market rates retrieved.', 'تم جلب أسعار السوق المباشرة.'), ingredients: data.ingredients || marketIngredients() };
    toast(L('Live market rates updated', 'تم تحديث أسعار السوق المباشرة'));
  } catch (err) {
    STATE.market = { source: 'offline', at: new Date().toLocaleDateString(isAr() ? 'ar-SA' : 'en-US'), note: (isAr() ? 'تقديرات السوق السعودي غير المتصلة' : MARKET_FALLBACK.note) + ' (' + err.message + ')', ingredients: marketIngredients() };
    toast(L('Live service unavailable — showing Saudi market estimates', 'الخدمة المباشرة غير متاحة — عرض تقديرات السوق السعودي'), 'bad');
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
    toast(L('Exported ' + rows.length + ' ingredients to Excel', 'تم تصدير ' + rows.length + ' مكوّن إلى Excel'));
    return;
  }
  // CSV fallback (opens in Excel) with UTF-8 BOM
  const head = ['Name', 'Supplier', 'Unit', 'Price (SAR)', 'Yield %'];
  const csvEsc = v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const csv = '﻿' + [head.join(','), ...rows.map(r => head.map(h => csvEsc(r[h])).join(','))].join('\n');
  downloadBlob(csv, fname + '_ingredients.csv', 'text/csv;charset=utf-8');
  toast(L('Exported ' + rows.length + ' ingredients (CSV)', 'تم تصدير ' + rows.length + ' مكوّن (CSV)'));
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
  toast(L(`Import done — ${added} added, ${updated} price(s) updated`, `تم الاستيراد — أُضيف ${added}، حُدّث ${updated} سعر`) + (recosted.size ? L(`, ${recosted.size} recipe(s) recosted`, `، أُعيد حساب ${recosted.size} وصفة`) : ''));
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
        if (!objs.length) { toast(L('No "name + price" rows found in the sheet', 'لم يُعثر على صفوف "اسم + سعر" في الورقة'), 'bad'); return; }
        applyIngredientRows(objs);
      } catch (err) { toast(L('Could not read Excel file: ', 'تعذّر قراءة ملف Excel: ') + err.message, 'bad'); }
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = e => {
      const objs = rowsToObjects(parseCSV(String(e.target.result)));
      if (!objs.length) { toast(L('No "name + price" rows found', 'لم يُعثر على صفوف "اسم + سعر"'), 'bad'); return; }
      applyIngredientRows(objs);
    };
    reader.readAsText(file);
  }
  input.value = '';
}
function ingredientImportModal() {
  modal(`<h3>${L('Import ingredients', 'استيراد المكونات')}</h3>
   <div class="field"><label>${L('Paste rows — one per line as <b>name, price, unit</b> (or tab/space separated)', 'الصق الصفوف — صف لكل سطر بصيغة <b>الاسم، السعر، الوحدة</b> (أو مفصولة بمسافة/جدولة)')}</label>
    <textarea id="igPaste" rows="6" placeholder="Hamour fish, 62, kg&#10;Shrimp peeled 58 kg&#10;Rice, 7.5"></textarea></div>
   <button class="btn btn-navy btn-sm" onclick="importIngredientsPaste()">${L('Import pasted rows', 'استيراد الصفوف الملصقة')}</button>
   <div class="or">${L('or pull from a supplier price-list URL', 'أو اجلب من رابط قائمة أسعار مورّد')}</div>
   <div class="field"><label>${L('Supplier price-list / website URL', 'رابط قائمة أسعار المورّد / الموقع')}</label><input id="igUrl" placeholder="https://supplier.sa/pricelist"></div>
   <div class="term" id="igTerm" style="height:90px;margin-bottom:14px">${L('› Idle.', '› في وضع الانتظار.')}</div>
   <div style="display:flex;gap:9px;justify-content:flex-end">
    <button class="btn btn-line" onclick="closeModal()">${L('Close', 'إغلاق')}</button>
    <button class="btn btn-gold" onclick="importIngredientsUrl()">${L('▶ Extract from URL', '▶ استخراج من الرابط')}</button></div>`);
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
  if (!objs.length) { toast(L('No "name + price" rows detected', 'لم تُكتشف صفوف "اسم + سعر"'), 'bad'); return; }
  closeModal(); applyIngredientRows(objs);
}
async function importIngredientsUrl() {
  const url = ($('igUrl') && $('igUrl').value.trim()) || '';
  const term = $('igTerm');
  if (!url.startsWith('http')) { toast(L('Enter a valid URL', 'أدخل رابطاً صحيحاً'), 'bad'); return; }
  if (term) term.innerHTML = L(`› Fetching <b>${esc(url)}</b> server-side…`, `› يجري جلب <b>${esc(url)}</b> من الخادم…`);
  try {
    const res = await fetch('/api/fetch-prices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Extraction failed');
    const objs = (data.items || []).map(it => ({ n: it.name, price: it.price, unit: (it.unit || '').toLowerCase(), sup: it.supplier || '', yield: NaN })).filter(o => o.n && o.price > 0);
    if (!objs.length) { if (term) term.innerHTML = `<span style="color:#FF9B8E">${L('✗ No priced ingredients found on that page.', '✗ لم يُعثر على مكونات مُسعّرة في تلك الصفحة.')}</span>`; return; }
    if (term) term.innerHTML = `<span class="g">✓</span> ${L(objs.length + ' ingredient(s) found — importing…', objs.length + ' مكوّن — يجري الاستيراد…')}`;
    closeModal(); applyIngredientRows(objs);
  } catch (err) {
    if (term) term.innerHTML = `<span style="color:#FF9B8E">✗ ${esc(err.message)}</span><br>${L('Tip: paste the price list text instead.', 'نصيحة: الصق نص قائمة الأسعار بدلاً من ذلك.')}`;
    toast(L('URL extraction failed: ', 'فشل الاستخراج من الرابط: ') + err.message, 'bad');
  }
}
