# AGENTS.md — Castle Packaging Website

A README for coding agents working on this repository. For broader company/product context, see `123Castle-Packaging-Project-Reference.docx` in the parent folder, and `Castle-Packaging-Website-Reference-Guide.docx` (the current, accurate reference for this site — supersedes the outdated `cms-setup-guide.md` inside this repo).

## What this is

The public marketing site for Castle Packaging (eco-friendly paper bag / paper cup / packaging manufacturer, Bengaluru). Plain HTML/CSS/JS, no build step, also a PWA (has a service worker). Pages: `index.html` (Home), `about.html`, `products.html`, `custom-order.html`, `quote.html` (Request a Quote), `contact.html`, `faq.html`, `news.html`, `privacy.html`, `thank-you.html`.

## Environments

| | Sandbox | Production |
|---|---|---|
| Website | `castle-packaging-website-sandbox-o67at.ondigitalocean.app` | `www.castlepkg.com` |
| Firebase project | `castle-erp-sandbox` | `castle-business-suite` |
| GitHub branch | `sandbox` | `main` |

Repo: `castle-packaging-website` (**public**, GitHub account `antonyjohnt18-crypto`). **Push new/untested work to `sandbox` first and verify there before touching `main`.** Note: `main` is not branch-protected here (no PR requirement, no review gate) — nothing stops a direct accidental push, so be deliberate about which branch you're on before every push.

## Content is data-driven, not hardcoded in HTML

Company info and the product catalog live in `data-company.json`, `data-products.json`, `data-news.json`, `data-pages.json`, loaded client-side by `cms-loader.js`. The HTML files carry today's content as a fallback if that fetch fails — so editing a JSON data file is almost always the right move for a content change, not editing the HTML directly, unless the change is to page layout/structure itself (which the CMS can't touch).

### The `/admin` CMS

Content editor at `/admin`, built on Decap CMS via DecapBridge (git-gateway, PKCE auth) — lets the Owner edit company info and the product catalog without touching code. **Its commits land directly on `main`**, bypassing `sandbox` entirely (see `admin/config.yml`) — a config change here is one of the few things in this repo that goes straight to production. Page layout and wording outside the product catalog aren't editable there.

## Integration points with the ERP backend

This site has no backend of its own — it calls the ERP's Express API (`castle-business-suite` repo's `server/`) for anything dynamic:

- **Chatbot widget** (`chat-widget.js` + `chat-config.js`): floating chat bubble backed by `server/routes/chat.js` in the ERP repo. Conversation history persists in the visitor's own `localStorage`, not server-side.
- **Enquiry sync**: `web-enquiry-sync.js` (Quote form) and `contact-enquiry-sync.js` (Contact form) write submissions straight into the ERP's `webEnquiries` Firestore collection — they show up on the ERP's Leads page as "Website Enquiries." A change to either form's fields needs a matching check against what the ERP side expects to read.

Netlify Forms and Netlify Identity are fully retired — don't reintroduce them or reference them as current. The site now runs entirely on DigitalOcean.

## Verify before calling something done

No test suite, no build step.

```bash
node --check path/to/file.js
```

For inline `<script>` in an `.html` file, extract it first (see the ERP repo's AGENTS.md for the exact one-liner), then `node --check` the extraction. Also check for duplicate `id` attributes outside `<script>` blocks — they silently break `getElementById` lookups.

## Deploying a change

A push to `sandbox` auto-deploys `castle-packaging-website-sandbox`; a push to `main` auto-deploys the live production site at `www.castlepkg.com` — treat every `main` push as customer-facing immediately, not staged.

After deploying, hard-verify in-browser: this site registers a service worker, which can serve a stale cached page even after the origin has the new file. If a change doesn't seem to have taken effect, unregister service workers and clear Cache Storage before concluding the deploy failed.

## Key files

| File | Purpose |
|---|---|
| `cms-loader.js` | Loads `data-*.json` client-side into the static HTML |
| `admin/config.yml` | Decap CMS field/collection config — commits land on `main` |
| `data-company.json`, `data-products.json`, `data-news.json`, `data-pages.json` | CMS-editable content |
| `chat-widget.js`, `chat-config.js` | Chatbot widget, backed by the ERP repo's `server/routes/chat.js` |
| `web-enquiry-sync.js`, `contact-enquiry-sync.js` | Write straight into the ERP's `webEnquiries` Firestore collection |
