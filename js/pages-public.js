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
  <h2>${L('Eight agents. One P&L brain.', 'ثمانية وكلاء. عقل واحد لقائمة الدخل.')}</h2>
  <p class="sub2">${L('Each agent is now powered by Claude AI — not a label, not a demo. Open an account to use every one of them on your real data.', 'كل وكيل مدعوم الآن بـ Claude — ليس مجرد اسم ولا عرض. أنشئ حساباً لاستخدامهم جميعاً على بياناتك الحقيقية.')}</p>
  <div class="grid g2">
  ${[[L('Menu Extraction Agent','وكيل استخراج القائمة'),L('Reads your pasted menu text, extracts every item','يقرأ نص قائمتك الملصق، ويستخرج كل صنف'),L('Categories, items, prices, descriptions — saved into your Menu dashboard instantly.','التصنيفات والأصناف والأسعار والأوصاف — تُحفظ في لوحة قائمتك فوراً.')],
     [L('Recipe Intelligence Agent','وكيل ذكاء الوصفات'),L('Predicts ingredients from item name & cuisine using Claude','يتوقّع المكونات من اسم الصنف والمطبخ باستخدام Claude'),L('Suggested ingredients, quantities, yield % — you approve, edit, or reject.','مكونات وكميات ونسبة إنتاجية مقترحة — تعتمدها أو تعدّلها أو ترفضها.')],
     [L('Cost Analyst Agent','وكيل تحليل التكلفة'),L('Computes true cost per item, live','يحسب التكلفة الحقيقية لكل صنف مباشرة'),L('11 layers: materials, labor, packaging, utilities, rent, government, delivery, marketing, hidden, waste.','11 طبقة: المواد، العمالة، التغليف، المرافق، الإيجار، الحكومية، التوصيل، التسويق، الخفية، الهدر.')],
     [L('Pricing Strategist Agent','وكيل استراتيجية التسعير'),L('Recommends prices with risk levels + Claude rationale','يوصي بأسعار مع مستويات مخاطرة وتفسير من Claude'),L('Cost-plus, markup, competitor, value, delivery-app, combo, premium, psychological, seasonal, branch-specific.','التكلفة زائد، الترميز، المنافسين، القيمة، تطبيقات التوصيل، الكومبو، المميّز، النفسي، الموسمي، الخاص بالفرع.')],
     [L('Procurement Analyst Agent','وكيل تحليل المشتريات'),L('Invoice capture + supplier price tracking','التقاط الفواتير وتتبّع أسعار الموردين'),L('Paste invoice lines → Claude parses them → prices update → every recipe recosts.','الصق سطور الفاتورة ← يحللها Claude ← تتحدث الأسعار ← تُعاد تكلفة كل وصفة.')],
     [L('Profitability Analyst Agent','وكيل تحليل الربحية'),L('Menu engineering on autopilot','هندسة القائمة تلقائياً'),L('Stars, Puzzles, Plow Horses, Dogs — with promote / reprice / redesign / remove actions.','نجوم، ألغاز، خيول جرّارة، كلاب — مع إجراءات ترويج / إعادة تسعير / إعادة تصميم / حذف.')],
     [L('Saudi Compliance Cost Agent','وكيل تكاليف الامتثال السعودي'),L('Every government & compliance fee, editable','كل رسم حكومي وامتثال، قابل للتعديل'),L('Balady, ZATCA, Qiwa, Mudad, Muqeem, GOSI, iqama, visas, Saudization, SFDA — allocated per dish.','بلدي، زاتكا، قوى، مدد، مقيم، التأمينات، الإقامة، التأشيرات، السعودة، الغذاء والدواء — موزعة على كل صنف.')],
     [L('Restaurant CFO Agent','وكيل المدير المالي للمطعم'),L('Real Claude AI in chat — your actual numbers','ذكاء Claude حقيقي في المحادثة — أرقامك الفعلية'),L('Losing items, break-even point, +10% profit plans, supplier and delivery-app verdicts. Powered by Claude.','الأصناف الخاسرة، نقطة التعادل، خطط ربح +10%، أحكام الموردين وتطبيقات التوصيل. مدعوم بـ Claude.')]].map((a, i) => `
   <div class="card"><h4>${a[0]} <span class="tag gold">${L('Agent ', 'الوكيل ')}${'ABCDEFGH'[i]}</span></h4>
   <p style="font-size:13px;margin-bottom:8px">${a[1]}.</p><p class="note">${a[2]}</p></div>`).join('')}
  </div>
  <div style="margin-top:26px"><button class="btn btn-gold" onclick="enterDemo()">${L('Use the agents in the live demo →', 'استخدم الوكلاء في العرض المباشر ←')}</button></div>
 </div></div>${pubFoot()}</div>`;

PUB.pricingPub = () => `<div class="pub">${pubNav()}
 <div class="pub-section" style="flex:1"><div class="inner">
  <h2>${L('Simple pricing in SAR.', 'تسعير بسيط بالريال.')}</h2><p class="sub2">${L('Start free for 14 days on any plan. Cancel anytime.', 'ابدأ مجاناً 14 يوماً على أي باقة. ألغِ في أي وقت.')}</p>
  <div class="grid g3">
   ${[['Starter',299,L('1 branch','فرع واحد'),[L('1 branch','فرع واحد'),L('Menu costing & recipes','تكلفة القائمة والوصفات'),L('Menu engineering','هندسة القائمة'),L('Saudi government fee database','قاعدة الرسوم الحكومية السعودية'),L('Email support','دعم بالبريد')],false],
      ['Growth',599,L('Up to 3 branches','حتى 3 فروع'),[L('Everything in Starter','كل ما في Starter'),L('All 8 AI agents (Claude-powered)','كل الوكلاء الـ8 (مدعومون بـ Claude)'),L('Scenario simulator & break-even','محاكي السيناريوهات ونقطة التعادل'),L('Delivery app profitability','ربحية تطبيقات التوصيل'),L('Procurement price alerts','تنبيهات أسعار المشتريات'),L('Priority support','دعم ذو أولوية')],true],
      ['Enterprise',0,L('Multi-brand groups','مجموعات متعددة العلامات'),[L('Unlimited branches & brands','فروع وعلامات غير محدودة'),L('Custom cost models','نماذج تكلفة مخصصة'),L('API & POS integrations','تكاملات API ونقاط البيع'),L('Dedicated success manager','مدير نجاح مخصص'),L('SLA & onboarding team','اتفاقية مستوى خدمة وفريق إعداد')],false]].map(p => `
   <div class="card plan ${p[4] ? 'feat' : ''}"><div class="pname">${p[0]} ${p[4] ? `<span class="tag gold">${L('Most popular', 'الأكثر شيوعاً')}</span>` : ''}</div>
    <div class="pprice">${p[1] ? L('SAR ' + p[1], p[1] + ' ر.س') : L('Custom', 'مخصص')} ${p[1] ? `<span>${L('/ month / brand', '/ شهر / علامة')}</span>` : ''}</div>
    <div class="note">${p[2]}</div><ul>${p[3].map(x => `<li>${x}</li>`).join('')}</ul>
    <button class="btn ${p[4] ? 'btn-gold' : 'btn-line'}" onclick="STATE.plan='${p[0]}';go('signup')">${p[1] ? L('Choose ' + p[0], 'اختر ' + p[0]) : L('Contact sales', 'تواصل مع المبيعات')}</button></div>`).join('')}
  </div></div></div>${pubFoot()}</div>`;

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
