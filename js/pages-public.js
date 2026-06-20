// ═══════════════════════════════════════════════════════════════
// PUBLIC PAGES — landing, features, pricing, auth pages
// Exactly as in the original HTML, extracted to its own file.
// ═══════════════════════════════════════════════════════════════

const PUB = {};

// Hand-drawn line icons (1.6px stroke, currentColor) — used on the landing feature cards.
const ICON = {
  scan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/><path d="M9 9h6M9 15h4"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/><path d="m3 18 9 5 9-5"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.4 3 8.2 7 9.5 4-1.3 7-5.1 7-9.5V6l-7-3Z"/><path d="m9.2 11.8 1.9 1.9 3.7-3.7"/></svg>`,
};

// Live console output per agent (A–H) for the landing "Agent Orchestra".
function aoData() {
  return [
    ['Menu Extraction', L('Parsed 47 items across 6 categories from your menu URL.', 'استخرجت 47 صنفاً في 6 تصنيفات من رابط قائمتك.')],
    ['Recipe Intelligence', L('Predicted 11 ingredients for Grilled Hamour · 92% yield.', 'توقعت 11 مكوناً للهامور المشوي · إنتاجية 92%.')],
    ['Cost Analyst', L('True cost SAR 49.62 — all 11 layers reconciled.', 'التكلفة الحقيقية 49.62 ر.س — سُويت كل الطبقات الـ11.')],
    ['Pricing Strategist', L('Hold SAR 89 — defends 44% margin vs −30% delivery fee.', 'ثبّت 89 ر.س — يحمي هامش 44% أمام عمولة توصيل 30%.')],
    ['Procurement', L('Hamour ↑ SAR 4/kg this week → 3 recipes recosted.', 'الهامور ↑ 4 ر.س/كجم هذا الأسبوع ← أُعيد تسعير 3 وصفات.')],
    ['Profitability', L('Grilled Hamour = ★ Star · promote on delivery apps.', 'الهامور المشوي = ★ نجم · روّج له على تطبيقات التوصيل.')],
    ['Saudi Compliance', L('GOSI 11.75% · ZATCA · Balady allocated per dish.', 'جوسي 11.75% · زاتكا · بلدي موزّعة على كل طبق.')],
    ['Restaurant CFO', L('Break-even at 612 covers/mo · +10% profit plan ready.', 'نقطة التعادل عند 612 طلباً/شهر · خطة +10% ربح جاهزة.')],
  ];
}

function pubNav() {
  return `<nav class="pub-nav">
  <button class="brand" onclick="go('landing')"><span class="mark">◔</span> MenuPilot AI</button>
  <div class="links">
    <button onclick="go('features')">${L('Features', 'المزايا')}</button>
    <button onclick="go('pricingPub')">${L('Pricing', 'الأسعار')}</button>
    <button onclick="go('login')">${L('Log in', 'تسجيل الدخول')}</button>
  </div>
  <div style="display:flex;gap:9px;align-items:center">
    <button class="btn btn-ghost btn-sm" onclick="setLang(STATE.lang==='en'?'ar':'en')">${STATE.lang === 'en' ? 'العربية' : 'English'}</button>
    <button class="btn btn-ghost btn-sm" onclick="enterDemo()">${L('Live demo', 'تجربة مباشرة')}</button>
    <button class="btn btn-gold btn-sm" onclick="go('signup')">${L('Get started', 'ابدأ الآن')}</button>
  </div></nav>`;
}
function pubFoot() {
  return `<div class="pub-foot"><span>MenuPilot AI</span><span>${L('Saudi-first · SAR · ZATCA-aware · Arabic ready', 'سعودي أولاً · ر.س · متوافق مع زاتكا · جاهز للعربية')}</span></div>`;
}

// Shared editorial nav + footer (used by landing, features, pricing).
function edNav(active) {
  const lk = (k, label, route) => `<button class="${active === k ? 'on' : ''}" onclick="go('${route}')">${label}</button>`;
  return `<nav class="ed-nav">
  <button class="ed-brand" onclick="go('landing')"><span class="ed-mark">◔</span> MenuPilot <span class="ed-brand-sub">/ AI</span></button>
  <div class="ed-links">
   ${lk('agents', L('Agents', 'الوكلاء'), 'features')}
   ${lk('features', L('Features', 'المزايا'), 'features')}
   ${lk('pricing', L('Pricing', 'الأسعار'), 'pricingPub')}
   ${lk('signin', L('Sign in', 'تسجيل الدخول'), 'login')}
  </div>
  <div class="ed-nav-act">
   <button class="ed-ghost" onclick="setLang(STATE.lang==='en'?'ar':'en')">${STATE.lang === 'en' ? 'العربية' : 'English'}</button>
   <button class="ed-pill-dark" onclick="go('signup')">${L('Get started', 'ابدأ الآن')} <span>→</span></button>
  </div>
 </nav>`;
}
function edFoot() {
  return `<footer class="ed-foot">
  <span class="ed-brand"><span class="ed-mark">◔</span> MenuPilot AI</span>
  <span>${L('Saudi-first · SAR · ZATCA-aware · Arabic ready', 'سعودي أولاً · ر.س · متوافق مع زاتكا · جاهز للعربية')}</span>
 </footer>`;
}

PUB.landing = () => `<div class="ed-land">
 ${edNav('')}

 <header class="ed-hero">
  <div class="ed-hero-left">
   <div class="ed-eyebrow"><i></i>${L('MENUPILOT AI · BUILT FOR SAUDI RESTAURANTS', 'منيوبايلوت · مصمم لمطاعم السعودية')}</div>
   <h1 class="ed-h1">${L('The operating system for <em>profitable</em> <mark>restaurants</mark>.', 'نظام التشغيل <em>للمطاعم</em> <mark>المربحة</mark>.')}</h1>
   <p class="ed-lead">${L('MenuPilot helps owners cost, price, and protect margin — across every dish, every branch, every delivery app. Eight AI agents. One conversational surface. One financial brain.', 'يساعد منيوبايلوت الملاك على حساب التكلفة والتسعير وحماية الهامش — لكل طبق وكل فرع وكل تطبيق توصيل. ثمانية وكلاء ذكاء. سطح محادثة واحد. عقل مالي واحد.')}</p>
   <div class="ed-cta-row">
    <button class="ed-pill-dark lg" onclick="go('signup')">${L('Start free', 'ابدأ مجاناً')} <span>→</span></button>
    <button class="ed-pill-ghost lg" onclick="enterDemo()">▷ ${L('Explore the demo', 'استكشف العرض')}</button>
   </div>
   <div class="ed-trust">
    <span class="ed-trust-lbl">${L('SAUDI-READY', 'جاهز للسعودية')}</span>
    <div class="ed-trust-row">${['ZATCA', 'GOSI', 'Balady', 'Qiwa', 'Mudad', 'SFDA'].map(b => `<span>${b}</span>`).join('')}</div>
   </div>
  </div>

  <div class="ed-hero-right">
   <div class="ed-panel">
    <div class="ed-panel-h"><span class="ed-mono">◴ menupilot/session/hamour</span><span class="ed-live"><i></i>${L('live', 'مباشر')}</span></div>
    <div class="ed-panel-row">
     <div class="ed-avatar">C</div>
     <div><b>${L('Cost Analyst Agent', 'وكيل تحليل التكلفة')}</b><span>${L('Rebuilding Grilled Hamour — 11 cost layers', 'إعادة بناء الهامور المشوي — 11 طبقة تكلفة')}</span></div>
    </div>
    <div class="ed-panel-grid">
     ${[[L('RECIPE', 'الوصفة'), L('11 ingredients', '11 مكوناً')], [L('MENU PRICE', 'سعر القائمة'), 'SAR 89.00'], [L('COMPETITORS', 'المنافسون'), L('312 nearby', '312 قريباً')], [L('OWNER MARGIN', 'هامش المالك'), '44.2%']].map(g => `<div class="ed-pg-cell"><span>${g[0]}</span><b>${g[1]}</b></div>`).join('')}
    </div>
    <div class="ed-panel-checks">
     ${[L('Ingredient yields verified', 'تم التحقق من إنتاجية المكونات'), L('GOSI + ZATCA allocated per plate', 'توزيع جوسي وزاتكا لكل طبق'), L('Delivery −30% commission modeled', 'احتساب عمولة توصيل −30%')].map(c => `<div class="ed-check">✓ ${c}</div>`).join('')}
    </div>
   </div>
   <div class="ed-float-dark">
    <span class="ed-fd-lbl">${L('TRUE COST / PLATE', 'التكلفة الحقيقية / طبق')}</span>
    <b class="ed-fd-num">SAR 49.62</b>
    <svg class="ed-spark" viewBox="0 0 120 34" preserveAspectRatio="none"><polyline points="0,26 16,22 32,24 48,15 64,18 80,9 96,12 120,5" fill="none" stroke="#D4A53C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
   </div>
   <div class="ed-float-sm"><b>44%</b><span>${L('net margin', 'هامش صافٍ')}</span></div>
  </div>
 </header>

 <section class="ed-problem"><div class="ed-wrap ed-problem-grid">
  <div class="ed-problem-l reveal">
   <div class="ed-eyebrow dark"><i></i>${L('THE MARGIN PROBLEM', 'مشكلة الهامش')}</div>
   <h2 class="ed-h2">${L('Hidden costs bleed you <em>quietly</em>.', 'التكاليف الخفية تنزفك <em>بصمت</em>.')}</h2>
   <p class="ed-sub">${L('It never shows on one dish. You feel it in the quarter that fell short, the branch that never quite turned a profit, the price you never dared to raise.', 'لا تشعر بها في طبق واحد. تشعر بها في الربع الذي خاب، والفرع الذي لم يربح، والسعر الذي لم تجرؤ على رفعه.')}</p>
  </div>
  <div class="ed-problem-r">
   ${[['73', '%', L('Owners price by gut', 'الملاك يسعّرون بالحدس'), L('Most menus are priced on instinct, not true cost — and margin leaks invisibly, plate by plate.', 'تُسعّر معظم القوائم بالحدس لا بالتكلفة الحقيقية — ويتسرب الهامش بصمت، طبقاً بعد طبق.')], ['11', '', L('Cost layers per dish', 'طبقة تكلفة لكل طبق'), L('Ingredients, labor, rent, GOSI, ZATCA, delivery, waste — most never make it into the price.', 'المكونات، العمالة، الإيجار، جوسي، زاتكا، التوصيل، الهدر — معظمها لا يدخل في السعر أبداً.')], ['30', '%', L('Delivery commission', 'عمولة التوصيل'), L('Aggregator fees quietly turn your best sellers into your biggest losers unless pricing accounts for them.', 'تُحوّل عمولات التطبيقات أفضل أصنافك إلى أكبر خسائرك ما لم يحتسبها التسعير.'), '−']].map((s, i) => `
   <div class="ed-statrow reveal" style="transition-delay:${(i * 0.08).toFixed(2)}s">
    <div class="ed-stat-n">${s[4] || ''}<span data-count="${s[0]}"${s[1] ? ` data-suffix="${s[1]}"` : ''}>0</span></div>
    <div class="ed-stat-tx"><b>${s[2]}</b><p>${s[3]}</p></div>
   </div>`).join('')}
  </div>
 </div></section>

 <section class="ed-agents"><div class="ed-wrap">
  <div class="ed-agents-h reveal">
   <div class="ed-eyebrow dark"><i></i>${L('EIGHT SPECIALIST AGENTS', 'ثمانية وكلاء متخصصين')}</div>
   <h2 class="ed-h2">${L('Pre-built. <em>Yours to direct.</em>', 'جاهزة. <em>وأنت توجّهها.</em>')}</h2>
  </div>
  <div class="ed-agent-grid">
   ${[[L('ANALYSIS', 'تحليل'), 'C', L('Cost Analyst', 'تحليل التكلفة'), L('DISHES COSTED', 'أطباق محسوبة'), '12402', true], [L('INTAKE', 'إدخال'), 'A', L('Menu Extraction', 'استخراج القائمة'), L('ITEMS PARSED', 'أصناف مُستخرجة'), '8210', false], [L('RECIPES', 'وصفات'), 'B', L('Recipe Intelligence', 'ذكاء الوصفات'), L('RECIPES BUILT', 'وصفات مبنية'), '1901', false], [L('PRICING', 'تسعير'), 'D', L('Pricing Strategist', 'استراتيجية التسعير'), L('PRICES SET', 'أسعار محددة'), '2710', false], [L('SUPPLY', 'توريد'), 'E', L('Procurement', 'المشتريات'), L('INVOICES READ', 'فواتير مقروءة'), '640', false], [L('MENU', 'قائمة'), 'F', L('Profitability', 'الربحية'), L('ITEMS RANKED', 'أصناف مُصنّفة'), '6901', false], [L('COMPLIANCE', 'امتثال'), 'G', L('Saudi Compliance', 'الامتثال السعودي'), L('FEES TRACKED', 'رسوم مُتتبَّعة'), '3204', false], [L('ADVISORY', 'استشارة'), 'H', L('Restaurant CFO', 'المدير المالي'), L('QUESTIONS ANSWERED', 'أسئلة مُجابة'), '5530', false]].map((a, i) => `
   <button class="ed-acard${a[5] ? ' feat' : ''} reveal" style="transition-delay:${(i % 4 * 0.06).toFixed(2)}s" onclick="enterDemo()">
    <div class="ed-acard-top"><span class="ed-acard-cat">${a[0]}</span><span class="ed-acard-tag">${L('AGENT', 'الوكيل')} ${a[1]}</span></div>
    <div class="ed-acard-name">${a[2]}</div>
    <div class="ed-acard-foot"><div><span>${a[3]}</span><b data-count="${a[4]}">0</b></div><span class="ed-acard-go">↗</span></div>
   </button>`).join('')}
  </div>
 </div></section>

 <section class="ed-dark"><div class="ed-wrap ed-dark-grid">
  <div class="ed-dark-l">
   <div class="ed-eyebrow"><i></i>${L('TEAM SURFACE', 'سطح الفريق')}</div>
   <h2 class="ed-h2 light">${L('Built for <em>operators</em>, not spreadsheets.', 'مبني <em>للمشغّلين</em>، لا للجداول.')}</h2>
   <p class="ed-sub light">${L('MenuPilot sits between your kitchen and your P&L. Owners decide, managers execute, and the agents keep every number current overnight.', 'يقع منيوبايلوت بين مطبخك وقائمة دخلك. الملاك يقررون، المدراء ينفذون، والوكلاء يبقون كل رقم محدّثاً ليلاً.')}</p>
   <div class="ed-dark-checks">
    ${[[L('Shared cost base across branches', 'قاعدة تكلفة مشتركة بين الفروع'), L('Every pricing decision becomes searchable, auditable context.', 'كل قرار تسعير يصبح سياقاً قابلاً للبحث والتدقيق.')], [L('Roles, permissions, audit', 'الأدوار والصلاحيات والتدقيق'), L('Approvals scoped to teams, branches, and brands.', 'موافقات محددة للفرق والفروع والعلامات.')], [L('Real Claude agents, not labels', 'وكلاء Claude حقيقيون، لا مجرد أسماء'), L('Eight agents reason over your actual numbers — in Arabic and English.', 'ثمانية وكلاء يحللون أرقامك الفعلية — بالعربية والإنجليزية.')]].map(c => `
    <div class="ed-dcheck"><span class="ed-dcheck-i">✓</span><div><b>${c[0]}</b><p>${c[1]}</p></div></div>`).join('')}
   </div>
  </div>
  <div class="ed-dark-r">
   <div class="ed-dash">
    <div class="ed-dash-h"><span class="ed-mono">${L('Margin overview', 'نظرة الهامش')}</span><span class="ed-chip">${L('Synced', 'مُزامن')}</span></div>
    <div class="ed-dash-bars">${[42, 61, 38, 74, 55, 83, 69].map((h, i) => `<i style="height:${h}%;animation-delay:${(i * 0.08).toFixed(2)}s"></i>`).join('')}</div>
    <div class="ed-dash-foot"><div><span>${L('Avg. net margin', 'متوسط الهامش الصافي')}</span><b>41.8%</b></div><span class="ed-chip gold">ZATCA ✓</span></div>
   </div>
   <div class="ed-dash-float">${L('Pricing approved · 3 branches', 'تم اعتماد التسعير · 3 فروع')}</div>
  </div>
 </div></section>

 <section class="ed-bigcta"><div class="ed-wrap reveal">
  <h2 class="ed-h1 center">${L('Stop guessing. <mark>Start pricing like a CFO.</mark>', 'توقّف عن التخمين. <mark>سعّر كمدير مالي.</mark>')}</h2>
  <p class="ed-sub center">${L('Set up your first menu in about 10 minutes — free for 14 days, no card required.', 'جهّز أول قائمة في نحو 10 دقائق — مجاناً 14 يوماً، دون بطاقة.')}</p>
  <div class="ed-cta-row center">
   <button class="ed-pill-dark lg" onclick="go('signup')">${L('Get started free', 'ابدأ مجاناً')} <span>→</span></button>
   <button class="ed-pill-ghost lg" onclick="go('pricingPub')">${L('See pricing', 'اطّلع على الأسعار')}</button>
  </div>
 </div></section>

 ${edFoot()}
</div>`;

// Landing-page effects: count-up numbers (supports decimals, prefix/suffix) +
// scroll-reveal. Registered as AFTER.landing in router.js (runs after DOM is in place).
function landingFX() {
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('fx-on');

  document.querySelectorAll('[data-count]').forEach(el => {
    const raw = el.dataset.count, target = parseFloat(raw);
    const suf = el.dataset.suffix || '', pre = el.dataset.prefix || '';
    const dec = (raw.split('.')[1] || '').length;
    const fmt = v => pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
    if (reduce) { el.textContent = fmt(target); return; }
    let cur = 0; const inc = target / 34;
    const t = setInterval(() => { cur += inc; if (cur >= target) { cur = target; clearInterval(t); } el.textContent = fmt(cur); }, 26);
  });

  const reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((ents) => ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(el => io.observe(el));
  }
}

PUB.features = () => `<div class="ed-land">
 ${edNav('agents')}
 <header class="ed-pagehead"><div class="ed-wrap">
  <div class="ed-eyebrow"><i></i>${L('EIGHT SPECIALIST AGENTS', 'ثمانية وكلاء متخصصين')}</div>
  <h1 class="ed-h1">${L('Eight agents. <mark>One P&L brain.</mark>', 'ثمانية وكلاء. <mark>عقل واحد لقائمة الدخل.</mark>')}</h1>
  <p class="ed-lead">${L('Each agent is powered by Claude — not a label, not a demo. Together they read your menu, rebuild recipes, layer in every Saudi cost, and price every plate on your real data.', 'كل وكيل مدعوم بـ Claude — ليس مجرد اسم ولا عرض. معاً يقرؤون قائمتك، ويعيدون بناء الوصفات، ويضيفون كل تكلفة سعودية، ويسعّرون كل طبق على بياناتك الحقيقية.')}</p>
 </div></header>
 <section class="ed-fsec"><div class="ed-wrap">
  <div class="ed-fgrid">
  ${[[L('INTAKE', 'إدخال'), 'A', L('Menu Extraction', 'استخراج القائمة'), L('Reads your pasted menu text and extracts every item', 'يقرأ نص قائمتك الملصق ويستخرج كل صنف'), L('Categories, items, prices, descriptions — saved into your Menu dashboard instantly.', 'التصنيفات والأصناف والأسعار والأوصاف — تُحفظ في لوحة قائمتك فوراً.')],
     [L('RECIPES', 'وصفات'), 'B', L('Recipe Intelligence', 'ذكاء الوصفات'), L('Predicts ingredients from item name and cuisine using Claude', 'يتوقّع المكونات من اسم الصنف والمطبخ باستخدام Claude'), L('Suggested ingredients, quantities, yield % — you approve, edit, or reject.', 'مكونات وكميات ونسبة إنتاجية مقترحة — تعتمدها أو تعدّلها أو ترفضها.')],
     [L('ANALYSIS', 'تحليل'), 'C', L('Cost Analyst', 'تحليل التكلفة'), L('Computes the true cost per item, live', 'يحسب التكلفة الحقيقية لكل صنف مباشرة'), L('11 layers: materials, labor, packaging, utilities, rent, government, delivery, marketing, hidden, waste.', '11 طبقة: المواد، العمالة، التغليف، المرافق، الإيجار، الحكومية، التوصيل، التسويق، الخفية، الهدر.')],
     [L('PRICING', 'تسعير'), 'D', L('Pricing Strategist', 'استراتيجية التسعير'), L('Recommends prices with risk levels and a Claude rationale', 'يوصي بأسعار مع مستويات مخاطرة وتفسير من Claude'), L('Cost-plus, markup, competitor, value, delivery-app, combo, premium, psychological, seasonal, branch-specific.', 'التكلفة زائد، الترميز، المنافسين، القيمة، تطبيقات التوصيل، الكومبو، المميّز، النفسي، الموسمي، الخاص بالفرع.')],
     [L('SUPPLY', 'توريد'), 'E', L('Procurement Analyst', 'تحليل المشتريات'), L('Invoice capture and supplier price tracking', 'التقاط الفواتير وتتبّع أسعار الموردين'), L('Paste invoice lines, Claude parses them, prices update, and every recipe recosts.', 'الصق سطور الفاتورة، يحللها Claude، تتحدث الأسعار، وتُعاد تكلفة كل وصفة.')],
     [L('MENU', 'قائمة'), 'F', L('Profitability Analyst', 'تحليل الربحية'), L('Menu engineering on autopilot', 'هندسة القائمة تلقائياً'), L('Stars, Puzzles, Plow Horses, Dogs — with promote, reprice, redesign, and remove actions.', 'نجوم، ألغاز، خيول جرّارة، كلاب — مع إجراءات ترويج وإعادة تسعير وإعادة تصميم وحذف.')],
     [L('COMPLIANCE', 'امتثال'), 'G', L('Saudi Compliance', 'الامتثال السعودي'), L('Every government and compliance fee, editable', 'كل رسم حكومي وامتثال، قابل للتعديل'), L('Balady, ZATCA, Qiwa, Mudad, Muqeem, GOSI, iqama, visas, Saudization, SFDA — allocated per dish.', 'بلدي، زاتكا، قوى، مدد، مقيم، التأمينات، الإقامة، التأشيرات، السعودة، الغذاء والدواء — موزعة على كل صنف.')],
     [L('ADVISORY', 'استشارة'), 'H', L('Restaurant CFO', 'المدير المالي'), L('Real Claude AI in chat, on your actual numbers', 'ذكاء Claude حقيقي في المحادثة، على أرقامك الفعلية'), L('Losing items, break-even point, +10% profit plans, supplier and delivery-app verdicts.', 'الأصناف الخاسرة، نقطة التعادل، خطط ربح +10%، أحكام الموردين وتطبيقات التوصيل.')]].map((a, i) => `
   <div class="ed-fcard reveal" style="transition-delay:${(i % 2 * 0.06).toFixed(2)}s">
    <div class="ed-fcard-top"><span class="ed-fcard-cat">${a[0]}</span><span class="ed-fcard-tag">${L('AGENT', 'الوكيل')} ${a[1]}</span></div>
    <h3 class="ed-fcard-name">${a[2]}</h3>
    <p class="ed-fcard-lead">${a[3]}.</p>
    <p class="ed-fcard-note">${a[4]}</p>
   </div>`).join('')}
  </div>
  <div class="ed-cta-row" style="margin-top:36px"><button class="ed-pill-dark lg" onclick="enterDemo()">${L('Use the agents in the live demo', 'استخدم الوكلاء في العرض المباشر')} <span>→</span></button></div>
 </div></section>
 ${edFoot()}
</div>`;

PUB.pricingPub = () => `<div class="ed-land">
 ${edNav('pricing')}
 <header class="ed-pagehead"><div class="ed-wrap">
  <div class="ed-eyebrow"><i></i>${L('PRICING', 'الأسعار')}</div>
  <h1 class="ed-h1">${L('Simple pricing, <mark>in SAR.</mark>', 'تسعير بسيط، <mark>بالريال.</mark>')}</h1>
  <p class="ed-lead">${L('Start free for 14 days on any plan. No card required. Cancel anytime.', 'ابدأ مجاناً 14 يوماً على أي باقة. دون بطاقة. ألغِ في أي وقت.')}</p>
 </div></header>
 <section class="ed-fsec"><div class="ed-wrap">
  <div class="ed-plan-grid">
   ${[['Starter', 299, L('1 branch', 'فرع واحد'), [L('1 branch', 'فرع واحد'), L('Menu costing and recipes', 'تكلفة القائمة والوصفات'), L('Menu engineering', 'هندسة القائمة'), L('Saudi government fee database', 'قاعدة الرسوم الحكومية السعودية'), L('Email support', 'دعم بالبريد')], false],
      ['Growth', 599, L('Up to 3 branches', 'حتى 3 فروع'), [L('Everything in Starter', 'كل ما في Starter'), L('All 8 AI agents (Claude-powered)', 'كل الوكلاء الـ8 (مدعومون بـ Claude)'), L('Scenario simulator and break-even', 'محاكي السيناريوهات ونقطة التعادل'), L('Delivery app profitability', 'ربحية تطبيقات التوصيل'), L('Procurement price alerts', 'تنبيهات أسعار المشتريات'), L('Priority support', 'دعم ذو أولوية')], true],
      ['Enterprise', 0, L('Multi-brand groups', 'مجموعات متعددة العلامات'), [L('Unlimited branches and brands', 'فروع وعلامات غير محدودة'), L('Custom cost models', 'نماذج تكلفة مخصصة'), L('API and POS integrations', 'تكاملات API ونقاط البيع'), L('Dedicated success manager', 'مدير نجاح مخصص'), L('SLA and onboarding team', 'اتفاقية مستوى خدمة وفريق إعداد')], false]].map(p => `
   <div class="ed-plan${p[4] ? ' feat' : ''} reveal">
    ${p[4] ? `<span class="ed-plan-badge">${L('Most popular', 'الأكثر شيوعاً')}</span>` : ''}
    <div class="ed-plan-name">${p[0]}</div>
    <div class="ed-plan-price">${p[1] ? L('SAR ' + p[1], p[1] + ' ر.س') : L('Custom', 'مخصص')}${p[1] ? `<span>${L('/ mo / brand', '/ شهر / علامة')}</span>` : ''}</div>
    <div class="ed-plan-note">${p[2]}</div>
    <ul class="ed-plan-feats">${p[3].map(x => `<li>${x}</li>`).join('')}</ul>
    <button class="${p[4] ? 'ed-pill-dark' : 'ed-pill-ghost'} lg ed-plan-btn" onclick="STATE.plan='${p[0]}';go('signup')">${p[1] ? L('Choose ' + p[0], 'اختر ' + p[0]) : L('Contact sales', 'تواصل مع المبيعات')}${p[4] ? ' <span>→</span>' : ''}</button>
   </div>`).join('')}
  </div>
 </div></section>
 ${edFoot()}
</div>`;

PUB.forgot = () => authShell(`
  <h3>${L('Reset password', 'إعادة تعيين كلمة المرور')}</h3><div class="sub">${L('Enter your email — we will send a reset link.', 'أدخل بريدك — سنرسل رابط إعادة التعيين.')}</div>
  <div class="field" id="f-femail"><label>${L('Email', 'البريد الإلكتروني')}</label><input id="femail" type="email" placeholder="owner@restaurant.sa"><div class="err">${L('Valid email required.', 'بريد صحيح مطلوب.')}</div></div>
  <button class="btn btn-navy" style="width:100%" onclick="doReset()">${L('Send reset link', 'إرسال رابط التعيين')}</button>
  <div class="or"></div><button class="btn btn-line" style="width:100%" onclick="go('login')">${L('Back to login', 'العودة لتسجيل الدخول')}</button>`);

async function doReset() {
  const e = $('femail').value.trim().toLowerCase();
  $('f-femail').classList.toggle('bad', !e.includes('@'));
  if (!e.includes('@')) return;
  // Supabase handles the reset email
  const { error } = await sb.auth.resetPasswordForEmail(e, {
    redirectTo: window.location.origin + '/reset',
  });
  if (error) { toast(error.message, 'bad'); return; }
  toast(L('Reset link sent — check your email.', 'تم إرسال رابط التعيين — تحقق من بريدك.'));
  go('login');
}

PUB.verify = () => authShell(`
  <h3>${L('Check your email', 'تحقق من بريدك')}</h3>
  <div class="sub">${L('We sent a confirmation link to', 'أرسلنا رابط تأكيد إلى')} <b>${esc(STATE.pendingSignup?.email || (isAr() ? 'بريدك' : 'your email'))}</b>. ${L('Click it to verify your account, then log in.', 'انقر عليه لتأكيد حسابك، ثم سجّل الدخول.')}</div>
  <button class="btn btn-navy" style="width:100%;margin-top:18px" onclick="go('login')">${L('Go to login', 'الذهاب لتسجيل الدخول')}</button>`);

PUB.orgsetup = () => authShell(`
  <h3>${L('Almost there', 'اقتربت')}</h3><div class="sub">${L('Your account was created. Log in to finish setting up your restaurant workspace.', 'تم إنشاء حسابك. سجّل الدخول لإكمال إعداد مساحة عمل مطعمك.')}</div>
  <button class="btn btn-gold" style="width:100%;margin-top:18px" onclick="go('login')">${L('Log in now →', 'سجّل الدخول الآن ←')}</button>`);
