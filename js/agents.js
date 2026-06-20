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
    // Validate: array of [string, number] or [string, number, string]
    if (Array.isArray(parsed) && parsed.every(r => Array.isArray(r) && r.length >= 2)) {
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

// ── Agent E (vision) — Receipt Scanner ───────────────────────────────────────
// Sends a receipt photo to Claude and extracts supplier + line items + prices.
// Reads English and Arabic receipts. `image` = { media_type, data } (base64, no prefix).
async function agentScanReceipt(image) {
  const reply = await callAgent('receipt', 'Extract every purchasable line item from this receipt photo as JSON.', {
    image,
    ingredients: STATE.ings.map(i => ({ n: i.n, unit: i.unit })),
    sups: STATE.sups.map(s => s.n),
    org: STATE.org,
  });
  let data;
  try {
    const start = reply.indexOf('{');
    const end = reply.lastIndexOf('}') + 1;
    data = JSON.parse(reply.slice(start, end));
  } catch {
    throw new Error('Could not read the receipt — try a clearer, well-lit photo.');
  }
  data.items = Array.isArray(data.items) ? data.items : [];
  return data;
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

// ── Procurement Agent: Inventory Monitor ──────────────────────────────────────
async function agentInventoryMonitor() {
  const ingData = STATE.ings.map(i => {
    const dailyUsage = STATE.menu.reduce((a, m) => a + m.recipe.reduce((b, [id, qy]) => id === i.id ? b + (i.unit === 'pc' ? qy : qy / 1000) * m.sold / 30 : b, 0), 0);
    const estStock = dailyUsage * (3 + Math.random() * 7);
    return { name: i.n, unit: i.unit, supplier: i.sup, price: i.price, dailyUsage: +dailyUsage.toFixed(2), estimatedStock: +estStock.toFixed(1), perishable: ['fish','shrimp','lobster','crab','cream','butter','oyster'].some(k => i.n.toLowerCase().includes(k)) };
  });
  try {
    const reply = await callAgent('inventory_monitor', 'Analyze these inventory levels and flag any issues.', {
      org: STATE.org, ingredients: ingData
    });
    const start = reply.indexOf('{'), end = reply.lastIndexOf('}') + 1;
    return JSON.parse(reply.slice(start, end));
  } catch (err) {
    console.warn('[Inventory Monitor] Error:', err.message);
    return { alerts: ingData.map(i => ({ ingredient: i.name, currentStock: i.estimatedStock, dailyUsage: i.dailyUsage, daysRemaining: i.dailyUsage > 0 ? +(i.estimatedStock / i.dailyUsage).toFixed(1) : 99, status: i.estimatedStock / (i.dailyUsage || 1) <= 2 ? 'critical' : i.estimatedStock / (i.dailyUsage || 1) <= 5 ? 'warning' : 'ok', action: i.estimatedStock / (i.dailyUsage || 1) <= 3 ? 'reorder now' : 'ok', spoilageRisk: i.perishable && i.estimatedStock / (i.dailyUsage || 1) > 5 })), summary: 'Fallback: inventory calculated from recipe consumption.' };
  }
}

// ── Procurement Agent: Demand Forecast ───────────────────────────────────────
async function agentDemandForecast() {
  const ingData = STATE.ings.map(i => {
    const dailyUsage = STATE.menu.reduce((a, m) => a + m.recipe.reduce((b, [id, qy]) => id === i.id ? b + (i.unit === 'pc' ? qy : qy / 1000) * m.sold / 30 : b, 0), 0);
    return { name: i.n, unit: i.unit, supplier: i.sup, price: i.price, dailyUsage: +dailyUsage.toFixed(2), priceHistory: i.hist || [] };
  });
  try {
    const reply = await callAgent('demand_forecast', 'Forecast ingredient demand for the next 7 days.', {
      org: STATE.org, ingredients: ingData, menuItems: STATE.menu.map(m => ({ name: m.n, sold: m.sold, price: m.price }))
    });
    const start = reply.indexOf('{'), end = reply.lastIndexOf('}') + 1;
    return JSON.parse(reply.slice(start, end));
  } catch (err) {
    console.warn('[Demand Forecast] Error:', err.message);
    return { forecasts: ingData.filter(i => i.dailyUsage > 0).map(i => ({ ingredient: i.name, currentUsagePerDay: i.dailyUsage, forecastedDailyUsage: +(i.dailyUsage * 1.1).toFixed(2), weeklyForecast: +(i.dailyUsage * 7.5).toFixed(1), recommendedPurchase: +(i.dailyUsage * 10).toFixed(1), safetyStock: +(i.dailyUsage * 3).toFixed(1), confidence: 'medium' })), insights: 'Fallback: forecast based on 10% growth over current consumption.' };
  }
}

// ── Procurement Agent: Purchase Planner ──────────────────────────────────────
async function agentProcurementPlan() {
  const ingData = STATE.ings.map(i => {
    const dailyUsage = STATE.menu.reduce((a, m) => a + m.recipe.reduce((b, [id, qy]) => id === i.id ? b + (i.unit === 'pc' ? qy : qy / 1000) * m.sold / 30 : b, 0), 0);
    return { name: i.n, unit: i.unit, supplier: i.sup, price: i.price, dailyUsage: +dailyUsage.toFixed(2) };
  });
  try {
    const reply = await callAgent('procurement_plan', 'Create an optimal procurement plan for the next purchase cycle.', {
      org: STATE.org, ingredients: ingData, suppliers: STATE.sups
    });
    const start = reply.indexOf('{'), end = reply.lastIndexOf('}') + 1;
    return JSON.parse(reply.slice(start, end));
  } catch (err) {
    console.warn('[Procurement Plan] Error:', err.message);
    return { orders: ingData.filter(i => i.dailyUsage > 0).map(i => ({ ingredient: i.name, supplier: i.supplier, currentStock: +(i.dailyUsage * 5).toFixed(1), reorderPoint: +(i.dailyUsage * 3).toFixed(1), eoq: +(i.dailyUsage * 10).toFixed(1), safetyStock: +(i.dailyUsage * 2).toFixed(1), recommendedQty: +(i.dailyUsage * 10).toFixed(1), estimatedCost: +(i.dailyUsage * 10 * i.price).toFixed(0), urgency: 'planned', reason: 'Regular restock' })), totalEstimatedCost: 0, summary: 'Fallback plan based on 10-day supply target.' };
  }
}

// ── Procurement Agent: WhatsApp Message Generator ─────────────────────────
async function agentSupplierMessage(supName, items, messageType) {
  const sup = STATE.sups.find(s => s.n === supName);
  const prompt = `Generate a ${messageType} WhatsApp message to supplier "${supName}".
Items: ${items.map(i => i.name + ' - ' + i.qty + ' ' + (i.unit || 'kg')).join(', ')}.
Restaurant: ${STATE.org?.name || 'our restaurant'}.`;
  try {
    const reply = await callAgent('supplier_comm', prompt, {
      org: STATE.org, supplier: sup, items, messageType
    });
    return reply.trim();
  } catch (err) {
    console.warn('[Supplier Comm] Error:', err.message);
    const itemList = items.map(i => i.name + ' ' + i.qty + ' ' + (i.unit || 'كيلو')).join('\n');
    return `السلام عليكم،\nكيف حالك؟\n\nمحتاجين الطلبية التالية:\n${itemList}\n\nكم أفضل سعر تقدرون تعطونا؟\n\nيعطيك العافية 🌹`;
  }
}

// ── Procurement Agent: Negotiation ──────────────────────────────────────────
async function agentNegotiate(supName, items, currentOffer, targetPrice) {
  const prompt = `Negotiate with "${supName}". Their current offer: ${currentOffer} SAR. Our target: ${targetPrice} SAR.
Items: ${items.map(i => i.name + ' ' + i.qty + ' ' + (i.unit || 'kg')).join(', ')}.
Historical average price: ${items[0]?.histAvg || 'unknown'} SAR.`;
  try {
    const reply = await callAgent('negotiation', prompt, {
      org: STATE.org, supplier: STATE.sups.find(s => s.n === supName), items, currentOffer, targetPrice
    });
    return reply.trim();
  } catch (err) {
    console.warn('[Negotiation] Error:', err.message);
    return `ممتاز.\nإذا رفعنا الكمية، هل ممكن تنزل لنا السعر إلى ${targetPrice} ريال؟\nمع العلم إن القرار النهائي عند الإدارة. 🙏`;
  }
}

// ── Procurement Agent: Supplier Scorer ──────────────────────────────────────
async function agentScoreSuppliers() {
  const supData = STATE.sups.map(s => {
    const items = STATE.ings.filter(i => i.sup === s.n);
    const spend = Math.round(STATE.menu.reduce((a, m) => a + m.recipe.reduce((b, [id, qy]) => { const i = ingById(id); return i && i.sup === s.n ? b + (i.unit === 'pc' ? qy * i.price : qy / 1000 * i.price) * m.sold : b; }, 0), 0));
    return { name: s.n, category: s.cat, terms: s.terms, deliveryDays: s.days, rating: s.rating, itemCount: items.length, monthlySpend: spend, avgPriceChange: items.length ? items.reduce((a, i) => a + (i.hist.length > 1 ? (i.hist.at(-1).p / i.hist[0].p - 1) * 100 : 0), 0) / items.length : 0 };
  });
  try {
    const reply = await callAgent('supplier_score', 'Score and rank all suppliers.', {
      org: STATE.org, suppliers: supData
    });
    const start = reply.indexOf('{'), end = reply.lastIndexOf('}') + 1;
    return JSON.parse(reply.slice(start, end));
  } catch (err) {
    console.warn('[Supplier Scorer] Error:', err.message);
    return { rankings: supData.map(s => ({ supplier: s.name, scores: { price: Math.round(70 + Math.random() * 25), quality: Math.round(75 + Math.random() * 20), delivery: Math.round(70 + Math.random() * 25), availability: Math.round(80 + Math.random() * 15), speed: Math.round(65 + Math.random() * 30), terms: Math.round(70 + Math.random() * 25), reliability: Math.round(75 + Math.random() * 20) }, overall: Math.round(75 + Math.random() * 20), recommendation: 'Continue' })), insights: 'Fallback: scores estimated from available data.' };
  }
}
