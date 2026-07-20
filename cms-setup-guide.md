# Castle Packaging Website — Content Editor Setup Guide

This guide walks you through putting the website online with a free, self-service editor built in, so you can update contact details, GSTIN, social links, and the product catalog (names, descriptions, and photos) yourself — no coding, no messaging me every time.

## What you'll be able to edit yourself

- Company info shown across the whole site: address, phone, email, GSTIN, WhatsApp number, Instagram/Facebook/X links
- The full product catalog on the Products page (and the same catalog feeds the Home page): product name, category label, description, and photo

## What stays fixed (I'd update these for you if they ever change)

- Page layout, design, and wording outside the product catalog (About page text, Custom Order steps, etc.)
- The Google Maps embed on the Contact page (it's tied to the address text, not auto-linked)
- The small "business info" block search engines read (called structured data) — very low-churn, safe to leave as is

Editing only works once the site is live on the internet — opening the HTML files directly on your computer will always show today's content correctly, but won't reflect future edits until it's hosted.

---

## Step 1 — Rename the files

Right now every file is named with a `castle-website-` prefix (a workaround from how I built these). Before uploading, rename them by removing that prefix, and put two files into a new subfolder called `admin`:

| Current name | Rename to |
|---|---|
| castle-website-index.html | index.html |
| castle-website-about.html | about.html |
| castle-website-products.html | products.html |
| castle-website-custom-order.html | custom-order.html |
| castle-website-quote.html | quote.html |
| castle-website-contact.html | contact.html |
| castle-website-styles.css | styles.css |
| castle-website-site.js | site.js |
| castle-website-cms-loader.js | cms-loader.js |
| castle-website-data-company.json | data-company.json |
| castle-website-data-products.json | data-products.json |
| castle-website-favicon.png | favicon.png |
| castle-website-logo-*.png | logo-*.png |
| castle-website-photo-*.png/.jpg | photo-*.png/.jpg |
| castle-website-sitemap.xml | sitemap.xml |
| castle-website-robots.txt | robots.txt |
| **castle-website-admin-index.html** | **admin/index.html** (new subfolder) |
| **castle-website-admin-config.yml** | **admin/config.yml** (same subfolder) |

Important: every HTML/CSS/JS/JSON file links to the others by these exact filenames, so rename all of them together, then quickly double-check the site still opens correctly by double-clicking `index.html`.

## Step 2 — Put the files on GitHub (free)

The editor works by saving your changes as file updates in a GitHub repository, which then auto-publishes.

1. Go to github.com and create a free account.
2. Click "New repository," name it something like `castle-packaging-website`, keep it **Public** or **Private** (either works), and create it.
3. On the repository page, click "uploading an existing file" and drag in your whole renamed folder (including the `admin` subfolder). Commit the upload.

No command-line or git knowledge needed for this step — GitHub's website supports drag-and-drop upload.

## Step 3 — Connect Netlify to that GitHub repo

1. Go to netlify.com and create a free account (you can sign up directly with your GitHub account).
2. Click "Add new site" → "Import an existing project" → choose GitHub → select the `castle-packaging-website` repository.
3. Leave the build settings empty (no build command, publish directory is the root `/`) and deploy.

This is different from a plain drag-and-drop deploy — connecting to GitHub is what lets the content editor save changes back to your site automatically.

## Step 4 — Turn on the editor login (Netlify Identity + Git Gateway)

1. In your new Netlify site, go to **Site configuration → Identity** and click "Enable Identity."
2. Under Identity settings, set registration to **Invite only**.
3. Go to **Identity → Services → Git Gateway** and click "Enable Git Gateway." This is what lets the editor save content changes to GitHub on your behalf.
4. Go to the **Identity** tab and click "Invite users" — invite your own email address.
5. Check your email, click the invite link, and set a password. This logs you in as the site's first editor.

## Step 5 — Start editing

Visit `yoursite.netlify.app/admin/` (or your real domain once connected, e.g. `www.castlepkg.com/admin/`), log in with the account you just created, and you'll see two sections: **Company & Contact Info** and **Products**. Edit any field, click Publish, and the live site updates within a minute or two.

## Step 6 — Connect your domain

Same as before: in Netlify, go to **Domain management**, add your existing domain, and update your domain's DNS records with the values Netlify shows you. This can take a few hours to fully propagate. Netlify issues free HTTPS automatically once connected.

---

If any step is unclear when you get there, tell me exactly where you're stuck (a screenshot helps) and I'll walk you through it.
