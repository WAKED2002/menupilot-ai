// ═══════════════════════════════════════════════════════════════
// ROUTER — navigation, app shell, auth wiring (Supabase)
// ═══════════════════════════════════════════════════════════════

const PUBLIC = ['landing', 'features', 'pricingPub', 'login', 'signup', 'forgot', 'verify', 'orgsetup'];

function go(r) {
  if (!PUBLIC.includes(r) && r !== 'onboarding' && !STATE.authed) r = 'login';
  STATE.route = r;
  render();
  window.scrollTo(0, 0);
}

function setTheme(t) { STATE.theme = t; document.documentElement.dataset.theme = t; render(); }
function setLang(l) {
  STATE.lang = l;
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  render();
}

async function logout() {
  await DB.signOut();
  const th = STATE.theme, lg = STATE.lang;
  STATE = blankState(); STATE.theme = th; STATE.lang = lg;
  go('landing');
}

function enterDemo() {
  const th = STATE.theme, lg = STATE.lang;
  STATE = seedDemo(); STATE.theme = th; STATE.lang = lg;
  STATE._demo = true;
  go('dash');
  toast('Signed in to the demo organization');
}

function render() {
  migrate(STATE);
  const r = STATE.route;
  let html = '';
  if (PUBLIC.includes(r)) html = PUB[r]();
  else if (r === 'onboarding') html = obShell();
  else html = appShell(r);
  $('root').innerHTML = html;
  if (AFTER[r]) AFTER[r]();
}
const AFTER = {};

/* ── Auth: Supabase-backed signup / login ──────────────────── */

PUB.login = () => authShell(`
  <h3>${L('Welcome back', 'مرحباً بعودتك')}</h3><div class="sub">${L('Log in to your restaurant workspace.', 'سجّل الدخول إلى مساحة عمل مطعمك.')}</div>
  <button class="gbtn" onclick="enterDemo()"><span style="font-weight:800;color:var(--gold)">D</span> ${L('Open seeded demo workspace', 'افتح مساحة العرض التجريبي')}</button>
  <div class="or">${L('or with your account', 'أو بحسابك')}</div>
  <div class="field" id="f-lemail"><label>${L('Email', 'البريد الإلكتروني')}</label><input id="lemail" type="email" placeholder="owner@restaurant.sa"><div class="err">${L('Enter a valid email.', 'أدخل بريداً صحيحاً.')}</div></div>
  <div class="field" id="f-lpass"><label>${L('Password', 'كلمة المرور')}</label><input id="lpass" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()"><div class="err">${L('Password required.', 'كلمة المرور مطلوبة.')}</div></div>
  <button class="btn btn-navy" id="btnLogin" style="width:100%" onclick="doLogin()">${L('Log in', 'تسجيل الدخول')}</button>
  <div class="or">${L('new here?', 'جديد هنا؟')}</div>
  <button class="btn btn-line" style="width:100%" onclick="go('signup')">${L('Create an account', 'إنشاء حساب')}</button>`);

async function doLogin() {
  const email = $('lemail').value.trim().toLowerCase();
  const pass  = $('lpass').value;
  $('f-lemail').classList.toggle('bad', !email.includes('@'));
  $('f-lpass').classList.toggle('bad', !pass);
  if (!email.includes('@') || !pass) return;

  const btn = $('btnLogin');
  if (btn) { btn.disabled = true; btn.textContent = L('Signing in…', 'جارٍ تسجيل الدخول…'); }

  const { data, error } = await DB.signIn(email, pass);

  if (error) {
    if (btn) { btn.disabled = false; btn.textContent = L('Log in', 'تسجيل الدخول'); }
    toast(error.message || L('Login failed', 'فشل تسجيل الدخول'), 'bad');
    return;
  }

  // Load org state
  const { data: orgs } = await DB.getUserOrgs();
  if (orgs && orgs.length) {
    const orgState = await DB.loadOrgState(orgs[0].id);
    const th = STATE.theme, lg = STATE.lang;
    STATE = { ...blankState(), ...orgState, authed: true, verified: true, theme: th, lang: lg };
    STATE.user = { n: data.user.user_metadata?.name || email, email, role: 'Owner' };
  } else {
    // New user, no org yet
    STATE.authed = true; STATE.verified = true;
    STATE.user = { n: data.user.user_metadata?.name || email, email, role: 'Owner' };
    STATE.route = 'orgsetup';
  }

  toast(L('Welcome back, ' + STATE.user.n.split(' ')[0] + '.', 'مرحباً بعودتك، ' + STATE.user.n.split(' ')[0] + '.'));
  go(STATE.route || 'dash');
}

PUB.signup = () => authShell(`
  <h3>${L('Create your workspace', 'أنشئ مساحة عملك')}</h3><div class="sub">${L('Tell us about you and your restaurant.', 'أخبرنا عنك وعن مطعمك.')}</div>
  <div class="grid g2">
   <div class="field" id="f-sname"><label>${L('Owner name', 'اسم المالك')}</label><input id="sname" placeholder="${L('Bandar Waked', 'بندر واكد')}"><div class="err">${L('Required.', 'مطلوب.')}</div></div>
   <div class="field" id="f-semail"><label>${L('Email', 'البريد الإلكتروني')}</label><input id="semail" type="email" placeholder="you@restaurant.sa"><div class="err">${L('Valid email required.', 'بريد صحيح مطلوب.')}</div></div>
   <div class="field" id="f-srest"><label>${L('Restaurant name', 'اسم المطعم')}</label><input id="srest" placeholder="${L('Kabaila Seafood', 'كبايلا للمأكولات البحرية')}"><div class="err">${L('Required.', 'مطلوب.')}</div></div>
   <div class="field"><label>${L('City', 'المدينة')}</label><input id="scity" placeholder="${L('Riyadh', 'الرياض')}"></div>
   <div class="field"><label>${L('Country', 'الدولة')}</label><select id="scountry"><option>${L('Saudi Arabia', 'السعودية')}</option><option>${L('UAE', 'الإمارات')}</option><option>${L('Kuwait', 'الكويت')}</option><option>${L('Qatar', 'قطر')}</option><option>${L('Bahrain', 'البحرين')}</option><option>${L('Oman', 'عُمان')}</option></select></div>
   <div class="field"><label>${L('Number of branches', 'عدد الفروع')}</label><input id="sbr" type="number" value="1" min="1"></div>
  </div>
  <div class="field"><label>${L('Restaurant type', 'نوع المطعم')}</label><select id="stype">${TYPES.map(t => `<option>${t[1]}</option>`).join('')}</select></div>
  <div class="field" id="f-spass"><label>${L('Password', 'كلمة المرور')}</label><input id="spass" type="password" placeholder="${L('8+ characters', '8 أحرف أو أكثر')}"><div class="err">${L('At least 8 characters.', '8 أحرف على الأقل.')}</div></div>
  <button class="btn btn-gold" style="width:100%" onclick="doSignup()">${L('Create account →', 'إنشاء حساب ←')}</button>
  <p class="note" style="margin-top:12px;text-align:center">${L('Already have an account?', 'لديك حساب بالفعل؟')} <a href="#" onclick="go('login');return false" style="color:var(--gold);font-weight:600">${L('Log in', 'تسجيل الدخول')}</a></p>`);

async function doSignup() {
  const v = id => $(id).value.trim();
  const bad = (f, c) => { $(f).classList.toggle('bad', c); return c; };
  let e = false;
  e |= bad('f-sname', !v('sname'));
  e |= bad('f-semail', !v('semail').includes('@'));
  e |= bad('f-srest', !v('srest'));
  e |= bad('f-spass', v('spass').length < 8);
  if (e) { toast(L('Please fix the highlighted fields', 'يرجى تصحيح الحقول المُظللة'), 'bad'); return; }

  const email = v('semail').toLowerCase();
  const { data, error } = await DB.signUp(email, v('spass'), { name: v('sname') });

  if (error) { toast(error.message, 'bad'); return; }

  // Create org immediately (email confirmation disabled in Supabase for this flow)
  const { data: org, error: orgErr } = await DB.createOrg({
    name: v('srest'),
    city: v('scity') || 'Riyadh',
    country: v('scountry'),
    type: v('stype'),
    plan: 'Growth',
  });

  if (orgErr) { toast(L('Account created but org setup failed: ', 'أُنشئ الحساب لكن فشل إعداد المنشأة: ') + orgErr.message, 'bad'); return; }

  // Set branches
  const branches = Array.from({ length: +v('sbr') || 1 }, (_, i) => 'Branch ' + (i + 1));
  await DB.setBranches(org.id, branches);

  // Seed default gov fees + hidden costs + delivery apps
  await DB.bulkInsertGovFees(org.id, defaultGov());
  await DB.bulkInsertHiddenCosts(org.id, defaultHidden());
  await DB.bulkInsertDeliveryApps(org.id, [
    { n: 'HungerStation', comm: 25, mkt: 5, share: 40 },
    { n: 'Jahez', comm: 22, mkt: 3, share: 35 },
    { n: 'ToYou', comm: 20, mkt: 2, share: 25 },
  ]);
  await DB.setCategories(org.id, (TYPES.find(t => t[1] === v('stype')) || TYPES[0])[2]);

  const orgState = await DB.loadOrgState(org.id);
  const th = STATE.theme, lg = STATE.lang;
  STATE = { ...blankState(), ...orgState, authed: true, verified: true, theme: th, lang: lg };
  STATE.user = { n: v('sname'), email, role: 'Owner' };
  STATE.ob = { step: 1, src: 'paste', extracted: false };

  toast(L('Account created — welcome, ' + v('sname').split(' ')[0] + '!', 'تم إنشاء الحساب — أهلاً، ' + v('sname').split(' ')[0] + '!'));
  go('onboarding');
}

/* ── App shell ───────────────────────────────────────────────── */
const NAV = [
  ['overview', [['dash', '▦'], ['branch', '◫'], ['copilot', '✧']]],
  ['menuG', [['menu', '☰'], ['cats', '▤'], ['recipe', '⚗'], ['ing', '⬡'], ['sup', '⛟'], ['proc', '⇄'], ['inv', '▥']]],
  ['costsG', [['emp', '⬢'], ['gov', '⌂'], ['rentutil', '⌖'], ['hidden', '◌'], ['xfees', '⊘'], ['mktg', '◎'], ['apps', '➤'], ['alloc', '⊞']]],
  ['intelG', [['costing', '⬡'], ['pricing', '◈'], ['market', '◭'], ['eng', '◧'], ['scen', '∿'], ['profit', '◍'], ['reports', '▣']]],
  ['adminG', [['settings', '⚙'], ['usersP', '⊟'], ['billing', '▦']]],
];
let pops = { notif: false, user: false };

function appShell(r) {
  const t = totals();
  return `<div id="app">
  <aside class="side">
   <button class="brand" onclick="go('dash')"><span class="mark">◔</span> MenuPilot AI</button>
   ${NAV.map(([g, items]) => `<div class="navgroup">${T(g)}</div>` + items.map(([k, ic]) => `<button class="nitem ${r === k ? 'act' : ''}" onclick="go('${k}')"><span class="ic">${ic}</span> ${T(k)}</button>`).join('')).join('')}
  </aside>
  <div>
   <div class="topbar">
    <div class="searchbox"><span class="sic">⌕</span><input id="gsearch" placeholder="${T('search')}" oninput="gSearch(this.value)"><div id="sres"></div></div>
    <select class="orgsel" onchange="toast(L('Switched view: ','تم تبديل العرض: ')+this.value)"><option>${esc(STATE.org.name)}</option><option>${L('+ Add organization', '+ إضافة منشأة')}</option></select>
    <span style="flex:1"></span>
    <button class="iconbtn" title="Language" onclick="setLang(STATE.lang==='en'?'ar':'en')">${STATE.lang === 'en' ? 'ع' : 'EN'}</button>
    <button class="iconbtn" title="Theme" onclick="setTheme(STATE.theme==='light'?'dark':'light')">${STATE.theme === 'light' ? '☾' : '☀'}</button>
    <button class="iconbtn" onclick="pops.notif=!pops.notif;pops.user=false;render()">⊙${STATE.notifications.length ? '<span class="dot"></span>' : ''}</button>
    <button class="avatar" onclick="pops.user=!pops.user;pops.notif=false;render()">${esc(STATE.user.n.split(' ').map(x => x[0]).join('').slice(0, 2))}</button>
    ${pops.notif ? `<div class="pop right"><div class="ph"><b>${L('Notifications', 'الإشعارات')}</b> · ${L('agent alerts', 'تنبيهات الوكلاء')}</div>
      ${STATE.notifications.map(n => `<div class="pi"><span>${n.k === 'bad' ? '▲' : n.k === 'warn' ? '◆' : 'ℹ'}</span><div><b>${esc(n.t)}</b><small>${esc(n.m)}</small><small style="color:var(--gold)">${L(n.time + ' ago', 'منذ ' + n.time)}</small></div></div>`).join('') || `<div class="pi">${L('No notifications.', 'لا توجد إشعارات.')}</div>`}
      <button class="pi" style="color:var(--gold);font-weight:600" onclick="clearNotifs()">${L('Clear all', 'مسح الكل')}</button></div>` : ''}
    ${pops.user ? `<div class="pop right"><div class="ph"><b>${esc(STATE.user.n)}</b><br><span class="note">${esc(STATE.user.email)} · ${STATE.user.role}</span></div>
      <button class="pi" onclick="pops.user=false;go('settings')">⚙ <div>${T('settings')}</div></button>
      <button class="pi" onclick="pops.user=false;go('usersP')">⊟ <div>${T('usersP')}</div></button>
      <button class="pi" onclick="pops.user=false;go('billing')">▦ <div>${T('billing')} <small>${STATE.plan} plan</small></div></button>
      <button class="pi" style="color:var(--coral)" onclick="logout()">⏻ <div>${T('logout')}</div></button></div>` : ''}
   </div>
   <main class="main">
    <div class="pagehead"><div><h2>${T(r)}</h2><div class="crumb">${esc(STATE.org.name)} · ${esc(STATE.org.city)} · ${STATE.org.branches.length} ${L('branch(es)', 'فرع')} · ${STATE.menu.length ? SAR(t.rev) + L(' /mo', ' / شهر') : L('no sales data yet', 'لا توجد بيانات مبيعات بعد')}</div></div>
     <div style="display:flex;gap:8px;align-items:center"><span class="pill tag info">${L('SAR', 'ر.س')}</span><span class="tag ${STATE.plan === 'Growth' ? 'gold' : 'info'}">${L(STATE.plan + ' plan', 'باقة ' + STATE.plan)}</span></div></div>
    ${PAGES[r] ? PAGES[r]() : '<div class="empty"><h5>Page not found</h5></div>'}
   </main></div></div>`;
}

function gSearch(v) {
  const box = $('sres'); if (!v || v.length < 2) { box.innerHTML = ''; return; }
  const lo = v.toLowerCase();
  const hits = [...STATE.menu.filter(m => m.n.toLowerCase().includes(lo)).slice(0, 4).map(m => ['☰ ' + m.n, 'costing']),
    ...STATE.ings.filter(i => i.n.toLowerCase().includes(lo)).slice(0, 3).map(i => ['⬡ ' + i.n, 'ing']),
    ...Object.keys(I18N.en).filter(k => I18N.en[k].toLowerCase().includes(lo) && PAGES[k]).slice(0, 3).map(k => ['▦ ' + T(k), k])];
  box.innerHTML = hits.length ? `<div class="sresults">${hits.map(h => `<button onclick="$('gsearch').value='';$('sres').innerHTML='';go('${h[1]}')"><span>${esc(h[0])}</span><span class="note">${L('open', 'فتح')}</span></button>`).join('')}</div>` : '';
}

async function clearNotifs() {
  STATE.notifications = [];
  pops.notif = false;
  if (STATE._orgId) await DB.clearNotifications(STATE._orgId);
  render();
}

function emptyMenuState() {
  return `<div class="card"><div class="empty"><div class="big">☰</div><h5>${L('No menu yet', 'لا توجد قائمة بعد')}</h5>
 <p style="max-width:44ch;margin:0 auto 14px">${L('Run the Menu Extraction Agent on your website, Instagram, or a PDF menu — it builds your items, then Recipe Intelligence drafts the recipes.', 'شغّل وكيل استخراج القائمة على موقعك أو إنستغرام أو ملف PDF — يبني الأصناف، ثم يقوم وكيل ذكاء الوصفات بإعداد الوصفات.')}</p>
 <button class="btn btn-gold" onclick="STATE.ob.step=3;go('onboarding')">${L('▶ Run AI onboarding', '▶ تشغيل الإعداد الذكي')}</button></div></div>`;
}

// Auth helpers (used by pages-public.js)
function authShell(inner, head) {
  return `<div class="auth">
 <div class="auth-side"><button class="brand" onclick="go('landing')"><span class="mark">◔</span> MenuPilot AI</button>
  <h2>${head || L('Run your menu like a <em>CFO</em>.', 'أدِر قائمتك كأنك <em>مدير مالي</em>.')}</h2>
  <div class="note" style="color:#5E7682">${L('Saudi-first restaurant financial intelligence · SAR · ZATCA-aware', 'ذكاء مالي للمطاعم سعودي أولاً · ر.س · متوافق مع زاتكا')}</div></div>
 <div class="auth-panel"><div class="auth-card">${inner}</div></div></div>`;
}
