// ═══════════════════════════════════════════════════════════════
// STATE — global app store + demo seed data
// ═══════════════════════════════════════════════════════════════

let STATE = null;

function blankState() {
  return {
    theme: document.documentElement.dataset.theme || 'light',
    lang: 'en',
    route: 'landing',
    authed: false,
    user: null,
    org: null,
    _orgId: null,
    plan: 'Growth',
    verified: false,
    branchView: 0,
    cats: [], ings: [], menu: [], sups: [], emps: [], gov: [], hidden: [], apps: [],
    users: [],
    rent: 28000,
    rentTerm: { months: 12, start: curMonth() },
    elec: { included: true, amt: 0 },
    water: { included: true, amt: 0 },
    xfees: [],
    evalMonth: curMonth(),
    wastePct: 4,
    budget: { food: 32, labor: 20, mkt: 5 },
    lastInv: null,
    receipts: [],
    notifications: [],
    procOrders: [],
    procQuotes: [],
    procForecasts: [],
    supScores: [],
    procMessages: [],
    invoices: [],
    market: null,
    ob: { step: 1, src: 'paste', extracted: false },
    pendingSignup: null,
  };
}

// Ensures older / DB-loaded states carry the new rent-term, utility, extra-fee
// and eval-month fields, and pulls any legacy Electricity/Water lines out of
// Hidden Costs into the dedicated utilities model so they are never double-counted.
function migrate(s) {
  if (!s || s._migrated) return s;
  if (!s.rentTerm) s.rentTerm = { months: 12, start: curMonth() };
  if (!s.xfees) s.xfees = [];
  if (!s.evalMonth) s.evalMonth = curMonth();
  if (!('market' in s)) s.market = null;
  if (!s.receipts) s.receipts = [];
  // Absorb any legacy Electricity/Water lines from Hidden Costs into the
  // dedicated utilities model (so they appear on the Rent & Utilities page and
  // are never counted twice). Only absorb when the field is still untouched.
  const absorb = (key, name) => {
    const u = s[key];
    const idx = (s.hidden || []).findIndex(h => h.grp === 'Utilities' && new RegExp(name, 'i').test(h.n));
    if (idx === -1) { if (!u) s[key] = { included: true, amt: 0 }; return; }
    if (!u || (u.included && !u.amt)) {       // not yet configured by the user
      const amt = s.hidden[idx].amt;
      s.hidden.splice(idx, 1);
      s[key] = { included: false, amt };      // it was a real out-of-pocket bill
    }
  };
  absorb('elec', 'electric');
  absorb('water', 'water');
  // Every menu item carries a recipe version history (spec §3).
  (s.menu || []).forEach(m => { if (!m.versions) m.versions = []; });
  if (!s.procOrders) s.procOrders = [];
  if (!s.procQuotes) s.procQuotes = [];
  if (!s.procForecasts) s.procForecasts = [];
  if (!s.supScores) s.supScores = [];
  if (!s.procMessages) s.procMessages = [];
  (s.sups || []).forEach(sp => { if (!sp.phone) sp.phone = ''; });
  s._migrated = true;
  return s;
}

function defaultGov() {
  return [
    ['Balady (Municipality) license','Municipality',7200,'Annual'],
    ['Commercial Registration renewal','MoC',1200,'Annual'],
    ['Chamber of Commerce','CoC',2000,'Annual'],
    ['Civil Defense permit','Civil Defense',1500,'Annual'],
    ['Health certificates','Balady',450,'Per employee / yr'],
    ['Signboard fee','Municipality',2500,'Annual'],
    ['Waste collection','Municipality',1800,'Annual'],
    ['ZATCA e-invoicing (Fatoora)','ZATCA',3600,'Annual'],
    ['POS compliance & maintenance','Vendor',2400,'Annual'],
    ['Qiwa subscription','HRSD',1150,'Annual'],
    ['Mudad payroll (WPS)','HRSD',960,'Annual'],
    ['Muqeem services','MoI',1200,'Annual'],
    ['Iqama renewal (per expat)','MoI',650,'Per employee / yr'],
    ['Work permit levy (per expat)','HRSD',9600,'Per employee / yr'],
    ['Visa & exit re-entry (avg)','MoI',670,'Per employee / yr'],
    ['Medical insurance (per employee)','CCHI',1600,'Per employee / yr'],
    ['Saudization-related costs','HRSD',2400,'Annual'],
    ['Municipality inspection fees','Balady',800,'Annual'],
    ['Food safety certificates','SFDA',1200,'Annual'],
    ['Delivery platform registration','Platforms',1500,'Annual'],
  ].map(g => ({ id: uid(), n: g[0], auth: g[1], amt: g[2], cycle: g[3] }));
}

function defaultHidden() {
  return [
    ['Cleaning supplies','Operations',1400],['Uniforms','Operations',450],['Pest control','Operations',600],
    ['Waste disposal','Operations',500],['Gas','Utilities',1700],
    ['POS subscription','Technology',850],['Internet','Technology',420],['Accounting software','Technology',380],['HR software','Technology',300],
    ['Photography','Marketing',900],['Social media & influencers','Marketing',2600],['Marketing agency retainer','Marketing',3500],['Paid ads (Snap/TikTok/Instagram)','Marketing',1800],['Printing','Marketing',350],
    ['Bank charges','Finance',300],['Payment gateway fees','Finance',1150],
    ['Food waste & spoilage','Shrinkage',2100],['Damage & theft provision','Shrinkage',600],
  ].map(h => ({ id: uid(), n: h[0], grp: h[1], amt: h[2] }));
}

function seedDemo() {
  const s = blankState();
  s.authed = true; s.verified = true;
  s.user = { n: 'Bandar W.', email: 'owner@almarjan.sa', role: 'Owner' };
  s.org = { name: 'Al Marjan Seafood', country: 'Saudi Arabia', city: 'Riyadh', branches: ['Olaya', 'Al Nakheel'], type: 'Seafood Restaurant', website: 'https://almarjan-seafood.example' };
  s.users = [
    { n: 'Bandar W.', email: 'owner@almarjan.sa', role: 'Owner', st: 'Active' },
    { n: 'Faisal A.', email: 'chef@almarjan.sa', role: 'Chef', st: 'Active' },
    { n: 'Sara M.', email: 'sara@almarjan.sa', role: 'Accountant', st: 'Active' },
    { n: 'Khalid R.', email: 'khalid@almarjan.sa', role: 'Manager', st: 'Invited' },
  ];
  s.cats = TYPES[0][2].slice();
  const I = (n, sup, price, yld) => ({ id: uid(), n, sup, unit: 'kg', price, yield: yld, hist: [{ d: 'Mar', p: price * 0.93 }, { d: 'Apr', p: price * 0.97 }, { d: 'May', p: price }] });
  s.ings = [
    I('Hamour fish','Gulf Fresh Fish Co.',62,0.62), I('Shrimp (peeled)','Gulf Fresh Fish Co.',58,0.95),
    I('Lobster','Red Sea Imports',95,0.60), I('White fish fillet','Gulf Fresh Fish Co.',38,0.90),
    I('Calamari rings','Red Sea Imports',34,0.92), I('Crab','Red Sea Imports',82,0.48),
    I('Fresh oysters','Red Sea Imports',9,1), I('Rice','Riyadh Wholesale Foods',7.5,1),
    I('Olive oil','Riyadh Wholesale Foods',24,1), I('Oil (fryer)','Riyadh Wholesale Foods',11,1),
    I('Lemon','Riyadh Wholesale Foods',6,0.9), I('Garlic & spices','Riyadh Wholesale Foods',32,1),
    I('Butter','Riyadh Wholesale Foods',28,1), I('Cream','Riyadh Wholesale Foods',18,1),
    I('Flour & batter','Riyadh Wholesale Foods',5.5,1), I('Vegetables mix','Riyadh Wholesale Foods',9,0.85),
    I('Stock base','In-house prep',8,1), I('Saffron & premium spice','Riyadh Wholesale Foods',210,1),
  ];
  s.ings[6].unit = 'pc'; s.ings[6].price = 7;
  const ing = n => s.ings.find(i => i.n === n).id;
  const M = (n, cat, price, recipe, laborMin, pack, sold, delShare, status) => ({
    id: uid(), n, cat, price, desc: '', recipe, laborMin, pack, sold, delShare, status: status || 'approved', reprice: false
  });
  s.menu = [
    M('Grilled Hamour','Grilled Fish',89,[[ing('Hamour fish'),240],[ing('Olive oil'),20],[ing('Lemon'),60],[ing('Garlic & spices'),15]],9,1.8,620,.32),
    M('Royal Seafood Platter','Seafood Platters',159,[[ing('Hamour fish'),150],[ing('Shrimp (peeled)'),150],[ing('Calamari rings'),120],[ing('Rice'),200],[ing('Garlic & spices'),20]],14,3.2,410,.41),
    M('Jumbo Shrimp Sayadiya','Shrimp',79,[[ing('Shrimp (peeled)'),180],[ing('Rice'),180],[ing('Vegetables mix'),120],[ing('Garlic & spices'),12],[ing('Olive oil'),25]],8,1.9,530,.38),
    M('Lobster Thermidor','Lobster',189,[[ing('Lobster'),320],[ing('Butter'),40],[ing('Cream'),60],[ing('Garlic & spices'),8]],16,2.8,95,.18),
    M('Fried Fish Sandwich','Fish Sandwiches',32,[[ing('White fish fillet'),140],[ing('Flour & batter'),60],[ing('Oil (fryer)'),45],[ing('Lemon'),30]],4,1.4,880,.45),
    M('Crispy Calamari','Calamari',39,[[ing('Calamari rings'),160],[ing('Flour & batter'),50],[ing('Oil (fryer)'),40]],4,1.1,700,.36),
    M('Oysters (Half Dozen)','Oysters',95,[[ing('Fresh oysters'),6],[ing('Lemon'),40]],5,1.5,60,.05),
    M('Crab Curry','Crab',99,[[ing('Crab'),200],[ing('Cream'),120],[ing('Rice'),150],[ing('Garlic & spices'),18]],10,2.0,140,.22),
    M('Seafood Soup','Seafood Soup',29,[[ing('Stock base'),250],[ing('Shrimp (peeled)'),60],[ing('White fish fillet'),60],[ing('Cream'),40]],4,1.0,210,.25),
    M('Saffron Seafood Rice','Seafood Rice',69,[[ing('Rice'),220],[ing('Shrimp (peeled)'),120],[ing('White fish fillet'),90],[ing('Saffron & premium spice'),3],[ing('Olive oil'),20]],7,1.7,480,.34),
  ];
  s.sups = [
    { n: 'Gulf Fresh Fish Co.', phone: '966500000001', cat: 'Fresh fish & shellfish', terms: 'Net 15', days: 'Sat · Mon · Wed', rating: 4.6 },
    { n: 'Red Sea Imports', phone: '966500000002', cat: 'Premium & frozen seafood', terms: 'Net 30', days: 'Sun · Tue', rating: 4.2 },
    { n: 'Riyadh Wholesale Foods', phone: '966500000003', cat: 'Dry goods, produce, dairy', terms: 'Net 7', days: 'Daily', rating: 4.8 },
    { n: 'In-house prep', phone: '', cat: 'Stocks & sauces', terms: '—', days: '—', rating: 5.0 },
  ];
  s.emps = [
    { id: uid(), n: 'Faisal A.', pos: 'Head Chef', basic: 9000, hous: 2250, trans: 500, food: 300, ot: 400, gosi: .1175, visa: 170, iqama: 54, med: 180, recr: 250, saudi: false },
    { id: uid(), n: 'Ravi K.', pos: 'Sous Chef', basic: 5500, hous: 1375, trans: 400, food: 300, ot: 350, gosi: .02, visa: 170, iqama: 54, med: 150, recr: 200, saudi: false },
    { id: uid(), n: 'Joseph M.', pos: 'Grill Cook', basic: 3800, hous: 950, trans: 300, food: 300, ot: 300, gosi: .02, visa: 170, iqama: 54, med: 130, recr: 160, saudi: false },
    { id: uid(), n: 'Noura S.', pos: 'Cashier', basic: 5000, hous: 1250, trans: 400, food: 0, ot: 0, gosi: .2175, visa: 0, iqama: 0, med: 0, recr: 0, saudi: true },
    { id: uid(), n: 'Arjun P.', pos: 'Waiter', basic: 3200, hous: 800, trans: 300, food: 300, ot: 250, gosi: .02, visa: 170, iqama: 54, med: 120, recr: 150, saudi: false },
    { id: uid(), n: 'Hassan T.', pos: 'Delivery Packer', basic: 3000, hous: 750, trans: 300, food: 300, ot: 200, gosi: .02, visa: 170, iqama: 54, med: 120, recr: 150, saudi: false },
  ];
  s.gov = defaultGov();
  s.hidden = defaultHidden();
  s.rent = 28000;
  s.rentTerm = { months: 36, start: '2025-01' };
  s.elec  = { included: false, amt: 6200 };
  s.water = { included: false, amt: 1900 };
  s.evalMonth = curMonth();
  s.xfees = [
    { id: uid(), n: 'Pest control contract', amt: 600, type: 'monthly', paid: true, month: null, note: '' },
    { id: uid(), n: 'Grease trap cleaning', amt: 350, type: 'monthly', paid: true, month: null, note: '' },
    { id: uid(), n: 'Municipality hygiene fine', amt: 2000, type: 'onetime', paid: false, month: curMonth(), note: 'Inspection — toilets flagged' },
  ];
  s.apps = [
    { n: 'HungerStation', comm: 25, mkt: 5, share: 38 }, { n: 'Jahez', comm: 22, mkt: 3, share: 31 },
    { n: 'ToYou', comm: 20, mkt: 2, share: 14 }, { n: 'The Chefz', comm: 23, mkt: 3, share: 9 }, { n: 'Mrsool', comm: 18, mkt: 2, share: 8 },
  ];
  s.notifications = [
    { t: 'Procurement Analyst', m: 'Hamour price up 6.9% at Gulf Fresh Fish Co. — 4 recipes affected.', k: 'bad', time: '2h' },
    { t: 'Pricing Strategist', m: 'Oysters margin below 20% floor. Recommended price: SAR 109.', k: 'warn', time: '5h' },
    { t: 'Recipe Intelligence', m: '1 recipe pending your approval (Royal Seafood Platter).', k: 'info', time: '1d' },
  ];
  s.invoices = [
    { d: '01 May 2026', n: 'INV-0142', amt: 599, st: 'Paid' },
    { d: '01 Apr 2026', n: 'INV-0117', amt: 599, st: 'Paid' },
    { d: '01 Mar 2026', n: 'INV-0093', amt: 599, st: 'Paid' },
  ];
  s.menu[1].status = 'pending';
  // Demo recipe history on the shrimp dish (spec §3 example): a quantity cut
  // that lowered cost and lifted margin — shows the versioning UI populated.
  s.menu[2].versions = [
    { ts: '2026-03-04T09:00:00Z', by: 'Faisal A.', reason: 'Initial approved recipe', recipe: s.menu[2].recipe.map(r => r.slice()), ingCost: 24.10, cost: 49.20, marginPct: 37.7 },
    { ts: '2026-05-21T14:30:00Z', by: 'Bandar W.', reason: 'Reduced shrimp 200g → 180g after yield review', recipe: s.menu[2].recipe.map(r => r.slice()), ingCost: 21.40, cost: 46.10, marginPct: 41.6 },
  ];
  // ── Procurement AI demo data ──────────────────
  s.supScores = [
    { sup: 'Gulf Fresh Fish Co.', overall: 88, price: 82, quality: 93, delivery: 90, spend: 47200 },
    { sup: 'Red Sea Imports', overall: 79, price: 75, quality: 85, delivery: 78, spend: 28600 },
    { sup: 'Riyadh Wholesale Foods', overall: 92, price: 90, quality: 91, delivery: 95, spend: 18900 },
  ];
  s.procOrders = [
    { id: uid(), sup: 'Gulf Fresh Fish Co.', items: [{ n: 'Hamour fish', qty: 50, unit: 'kg', price: 62 }, { n: 'Shrimp (peeled)', qty: 30, unit: 'kg', price: 58 }], total: 4840, status: 'draft', date: '2026-06-19' },
    { id: uid(), sup: 'Riyadh Wholesale Foods', items: [{ n: 'Rice', qty: 100, unit: 'kg', price: 7.5 }, { n: 'Olive oil', qty: 20, unit: 'L', price: 24 }], total: 1230, status: 'sent', date: '2026-06-18' },
    { id: uid(), sup: 'Red Sea Imports', items: [{ n: 'Lobster', qty: 10, unit: 'kg', price: 95 }], total: 950, status: 'confirmed', date: '2026-06-17' },
  ];
  s.procMessages = [
    { id: uid(), sup: 'Gulf Fresh Fish Co.', msg: '\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064a\u0643\u0645 \u064a\u0627 \u0623\u0628\u0648 \u062e\u0627\u0644\u062f\u060c\n\n\u0623\u0631\u062c\u0648 \u062a\u0623\u0643\u064a\u062f \u0637\u0644\u0628\u064a\u0629 \u064a\u0648\u0645 \u0627\u0644\u0633\u0628\u062a:\n- \u0647\u0627\u0645\u0648\u0631 \u0665\u0660 \u0643\u062c\u0645\n- \u0631\u0628\u064a\u0627\u0646 \u0645\u0642\u0634\u0631 \u0663\u0660 \u0643\u062c\u0645\n\n\u0627\u0644\u0645\u062c\u0645\u0648\u0639: \u0664,\u0668\u0664\u0660 \u0631.\u0633\n\u0627\u0644\u062a\u0648\u0635\u064a\u0644: \u0635\u0628\u0627\u062d \u0627\u0644\u0633\u0628\u062a\n\n\u062c\u0632\u0627\u0643 \u0627\u0644\u0644\u0647 \u062e\u064a\u0631\u0627\u064b', date: '2026-06-19', status: 'drafted' },
    { id: uid(), sup: 'Riyadh Wholesale Foods', msg: '\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064a\u0643\u0645\u060c\n\n\u0646\u062d\u062a\u0627\u062c \u062a\u0648\u0631\u064a\u062f \u0639\u0627\u062c\u0644:\n- \u0623\u0631\u0632 \u0628\u0633\u0645\u062a\u064a \u0661\u0660\u0660 \u0643\u062c\u0645\n- \u0632\u064a\u062a \u0632\u064a\u062a\u0648\u0646 \u0662\u0660 \u0644\u062a\u0631\n\n\u0627\u0644\u0645\u062c\u0645\u0648\u0639: \u0661,\u0662\u0663\u0660 \u0631.\u0633\n\u0646\u0631\u062c\u0648 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u063a\u062f\u0627\u064b \u0635\u0628\u0627\u062d\u0627\u064b\n\n\u0634\u0643\u0631\u0627\u064b', date: '2026-06-18', status: 'sent' },
  ];
  return s;
}

STATE = blankState();
