// ═══════════════════════════════════════════════════════════════
// AGENTS — real Claude API calls via /api/analyze
// Each function replaces the old deterministic JS stub.
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api/analyze';

async function callAgent(agent, message, context = {}) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent, message, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Agent call failed');
  }
  const { reply } = await res.json();
  return reply;
}

// ── Agent A — Menu Extraction ─────────────────────────────────────────────────
// The paste-mode parser (parseMenuText) is fast and deterministic — keep it.
// This function is for URL/PDF mode where we need Claude to process raw content.
async function agentMenuExtraction(rawText) {
  const reply = await callAgent('extraction', rawText, {});
  try {
    const start = reply.indexOf('{');
    const end = reply.lastIndexOf('}') + 1;
    return JSON.parse(reply.slice(start, end));
  } catch {
    throw new Error('Menu extraction returned invalid JSON');
  }
}

// ── Agent B — Recipe Intelligence ─────────────────────────────────────────────
// Replaces the keyword-lookup suggestIngredients() with Claude.
// Falls back to the static lookup on error.
async function agentSuggestIngredients(itemName, description, restaurantType) {
  try {
    const prompt = `Menu item: "${itemName}"${description ? '. Description: ' + description : ''}`;
    const reply = await callAgent('recipe', prompt, { restaurantType });
    const start = reply.indexOf('[');
    const end = reply.lastIndexOf(']') + 1;
    const parsed = JSON.parse(reply.slice(start, end));
    // Validate: array of [string, number]
    if (Array.isArray(parsed) && parsed.every(r => Array.isArray(r) && r.length === 2)) {
      return parsed;
    }
    throw new Error('Invalid recipe format');
  } catch (err) {
    console.warn('[Agent B] Falling back to static lookup:', err.message);
    return suggestIngredients(itemName); // static fallback from core.js
  }
}

// ── Agent C — Cost Analyst ────────────────────────────────────────────────────
// The math stays in JS (cost-engine.js) — it's deterministic and instant.
// Claude is used for narrative explanation when requested.
async function agentCostExplain(menuItem, layersData) {
  const layerText = Object.entries(layersData)
    .map(([k, v]) => `${k}: SAR ${v.toFixed(2)}`)
    .join(', ');
  const prompt = `Explain the cost structure of "${menuItem.n}" (price SAR ${menuItem.price}) in 2-3 sentences. Layers: ${layerText}. What should the owner focus on to improve margin?`;
  return callAgent('cfo', prompt, buildCFOContext());
}

// ── Agent D — Pricing Strategist ─────────────────────────────────────────────
// Math is computed in JS (priceRec). Claude adds narrative rationale.
async function agentPricingRationale(item, strategy, recommendedPrice, blendedRate) {
  const prompt = `Strategy: ${strategy}. Recommended price: SAR ${recommendedPrice.toFixed(2)}. Why is this right for "${item.n}"?`;
  return callAgent('pricing', prompt, {
    item: {
      name: item.n,
      price: item.price,
      cost: cost(item),
      ingCost: ingCost(item),
      marginPct: marginPct(item),
      sold: item.sold,
      delShare: item.delShare,
    },
    strategy,
    targetMargin: window.pSel?.target || 28,
    blendedRate,
  });
}

// ── Agent E — Procurement Analyst ────────────────────────────────────────────
// Replaces the static invMatch() with Claude for smarter parsing.
async function agentParseInvoice(invoiceText) {
  const ingNames = STATE.ings.map(i => i.n);
  try {
    const reply = await callAgent('procurement', invoiceText, {
      ingredients: STATE.ings,
      org: STATE.org,
    });
    const start = reply.indexOf('{');
    const end = reply.lastIndexOf('}') + 1;
    return JSON.parse(reply.slice(start, end));
  } catch (err) {
    console.warn('[Agent E] Falling back to static invoice parser:', err.message);
    return invMatch(invoiceText); // static fallback from pages-app.js
  }
}

// ── Agent H — Restaurant CFO ──────────────────────────────────────────────────
// Fully replaces cfoCore() / cfoAnswer() with real Claude.
async function agentCFO(userMessage) {
  return callAgent('cfo', userMessage, buildCFOContext());
}

// ── Context builder for CFO agent ────────────────────────────────────────────
function buildCFOContext() {
  if (!STATE || !STATE.menu) return {};
  const t = totals();
  const be = breakEven();
  const thin = STATE.menu.filter(m => marginPct(m) < 20 && margin(m) > 0);
  const losing = STATE.menu.filter(m => margin(m) <= 0);

  return {
    org: STATE.org,
    totals: {
      rev: t.rev,
      foodPct: t.foodPct,
      laborPct: t.laborPct,
      primePct: t.primePct,
      net: t.net,
      rentPct: t.rentPct,
    },
    breakEven: { rev: be.rev, cmr: be.cmr, fixed: be.fixed },
    menu: STATE.menu.map(m => ({
      n: m.n, price: m.price,
      cost: cost(m),
      marginPct: marginPct(m),
      sold: m.sold,
      mLabel: mLabel(m),
    })),
    emps: STATE.emps.map(e => ({
      n: e.n, pos: e.pos, basic: e.basic,
      trueCost: empMonthly(e),
      saudi: e.saudi,
    })),
    apps: STATE.apps,
    thinCount: thin.length,
    losingCount: losing.length,
  };
}
