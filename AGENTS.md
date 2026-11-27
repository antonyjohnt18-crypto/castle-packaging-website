# AGENTS.md — Castle Packaging Website

A README for coding agents working on this repository. For broader company/product context, see `123Castle-Packaging-Project-Reference.docx` in the parent folder, and `Castle-Packaging-Website-Reference-Guide.docx` (the current, accurate reference for this site — supersedes the outdated `cms-setup-guide.md` inside this repo).

## What this is

The public marketing site for Castle Packaging (paper bag manufacturer and custom digital printing studio, Bengaluru). Plain HTML/CSS/JS, no build step. It is **not** a PWA any more: `sw.js` is only a clean-up script that unregisters an old broken service worker from earlier visitors' browsers, and `site.js` registers nothing. Pages: `index.html` (Home), `products.html`, `digital-printing.html` (Digital Printing), `for-bag-makers.html` (printing for jute/cloth/paper bag makers, with its own short enquiry form), `quote.html` (Get a Quote — one form for all enquiries), `about.html`, `faq.html`, `news.html`, `contact.html`, `privacy.html`, `terms.html` (Terms & Order Policy), `thank-you.html`. `custom-order.html` and `printing-service.html` are now tiny redirect pages (to `quote.html` and `digital-printing.html`) kept only so old links keep working.

**Status (Nov 2026): the redesign described below is live on `sandbox` only and is NOT yet on production (`main`).** It was approved in design (home page mockup "Option A") but is still being fine-tuned by the owner.

### Navigation and footer are hand-written in every page

The utility bar, header (`<header class="site-header">`) and footer (`<footer class="site-footer">`) are copied into each of the 12 HTML pages — there is no shared include. Any header or footer change must be made in **all** pages, and the current page needs `aria-current="page"` on its menu link. Header menu: Home (icon), About Us, Products, Printing ▾ (Digital Printing, For Bag Makers), Contact, plus the WhatsApp icon (green) and Quote (black) buttons; hamburger menu below 1100 px. The top utility bar reads "Crafted and Printed in Bengaluru". Footer Quick Links: Home, Products, Digital Printing, For Bag Makers, About Us, FAQ, News, Get a Quote, Contact, Privacy Policy, Terms & Order Policy (shown as two columns on desktop via the "footer align v6" CSS blocks). Footer bottom line carries the photo credit "Photos: Magnific" (free licence requires attribution — author details are still missing for the jute, T-shirt, clock and group-bag photos; resolve before production). The Terms & Order Policy page (`terms.html`) is linked from every footer.

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

### Content editing (Decap CMS and DecapBridge retired 24 Nov 2026)

The old `/admin` content editor (Decap CMS via DecapBridge) was removed from `sandbox` on 24 Nov 2026 because it was broken (expired GitHub token, stale Netlify login address) and the owner does not edit pages by hand. It was removed from `main` as well on 24 Nov 2026 (owner approved a direct production change). Content changes are made by editing the `data-*.json` files or the HTML in GitHub. The planned replacement is an ERP feature for the standard bag and cover sizes: an Item Master tick ("Show on size chart") plus a Publish action that commits `data-stock.json` to this repo (sandbox ERP to `sandbox`, production ERP to `main`). Do not reintroduce Decap, DecapBridge or Netlify Identity.

## Integration points with the ERP backend

This site has no backend of its own — it calls the ERP's Express API (`castle-business-suite` repo's `server/`) for anything dynamic:

- **Chatbot widget** (`chat-widget.js` + `chat-config.js`): floating chat bubble backed by `server/routes/chat.js` in the ERP repo. Conversation history persists in the visitor's own `localStorage`, not server-side.
- **Enquiry sync**: `web-enquiry-sync.js` (Quote form) and `contact-enquiry-sync.js` (Contact form) write submissions straight into the ERP's `webEnquiries` Firestore collection — they show up on the ERP's Leads page as "Website Enquiries." A change to either form's fields needs a matching check against what the ERP side expects to read.

Netlify Forms and Netlify Identity are fully retired — don't reintroduce them or reference them as current. The site now runs entirely on DigitalOcean.

## Merging `sandbox` into `main` (production) — checklist

Before any merge, remind the owner this list exists and get a clear "yes" at each step:

1. **Protect environment-specific files:** `firebase-site-config.js` and `chat-config.js` are meant to differ between branches (see the mismatch note above). A plain merge can overwrite production's values with sandbox's — review the diff for both and keep production's.
2. **Compare `data-products.json` (and the other `data-*.json`).** Before 24 Nov 2026 the Decap `/admin` committed straight to `main`, so `main` may hold owner edits that `sandbox` lacks. Merge, don't overwrite, and check the Products page afterwards. `/admin` was deleted on both `sandbox` and `main` on 24 Nov 2026, so no `admin/` folder should exist after a merge; confirm `/admin/` returns 404 after deploy.
3. **Review the whole diff** (`main...sandbox`) and list the files changed.
4. After the deploy, hard-verify on `www.castlepkg.com` (clear cache, check the menu on every page, the new page loads, `sitemap.xml` includes it).
5. Update this file to mark what is now live.
6. **Complete the Security section's "Before production" and "After production" checklists.** Do not merge until the "Before production" items are ticked.

## Verified facts (4 Nov 2026)

- The repo is public. **`main` has no protection:** no classic branch-protection rules and no rulesets (checked in Settings → Branches and Rules), so a direct push to `main` is allowed.
- **DecapBridge (retired 24 Nov 2026):** the `admin/` folder is gone from `sandbox`. The DecapBridge site was deleted on 24 Nov 2026. Still for the owner: revoke the old GitHub token it used (github.com/settings/tokens).
- The old root `config.yml` was deleted on 22 Nov 2026.

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
| `admin/` | Removed on `sandbox` and `main` (24 Nov 2026) |
| `data-company.json`, `data-products.json`, `data-news.json`, `data-pages.json` | Content data files (edited in GitHub) |
| `chat-widget.js`, `chat-config.js` | Chatbot widget, backed by the ERP repo's `server/routes/chat.js` (Angela's greeting updated Nov 2026; her instructions in `server/routes/chat.js` and `server/lib/chat-catalog-rules.js` are updated in the owner's local ERP copy but not yet deployed) |
| `web-enquiry-sync.js`, `contact-enquiry-sync.js` | Write straight into the ERP's `webEnquiries` Firestore collection |
| `firebase-site-config.js` | Firebase project the enquiry sync writes to (branch-specific; see mismatch note) |
| `digital-printing.html`, `for-bag-makers.html`, `quote.html` | The three focus pages (printing on finished items; trade printing for bag makers; the single enquiry form) |
| `sitemap.xml`, `robots.txt`, `llms.txt` | Search-engine and AI-crawler files; add new pages to `sitemap.xml` and `llms.txt` (both already list the new pages; the old two URLs were replaced) |
| `sw.js` | Clean-up script only; registers nothing |
| `config.yml` (root) | Deleted 22 Nov 2026 |

## Product photo format

Product photos are JPEG, not PNG (converted for performance). When changing or adding a product photo, update the path in `data-products.json` — that JSON is what `products.html` actually renders from client-side; the hardcoded `<img>` tags in the HTML and any JSON-LD `image` URLs in `products.html` are only the no-JS fallback. Editing the HTML alone looks complete in a diff but changes nothing a visitor with JS enabled ever sees. Each product entry's `"image"` line in `data-products.json` has no trailing comma (it's the last property in the object; the comma belongs to the following line) — don't assume it matches the comma pattern used elsewhere in this repo's JSON-LD blocks.

## Other forms (sandbox redesign)

- **For Bag Makers form** (`for-bag-makers.html`, `#quoteForm`, synced by `web-enquiry-sync.js`): name*, business name, phone*, email, `bagtype`* (Jute/Cloth/Paper/More than one), `bagsize`, `designs`*, `quantity`* (pieces per design, min 1, hidden `qty_unit`), `urgent` checkbox (always available; enables `needed_by` with the 5:30 pm IST same-day rule), `printing` (artwork select), `artwork_link`, `message`. Inline script at the end of the form handles the urgent/date logic.
- **Contact form** (`contact.html`, `#contactForm`, synced by `contact-enquiry-sync.js`): name*, phone (optional; Firestore fallback "Not provided"), email*, `topic`* dropdown, `order_ref` (shown only for "An existing order"), `message`*. `contact-enquiry-sync.js` prepends "Topic: ..." and "Order/invoice: ..." to the message.

## Home flow, products and stock (sandbox redesign)

**Header (all pages, markup duplicated per page):** nav order is Home (house icon, label "Home" shown only in the mobile menu), About Us, Products, Printing ▾, Contact. "Printing" is a dropdown (button `.dd-btn` inside `.dd`; menu `.dd-menu`) holding Digital Printing and For Bag Makers; it opens on click, closes on outside click or Esc (handler in `site.js`), is highlighted (`.dd.on`) on both child pages, and expands inline inside the hamburger menu on phones. When adding or renaming nav items, update all 12 pages (index, products, digital-printing, for-bag-makers, about, faq, news, contact, privacy, quote, thank-you, terms); the footer Quick Links are separate and unchanged. WhatsApp button is icon-only; the Get a Quote button reads "Quote" (aria-label "Get a Quote"). The menu collapses to the hamburger at max-width 1100px. Favicons: `favicon.png` (gold castle on black rounded square), `favicon.ico`, `apple-touch-icon.png`; the old `favicon.svg` link was removed from all pages.

**Home page order (index.html):** hero (paper-bag-first headline, sub-line, three-photo collage, checkmark list) → dark proof bar with icons (1 piece, Full colour, In-house, Rush) → What we do (3 cards) → 01 Paper bag manufacturing (`#paper-bags`, cream, two cards: made to your size / standard sizes, "View size chart" → `products.html#sizes`) → 02 Digital printing (`#catalogue`, class `cat plain`, white, no spec table) → 03 Rush & last-minute (`#rush`, dark) → Who we serve → For bag makers → How it works → closing "Get a quote" section (cream; general copy). Keep this 01/02/03 flow. "For Bag Makers" is the agreed trade label everywhere (not "B2B"/"For Business").

**Home positioning (24 Nov 2026, owner decision):** the home page must read as a paper bag manufacturer first; digital printing is the supporting service, not the headline. Applied so far: hero h1 "Your paper bags, *made to size* and printed with your brand."; sub-line "Manufactured in Bengaluru. Digital printing on finished items from one piece, with rush orders for events."; page title "Paper Bag Manufacturer in Bengaluru | Castle Packaging"; meta and og description start with "Paper bag manufacturer in Bengaluru"; hero collage = woman with printed bags, jute and cloth totes (`hero-jute-cloth.jpg`), white Castle bag (`photo-bag-custom.png`, caption "Printed with your logo"); "Who we serve" heading "Paper bags for every business and every occasion." with bag-use tags (shopping bags and covers, bakery/cake/takeaway bags, return-gift and thamboolam bags, etc.). Do not reintroduce a printing-first headline or T-shirt hero photo. Owner decision (24 Nov 2026): leave the small tag above the h1, the dark proof bar and the How it works steps exactly as they are. No further home page rewording is pending; do not change them unless the owner asks.

**Home closing form (`#homeQuote`, GET to quote.html):** name*, phone*, item*, quantity* then Continue. Name and phone are NOT in the URL: the inline script stores them in sessionStorage (`cp_n`, `cp_p`) and quote.html fills and clears them; item goes into the message, quantity into the quantity field.

**Spacing:** sections use 64px vertical padding (48px on phones) and 34px h2 on desktop ("compact sections" block at the end of styles.css). Material photo boxes use equal `.mphoto` 3:2 boxes in a 4-column grid with equal gaps.

**Products page and stock data:**
- `data-stock.json` is the single list of ready-stock sizes (groups: brown-bag 100 gsm, white-bag 120 gsm, brown-cover 80 gsm; each item has name, w, h, g and status `in_stock | limited | out_of_stock`). `products.html` (size chart `#sizes`, `#szGrid`) and `quote.html` (standard-size dropdowns) both read it, with the old hardcoded lists as fallback. Out-of-stock sizes are struck through on the chart and hidden from the quote dropdowns. The ERP stock sync will write this file later. Angela's rules in the ERP repo (`server/lib/chat-catalog-rules.js`) still hold their own copy of the size lists — keep them in step until she reads ERP stock.
- `data-products.json` cards: Recycled Paper Bags — Brown (100 gsm), Paper Bags — White (virgin, 120 gsm), Recycled Paper Covers — Brown (80 gsm), Made to Your Specification, Paper Tissues, Digital Printing, Printing for Bag Makers. Paper Cups and the old Kraft/Recycled/Virgin cards were removed; the static fallback cards, meta tags and JSON-LD in products.html match.
- **Wording rules:** "recycled" is used only for the brown products (kraft = recycled). White paper is virgin — never call it recycled; position it as the best choice for multicolour printing, and recycled brown as the affordable choice. Only make verifiable green claims (plastic-free, recyclable after use); avoid vague "eco-friendly". Do not mention the 60–140 gsm custom range on the website; custom orders say "your size, your paper".
- **Merge note:** when promoting to main, merge `data-products.json` and `data-stock.json` carefully (the ERP CMS may write them) and re-verify the Products page and Quote form after deploy.

## Legal pages and policies (sandbox redesign)

- Pages: `faq.html` (18 Q&As + FAQPage JSON-LD — keep the JSON-LD in step with the visible answers), `privacy.html`, and `terms.html` (Terms & Order Policy). A "Terms & Order Policy" link sits after "Privacy Policy" in the footer of every page, and `sitemap.xml` lists terms.html.
- Business facts stated in these pages: Castle Packaging is a **proprietorship** based in Bengaluru. Payment is **UPI only** (no online/card payment, no card details collected). Work starts only after the customer confirms the order **and pays a 50% advance**. Cancellation is possible **before printing starts**; **no refunds**; defective pieces are **replaced**. **Delivery is arranged by the customer**; if Castle arranges it, the customer pays for it. Grievances go to the owner at info@castlepkg.com.
- Assumed, not given by the owner (review with a lawyer/CA before production): treatment of the advance on cancellation, no fixed defect-reporting window, governing law India / Bengaluru courts, DPDP wording, no named grievance officer.
- Privacy "Third-Party Services We Use" must match what is really used: DigitalOcean (hosting), Google Firebase (form and chat storage), Anthropic (Angela), ipinfo.io (server-side location estimate in chat), Google Maps (Contact page), Google Fonts, WhatsApp, Instagram/Facebook/X links. Add a line whenever a new external service is loaded. The Advertising section is forward-looking only; no ad scripts are loaded.
- Update "Last updated" on privacy.html and terms.html whenever their content changes.
- **Angela (chatbot):** she does not need to know the payment, advance, cancellation, refund or delivery policy. If a visitor asks about these, she redirects them to the sales team (the team confirms) and captures the lead as usual. Do not add these policies to her rules.

## Header, About and contact layout (sandbox redesign)

- Top bar line on every page: "Crafted and Printed in Bengaluru" (`.util` strip, hand-written in each page's HTML).
- About page: the visible copy lives both in `about.html` (static fallback) and `data-pages.json` → `about` (overrides at runtime via `data-cms="pages.about.*"`). Edit both together. No cups, no "plastic alternative" claims, no 360° wording; brown kraft = recycled, white = virgin.
- Contact page: form on the left, address/details card on the right (aligned), full-width Google Map below filling the section (`.map-full`).
- Mobile polish (v5/v5b/v5c blocks at the end of styles.css): all pages tested at 390 px with no horizontal overflow, 44 px tap targets, 16 px form fonts; hamburger menu below 1100 px. The home page and the Bag Makers form are long on mobile by design.

## Security (added Nov 2026 — applies to sandbox AND production)

An outside check of the sandbox (22 Nov 2026) found the site is HTTPS-only behind Cloudflare, with no exposed `.git`/`.env`, but the gaps below. **This section must be kept when `sandbox` is merged into `main`, and every item in "Before production" and "After production" must be done and ticked off.**

### Standing rules
(Repo is public — see below.)
- **Public by design:** `firebase-site-config.js` web keys are not secrets — the real protection is the Firestore security rules. `chat-config.js` contains a "shared secret" that is readable by anyone in the browser; it protects nothing. Never rely on it and never put real secrets (API keys, service accounts, tokens) in this repo.
- Do not edit `firebase-site-config.js` or `chat-config.js` during a merge (each environment has its own values).
- The Decap `admin/` folder has been retired; there is no CMS config to check on merge. Make sure `admin/` is deleted on `main` after promotion.
- **The GitHub repo is public**, so everything committed (including `AGENTS.md`) is readable by anyone — never write secrets, passwords, tokens or customer data into the repo or this file. Blocking `/AGENTS.md` on the website is only tidiness, not protection. Delete the outdated internal files `cms-setup-guide.md` and the old root `config.yml` (not the `admin/` copy).
- Keep the privacy page's "Third-Party Services We Use" list in step with what the site really loads.

### Sandbox — do now
1. (Done 22 Nov 2026, now obsolete) `admin/config.yml` was set to `sandbox`; the whole `admin/` folder was deleted on 24 Nov 2026.
2. Delete `cms-setup-guide.md` and the old root `config.yml` (an old Netlify-era Decap copy; the live one is `admin/config.yml`).
3. Chat server (ERP repo, sandbox API): accept requests only from the sandbox site origin and castlepkg.com; add per-IP and per-session rate limits, a maximum message length and a per-conversation message cap.
4. Set a monthly spend limit on the Anthropic API key used by the sandbox chat.
5. Firebase sandbox project (`castle-erp-sandbox`) → Firestore rules: public may only **create** documents in `webEnquiries` and the contact collection (with field and size checks); no public read, list, update or delete. Test by trying a public read — it must fail.
6. Turn on 2FA for GitHub, DigitalOcean, Firebase/Google and Anthropic accounts.
6a. GitHub repo → Settings → turn on **secret scanning and push protection**, and check Dependabot/security alerts are enabled.
7. Re-run the outside check (headers and sensitive paths) and record the result here.

### Before production (checklist — do not promote until done)
- [ ] `/admin/` returns 404 on production (deleted from `main` on 24 Nov 2026); `firebase-site-config.js` and `chat-config.js` untouched.
- [ ] Production Firebase project has the same locked-down Firestore rules as sandbox (public create-only, no public read/list/update/delete).
- [ ] Production chat API: origin allow-list is castlepkg.com only (sandbox origin removed), rate limits on, Anthropic spend limit set, production uses its own value in `chat-config.js`.
- [ ] Cloudflare (castlepkg.com): HSTS on; response headers `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`; optional WAF rule hiding `/AGENTS.md` (cosmetic only); Content-Security-Policy added as report-only first (site uses Google Fonts, Firebase, Google Maps and the chat API).
- [ ] **Branch protection on `main`** (Settings → Rules): require a pull request, block force-push and deletion. Currently `main` has no protection (checked 4 Nov 2026). The Decap CMS no longer commits to `main`. If the planned ERP publish feature commits `data-stock.json` to `main` with a token, allow that path (for example a bypass for that token) and test a publish.
- [ ] 2FA on every account above, including Cloudflare and the domain registrar.
- [ ] This Security section is present in main's AGENTS.md.

### After production (verify within 24 hours)
- [ ] Headers present on https://www.castlepkg.com (HSTS, nosniff, X-Frame-Options, Referrer-Policy).
- [ ] `/cms-setup-guide.md` and root `/config.yml` return 404 (deleted); `/.git/config` and `/.env` return 404. (`/AGENTS.md` stays reachable because the repo is public — that is accepted.)
- [ ] A public Firestore read/list is rejected; a test enquiry and a test contact message still save.
- [ ] Chat works from castlepkg.com and is rejected from another origin; rate limit triggers.
- [ ] `/admin/` returns 404 on production. DecapBridge site deleted and its GitHub token revoked by the owner.
- [ ] Review the Content-Security-Policy report-only results, then enforce it.
- [ ] Update this section with the date checked and any findings.

### Security status log
- **22 Nov 2026 (sandbox):** done — `admin/config.yml` branch set to `sandbox` (must be `main` on `main`); `cms-setup-guide.md` and the old root `config.yml` deleted (now 404); `.git`/`.env` return 404; GitHub secret protection and push protection already ON (dependency scanning/Dependabot off — the site has no packages). Still open on sandbox: chat server origin allow-list/rate limits and Anthropic spend limit (ERP repo/console), Firestore rules check (Firebase console), 2FA on all accounts. Headers (HSTS, nosniff, X-Frame-Options, Referrer-Policy) cannot be set on the sandbox URL; do them on castlepkg.com in Cloudflare before production.
- **24 Nov 2026 (sandbox):** Decap CMS retired: `admin/config.yml` and `admin/index.html` deleted from `sandbox`. `admin/` was also deleted from `main` with the owner's approval, and the DecapBridge site was deleted. Still to do by the owner: revoke the old GitHub token used by DecapBridge.


## Form validation and spam rules (22 Nov 2026)

- **Mobile number and Email are mandatory** on Get a Quote (`quote.html`), For Bag Makers, and Contact; the home quick-quote requires the mobile number (email is asked on the Quote page). Labels read "Mobile number *" and "Email *".
- **Level 1 format check** (HTML `pattern`, no JavaScript): Indian mobile = 10 digits starting 6-9, optional `+91`/`91`/`0` prefix, optional single space or hyphen after the prefix and in the middle (`98765 43210`, `+91 98765 43210`). Email must have text, `@`, a domain and a dot. Patterns avoid character classes with `-` and `.` because browsers compile `pattern` with the `v` flag. Keep the pattern identical on every form.
- This is a format check only — it cannot prove the number is real or belongs to the visitor. Real verification would need an OTP service (not built).
- **Honeypot:** every enquiry form has a hidden `bot-field`; `web-enquiry-sync.js` and `contact-enquiry-sync.js` skip the Firestore write when it is filled (the visitor is still sent to the thank-you page). Do not remove the field or the check.
- Still to do for spam: Firebase budget alert and Firebase App Check (monitor mode first) before production.

## Angela chat widget design (24 Nov 2026)

`chat-widget.js` injects its own CSS. The visible design is the **black and gold** version approved by the owner (chosen over a cream and gold option because it is more visible): square corners, hairline `--line` borders, Marcellus for the name and Montserrat for text, small uppercase tracked labels and buttons, black header with a gold bottom rule and a black "A" tile with a gold border, white bot bubbles, black customer bubbles with white text, black Send button (gold-deep on hover), square black launcher with a gold border and gold-light icon. The details form is a collapsed bar ("Leave your number and we'll get back to you") that opens on tap. Angela's `**bold**` is rendered as bold (everything else is escaped; no other markdown). The redesign rules are an override block in the style array labelled "widget redesign (Nov 2026)", placed after the base rules; edit that block, not the older base rules. The panel fits the screen on phones (left/right 12px). Subtitle is "Packaging assistant" (a longer subtitle gets cut off in the header). Keep the widget on the site design tokens in `styles.css`.


## Website Control (ERP) edits this site's text and page visibility (27 Nov 2026, sandbox)

The ERP menu **Website Control** (CRM, sandbox first) is the backend for this website. One row of tabs: Page control (first), then one tab per page in menu order (Home, About, Products, Digital printing, For bag makers, Get a quote, FAQ, News and updates, Contact, Terms, Privacy), then E-commerce. The Products tab holds the page wording plus the ready-size chart. Only the Owner publishes; edits are drafts first.

What the ERP writes into THIS repo (never hand-edit these while the ERP owns them): data-pages.json (page text under pages.<page>.<key> plus a hidden map), data-stock.json (ready sizes: name, size, handle, status; no pack size, no quantities), sitemap.xml (regenerated when page visibility changes).

How the site uses it: cms-loader.js reads data-pages.json and fills elements marked data-cms="pages.<page>.<key>" (textContent only). A page is only editable from the ERP if its HTML has those markers. Wired today: about.html (18 keys) and quote.html (2 keys). Home, FAQ, Contact, Products wording, Digital printing, For bag makers, Terms and Privacy are plain HTML and still to be wired (one page at a time: add markers, then add the page to FIELDS in the ERP server/lib/website-content.js).

Hidden pages: cms-loader.js removes links to hidden pages, adds noindex,nofollow, and shows a "This page is coming soon" notice with a Back to Home button (no redirect). Home cannot be hidden. Hiding is script-based on a static site, so a brief flash is possible and it is not for secrets.

Content rules still apply to anything typed in the ERP (publish is blocked by a rules check): no single-pass/one-pass, 42 cm, print head, ink type, item height limit, 60-140 gsm, cups or prices; "recycled" only for brown kraft, white is virgin.

Production (main) must not be touched or promoted without explicit approval. Next session: wire Home and FAQ first.


## Browser tab rule (applies to every session)

Keep ONE browser tab per website and always reuse that same tab for that website. Never open a different website in a tab that belongs to another site, and never load all sites into one tab. Standard tabs: (1) website sandbox https://castle-packaging-website-sandbox-o67at.ondigitalocean.app, (2) ERP sandbox https://erp-castlepkg-sandbox-7bgs8.ondigitalocean.app, (3) GitHub repo castle-packaging-website (this repo), (4) GitHub repo castle-packagingerp-website (ERP), and a DigitalOcean tab when deploys need checking. At the start of a session open each one in its own tab. Open the tabs one at a time (parallel preview_start calls reuse the same tab and overwrite each other), then check with tabs_context that each tab shows the right site.


## Text markers wired for the ERP (27 Nov 2026, sandbox)

Markers (data-cms="pages.<page>.<key>") now exist in: about.html (18), quote.html (2), index.html (14: heroTag, heroIntro, whatHead, whatIntro, bagsHead, bagsIntro, printHead, printIntro, rushHead, rushIntro, serveHead, howHead, quoteHead, quoteIntro), faq.html (4: headline, intro, ctaHeadline, ctaText). Keep those marker names in step with FIELDS in the ERP server/lib/website-content.js. The home hero H1 and the FAQ questions/answers are deliberately not marked (emphasis and links would be lost; FAQPage JSON-LD would go stale). data-pages.json still has stale old home keys (heroHeadline, heroLead, feature*, cta*): never reuse those names for markers.


## Rich text markers (27 Nov 2026, sandbox)

For text that needs bold, italic, links, line breaks or bullets, mark the element with data-cms-rich="pages.<page>.<key>" instead of data-cms (data-cms writes plain text only). cms-loader.js cleanRich() keeps only strong, em, br, ul, ol, li and a[href] (safe links only) before setting innerHTML. Wired today: index.html h1 = pages.home.heroTitle (keeps its em highlight). Do not hand-edit data-pages.json values for rich keys with other tags: they are stripped.


## FAQ list marker (27 Nov 2026, sandbox) - supersedes the FAQ note above

faq.html: the container of the question blocks has data-cms-faq="pages.faq.items". Each block must stay as div > h3 (question) + p (answer); the ERP reads this structure as the starting list and cms-loader.js setFaq() rebuilds it from data-pages.json (faq.items = [{ q, a }]) once the ERP has published. When the ERP publishes FAQ changes it also rewrites the FAQPage JSON-LD in faq.html: do not hand-edit the questions in faq.html or the JSON-LD after that; change them in the ERP (Website Control -> FAQ).


## Look presets from the ERP (27 Nov 2026, sandbox)

data-pages.json can have a top-level _styles = { page: { key: { size: sm|lg|xl, color: gold|ink|muted, font: serif|sans } } } written by the ERP (Website Control). cms-loader.js applyStyles() applies it to elements with data-cms or data-cms-rich markers: classes cms-c-* and cms-f-* (CSS injected by the loader, using --gold, --ink, --muted, --serif, --sans) and a font-size multiplier (0.85 / 1.2 / 1.5 of the element's own computed size, recomputed on resize). Do not hand-edit _styles; do not put !important font rules on marked elements.

## Visual page editor support (27 Nov 2026, sandbox)
- The ERP (Website Control) opens a page in an iframe with ?cmsedit=1. In that mode cms-loader.js (EDIT = inside an iframe and cmsedit=1) skips applying published content and loads cms-editor.js, which makes every data-cms-rich element editable (contenteditable) and talks to the ERP by postMessage (every message has cms:1): site to ERP ready, change, select, notice; ERP to site init, cmd. The website never saves anything.
- cms-editor.js only accepts messages from origins in its ALLOWED list (sandbox ERP only). Add the production ERP origin only when promoting to main.
- Link clicks and form submits are blocked in edit mode; paste is plain text; Enter inserts a line break.
- Look presets are span classes whitelisted in cleanRich: cms-c-gold|ink|muted (colour), cms-f-serif|sans (font), cms-s-sm|lg|xl (size). Add new classes in cms-loader.js, cms-editor.js and the ERP server cleanHtml together.
- Home markers are all data-cms-rich (15). To make another page visually editable: switch its markers to data-cms-rich and flag the page visual:true in the ERP server.
- Verified on sandbox: iframe loads, edit and colour apply, autosave to draft, discard. Real publish still to be tested.

## All pages editable + E-commerce page (27 Nov 2026, sandbox)
- Every page except FAQ now has data-cms-rich markers on its headings, paragraphs and list items (keys come from the first words of the text, e.g. pages.about.ourStory). Footer, forms, tables and dynamic blocks (size chart, product and news grids) are intentionally not marked. Never put a marker on an element whose content JavaScript rebuilds (e.g. inside #szGrid or #shopGrid): the edit would never show.
- When you add a new text element to a page, add a data-cms-rich marker AND the matching R(...) entry in the ERP server FIELDS list, or it will not be editable.
- FAQ questions are still edited with the form (visual list editing is next).
- shop.html is the E-commerce page. It is hidden by default (data-pages.json hidden.shop = true). cms-loader.js adds a Shop link after Products in the menu and footer only when the page is not hidden and shop.html exists. Add shop.html to sitemap.xml when it goes live (the ERP only removes entries for hidden pages, it never adds them). Terms currently say online checkout is not available: review the Terms and the page wording before showing it.
- On promotion to main: check hidden.shop is true in data-pages.json, and add the production ERP origin to cms-editor.js ALLOWED.
