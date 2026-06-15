// ═══════════════════════════════════════════════════════════════
// PUBLIC PAGES — landing, features, pricing, auth pages
// Exactly as in the original HTML, extracted to its own file.
// ═══════════════════════════════════════════════════════════════

const PUB = {};

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

PUB.landing = () => `<div class="pub">${pubNav()}
 <div class="hero">
  <div>
   <div class="eyebrow">${L('Restaurant Financial Intelligence · Saudi Arabia → GCC', 'ذكاء مالي للمطاعم · السعودية ← الخليج')}</div>
   <h1>${L('Know the <em>true cost</em> of every dish on your menu.', 'اعرف <em>التكلفة الحقيقية</em> لكل طبق في قائمتك.')}</h1>
   ${isAr() ? '' : `<div class="ar">اعرف التكلفة الحقيقية لكل طبق في قائمتك — وسعّره بثقة</div>`}
   <p class="lead">${L('8 AI agents read your menu, rebuild your recipes, layer in every Saudi cost — GOSI, Balady, ZATCA, delivery commissions, hidden overheads — and tell you what to charge, what to promote, and what to remove.', '8 وكلاء ذكاء اصطناعي يقرؤون قائمتك، ويعيدون بناء وصفاتك، ويضيفون كل تكلفة سعودية — التأمينات (جوسي)، بلدي، زاتكا، عمولات التوصيل، المصاريف الخفية — ثم يخبرونك بالسعر المناسب، وما تروّج له، وما تحذفه.')}</p>
   <div style="display:flex;gap:12px;flex-wrap:wrap">
    <button class="btn btn-gold" onclick="go('signup')">${L('Start free — set up in 10 minutes', 'ابدأ مجاناً — الإعداد في 10 دقائق')}</button>
    <button class="btn btn-ghost" onclick="enterDemo()">${L('Explore demo restaurant', 'استكشف مطعم العرض التجريبي')}</button>
   </div>
   <div class="hero-stats">
    <div class="hstat"><div class="n">8</div><div class="l">${L('AI agents working for you', 'وكلاء ذكاء يعملون لأجلك')}</div></div>
    <div class="hstat"><div class="n">20+</div><div class="l">${L('Saudi government fees tracked', 'رسوم حكومية سعودية مُتتبَّعة')}</div></div>
    <div class="hstat"><div class="n">11</div><div class="l">${L('cost layers per menu item', 'طبقة تكلفة لكل صنف')}</div></div>
   </div>
  </div>
  <div class="dishcard">
   <h3>${L('Grilled Hamour', 'هامور مشوي')} <span class="price">${L('SAR 89.00', '89.00 ر.س')}</span></h3>
   <div class="sub">${L('True cost · live from the Cost Analyst Agent', 'التكلفة الحقيقية · مباشرة من وكيل تحليل التكلفة')}</div>
   ${[[L('Ingredients','المكوّنات'),92,'24.50'],[L('Direct labor','العمالة المباشرة'),24,'6.18'],[L('Delivery alloc.','حصة التوصيل'),11,'2.85'],[L('Rent alloc.','حصة الإيجار'),26,'6.84'],[L('Utilities','المرافق'),9,'2.39'],[L('Gov. fees','رسوم حكومية'),13,'3.46'],[L('Marketing','التسويق'),4,'0.94'],[L('Waste alloc.','حصة الهدر'),7,'1.64']].map((x, i) => `
   <div class="layer"><span class="lbl">${x[0]}</span><div class="bar"><i style="width:${x[1]}%;animation-delay:.${i}s"></i></div><span class="val">${x[2]}</span></div>`).join('')}
   <div class="dish-foot"><span>${L('True cost', 'التكلفة الحقيقية')} <b style="color:#fff">${L('SAR 49.62', '49.62 ر.س')}</b></span><span class="g">${L('Net margin 44.2% ✓', 'الهامش الصافي 44.2% ✓')}</span></div>
  </div>
 </div>
 <div class="pub-section"><div class="inner">
  <h2>${L('Built like a CFO. Priced like an app.', 'مبني كمدير مالي. بسعر تطبيق.')}</h2>
  <p class="sub2">${L('From AI menu extraction to break-even analysis — one system for owners who want answers, not spreadsheets.', 'من استخراج القائمة بالذكاء الاصطناعي إلى تحليل نقطة التعادل — نظام واحد للملاك الذين يريدون إجابات لا جداول.')}</p>
  <div class="grid g3">
   ${[['✦',L('AI onboarding','إعداد بالذكاء الاصطناعي'),L('Paste your website or upload a menu — agents extract items, predict recipes, and build your cost base.','الصق موقعك أو ارفع قائمة — يستخرج الوكلاء الأصناف ويتوقعون الوصفات ويبنون قاعدة تكاليفك.')],
      ['⬡',L('11-layer true costing','تكلفة حقيقية بـ11 طبقة'),L('Ingredients with yield %, labor minutes, rent, GOSI, ZATCA, delivery commissions, waste — per dish.','المكونات بنسبة الإنتاجية، دقائق العمالة، الإيجار، جوسي، زاتكا، عمولات التوصيل، الهدر — لكل طبق.')],
      ['◈',L('Pricing that defends margin','تسعير يحمي الهامش'),L('10 strategies with risk levels, including delivery-app pricing that survives 30% commissions.','10 استراتيجيات بمستويات مخاطرة، منها تسعير تطبيقات التوصيل الذي يصمد أمام عمولات 30%.')]].map(f => `
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
