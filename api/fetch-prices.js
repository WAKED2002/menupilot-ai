// Vercel serverless function — ingredient / supplier price-list extraction
// POST /api/fetch-prices
// Body: { url }   (or { text } to skip fetching)
// Returns: { items: [{ name, price, unit, supplier }], count }

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
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  const { url, text } = req.body || {};
  let rawText = (text || '').slice(0, 10000);

  if (!rawText) {
    if (!url || !url.startsWith('http')) return res.status(400).json({ error: 'Valid URL or text required' });
    try {
      if (process.env.TAVILY_API_KEY) {
        const tv = await fetch('https://api.tavily.com/extract', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, urls: [url], format: 'text' }),
        });
        if (tv.ok) {
          const d = await tv.json();
          const content = d.results?.[0]?.raw_content || d.results?.[0]?.content || '';
          if (content.length > 50) rawText = content.slice(0, 10000);
        }
      }
      if (!rawText) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const r = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36', 'Accept-Language': 'ar,en;q=0.9' },
        });
        clearTimeout(timeout);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        rawText = stripHtml(await r.text()).slice(0, 10000);
      }
    } catch (err) {
      return res.status(502).json({ error: `Could not fetch URL: ${err.message}` });
    }
  }

  if (rawText.length < 30) return res.status(422).json({ error: 'No readable content — paste the price list text instead.' });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You extract a restaurant INGREDIENT / supplier price list for a Saudi restaurant cost system.
Return ONLY a valid JSON array — no markdown, no explanation.
Each object: { "name": "string", "price": number, "unit": "kg|pc|L", "supplier": "string" }
Rules:
- price: SAR numeric per unit (no symbol). Omit items with no price.
- unit: "kg" for weight-priced goods, "pc" for items sold per piece, "L" for liquids. Default "kg".
- supplier: only if clearly stated, else "".
- Keep Arabic ingredient names if that is all that is present.
- Exclude prepared menu dishes, headings, totals, phone numbers and addresses.`,
      messages: [{ role: 'user', content: `Extract the ingredient price list from this text:\n\n${rawText}` }],
    });
    const reply = message.content[0]?.text?.trim() || '[]';
    const match = reply.match(/\[[\s\S]*\]/);
    let items = [];
    if (match) { try { items = JSON.parse(match[0]); } catch { items = []; } }
    items = items.filter(it => it.name && it.price > 0);
    return res.status(200).json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ error: `Extraction failed: ${err.message}` });
  }
}
