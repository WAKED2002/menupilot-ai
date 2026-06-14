// ═══════════════════════════════════════════════════════════════
// COST ENGINE — Agent C math (pure functions, no LLM)
// All calculations are deterministic and run client-side.
// ═══════════════════════════════════════════════════════════════

const ingById = id => STATE.ings.find(i => i.id === id);

function ingCost(m) {
  return m.recipe.reduce((a, [id, q]) => {
    const i = ingById(id); if (!i) return a;
    return a + (i.unit === 'pc' ? q * i.price : q / 1000 * i.price) / (i.yield || 1);
  }, 0);
}

const totalUnits   = () => STATE.menu.reduce((a, m) => a + m.sold, 0) || 1;
const totalRevenue = () => STATE.menu.reduce((a, m) => a + m.price * m.sold, 0);
const empMonthly   = e => e.basic + e.hous + e.trans + e.food + e.ot + e.basic * e.gosi + e.visa + e.iqama + e.med + e.recr;
const laborPool    = () => STATE.emps.reduce((a, e) => a + empMonthly(e), 0);

function laborRate() {
  const mins = STATE.menu.reduce((a, m) => a + m.laborMin * m.sold, 0) || 1;
  return laborPool() / mins;
}

function govMonthly() {
  const n = STATE.emps.filter(e => !e.saudi).length || 1;
  const all = STATE.emps.length || 1;
  return STATE.gov.reduce((a, g) => {
    const per = g.cycle.includes('employee');
    const mult = per ? (g.n.includes('expat') || g.n.includes('Iqama') || g.n.includes('Work permit') || g.n.includes('Visa') ? n : all) : 1;
    return a + g.amt * mult / 12;
  }, 0);
}

const hiddenGroup   = grp => STATE.hidden.filter(h => h.grp === grp).reduce((a, h) => a + h.amt, 0);
const hiddenMonthly = () => STATE.hidden.reduce((a, h) => a + h.amt, 0);

// Electricity & water that are NOT included in the rent — billed out of pocket.
const utilMonthly = () =>
  ((STATE.elec && !STATE.elec.included) ? (STATE.elec.amt || 0) : 0) +
  ((STATE.water && !STATE.water.included) ? (STATE.water.amt || 0) : 0);

// Extra fees: recurring monthly lines always count; a one-time fee/fine only
// counts in the evaluation month it is logged against, then drops off.
function xfeesMonthly() {
  return (STATE.xfees || []).reduce((a, f) => {
    if (f.type === 'monthly') return a + (f.amt || 0);
    if (f.month === STATE.evalMonth) return a + (f.amt || 0); // one-time, current month only
    return a;
  }, 0);
}
const xfeesRecurring = () => (STATE.xfees || []).filter(f => f.type === 'monthly').reduce((a, f) => a + (f.amt || 0), 0);
const xfeesOneTime   = () => (STATE.xfees || []).filter(f => f.type === 'onetime' && f.month === STATE.evalMonth).reduce((a, f) => a + (f.amt || 0), 0);

function blendedAppRate() {
  const tot = STATE.apps.reduce((a, x) => a + x.share, 0) || 1;
  return STATE.apps.reduce((a, x) => a + (x.comm + x.mkt) / 100 * x.share, 0) / tot;
}

function layers(m) {
  const REV = totalRevenue() || 1;
  const w = m.price / REV;
  const ing = ingCost(m);
  return {
    ing,
    labor:  m.laborMin * laborRate(),
    pack:   m.pack,
    util:   (hiddenGroup('Utilities') + utilMonthly()) * w,
    rent:   STATE.rent * w,
    gov:    govMonthly() * w,
    tech:   hiddenGroup('Technology') * w,
    mkt:    hiddenGroup('Marketing') * w,
    del:    m.delShare * blendedAppRate() * m.price,
    hid:    (hiddenGroup('Operations') + hiddenGroup('Finance')) * w,
    xfee:   xfeesMonthly() * w,
    waste:  ing * (STATE.wastePct ?? 4) / 100 + hiddenGroup('Shrinkage') * w,
  };
}

const cost       = m => Object.values(layers(m)).reduce((a, b) => a + b, 0);
const margin     = m => m.price - cost(m);
const marginPct  = m => margin(m) / m.price * 100;
const grossMarginPct = m => (m.price - ingCost(m)) / m.price * 100;

function totals() {
  const rev  = totalRevenue();
  const ingT = STATE.menu.reduce((a, m) => a + ingCost(m) * m.sold, 0);
  const profit = STATE.menu.reduce((a, m) => a + margin(m) * m.sold, 0);
  return {
    rev, ingT, labor: laborPool(), gov: govMonthly(), hidden: hiddenMonthly(), rent: STATE.rent,
    util: utilMonthly(), xfee: xfeesMonthly(),
    gross: rev - ingT, net: profit,
    foodPct:  ingT / rev * 100,
    laborPct: laborPool() / rev * 100,
    primePct: (ingT + laborPool()) / rev * 100,
    rentPct:  STATE.rent / rev * 100,
    delPct:   STATE.menu.reduce((a, m) => a + layers(m).del * m.sold, 0) / rev * 100,
  };
}

function breakEven() {
  const t = totals();
  const variable = STATE.menu.reduce((a, m) => {
    const L = layers(m);
    return a + (L.ing + L.pack + L.del + L.waste) * m.sold;
  }, 0);
  const cmr = 1 - variable / t.rev;
  const fixed = t.labor + t.gov + t.hidden + t.rent + utilMonthly() + xfeesMonthly();
  return { cmr, fixed, rev: fixed / cmr };
}

// ── Menu engineering ──────────────────────────────────────────
function medians() {
  const a = STATE.menu.filter(m => m.status !== 'extracted');
  const q = a.map(m => m.sold).sort((x, y) => x - y);
  const mm = a.map(m => marginPct(m)).sort((x, y) => x - y);
  return { q: q[Math.floor(q.length / 2)] || 0, m: mm[Math.floor(mm.length / 2)] || 0 };
}

function mLabel(m) {
  const md = medians(); const hp = marginPct(m) >= md.m, hq = m.sold >= md.q;
  return hp && hq ? 'Star' : hp ? 'Puzzle' : hq ? 'Plow Horse' : 'Dog';
}
const mCls    = m => ({ Star: 'star', Puzzle: 'puzzle', 'Plow Horse': 'plow', Dog: 'dog' }[mLabel(m)]);
const mAction = m => ({
  Star:        'Promote — feature & protect, never discount',
  Puzzle:      'Reprice or reposition — bundle, photograph, move on menu',
  'Plow Horse':'Redesign recipe or raise price slightly',
  Dog:         'Remove or fully redesign',
}[mLabel(m)]);

// ── Procurement invoice parser (static fallback for Agent E) ──
function invMatch(text) {
  const norm = x => x.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const lines = norm(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const priceRe = /(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:SAR|SR|ر\.س)?$/i;
  const matched = [], unmatched = [];
  lines.forEach(l => {
    const pm = l.match(priceRe);
    if (!pm) return;
    const price = parseFloat(pm[1].replace(',', '.'));
    const nameRaw = l.slice(0, l.length - pm[0].length).trim();
    const lo = nameRaw.toLowerCase();
    const ing = STATE.ings.find(i => {
      const in2 = i.n.toLowerCase();
      return lo.includes(in2) || in2.includes(lo) || lo.split(' ').some(w => w.length > 3 && in2.includes(w));
    });
    if (ing) matched.push({ ing, price, line: l });
    else unmatched.push(nameRaw);
  });
  return { matched, unmatched };
}
