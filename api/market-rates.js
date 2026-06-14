// Vercel serverless function — live market rate benchmarks
// POST /api/market-rates
// Body: { org, ingredients:[name], rent, blendedDelivery }
// Returns: { note, ingredients:[{key, lo, hi}], delivery:{lo,hi}, generatedAt }
//
// Uses Tavily web search (if TAVILY_API_KEY set) to ground prices in current
// Saudi market data, then Claude to normalize into per-category SAR/kg ranges.
// The client always has a static fallback, so this never blocks the UI.

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = ['fish', 'shrimp', 'chicken', 'beef', 'lamb', 'rice', 'vegetables', 'dairy', 'oil', 'flour', 'cheese', 'coffee'];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const { org = {}, ingredients = [] } = req.body || {};
  const city = org.city || 'Riyadh';
  const type = org.type || 'restaurant';

  // 1. Optional web grounding via Tavily
  let grounding = '';
  try {
    if (process.env.TAVILY_API_KEY) {
      const tv = await fetch('https://api.tavily.com/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `current wholesale food ingredient prices SAR per kg ${city} Saudi Arabia ${new Date().getFullYear()} restaurant delivery commission`,
          max_results: 5, search_depth: 'basic',
        }),
      });
      if (tv.ok) {
        const d = await tv.json();
        grounding = (d.results || []).map(r => `- ${r.title}: ${r.content}`).join('\n').slice(0, 4000);
      }
    }
  } catch { /* non-fatal — fall through to model knowledge */ }

  // 2. Ask Claude to produce category ranges as strict JSON
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a Saudi food-market rate analyst. Return ONLY valid JSON, no markdown.
Give current wholesale price ranges (SAR per kg) for a ${type} in ${city}, Saudi Arabia, plus the typical delivery-app commission band.
Format:
{
  "note": "one sentence on the market right now",
  "delivery": { "lo": number, "hi": number },
  "ingredients": [ { "key": "fish", "lo": number, "hi": number } ]
}
Only use category keys from this list: ${CATEGORIES.join(', ')}.
Base your numbers on the web research below when present; otherwise use realistic 2026 Saudi market knowledge.`,
      messages: [{ role: 'user', content: `Ingredient categories the restaurant buys: ${ingredients.join(', ') || 'general'}.\n\nWeb research:\n${grounding || '(none available — use your market knowledge)'}` }],
    });
    const reply = message.content[0]?.text?.trim() || '{}';
    const match = reply.match(/\{[\s\S]*\}/);
    let parsed = {};
    if (match) { try { parsed = JSON.parse(match[0]); } catch { parsed = {}; } }

    const ings = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.filter(x => x && CATEGORIES.includes(x.key) && x.lo > 0 && x.hi >= x.lo)
      : [];

    return res.status(200).json({
      note: parsed.note || `Market estimate for ${type} in ${city}${grounding ? ' (web-grounded)' : ''}.`,
      delivery: parsed.delivery || { lo: 15, hi: 30 },
      ingredients: ings,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: `Market service error: ${err.message}` });
  }
}
