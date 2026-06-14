// ═══════════════════════════════════════════════════════════════
// DB — Supabase-backed persistence layer
// Replaces the old localStorage DB object.
// All functions are async and return {data, error}.
// ═══════════════════════════════════════════════════════════════

const { createClient } = window.supabase;

const SUPABASE_URL  = window.SUPABASE_URL;
const SUPABASE_ANON = window.SUPABASE_ANON;

// Guard: don't crash if env vars weren't injected at build time
const _sbConfigured = SUPABASE_URL && !SUPABASE_URL.startsWith('__') && SUPABASE_URL.startsWith('https://');
let sb = null;
try {
  if (!_sbConfigured) throw new Error('SUPABASE_URL not configured');
  sb = createClient(SUPABASE_URL, SUPABASE_ANON);
} catch (e) {
  console.error('[MenuPilot] Supabase init failed:', e.message, '— set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel environment variables.');
}

// Stub returned when sb is null — lets public pages render, shows error on auth
function _noDb() { return { data: null, error: { message: 'Database not configured — add SUPABASE_URL and SUPABASE_ANON_KEY in your Vercel project settings, then redeploy.' } }; }

// ── Auth ──────────────────────────────────────────────────────────────────────

const DB = {

  // ── Auth ──────────────────────────────────────────────────────
  async signUp(email, password, meta = {}) {
    if (!sb) return _noDb();
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: meta } });
    return { data, error };
  },

  async signIn(email, password) {
    if (!sb) return _noDb();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  async signOut() {
    if (!sb) return { error: null };
    const { error } = await sb.auth.signOut();
    return { error };
  },

  async getUser() {
    if (!sb) return { user: null, error: null };
    const { data: { user }, error } = await sb.auth.getUser();
    return { user, error };
  },

  async getSession() {
    if (!sb) return { session: null, error: null };
    const { data: { session }, error } = await sb.auth.getSession();
    return { session, error };
  },

  onAuthChange(callback) {
    if (!sb) return;
    return sb.auth.onAuthStateChange(callback);
  },

  // ── Organizations ─────────────────────────────────────────────
  async createOrg(org) {
    const { data: { user } } = await sb.auth.getUser();
    const { data, error } = await sb.from('organizations').insert({
      owner_id: user.id,
      name: org.name,
      city: org.city || 'Riyadh',
      country: org.country || 'Saudi Arabia',
      type: org.type || 'Seafood Restaurant',
      website: org.website || '',
      rent: org.rent || 28000,
      waste_pct: org.wastePct || 4,
      plan: org.plan || 'Growth',
    }).select().single();
    return { data, error };
  },

  async getOrg(orgId) {
    const { data, error } = await sb.from('organizations').select('*').eq('id', orgId).single();
    return { data, error };
  },

  async updateOrg(orgId, updates) {
    const { data, error } = await sb.from('organizations').update(updates).eq('id', orgId).select().single();
    return { data, error };
  },

  async getUserOrgs() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return { data: [], error: null };
    const { data, error } = await sb.from('organizations').select('*').eq('owner_id', user.id);
    return { data: data || [], error };
  },

  // ── Branches ──────────────────────────────────────────────────
  async getBranches(orgId) {
    const { data, error } = await sb.from('branches').select('*').eq('org_id', orgId).order('sort_order');
    return { data: data || [], error };
  },

  async setBranches(orgId, names) {
    await sb.from('branches').delete().eq('org_id', orgId);
    if (!names.length) return { error: null };
    const rows = names.map((name, i) => ({ org_id: orgId, name, sort_order: i }));
    const { data, error } = await sb.from('branches').insert(rows).select();
    return { data: data || [], error };
  },

  // ── Menu items ────────────────────────────────────────────────
  async getMenu(orgId) {
    const { data, error } = await sb.from('menu_item_with_recipe').select('*').eq('org_id', orgId);
    return { data: (data || []).map(normalizeMenuItem), error };
  },

  async upsertMenuItem(orgId, item) {
    const row = {
      org_id: orgId,
      name: item.n,
      category: item.cat,
      description: item.desc || '',
      price: item.price,
      labor_min: item.laborMin || 5,
      packaging_cost: item.pack || 1.5,
      monthly_sold: item.sold || 0,
      delivery_share: item.delShare || 0.3,
      status: item.status || 'pending',
      needs_reprice: item.reprice || false,
    };
    if (item._dbId) {
      const { data, error } = await sb.from('menu_items').update(row).eq('id', item._dbId).select().single();
      return { data, error };
    }
    const { data, error } = await sb.from('menu_items').insert({ ...row }).select().single();
    return { data, error };
  },

  async deleteMenuItem(dbId) {
    const { error } = await sb.from('menu_items').delete().eq('id', dbId);
    return { error };
  },

  async setRecipe(menuItemDbId, recipeRows) {
    // recipeRows: [{ingredient_id, quantity}]
    await sb.from('recipes').delete().eq('menu_item_id', menuItemDbId);
    if (!recipeRows.length) return { error: null };
    const { data, error } = await sb.from('recipes').insert(
      recipeRows.map(r => ({ menu_item_id: menuItemDbId, ...r }))
    );
    return { data, error };
  },

  // ── Ingredients ───────────────────────────────────────────────
  async getIngredients(orgId) {
    const { data, error } = await sb.from('ingredient_with_supplier')
      .select('*').eq('org_id', orgId);
    return { data: (data || []).map(normalizeIngredient), error };
  },

  async upsertIngredient(orgId, ing) {
    const row = {
      org_id: orgId,
      supplier_id: ing._supplierId || null,
      name: ing.n,
      unit: ing.unit || 'kg',
      price: ing.price,
      yield_pct: ing.yield || 1.0,
      is_estimate: ing.est !== false,
    };
    if (ing._dbId) {
      const { data, error } = await sb.from('ingredients').update(row).eq('id', ing._dbId).select().single();
      return { data, error };
    }
    const { data, error } = await sb.from('ingredients').insert(row).select().single();
    return { data, error };
  },

  async recordPriceHistory(ingredientDbId, price) {
    const { data, error } = await sb.from('ingredient_price_history').insert({
      ingredient_id: ingredientDbId,
      price,
      source: 'manual',
    });
    return { data, error };
  },

  async getPriceHistory(ingredientDbId) {
    const { data, error } = await sb.from('ingredient_price_history')
      .select('*').eq('ingredient_id', ingredientDbId)
      .order('recorded_at', { ascending: true }).limit(12);
    return { data: data || [], error };
  },

  // ── Suppliers ─────────────────────────────────────────────────
  async getSuppliers(orgId) {
    const { data, error } = await sb.from('suppliers').select('*').eq('org_id', orgId);
    return { data: (data || []).map(s => ({
      _dbId: s.id, n: s.name, cat: s.category,
      terms: s.payment_terms, days: s.delivery_days, rating: s.rating
    })), error };
  },

  async upsertSupplier(orgId, sup) {
    const row = {
      org_id: orgId, name: sup.n, category: sup.cat || '',
      payment_terms: sup.terms || 'Net 15',
      delivery_days: sup.days || '',
      rating: sup.rating || 4.5,
    };
    if (sup._dbId) {
      const { data, error } = await sb.from('suppliers').update(row).eq('id', sup._dbId).select().single();
      return { data, error };
    }
    const { data, error } = await sb.from('suppliers').insert(row).select().single();
    return { data, error };
  },

  // ── Employees ─────────────────────────────────────────────────
  async getEmployees(orgId) {
    const { data, error } = await sb.from('employees').select('*').eq('org_id', orgId);
    return { data: (data || []).map(normalizeEmployee), error };
  },

  async upsertEmployee(orgId, emp) {
    const row = {
      org_id: orgId, name: emp.n, position: emp.pos,
      basic: emp.basic, housing: emp.hous, transport: emp.trans,
      food: emp.food, overtime: emp.ot, gosi_rate: emp.gosi,
      visa_annual: emp.visa, iqama: emp.iqama, medical: emp.med,
      recruitment: emp.recr, is_saudi: emp.saudi || false,
    };
    if (emp._dbId) {
      const { data, error } = await sb.from('employees').update(row).eq('id', emp._dbId).select().single();
      return { data, error };
    }
    const { data, error } = await sb.from('employees').insert(row).select().single();
    return { data, error };
  },

  // ── Government fees ───────────────────────────────────────────
  async getGovFees(orgId) {
    const { data, error } = await sb.from('gov_fees').select('*').eq('org_id', orgId);
    return { data: (data || []).map(g => ({
      _dbId: g.id, id: g.id, n: g.name, auth: g.authority, amt: g.amount, cycle: g.cycle
    })), error };
  },

  async bulkInsertGovFees(orgId, fees) {
    const rows = fees.map(f => ({
      org_id: orgId, name: f.n, authority: f.auth || '', amount: f.amt, cycle: f.cycle || 'Annual'
    }));
    const { data, error } = await sb.from('gov_fees').insert(rows).select();
    return { data: data || [], error };
  },

  async updateGovFee(dbId, amt) {
    const { data, error } = await sb.from('gov_fees').update({ amount: amt }).eq('id', dbId).select().single();
    return { data, error };
  },

  // ── Hidden costs ──────────────────────────────────────────────
  async getHiddenCosts(orgId) {
    const { data, error } = await sb.from('hidden_costs').select('*').eq('org_id', orgId);
    return { data: (data || []).map(h => ({
      _dbId: h.id, id: h.id, n: h.name, grp: h.group_name, amt: h.amount
    })), error };
  },

  async bulkInsertHiddenCosts(orgId, costs) {
    const rows = costs.map(c => ({
      org_id: orgId, name: c.n, group_name: c.grp || 'Operations', amount: c.amt
    }));
    const { data, error } = await sb.from('hidden_costs').insert(rows).select();
    return { data: data || [], error };
  },

  // ── Delivery apps ─────────────────────────────────────────────
  async getDeliveryApps(orgId) {
    const { data, error } = await sb.from('delivery_apps').select('*').eq('org_id', orgId);
    return { data: (data || []).map(a => ({
      _dbId: a.id, n: a.name, comm: a.commission, mkt: a.marketing, share: a.order_share
    })), error };
  },

  async bulkInsertDeliveryApps(orgId, apps) {
    const rows = apps.map(a => ({
      org_id: orgId, name: a.n, commission: a.comm, marketing: a.mkt, order_share: a.share
    }));
    const { data, error } = await sb.from('delivery_apps').insert(rows).select();
    return { data: data || [], error };
  },

  // ── Notifications ─────────────────────────────────────────────
  async getNotifications(orgId) {
    const { data, error } = await sb.from('notifications')
      .select('*').eq('org_id', orgId).eq('is_read', false)
      .order('created_at', { ascending: false }).limit(20);
    return { data: (data || []).map(n => ({
      _dbId: n.id, t: n.title, m: n.message, k: n.kind,
      time: relTime(n.created_at)
    })), error };
  },

  async insertNotification(orgId, { t, m, k }) {
    const { data, error } = await sb.from('notifications').insert({
      org_id: orgId, title: t, message: m, kind: k || 'info'
    });
    return { data, error };
  },

  async clearNotifications(orgId) {
    const { error } = await sb.from('notifications').update({ is_read: true }).eq('org_id', orgId);
    return { error };
  },

  // ── Menu categories ───────────────────────────────────────────
  async getCategories(orgId) {
    const { data, error } = await sb.from('menu_categories').select('*').eq('org_id', orgId).order('sort_order');
    return { data: (data || []).map(c => c.name), error };
  },

  async setCategories(orgId, names) {
    await sb.from('menu_categories').delete().eq('org_id', orgId);
    if (!names.length) return { error: null };
    const rows = names.map((name, i) => ({ org_id: orgId, name, sort_order: i }));
    const { data, error } = await sb.from('menu_categories').insert(rows).select();
    return { data: data || [], error };
  },

  // ── Load full org state into STATE ────────────────────────────
  async loadOrgState(orgId) {
    const [
      { data: org },
      { data: branches },
      { data: menu },
      { data: ings },
      { data: sups },
      { data: emps },
      { data: gov },
      { data: hidden },
      { data: apps },
      { data: notifs },
      { data: cats },
    ] = await Promise.all([
      DB.getOrg(orgId),
      DB.getBranches(orgId),
      DB.getMenu(orgId),
      DB.getIngredients(orgId),
      DB.getSuppliers(orgId),
      DB.getEmployees(orgId),
      DB.getGovFees(orgId),
      DB.getHiddenCosts(orgId),
      DB.getDeliveryApps(orgId),
      DB.getNotifications(orgId),
      DB.getCategories(orgId),
    ]);

    return {
      _orgId: orgId,
      org: {
        name: org.name,
        city: org.city,
        country: org.country,
        type: org.type,
        website: org.website,
        branches: branches.map(b => b.name),
      },
      rent: org.rent,
      rentTerm: org.rent_term || { months: 12, start: curMonth() },
      elec: org.elec || { included: true, amt: 0 },
      water: org.water || { included: true, amt: 0 },
      evalMonth: org.eval_month || curMonth(),
      xfees: org.extra_fees || [],
      wastePct: org.waste_pct,
      plan: org.plan,
      cats,
      menu,
      ings,
      sups,
      emps,
      gov,
      hidden,
      apps,
      notifications: notifs,
      invoices: [],
    };
  },

  // ── Save full STATE back to Supabase ──────────────────────────
  // Called on logout or explicit save. For real-time use upsertMenuItem etc.
  async saveOrgState(orgId, state) {
    await DB.updateOrg(orgId, {
      rent: state.rent,
      rent_term: state.rentTerm || { months: 12 },
      elec: state.elec || { included: true, amt: 0 },
      water: state.water || { included: true, amt: 0 },
      eval_month: state.evalMonth || curMonth(),
      extra_fees: state.xfees || [],
      waste_pct: state.wastePct,
      plan: state.plan,
      name: state.org.name,
      city: state.org.city,
      country: state.org.country,
      type: state.org.type,
      website: state.org.website,
    });
    await DB.setBranches(orgId, state.org.branches);
    await DB.setCategories(orgId, state.cats || []);
  },
};

// ── Normalizers (DB row → STATE shape) ───────────────────────────────────────

function normalizeMenuItem(row) {
  const recipe = (row.recipe || [])
    .filter(r => r && r.ingredient_id)
    .map(r => [r.ingredient_id, r.quantity]);
  return {
    _dbId: row.id,
    id: row.id,
    n: row.name,
    cat: row.category,
    desc: row.description || '',
    price: row.price,
    laborMin: row.labor_min,
    pack: row.packaging_cost,
    sold: row.monthly_sold,
    delShare: row.delivery_share,
    status: row.status,
    reprice: row.needs_reprice,
    recipe,
  };
}

function normalizeIngredient(row) {
  return {
    _dbId: row.id,
    _supplierId: row.supplier_id,
    id: row.id,
    n: row.name,
    sup: row.supplier_name || 'Unassigned',
    unit: row.unit,
    price: row.price,
    yield: row.yield_pct,
    est: row.is_estimate,
    hist: [], // loaded separately on demand
  };
}

function normalizeEmployee(row) {
  return {
    _dbId: row.id,
    id: row.id,
    n: row.name,
    pos: row.position,
    basic: row.basic,
    hous: row.housing,
    trans: row.transport,
    food: row.food,
    ot: row.overtime,
    gosi: row.gosi_rate,
    visa: row.visa_annual,
    iqama: row.iqama,
    med: row.medical,
    recr: row.recruitment,
    saudi: row.is_saudi,
  };
}

function relTime(iso) {
  if (!iso) return 'now';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'now';
  if (h < 24) return h + 'h';
  return Math.floor(h / 24) + 'd';
}
