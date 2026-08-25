// Castle Packaging website — Product Chatbot configuration
//
// This turns on the small chat bubble in the bottom-right corner of every
// page — visitors can ask about products and get answers drafted by
// Claude (Anthropic's AI), grounded only in this site's own product and
// company info (see netlify/functions/chat.js). Until this is set up,
// the chat bubble simply doesn't appear — nothing else on the site is
// affected.
//
// HOW TO SET THIS UP:
//   1. If you haven't already (e.g. for the Business Suite's Auto-Drafted
//      Replies), create a free account at console.anthropic.com and add
//      billing (pay-as-you-go — each chat reply costs a small fraction of
//      a cent; no monthly fee).
//   2. Create an API key there (or reuse the same one from the Business
//      Suite setup — either is fine, they're billed to the same account).
//   3. In THIS site's own Netlify dashboard (the website's, not the
//      Business Suite's — they're two separate Netlify sites), go to Site
//      configuration -> Environment variables and add two entries:
//        ANTHROPIC_API_KEY   = the key from step 2
//        CHAT_SHARED_SECRET  = any password-like string you make up
//   4. Paste that SAME secret string below, replacing "PASTE_YOUR_SECRET_HERE".
//   5. Redeploy the site (Netlify -> Deploys -> Trigger deploy) so the new
//      environment variables take effect.
//
// A note on how this secret works: unlike a login password, this file is
// a plain, public website file — anyone who inspects the page's source
// code could in principle read this secret too. It's sent with each
// request mainly to stop casual, automated abuse of a feature that costs
// you real money per use (a scraper hitting the Function's web address
// directly without ever loading the page). It is NOT the same as
// requiring visitors to log in, and a determined visitor could still find
// it. If you ever see unexpected Anthropic charges, the fix is to change
// this secret (and the matching Netlify environment variable)
// immediately — the chat-widget.js code also caps how many messages one
// visitor can send per visit, as a second, independent limit.

window.CPChatConfig = {
  sharedSecret: "PASTE_YOUR_SECRET_HERE",
};

function isChatConfigured() {
  return !!(window.CPChatConfig && window.CPChatConfig.sharedSecret && !String(window.CPChatConfig.sharedSecret).startsWith("PASTE_"));
}
window.isChatConfigured = isChatConfigured;
