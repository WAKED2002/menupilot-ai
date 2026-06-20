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
  if (window.lucide) lucide.createIcons();
}
const AFTER = {};
AFTER.landing = () => { try { landingFX(); } catch (e) { /* effects are non-critical */ } };
// Same count-up + scroll-reveal effects on the other editorial public pages.
AFTER.features = AFTER.landing;
AFTER.pricingPub = AFTER.landing;
AFTER.login = AFTER.landing;
AFTER.signup = AFTER.landing;

/* ── Auth: Supabase-backed signup / login ──────────────────── */

PUB.login = () => authShell(`
  <h2 class="ed-auth2-h">${L('Welcome back', 'مرحباً بعودتك')}</h2>
  <p class="ed-auth2-sub">${L('Need an account?', 'تحتاج حساباً؟')} <a href="#" onclick="go('signup');return false">${L('Sign up', 'أنشئ حساباً')}</a></p>
  <div class="field" id="f-lemail"><label>${L('Email', 'البريد الإلكتروني')}</label><input id="lemail" type="email" placeholder="owner@restaurant.sa"><div class="err">${L('Enter a valid email.', 'أدخل بريداً صحيحاً.')}</div></div>
  <div class="field" id="f-lpass"><label>${L('Password', 'كلمة المرور')}</label><input id="lpass" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()"><div class="err">${L('Password required.', 'كلمة المرور مطلوبة.')}</div></div>
  <div class="ed-auth2-row"><a href="#" class="ed-auth2-link" onclick="go('forgot');return false">${L('Forgot password?', 'نسيت كلمة المرور؟')}</a></div>
  <button class="ed-auth2-btn" id="btnLogin" onclick="doLogin()">${L('Log in', 'تسجيل الدخول')}</button>
  <div class="ed-auth2-or">${L('OR', 'أو')}</div>
  <div class="ed-auth2-social">
   <button class="ed-soc" onclick="toast(L('Facebook sign-in is coming soon','تسجيل الدخول عبر فيسبوك قريباً'))"><span class="ed-soc-ic fb">f</span> ${L('Continue with Facebook', 'المتابعة عبر فيسبوك')}</button>
   <button class="ed-soc" onclick="loginWithGoogle()"><span class="ed-soc-ic gg">G</span> ${L('Continue with Google', 'المتابعة عبر Google')}</button>
  </div>
  <button class="ed-auth2-demo" onclick="enterDemo()">${L('Or open the seeded demo workspace →', 'أو افتح مساحة العرض التجريبي ←')}</button>`);

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

async function loginWithGoogle() {
  const { error } = await DB.signInWithGoogle();
  // On success the browser redirects to Google, so we only reach here on error.
  if (error) toast(error.message || L('Google sign-in unavailable', 'تسجيل الدخول عبر Google غير متاح'), 'bad');
}

// Provision a starter org for a user who authenticated (e.g. via Google) but
// has none yet — mirrors the seeding doSignup() does, so OAuth users land in a
// working workspace and continue to onboarding. Returns the loaded org state.
async function provisionOrgForUser(user) {
  const name = user.user_metadata?.name || user.user_metadata?.full_name || (user.email || '').split('@')[0];
  const { data: org, error } = await DB.createOrg({ name: (name || 'My') + "'s Restaurant", city: 'Riyadh', country: 'Saudi Arabia', type: TYPES[0][1], plan: 'Growth' });
  if (error || !org) return null;
  await DB.setBranches(org.id, ['Branch 1']);
  await DB.bulkInsertGovFees(org.id, defaultGov());
  await DB.bulkInsertHiddenCosts(org.id, defaultHidden());
  await DB.bulkInsertDeliveryApps(org.id, [
    { n: 'HungerStation', comm: 25, mkt: 5, share: 40 },
    { n: 'Jahez', comm: 22, mkt: 3, share: 35 },
    { n: 'ToYou', comm: 20, mkt: 2, share: 25 },
  ]);
  await DB.setCategories(org.id, TYPES[0][2]);
  return await DB.loadOrgState(org.id);
}

// Multi-step "Create an account" — 3 steps: email → basic info → password.
// Values persist in STATE.su across re-renders so steps can be navigated freely.
PUB.signup = () => {
  const su = STATE.su || (STATE.su = { step: 1, country: 'Saudi Arabia', branches: 1, type: TYPES[0][1] });
  const st = su.step;
  let body = '';
  if (st === 1) {
    body = `
   <div class="field" id="f-su-email"><label>${L("What's your email?", 'ما هو بريدك؟')}</label><input id="su-email" type="email" value="${esc(su.email || '')}" placeholder="${L('Enter your email address', 'أدخل بريدك الإلكتروني')}" oninput="STATE.su.email=this.value" onkeydown="if(event.key==='Enter')suNext()"><div class="err">${L('Enter a valid email.', 'أدخل بريداً صحيحاً.')}</div></div>
   <button class="ed-auth2-btn" onclick="suNext()">${L('Next', 'التالي')}</button>
   <div class="ed-auth2-or">${L('OR', 'أو')}</div>
   <div class="ed-auth2-social">
    <button class="ed-soc" onclick="toast(L('Facebook sign-up is coming soon','التسجيل عبر فيسبوك قريباً'))"><span class="ed-soc-ic fb">f</span> ${L('Sign up with Facebook', 'التسجيل عبر فيسبوك')}</button>
    <button class="ed-soc" onclick="loginWithGoogle()"><span class="ed-soc-ic gg">G</span> ${L('Sign up with Google', 'التسجيل عبر Google')}</button>
   </div>`;
  } else if (st === 2) {
    body = `
   <div class="grid g2">
    <div class="field" id="f-su-name"><label>${L('Owner name', 'اسم المالك')}</label><input id="su-name" value="${esc(su.name || '')}" oninput="STATE.su.name=this.value" placeholder="${L('Bandar Waked', 'بندر واكد')}"><div class="err">${L('Required.', 'مطلوب.')}</div></div>
    <div class="field" id="f-su-rest"><label>${L('Restaurant name', 'اسم المطعم')}</label><input id="su-rest" value="${esc(su.rest || '')}" oninput="STATE.su.rest=this.value" placeholder="${L('Kabaila Seafood', 'كبايلا')}"><div class="err">${L('Required.', 'مطلوب.')}</div></div>
    <div class="field"><label>${L('City', 'المدينة')}</label><input value="${esc(su.city || '')}" oninput="STATE.su.city=this.value" placeholder="${L('Riyadh', 'الرياض')}"></div>
    <div class="field"><label>${L('Branches', 'الفروع')}</label><input type="number" min="1" value="${esc(su.branches || 1)}" oninput="STATE.su.branches=this.value"></div>
    <div class="field"><label>${L('Country', 'الدولة')}</label><select onchange="STATE.su.country=this.value">${['Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Bahrain', 'Oman'].map(c => `<option ${su.country === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div class="field"><label>${L('Restaurant type', 'نوع المطعم')}</label><select onchange="STATE.su.type=this.value">${TYPES.map(t => `<option ${su.type === t[1] ? 'selected' : ''}>${t[1]}</option>`).join('')}</select></div>
   </div>
   <button class="ed-auth2-btn" onclick="suNext()">${L('Next', 'التالي')}</button>`;
  } else {
    body = `
   <div class="field" id="f-su-pass"><label>${L('Create your password', 'أنشئ كلمة المرور')}</label><input id="su-pass" type="password" value="${esc(su.pass || '')}" oninput="STATE.su.pass=this.value" placeholder="${L('8+ characters', '8 أحرف أو أكثر')}" onkeydown="if(event.key==='Enter')suCreate()"><div class="err">${L('At least 8 characters.', '8 أحرف على الأقل.')}</div></div>
   <button class="ed-auth2-btn" id="suCreateBtn" onclick="suCreate()">${L('Create account', 'إنشاء حساب')}</button>`;
  }
  return authShell(`
   <h2 class="ed-auth2-h">${L('Create an account', 'أنشئ حساباً')}</h2>
   <p class="ed-auth2-sub">${L('Already have an account?', 'لديك حساب بالفعل؟')} <a href="#" onclick="go('login');return false">${L('Log in', 'تسجيل الدخول')}</a></p>
   ${authStepper(st)}
   ${body}
   ${st > 1 ? `<button class="ed-auth2-back" onclick="suBack()">← ${L('Back', 'رجوع')}</button>` : ''}`);
};

function suNext() {
  const su = STATE.su;
  if (su.step === 1) {
    if (!(su.email || '').includes('@')) { $('f-su-email').classList.add('bad'); return; }
    su.step = 2; render(); return;
  }
  if (su.step === 2) {
    let bad = false;
    if (!(su.name || '').trim()) { $('f-su-name').classList.add('bad'); bad = true; }
    if (!(su.rest || '').trim()) { $('f-su-rest').classList.add('bad'); bad = true; }
    if (bad) return;
    su.step = 3; render();
  }
}
function suBack() { STATE.su.step = Math.max(1, STATE.su.step - 1); render(); }

async function suCreate() {
  const su = STATE.su;
  if ((su.pass || '').length < 8) { $('f-su-pass').classList.add('bad'); return; }
  const email = (su.email || '').toLowerCase();
  const btn = $('suCreateBtn');
  if (btn) { btn.disabled = true; btn.textContent = L('Creating…', 'جارٍ الإنشاء…'); }

  const { data, error } = await DB.signUp(email, su.pass, { name: su.name });
  if (error) { toast(error.message, 'bad'); if (btn) { btn.disabled = false; btn.textContent = L('Create account', 'إنشاء حساب'); } return; }

  const { data: org, error: orgErr } = await DB.createOrg({
    name: su.rest, city: su.city || 'Riyadh', country: su.country || 'Saudi Arabia',
    type: su.type || TYPES[0][1], plan: STATE.plan || 'Growth',
  });
  if (orgErr) { toast(L('Account created but org setup failed: ', 'أُنشئ الحساب لكن فشل إعداد المنشأة: ') + orgErr.message, 'bad'); return; }

  const branches = Array.from({ length: +su.branches || 1 }, (_, i) => 'Branch ' + (i + 1));
  await DB.setBranches(org.id, branches);
  await DB.bulkInsertGovFees(org.id, defaultGov());
  await DB.bulkInsertHiddenCosts(org.id, defaultHidden());
  await DB.bulkInsertDeliveryApps(org.id, [
    { n: 'HungerStation', comm: 25, mkt: 5, share: 40 },
    { n: 'Jahez', comm: 22, mkt: 3, share: 35 },
    { n: 'ToYou', comm: 20, mkt: 2, share: 25 },
  ]);
  await DB.setCategories(org.id, (TYPES.find(t => t[1] === su.type) || TYPES[0])[2]);

  const orgState = await DB.loadOrgState(org.id);
  const th = STATE.theme, lg = STATE.lang;
  STATE = { ...blankState(), ...orgState, authed: true, verified: true, theme: th, lang: lg };
  STATE.user = { n: su.name, email, role: 'Owner' };
  STATE.ob = { step: 1, src: 'paste', extracted: false };
  STATE.su = null;

  toast(L('Account created — welcome, ' + (su.name || '').split(' ')[0] + '!', 'تم إنشاء الحساب — أهلاً، ' + (su.name || '').split(' ')[0] + '!'));
  go('onboarding');
}

/* ── App shell ───────────────────────────────────────────────── */
const NAV = [
  ['overview', [['dash', 'layout-dashboard'], ['branch', 'git-branch'], ['copilot', 'bot']]],
  ['menuG', [['menu', 'utensils'], ['cats', 'tags'], ['recipe', 'flask-conical'], ['ing', 'leaf'], ['sup', 'truck'], ['proc', 'receipt'], ['inv', 'package'], ['procDash', 'shopping-cart']]],
  ['costsG', [['emp', 'users'], ['gov', 'landmark'], ['rentutil', 'building-2'], ['hidden', 'eye-off'], ['xfees', 'alert-circle'], ['mktg', 'megaphone'], ['apps', 'smartphone'], ['alloc', 'pie-chart']]],
  ['intelG', [['costing', 'calculator'], ['pricing', 'tag'], ['market', 'trending-up'], ['eng', 'bar-chart-2'], ['scen', 'sliders'], ['profit', 'circle-dollar-sign'], ['reports', 'file-bar-chart']]],
  ['adminG', [['settings', 'settings'], ['usersP', 'user-cog'], ['billing', 'credit-card']]],
];
let pops = { notif: false, user: false };

function appShell(r) {
  const t = totals();
  const curGroup = NAV.find(([g, items]) => items.some(([k]) => k === r)) || NAV[0];
  return `<div class="appbg"><div class="apppanel">
   <nav class="topnav">
    <button class="brand" onclick="go('dash')"><span class="mark">${lc('chef-hat')}</span> MenuPilot AI</button>
    <div class="navpills">
     ${NAV.map(([g, items]) => `<button class="navpill ${curGroup[0] === g ? 'act' : ''}" onclick="go('${items[0][0]}')">${T(g)}</button>`).join('')}
    </div>
    <span style="flex:1"></span>
    <div class="searchbox sm"><span class="sic">${lc('search')}</span><input id="gsearch" placeholder="${T('search')}" oninput="gSearch(this.value)"><div id="sres"></div></div>
    <button class="iconbtn lang-btn" title="${STATE.lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}" onclick="setLang(STATE.lang==='en'?'ar':'en')">${lc('globe-2')}<span class="lang-badge">${STATE.lang === 'en' ? 'EN' : 'ع'}</span></button>
    <button class="iconbtn" title="Theme" onclick="setTheme(STATE.theme==='light'?'dark':'light')">${STATE.theme === 'light' ? lc('moon') : lc('sun')}</button>
    <button class="iconbtn" title="${T('settings')}" onclick="go('settings')">${lc('settings')}</button>
    <button class="iconbtn" onclick="pops.notif=!pops.notif;pops.user=false;render()">${lc('bell')}${STATE.notifications.length ? '<span class="dot"></span>' : ''}</button>
    <button class="avatar" onclick="pops.user=!pops.user;pops.notif=false;render()">${esc(STATE.user.n.split(' ').map(x => x[0]).join('').slice(0, 2))}</button>
    ${pops.notif ? `<div class="pop right"><div class="ph"><b>${L('Notifications', 'الإشعارات')}</b> · ${L('agent alerts', 'تنبيهات الوكلاء')}</div>
      ${STATE.notifications.map(n => `<div class="pi"><span class="pi-ic ${n.k}">${lc(n.k === 'bad' ? 'alert-triangle' : n.k === 'warn' ? 'alert-circle' : 'info')}</span><div><b>${esc(n.t)}</b><small>${esc(n.m)}</small><small style="color:var(--gold)">${L(n.time + ' ago', 'منذ ' + n.time)}</small></div></div>`).join('') || `<div class="pi">${lc('bell-off')} ${L('No notifications.', 'لا توجد إشعارات.')}</div>`}
      <button class="pi" style="color:var(--gold);font-weight:600" onclick="clearNotifs()">${L('Clear all', 'مسح الكل')}</button></div>` : ''}
    ${pops.user ? `<div class="pop right"><div class="ph"><b>${esc(STATE.user.n)}</b><br><span class="note">${esc(STATE.user.email)} · ${STATE.user.role}</span></div>
      <button class="pi" onclick="pops.user=false;go('settings')">${lc('settings')} <div>${T('settings')}</div></button>
      <button class="pi" onclick="pops.user=false;go('usersP')">${lc('user-cog')} <div>${T('usersP')}</div></button>
      <button class="pi" onclick="pops.user=false;go('billing')">${lc('credit-card')} <div>${T('billing')} <small>${STATE.plan} plan</small></div></button>
      <button class="pi" style="color:var(--coral)" onclick="logout()">${lc('log-out')} <div>${T('logout')}</div></button></div>` : ''}
   </nav>
   <div class="subnav">
    ${curGroup[1].map(([k, ic]) => `<button class="subpill ${r === k ? 'act' : ''}" onclick="go('${k}')"><span class="ic">${lc(ic)}</span> ${T(k)}</button>`).join('')}
   </div>
   <main class="main2">
    ${r === 'dash' ? '' : `<div class="pagehead"><div><h2>${T(r)}</h2><div class="crumb">${esc(STATE.org.name)} · ${esc(STATE.org.city)} · ${STATE.org.branches.length} ${L('branch(es)', 'فرع')} · ${STATE.menu.length ? SAR(t.rev) + L(' /mo', ' / شهر') : L('no sales data yet', 'لا توجد بيانات مبيعات بعد')}</div></div>
     <div style="display:flex;gap:8px;align-items:center"><span class="pill tag info">${L('SAR', 'ر.س')}</span><span class="tag ${STATE.plan === 'Growth' ? 'gold' : 'info'}">${L(STATE.plan + ' plan', 'باقة ' + STATE.plan)}</span></div></div>`}
    ${PAGES[r] ? PAGES[r]() : '<div class="empty"><h5>Page not found</h5></div>'}
   </main></div></div>`;
}

function gSearch(v) {
  const box = $('sres'); if (!v || v.length < 2) { box.innerHTML = ''; return; }
  const lo = v.toLowerCase();
  const hits = [...STATE.menu.filter(m => m.n.toLowerCase().includes(lo)).slice(0, 4).map(m => [lc('utensils') + ' ' + m.n, 'costing']),
    ...STATE.ings.filter(i => i.n.toLowerCase().includes(lo)).slice(0, 3).map(i => [lc('leaf') + ' ' + i.n, 'ing']),
    ...Object.keys(I18N.en).filter(k => I18N.en[k].toLowerCase().includes(lo) && PAGES[k]).slice(0, 3).map(k => [lc('layout-dashboard') + ' ' + T(k), k])];
  box.innerHTML = hits.length ? `<div class="sresults">${hits.map(h => `<button onclick="$('gsearch').value='';$('sres').innerHTML='';go('${h[1]}')"><span>${h[0]}</span><span class="note">${L('open', 'فتح')}</span></button>`).join('')}</div>` : '';
  if (window.lucide) lucide.createIcons();
}

async function clearNotifs() {
  STATE.notifications = [];
  pops.notif = false;
  if (STATE._orgId) await DB.clearNotifications(STATE._orgId);
  render();
}

function emptyMenuState() {
  return `<div class="card"><div class="empty"><div class="big lc-big">${lc('utensils')}</div><h5>${L('No menu yet', 'لا توجد قائمة بعد')}</h5>
 <p style="max-width:44ch;margin:0 auto 14px">${L('Run the Menu Extraction Agent on your website, Instagram, or a PDF menu — it builds your items, then Recipe Intelligence drafts the recipes.', 'شغّل وكيل استخراج القائمة على موقعك أو إنستغرام أو ملف PDF — يبني الأصناف، ثم يقوم وكيل ذكاء الوصفات بإعداد الوصفات.')}</p>
 <button class="btn btn-gold" onclick="STATE.ob.step=3;go('onboarding')">${lc('play')} ${L('Run AI onboarding', 'تشغيل الإعداد الذكي')}</button></div></div>`;
}

// Auth helpers (used by pages-public.js). Centered single-column layout.
function authShell(inner, head) {
  return `<div class="ed-auth2">
 <button class="ed-auth2-mark" onclick="go('landing')" title="MenuPilot AI"><span class="ed-mark">${lc('chef-hat')}</span></button>
 <button class="ed-auth2-lang" onclick="setLang(STATE.lang==='en'?'ar':'en')">${STATE.lang === 'en' ? 'العربية' : 'English'}</button>
 <div class="ed-auth2-col">${inner}</div>
</div>`;
}

// 3-step stepper used by the signup flow.
function authStepper(cur) {
  const steps = [[1, L('Enter your email address', 'أدخل بريدك الإلكتروني')], [2, L('Provide your basic info', 'أدخل معلوماتك الأساسية')], [3, L('Create your password', 'أنشئ كلمة المرور')]];
  return `<div class="ed-step">${steps.map((s, i) => `${i ? '<span class="ed-step-line"></span>' : ''}<div class="ed-step-i ${cur === s[0] ? 'cur' : cur > s[0] ? 'done' : ''}"><span class="ed-step-n">${cur > s[0] ? lc('check') : s[0]}</span><span class="ed-step-l">${s[1]}</span></div>`).join('')}</div>`;
}
