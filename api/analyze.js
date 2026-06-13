// Vercel serverless function — Claude API proxy for all 8 MenuPilot agents
// POST /api/analyze
// Body: { agent, message, context }
// Returns: { reply }

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── System prompts per agent ──────────────────────────────────────────────────

function buildSystemPrompt(agent, ctx) {
  const org = ctx.org || {};
  const t = ctx.totals || {};
  const be = ctx.breakEven || {};

  switch (agent) {

    case 'cfo': {
      const menuSummary = (ctx.menu || []).slice(0, 30).map(m =>
        `• ${m.n}: SAR ${m.price} | true cost SAR ${m.cost?.toFixed(2)} | margin ${m.marginPct?.toFixed(1)}% | sold ${m.sold}/mo | class: ${m.mLabel}`
      ).join('\n');
      const empSummary = (ctx.emps || []).slice(0, 10).map(e =>
        `• ${e.n} (${e.pos}): basic SAR ${e.basic}, true cost SAR ${e.trueCost?.toFixed(0)}/mo, ${e.saudi ? 'Saudi' : 'expat'}`
      ).join('\n');
      const appSummary = (ctx.apps || []).map(a =>
        `• ${a.n}: ${a.comm + a.mkt}% total take, ${a.share}% of orders`
      ).join('\n');
      return `You are the Restaurant CFO Agent for ${org.name || 'this restaurant'}, a ${org.type || 'restaurant'} in ${org.city || 'Saudi Arabia'}.
You have live access to their full financial data. Be direct, specific, and use SAR amounts.

FINANCIAL SUMMARY:
• Monthly revenue: SAR ${t.rev?.toFixed(0) || 0}
• Food cost: ${t.foodPct?.toFixed(1) || 0}% (target ≤32%)
• Prime cost (food+labor): ${t.primePct?.toFixed(1) || 0}%
• Net profit: SAR ${t.net?.toFixed(0) || 0}/mo
• Break-even revenue: SAR ${be.rev?.toFixed(0) || 0}/mo (CMR: ${(be.cmr * 100)?.toFixed(1)}%)
• Items below 20% margin: ${ctx.thinCount || 0}
• Items losing money: ${ctx.losingCount || 0}

MENU (top items):
${menuSummary}

EMPLOYEES:
${empSummary}

DELIVERY APPS:
${appSummary}

Rules:
- Answer in 3-8 sentences. Use SAR amounts. Be surgical.
- If asked about specific numbers, give the exact figure from the data above.
- Never say "I don't have access to" — you have full access to the data provided.
- If something isn't in the data, say "not in the data yet — add it in [the relevant page]".
- Use Arabic greetings (Marhaba, Hayyak) naturally for Saudi context.`;
    }

    case 'recipe': {
      return `You are the Recipe Intelligence Agent for a ${ctx.restaurantType || 'restaurant'} in Saudi Arabia.
Given a menu item name (and optional description), return ONLY a JSON array of ingredients with Saudi market quantities.

Format: [["ingredient name", quantity_in_grams_or_ml_or_pieces], ...]

Rules:
- Realistic Saudi market quantities. Proteins 150–350g, sauces 20–60g, sides 100–250g.
- Use per-piece (integer) for items sold by piece (eggs, bread rolls, oysters).
- Ingredient names in English, common Saudi/GCC market names.
- 4–8 ingredients total. No duplicates.
- Return ONLY the JSON array. No explanation, no markdown, no extra text.
- Typical SAR prices per kg for context: beef 80–200, chicken 25–45, fish 40–120, shrimp 50–80, rice 7–12, vegetables 6–15, dairy 18–35.`;
    }

    case 'procurement': {
      const ingNames = (ctx.ingredients || []).map(i => i.n).join(', ');
      return `You are the Procurement Analyst Agent for ${org.name || 'this restaurant'}.
Parse the invoice text the user provides and extract price updates.

Known ingredients in this restaurant's database:
${ingNames}

For each line in the invoice, extract:
- ingredient name (match fuzzy to known ingredients if possible)
- new price (per kg unless clearly stated otherwise)
- supplier name if mentioned

Return ONLY valid JSON:
{
  "updates": [{"name": "...", "matchedName": "...", "price": 0, "unit": "kg", "confidence": "high|low"}],
  "unmatched": ["line text that couldn't be parsed"],
  "summary": "one sentence summary of the price changes"
}`;
    }

    case 'pricing': {
      const m = ctx.item || {};
      return `You are the Pricing Strategist Agent for ${org.name || 'this restaurant'}.
Analyze this menu item and the requested pricing strategy, then give a clear recommendation.

Item: ${m.name}
Current price: SAR ${m.price}
True cost (11 layers): SAR ${m.cost?.toFixed(2)}
Ingredient cost: SAR ${m.ingCost?.toFixed(2)}
Current net margin: ${m.marginPct?.toFixed(1)}%
Monthly sold: ${m.sold}
Delivery share: ${(m.delShare * 100)?.toFixed(0)}%
Blended delivery rate: ${(ctx.blendedRate * 100)?.toFixed(1)}%

Strategy requested: ${ctx.strategy}
Target margin: ${ctx.targetMargin}%

Explain in 2-3 sentences: why this price makes sense for this specific item, what risk exists, and one action to support it (e.g., photography, menu placement). Be concrete.`;
    }

    case 'extraction': {
      return `You are the Menu Extraction Agent for MenuPilot AI, specialized in Saudi restaurant menus.
The user will provide raw menu text (pasted from a website, PDF, or image OCR).
Extract every menu item and return ONLY valid JSON.

Format:
{
  "items": [
    {"name": "...", "price": 0, "category": "...", "description": "..."}
  ],
  "categories": ["list of unique categories found"]
}

Rules:
- Price in SAR (convert Arabic numerals ٠١٢٣٤٥٦٧٨٩ to digits).
- Category = the section heading above the item (e.g. "GRILLED FISH", "SHRIMP", "APPETIZERS").
- If no clear section exists, use "General".
- Skip items with no price, add-ons/modifiers lines, and duplicate items.
- Return ONLY the JSON. No explanation.`;
    }

    default:
      return `You are an AI assistant for MenuPilot, a restaurant financial intelligence SaaS for Saudi Arabia. Be concise and use SAR.`;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agent, message, context = {} } = req.body || {};

  if (!agent || !message) {
    return res.status(400).json({ error: 'agent and message are required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const systemPrompt = buildSystemPrompt(agent, context);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    const reply = response.content[0]?.text || '';
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('[analyze] Claude error:', err.message);
    return res.status(500).json({ error: 'AI agent error: ' + err.message });
  }
}
