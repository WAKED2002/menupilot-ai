// Vercel serverless function — URL menu extraction
// POST /api/fetch-menu
// Body: { url }
// Returns: { items: [{name, price, category, description}], rawText }

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|th|td|h[1-6]|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL required' });
  }

  // 1. Fetch the page server-side (bypasses browser CORS)
  let rawText = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);

    const html = await response.text();
    rawText = stripHtml(html).slice(0, 10000); // cap at ~3k tokens
  } catch (err) {
    return res.status(502).json({ error: `Could not fetch URL: ${err.message}` });
  }

  if (rawText.length < 50) {
    return res.status(422).json({ error: 'Page returned no readable content — it may be a JavaScript-only SPA. Try pasting the menu text instead.' });
  }

  // 2. Send to Claude for extraction
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are a menu extraction agent for a Saudi restaurant cost system.
Extract every food and drink item from the page text below.
Return ONLY a valid JSON array — no markdown, no explanation.
Each object: { "name": "string", "price": number, "category": "string", "description": "string" }
Rules:
- price: SAR numeric value only (no symbol). If 0 or missing, omit the item.
- category: infer (Starters, Grills, Seafood, Salads, Beverages, Desserts, etc.)
- description: one sentence if visible, else ""
- Include Arabic names if present (keep as-is)
- Exclude non-food entries (hours, addresses, phone numbers)
Output format: [{"name":"...","price":0,"category":"...","description":"..."}]`,
      messages: [{ role: 'user', content: `Extract menu items from this restaurant page text:\n\n${rawText}` }],
    });

    const reply = message.content[0]?.text?.trim() || '[]';
    const jsonMatch = reply.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(200).json({ items: [], rawText });

    let items = [];
    try { items = JSON.parse(jsonMatch[0]); } catch { items = []; }

    // Filter out zero-price items
    items = items.filter(it => it.name && it.price > 0);

    return res.status(200).json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ error: `Claude extraction failed: ${err.message}` });
  }
}
