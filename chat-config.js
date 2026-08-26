// Castle Packaging website — Product Chatbot configuration
//
// This turns on the small chat bubble in the bottom-right corner of every
// page — visitors can ask about products and get answers drafted by
// Claude (Anthropic's AI), grounded only in this site's own product and
// company info (chat.js on the backend reads data-company.json and
// data-products.json live, so the chatbot never drifts out of sync with
// whatever's actually published here). Until this is set up, the chat
// bubble simply doesn't appear — nothing else on the site is affected.
//
// STATUS AS OF 26 AUG 2026: fully wired up — the backend route (chat.js on
// the castle-business-suite-api DigitalOcean app) exists and chat-widget.js
// calls it directly by URL, same pattern as the ERP's Auto-Drafted Replies.
// The only remaining step is turning it ON: set the environment variables
// below in DigitalOcean, then paste the matching secret into this file.
//
// HOW TO SET THIS UP:
//   1. If you haven't already (e.g. for the Business Suite's Auto-Drafted
//      Replies), create a free account at console.anthropic.com and add
//      billing (pay-as-you-go — each chat reply costs a small fraction of
//      a cent; no monthly fee).
//   2. Create an API key there (or reuse the same one from the Business
//      Suite setup — either is fine, they're billed to the same account).
//   3. In DigitalOcean, open the castle-business-suite-api app -> Settings
//      -> App-Level Environment Variables, and add:
//        ANTHROPIC_API_KEY   = the key from step 2 (skip if already set)
//        CHAT_SHARED_SECRET  = any password-like string you make up
//   4. Paste that SAME secret string below, replacing "PASTE_YOUR_SECRET_HERE".
//   5. Saving those environment variables triggers an automatic redeploy;
//      re-upload this file to the website's GitHub repo too.
//
// A note on how this secret works: unlike a login password, this file is
// a plain, public website file — anyone who inspects the page's source
// code could in principle read this secret too. It's sent with each
// request mainly to stop casual, automated abuse of a feature that costs
// you real money per use (a scraper hitting the route directly without
// ever loading the page). It is NOT the same as requiring visitors to log
// in, and a determined visitor could still find it. If you ever see
// unexpected Anthropic charges, the fix is to change this secret (and the
// matching DigitalOcean environment variable) immediately — chat-widget.js
// also caps how many messages one visitor can send per visit, as a second,
// independent limit.

window.CPChatConfig = {
  apiBaseUrl: "https://castle-business-suite-api-iiibs.ondigitalocean.app",
  sharedSecret: "M6gxsLtEdkrwQSc0oExWZtKJ9K5JQO1u",
};

function isChatConfigured() {
  return !!(window.CPChatConfig && window.CPChatConfig.sharedSecret && !String(window.CPChatConfig.sharedSecret).startsWith("PASTE_"));
}
window.isChatConfigured = isChatConfigured;
