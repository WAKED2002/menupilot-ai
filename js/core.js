// ═══════════════════════════════════════════════════════════════
// CORE — utilities, i18n, restaurant type data, ingredient hints
// ═══════════════════════════════════════════════════════════════

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/</g, '&lt;');
const fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const SAR = n => 'SAR ' + fmt(n);
const SAR2 = n => 'SAR ' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = n => (isFinite(n) ? n : 0).toFixed(1) + '%';
const uid = () => Math.random().toString(36).slice(2, 9);

/* ── Month helpers (for one-time fees / monthly evaluation) ──── */
const curMonth = () => new Date().toISOString().slice(0, 7); // 'YYYY-MM'
function monthLabel(ym) {
  if (!ym) return '—';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}
function nextMonth(ym) {
  let [y, m] = ym.split('-').map(Number);
  m++; if (m > 12) { m = 1; y++; }
  return `${y}-${String(m).padStart(2, '0')}`;
}

/* ── i18n ────────────────────────────────────────────────────── */
const I18N = {
  en: { dash:'Dashboard',branch:'Branch Dashboard',menu:'Menu Items',cats:'Menu Categories',recipe:'Recipe Builder',ing:'Ingredient Center',sup:'Supplier Center',proc:'Procurement',inv:'Inventory',emp:'Employee Costs',gov:'Saudi Government Fees',hidden:'Hidden Costs',mktg:'Marketing Costs',apps:'Delivery Apps',rentutil:'Rent & Utilities',xfees:'Extra Fees & Fines',alloc:'Cost Allocation',market:'Live Market Rates',costing:'Menu Costing',pricing:'Pricing Center',eng:'Menu Engineering',scen:'Scenario Simulator',profit:'Profitability Center',reports:'Reports Center',copilot:'AI Copilot',settings:'Settings',usersP:'User Management',billing:'Subscription & Billing',overview:'Overview',menuG:'Menu & Recipes',costsG:'Cost Structure',intelG:'Intelligence',adminG:'Administration',search:'Search menu, ingredients, pages…',logout:'Log out' },
  ar: { dash:'لوحة التحكم',branch:'لوحة الفرع',menu:'أصناف القائمة',cats:'تصنيفات القائمة',recipe:'منشئ الوصفات',ing:'مركز المكونات',sup:'مركز الموردين',proc:'المشتريات',inv:'المخزون',emp:'تكاليف الموظفين',gov:'الرسوم الحكومية السعودية',hidden:'التكاليف الخفية',mktg:'تكاليف التسويق',apps:'تطبيقات التوصيل',rentutil:'الإيجار والمرافق',xfees:'رسوم وغرامات إضافية',alloc:'توزيع التكاليف',market:'أسعار السوق المباشرة',costing:'تكلفة القائمة',pricing:'مركز التسعير',eng:'هندسة القائمة',scen:'محاكي السيناريوهات',profit:'مركز الربحية',reports:'التقارير',copilot:'المساعد الذكي',settings:'الإعدادات',usersP:'إدارة المستخدمين',billing:'الاشتراك والفوترة',overview:'نظرة عامة',menuG:'القائمة والوصفات',costsG:'هيكل التكاليف',intelG:'الذكاء',adminG:'الإدارة',search:'ابحث في القائمة والمكونات…',logout:'تسجيل الخروج' }
};
const T = k => I18N[STATE.lang][k] || k;

/* ── Restaurant type templates ───────────────────────────────── */
const TYPES = [
  ['SF','Seafood Restaurant',['Whole Fish','Grilled Fish','Fried Fish','Seafood Platters','Shrimp','Lobster','Crab','Oysters','Calamari','Fish Sandwiches','Seafood Soup','Seafood Rice','Appetizers','Beverages','Desserts']],
  ['CF','Coffee Shop',['Espresso','Americano','Latte','Cappuccino','Flat White','Spanish Latte','Cold Brew','Frappes','Tea','Matcha','Pastries','Cakes','Sandwiches']],
  ['BG','Burger Restaurant',['Beef Burgers','Chicken Burgers','Wagyu Burgers','Signature Burgers','Fries','Sides','Drinks','Desserts']],
  ['PZ','Pizza Restaurant',['Pizza','Pasta','Appetizers','Salads','Desserts','Beverages']],
  ['BK','Bakery',['Bread','Croissants','Cakes','Cookies','Pastries','Coffee','Tea']],
  ['DS','Dessert Shop',['Cakes','Ice Cream','Chocolate','Waffles','Pancakes','Beverages']],
  ['FD','Fine Dining',['Starters','Main Courses','Premium Dishes','Signature Dishes','Desserts','Beverages']],
  ['CD','Casual Dining',['Starters','Main Courses','Beverages','Desserts']],
  ['FF','Fast Food',['Meals','Sandwiches','Combo Meals','Drinks','Desserts']],
  ['CK','Cloud Kitchen',['Concept Menu','Combos','Sides','Drinks']],
  ['SH','Steakhouse',['Steaks','Wagyu Cuts','Starters','Sides','Sauces','Desserts','Beverages']],
  ['SW','Shawarma Restaurant',['Shawarma Sandwiches','Shawarma Plates','Grills','Sides','Drinks']],
  ['FC','Fried Chicken',['Chicken Buckets','Sandwiches','Tenders','Sides','Drinks']],
  ['SU','Sushi Restaurant',['Nigiri','Maki Rolls','Sashimi','Signature Rolls','Appetizers','Beverages']],
  ['IN','Indian Restaurant',['Curries','Biryani','Tandoor','Breads','Appetizers','Desserts','Beverages']],
  ['LB','Lebanese Restaurant',['Mezza','Grills','Manakish','Salads','Desserts','Beverages']],
  ['TR','Turkish Restaurant',['Kebabs','Pide','Doner','Mezze','Desserts','Beverages']],
  ['IT','Italian Restaurant',['Pasta','Pizza','Risotto','Antipasti','Desserts','Beverages']],
  ['HF','Healthy Food Restaurant',['Bowls','Salads','Lean Proteins','Wraps','Smoothies','Snacks']],
  ['JB','Juice Bar',['Fresh Juices','Smoothies','Detox','Shots','Snacks']],
  ['IC','Ice Cream Shop',['Scoops','Sundaes','Milkshakes','Cones','Toppings']],
  ['FT','Food Truck',['Signature Items','Sides','Combos','Drinks']],
  ['CT','Catering Kitchen',['Buffet Packages','Boxed Meals','Live Stations','Desserts','Beverages']],
  ['BF','Buffet Restaurant',['Hot Buffet','Cold Buffet','Grill Station','Desserts','Beverages']],
];
const TYPE_KPI = t => ({ 'Coffee Shop': 'Avg ticket, cup cost, milk waste %', 'Seafood Restaurant': 'Fish yield %, daily catch cost, platter margin', 'Burger Restaurant': 'Patty cost, combo attach rate, bun waste' }[t] || 'Food cost %, prime cost %, item margins');

/* ── Ingredient keyword hints (static fallback for Agent B) ─── */
const ING_HINTS = [
  ['hamour',[['Hamour fish',650],['Olive oil',20],['Lemon',60],['Garlic & spices',15]]],
  ['shrimp',[['Shrimp (peeled)',280],['Rice',180],['Onion & tomato',120],['Spice mix',12],['Oil',25]]],
  ['lobster',[['Lobster',450],['Butter',40],['Cream',60],['Cheese',30],['Herbs',8]]],
  ['fish',[['White fish fillet',300],['Flour & batter',60],['Oil (fryer)',45],['Lemon',40],['Tartar sauce',30]]],
  ['calamari',[['Calamari rings',220],['Flour & batter',50],['Oil (fryer)',40],['Dip sauce',30]]],
  ['crab',[['Crab',400],['Curry paste',45],['Coconut milk',120],['Rice',150]]],
  ['oyster',[['Fresh oysters',6],['Lemon',40],['Mignonette',20]]],
  ['burger',[['Beef patty',180],['Burger bun',1],['Cheese slice',20],['Lettuce & tomato',50],['Sauce',25],['Fries (side)',120]]],
  ['chicken',[['Chicken',250],['Marinade & spices',25],['Oil',20],['Bread/rice',120]]],
  ['pizza',[['Pizza dough',280],['Mozzarella',120],['Tomato sauce',90],['Toppings',80]]],
  ['pasta',[['Pasta',140],['Sauce base',120],['Parmesan',25],['Olive oil',15]]],
  ['latte',[['Espresso beans',18],['Fresh milk',220],['Cup & lid',1]]],
  ['coffee',[['Espresso beans',18],['Water',200],['Cup & lid',1]]],
  ['matcha',[['Matcha powder',4],['Fresh milk',220],['Syrup',15],['Cup & lid',1]]],
  ['cake',[['Flour',90],['Butter',60],['Sugar',70],['Eggs',1],['Cream/topping',60]]],
  ['croissant',[['Laminated dough',95],['Butter',35],['Filling',25]]],
  ['shawarma',[['Marinated chicken/beef',160],['Saj bread',1],['Garlic sauce',30],['Pickles & fries',60]]],
  ['steak',[['Beef cut',300],['Butter & herbs',25],['Sides',150],['Sauce',40]]],
  ['sushi',[['Sushi rice',120],['Fresh fish',90],['Nori',2],['Wasabi & soy',10]]],
  ['biryani',[['Basmati rice',220],['Chicken/lamb',200],['Biryani spices',18],['Ghee & onions',45]]],
  ['juice',[['Fresh fruit',350],['Ice',80],['Cup & lid',1]]],
  ['salad',[['Mixed greens',150],['Vegetables',120],['Dressing',35],['Protein topper',90]]],
  ['soup',[['Stock base',250],['Seafood/veg mix',120],['Cream',40],['Bread',1]]],
  ['rice',[['Rice',200],['Protein mix',150],['Spices & saffron',10],['Oil/ghee',20]]],
];
function suggestIngredients(name) {
  const lo = name.toLowerCase();
  for (const [k, list] of ING_HINTS) if (lo.includes(k)) return list;
  return [['Main protein/base', 200], ['Oil & fats', 20], ['Spices & seasoning', 12], ['Sides & garnish', 80]];
}

/* ── Extra-fee suggestions (Saudi market — sourced from web research) ──
   type 'monthly' = recurring overhead; 'onetime' = a one-off charge/fine
   that only affects the month it is logged in. amt = typical SAR value. */
const XFEE_SUGGESTIONS = [
  ['Grease trap cleaning', 'monthly', 350],
  ['Pest control contract', 'monthly', 600],
  ['Music / public-performance licensing', 'monthly', 450],
  ['Security guard service', 'monthly', 2800],
  ['Annual license amortized (Balady/CR)', 'monthly', 700],
  ['Equipment maintenance contract', 'monthly', 900],
  ['Loyalty / POS app subscription', 'monthly', 500],
  ['Municipality hygiene fine', 'onetime', 2000],     // 200–4,000 SAR
  ['Health-certificate violation fine', 'onetime', 1000], // 200–2,000 SAR
  ['Staff personal-hygiene fine', 'onetime', 1200],   // 400–2,000 SAR
  ['Civil Defense violation fine', 'onetime', 3000],
  ['Labor office (Qiwa) penalty', 'onetime', 5000],
  ['Signage / advertising violation', 'onetime', 2500],
  ['Equipment breakdown repair', 'onetime', 1800],
];

/* ── Live-market fallback ranges (used if the market API is unreachable).
   Grounded in 2026 Saudi web research; clearly labelled as estimates. */
const MARKET_FALLBACK = {
  note: 'Offline estimates from Saudi market research — connect the live API for city-specific rates.',
  delivery: { label: 'Delivery commission (per order)', lo: 15, hi: 30, unit: '%' },
  deliveryMkt: { label: 'Delivery marketing fee', lo: 2, hi: 6, unit: '%' },
  vat: { label: 'VAT (ZATCA)', lo: 15, hi: 15, unit: '%' },
  electricity: { label: 'Commercial electricity tariff', lo: 0.18, hi: 0.32, unit: 'SAR/kWh' },
  water: { label: 'Commercial water tariff', lo: 6, hi: 9, unit: 'SAR/m³' },
  rentSqm: { label: 'F&B rent (prime/secondary)', lo: 1200, hi: 4500, unit: 'SAR/m²/yr' },
  ingredients: [
    ['fish', 40, 120], ['shrimp', 50, 80], ['chicken', 25, 45], ['beef', 80, 200],
    ['rice', 7, 12], ['vegetables', 6, 15], ['dairy', 18, 35], ['oil', 9, 28],
  ],
};

/* ── UI helpers ─────────────────────────────────────────────── */
function toast(m, k) {
  const t = document.createElement('div');
  t.className = 'toast ' + (k || 'good');
  t.innerHTML = (k === 'bad' ? '▲ ' : '✓ ') + m;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3800);
}
function modal(html) { $('modalhost').innerHTML = `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">${html}</div></div>`; }
function closeModal() { $('modalhost').innerHTML = ''; }
function kpi(l, n, d, cl) { return `<div class="card kpi"><div class="l">${l}</div><div class="n">${n}</div><div class="d ${cl || ''}">${d || ''}</div></div>`; }
function spark(hist, w = 70, h = 22) {
  if (!hist || hist.length < 2) return '';
  const ps = hist.map(x => x.p);
  const mn = Math.min(...ps), mx = Math.max(...ps) || 1, sp = mx - mn || 1;
  const pts = ps.map((p, i) => `${i / (ps.length - 1) * w},${h - 3 - ((p - mn) / sp) * (h - 6)}`).join(' ');
  const up = ps[ps.length - 1] > ps[0];
  return `<svg class="spark" width="${w}" height="${h}"><polyline points="${pts}" fill="none" stroke="${up ? 'var(--coral)' : 'var(--teal)'}" stroke-width="1.8"/></svg>`;
}
