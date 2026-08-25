// Castle Packaging website — Product Chatbot (Phase 7 Automation)
//
// Runs on Netlify's servers, never in the browser — the whole reason this
// is a Function and not a straight fetch() from chat-widget.js is so the
// Anthropic API key can live in a server-side environment variable
// instead of sitting exposed in the site's own public JavaScript for
// anyone to read. It calls Anthropic's Claude API to answer visitor
// questions, grounded ONLY in this site's own product and company data
// (data-products.json / data-company.json, bundled in at deploy time) —
// it is instructed never to invent prices, stock, or delivery promises.
//
// Required Netlify environment variables (Site settings -> Environment
// variables, on THIS site's — the website's, not the Business Suite's —
// Netlify dashboard):
//   ANTHROPIC_API_KEY   — from console.anthropic.com. You can reuse the
//                          same key already set up for the Business
//                          Suite's Auto-Drafted Replies, or create a
//                          second one — either works.
//   CHAT_SHARED_SECRET   — any string you make up yourself. See
//                          chat-config.js for why this is a soft
//                          deterrent, not real access control, for a
//                          public-facing chatbot.
// Optional:
//   ANTHROPIC_MODEL — defaults to a fast, inexpensive Claude model;
//                      override if you'd rather use a different one.

const products = require('../../data-products.json');
const company = require('../../data-company.json');

const DEFAULT_MODEL = 'claude-3-5-haiku-20241022';
const MAX_HISTORY_MESSAGES = 12; // last N turns (user+assistant combined) kept, older ones dropped
const MAX_MESSAGE_LENGTH = 600;

function buildSystemPrompt() {
  const productLines = (products.products || [])
    .map((p) => `- ${p.name} (${p.variant}): ${p.description}`)
    .join('\n');
  return `You are a helpful assistant on the Castle Packaging website (castlepkg.com), a paper bag and packaging manufacturer in Bengaluru, India. Answer visitor questions ONLY using the information given below. Keep replies short (2-4 sentences), friendly, and to the point.

Company: ${company.companyName}
Address: ${(company.addressLines || []).join(', ')}
Phone: ${company.phoneDisplay}
Email: ${company.email}

Products we manufacture:
${productLines}

Rules you must follow:
- Never invent or estimate a price, discount, minimum order quantity, or delivery timeline — we don't have fixed rates published, they depend on the order. If asked about pricing, quantity, or delivery, tell the visitor to use the "Request a Quote" page (or WhatsApp us) and we'll get back with exact figures.
- Never claim a product exists that isn't in the list above.
- If a question is unrelated to Castle Packaging's products, packaging in general, or how to get in touch, politely say you can only help with questions about Castle Packaging's products and how to reach us.
- Do not make promises about custom printing turnaround, stock availability, or bulk capacity — direct those questions to Request a Quote or WhatsApp too.
- Keep responses in plain text, no markdown formatting.`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const sharedSecret = process.env.CHAT_SHARED_SECRET;
  if (!apiKey || !sharedSecret) {
    return { statusCode: 501, body: JSON.stringify({ error: 'Chat is not configured yet — ANTHROPIC_API_KEY and CHAT_SHARED_SECRET need to be set in this site\'s Netlify environment variables.' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  if (payload.secret !== sharedSecret) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const incoming = Array.isArray(payload.messages) ? payload.messages : [];
  const messages = incoming
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, MAX_MESSAGE_LENGTH) }));

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return { statusCode: 400, body: JSON.stringify({ error: 'No visitor message to answer.' }) };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 300,
        system: buildSystemPrompt(),
        messages,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Anthropic API error: ' + errText.slice(0, 300) }) };
    }
    const data = await res.json();
    const reply = (data.content || []).map((block) => block.text || '').join('').trim();
    if (!reply) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Anthropic API returned no text.' }) };
    }
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not reach Anthropic API: ' + String((err && err.message) || err) }) };
  }
};
