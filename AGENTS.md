# AGENTS.md — Castle Packaging Website

A README for coding agents working on this repository. For broader company/product context, see `123Castle-Packaging-Project-Reference.docx` in the parent folder, and `Castle-Packaging-Website-Reference-Guide.docx` (the current, accurate reference for this site — supersedes the outdated `cms-setup-guide.md` inside this repo).

## What this is

The public marketing site for Castle Packaging (paper bag manufacturer and custom digital printing studio, Bengaluru). Plain HTML/CSS/JS, no build step. It is **not** a PWA any more: `sw.js` is only a clean-up script that unregisters an old broken service worker from earlier visitors' browsers, and `site.js` registers nothing. Pages: `index.html` (Home), `products.html`, `digital-printing.html` (Digital Printing), `for-bag-makers.html` (printing for jute/cloth/paper bag makers, with its own short enquiry form), `quote.html` (Get a Quote — one form for all enquiries), `about.html`, `faq.html`, `news.html`, `contact.html`, `privacy.html`, `thank-you.html`. `custom-order.html` and `printing-service.html` are now tiny redirect pages (to `quote.html` and `digital-printing.html`) kept only so old links keep working.

**Status (Nov 2026): the redesign described below is live on `sandbox` only and is NOT yet on production (`main`).** It was approved in design (home page mockup "Option A") but is still being fine-tuned by the owner.

### Navigation and footer are hand-written in every page

The utility bar, header (`<header class="site-header">`) and footer (`<footer class="site-footer">`) are copied into each of the 11 HTML pages — there is no shared include. Any header or footer change must be made in **all** pages, and the current page needs `aria-current="page"` on its menu link. Header menu: Home, Products, Digital Printing, plus the WhatsApp (green) and Get a Quote (black) buttons. Footer Quick Links: Home, Products, Digital Printing, For Bag Makers, About Us, FAQ, News, Get a Quote, Contact, Privacy Policy. Footer bottom line carries the photo credit "Photos: Magnific" (free licence requires attribution — author details are still missing for the jute, T-shirt, clock and group-bag photos; resolve before production). There is no Terms page, so there is no Terms link.

### Design system (v4, Nov 2026)

One shared `styles.css`, built on CSS variables: gold `#A67C26` / deep gold `#7F5C14` / light gold `#E3C37E`, black `#0B0B0B`, paper `#FBF8F0`, dark `#241C08`. Fonts (Google Fonts): Marcellus for headings, Montserrat for body and labels, Cormorant Garamond italic only for the accent word ("everything", "You stitch. We print."). 8-pt spacing, type scale h1 56 / h2 40 / h3 26 / h4 20 / body 16 / small 13 / label 11, square corners. Legacy inner-page classes (`.breadcrumb-hero`, `.card`, `.product-card`, `.site-form`, `.grid-*`, `.cta-band`) are kept and re-skinned in the same file. Images added for the redesign: `hero-cutout.png`, `hero-jute-cloth.jpg`, `hero-tshirt.jpg`, `svc-paper-bags.jpg`, `svc-digital-printing.jpg`, `svc-rush.jpg`, `bag-makers.jpg`.

### Content rules set by the owner (apply to every page, FAQ, JSON-LD, data files and the chatbot)

- Never say or imply single-pass / one-pass digital printing, a print width (42 cm), a print head, item height limits, or the ink type (water-based, pigment, eco ink). Say only "digital printing" / "full-colour printing".
- Do **not** list what we cannot print anywhere on the website. Non-woven is removed everywhere for now.
- Only the chatbot (Angela) may mention it, and only if a visitor asks about plastic, metal, glass, non-woven or glossy/coated items: "not doing it at the moment, planned for the future" plus a link to the Digital Printing page.
- No minimum order for digital printing (even 1 piece). Rush: only small digital print jobs "can be ready within minutes once artwork is approved"; never promise delivery/courier times. Paper bag and cover sizes, stock and minimums are pending from the owner — say "contact our representative" until then.
- Message focus: paper bag manufacturing; digital printing on finished items (paper/board, bagasse, cloth, jute); businesses and occasions (weddings, birthdays, pooja/housewarming, baby ceremonies, office events, festivals); and trade customers (jute, cloth and paper bag makers: "You stitch. We print.").

### Get a Quote form

`quote.html` keeps the original field ids/names (`name, company, phone, email, product, quantity, printing, message`) and adds `item`, `material`, `needed_by`, `occasion`, `urgent`, `artwork_link` (a link, not a file upload — there is no file storage; artwork can also be sent on WhatsApp). `web-enquiry-sync.js` folds the extra fields into the existing `message` text (via `composeMessage()`), so the ERP Leads inbox needs no change. `for-bag-makers.html` has its own form with the same id `quoteForm` (hidden `product` = "Printing for Bag Makers (trade)", plus `bagtype`). The home page mini-form is a plain GET to `quote.html` that pre-fills item/quantity/needed-by/occasion; `?urgent=1` ticks the urgent box.

## Environments

| | Sandbox | Production |
|---|---|---|
| Website | `castle-packaging-website-sandbox-o67at.ondigitalocean.app` | `www.castlepkg.com` |
| Firebase project | `castle-erp-sandbox` | `castle-business-suite` |
| GitHub branch | `sandbox` | `main` |

> **Known mismatch (verified 4 Nov 2026).** The table above is what the ERP repo expects, but the website is not currently set up that way. `firebase-site-config.js` and `chat-config.js` hold the **sandbox** values (`castle-erp-sandbox`, `castle-business-api-sandbox-pdymm.ondigitalocean.app`) on **both** branches, and the live site `www.castlepkg.com` was confirmed to serve those same sandbox values. So Quote/Contact enquiries and chatbot conversations from the live site go to the sandbox backend, not the production ERP. Last change to that file on `main`: 29 Aug 2026. Do not "fix" this without the owner's decision — find out which project the production ERP (`erp.castlepkg.com`, `castle-business-suite`) is meant to receive enquiries in, then set the production values on `main` only.

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

## Merging `sandbox` into `main` (production) — checklist

Before any merge, remind the owner this list exists and get a clear "yes" at each step:

1. **Protect environment-specific files:** `firebase-site-config.js` and `chat-config.js` are meant to differ between branches (see the mismatch note above). A plain merge can overwrite production's values with sandbox's — review the diff for both and keep production's.
2. **Compare `data-products.json` (and the other `data-*.json`).** The `/admin` CMS commits straight to `main`, so `main` may hold owner edits that `sandbox` lacks. Merge, don't overwrite, and check the Products page afterwards.
3. **Review the whole diff** (`main...sandbox`) and list the files changed.
4. After the deploy, hard-verify on `www.castlepkg.com` (clear cache, check the menu on every page, the new page loads, `sitemap.xml` includes it).
5. Update this file to mark what is now live.

## Verified facts (4 Nov 2026)

- The repo is public. **`main` has no protection:** no classic branch-protection rules and no rulesets (checked in Settings → Branches and Rules), so a direct push to `main` is allowed.
- **DecapBridge:** `admin/index.html` loads Decap CMS from unpkg and `admin/config.yml` uses `git-gateway` with PKCE against `auth.decapbridge.com`, branch `main`. The admin page and the PKCE endpoint respond. A full CMS login was not tested.
- Root `config.yml` is an old Decap copy that still references a Netlify URL; `admin/config.yml` is the live one.

## Verify before calling something done

No test suite, no build step.

```bash
node --check path/to/file.js
```

For inline `<script>` in an `.html` file, extract it first (see the ERP repo's AGENTS.md for the exact one-liner), then `node --check` the extraction. Also check for duplicate `id` attributes outside `<script>` blocks — they silently break `getElementById` lookups.

## Deploying a change

A push to `sandbox` auto-deploys `castle-packaging-website-sandbox`; a push to `main` auto-deploys the live production site at `www.castlepkg.com` — treat every `main` push as customer-facing immediately, not staged.

After deploying, hard-verify in-browser. The site no longer registers a service worker, but a visitor (or your own browser) may still hold an old one or cached pages. If a change doesn't seem to have taken effect, unregister service workers and clear Cache Storage, or fetch the file with `cache: 'no-store'`, before concluding the deploy failed.

## Key files

| File | Purpose |
|---|---|
| `cms-loader.js` | Loads `data-*.json` client-side into the static HTML |
| `admin/config.yml` | Decap CMS field/collection config — commits land on `main` |
| `data-company.json`, `data-products.json`, `data-news.json`, `data-pages.json` | CMS-editable content |
| `chat-widget.js`, `chat-config.js` | Chatbot widget, backed by the ERP repo's `server/routes/chat.js` (Angela's greeting updated Nov 2026; her instructions in `server/routes/chat.js` and `server/lib/chat-catalog-rules.js` are updated in the owner's local ERP copy but not yet deployed) |
| `web-enquiry-sync.js`, `contact-enquiry-sync.js` | Write straight into the ERP's `webEnquiries` Firestore collection |
| `firebase-site-config.js` | Firebase project the enquiry sync writes to (branch-specific; see mismatch note) |
| `digital-printing.html`, `for-bag-makers.html`, `quote.html` | The three focus pages (printing on finished items; trade printing for bag makers; the single enquiry form) |
| `sitemap.xml`, `robots.txt`, `llms.txt` | Search-engine and AI-crawler files; add new pages to `sitemap.xml` and `llms.txt` (both already list the new pages; the old two URLs were replaced) |
| `sw.js` | Clean-up script only; registers nothing |
| `config.yml` (root) | Stale Decap copy; the live one is `admin/config.yml` |

## Product photo format

Product photos are JPEG, not PNG (converted for performance). When changing or adding a product photo, update the path in `data-products.json` — that JSON is what `products.html` actually renders from client-side; the hardcoded `<img>` tags in the HTML and any JSON-LD `image` URLs in `products.html` are only the no-JS fallback. Editing the HTML alone looks complete in a diff but changes nothing a visitor with JS enabled ever sees. Each product entry's `"image"` line in `data-products.json` has no trailing comma (it's the last property in the object; the comma belongs to the following line) — don't assume it matches the comma pattern used elsewhere in this repo's JSON-LD blocks.
