// Castle Packaging — CMS content loader
// Reads data-company.json and data-products.json
// and injects their values into elements marked with data-cms / data-cms-href / data-cms-html.
// The HTML already contains today's content as a fallback, so if these fetches fail
// (e.g. opened as a local file:// page without a server) the site still looks correct —
// it just won't reflect the latest CMS edits until viewed on the live hosted site.
(function () {
  function setText(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) { el.textContent = value; });
  }
  function setHTML(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) { el.innerHTML = value; });
  }
  // Rich text from the ERP (bold, italic, links, line breaks, bullets only). Everything else is removed here too.
  var RICH_OK = { STRONG: 1, EM: 1, BR: 1, UL: 1, OL: 1, LI: 1, A: 1 };
  function hrefOk(h) {
    h = String(h || '').trim().toLowerCase();
    if (!h) return false;
    if (h.indexOf('http://') === 0 || h.indexOf('https://') === 0 || h.indexOf('mailto:') === 0 || h.indexOf('tel:') === 0 || h.charAt(0) === '#') return true;
    return h.indexOf(':') < 0 && h.indexOf('//') !== 0;
  }
  function cleanRich(html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = String(html || '');
    (function walk(n) {
      Array.prototype.slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) return;
        if (c.nodeType !== 1) { n.removeChild(c); return; }
        walk(c);
        if (!RICH_OK[c.tagName]) { while (c.firstChild) n.insertBefore(c.firstChild, c); n.removeChild(c); return; }
        Array.prototype.slice.call(c.attributes).forEach(function (a) { if (!(c.tagName === 'A' && a.name === 'href')) c.removeAttribute(a.name); });
        if (c.tagName === 'A') {
          if (!hrefOk(c.getAttribute('href'))) c.removeAttribute('href');
          else if (/^https?:/i.test(c.getAttribute('href'))) { c.setAttribute('target', '_blank'); c.setAttribute('rel', 'noopener'); }
        }
      });
    })(tpl.content);
    return tpl.innerHTML;
  }
  function setRich(selector, value) {
    var clean = cleanRich(value);
    document.querySelectorAll(selector).forEach(function (el) { el.innerHTML = clean; });
  }
  function setHref(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) { el.setAttribute('href', value); });
  }

  // ---- Hidden pages (set in the ERP: Website Content -> Website Text) ----
  // data-pages.json has a "hidden" map, for example { "faq": true }. A hidden page loses its
  // menu, footer and button links and shows a short coming-soon notice (and is marked noindex).
  function slugHere() {
    var f = location.pathname.split('/').pop().replace(/\.html$/, '');
    return (f === '' || f === 'index') ? 'home' : f;
  }
  function showNotice() {
    var meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    var header = document.querySelector('header.site-header');
    var footer = document.querySelector('footer.site-footer');
    if (!header || !footer) return;
    var n = header.nextElementSibling;
    while (n && n !== footer) { var next = n.nextElementSibling; n.parentNode.removeChild(n); n = next; }
    var s = document.createElement('section');
    s.innerHTML = '<div class="wrap" style="text-align:center;padding:72px 0;"><h1>This page is coming soon</h1><p>We are working on it and it will be back shortly. In the meantime, have a look around the rest of our site, or get in touch and we will be happy to help.</p><p><a class="btn btn-primary" href="index.html">Back to Home</a></p></div>';
    footer.parentNode.insertBefore(s, footer);
    document.title = 'Coming soon | Castle Packaging';
  }
  function applyVisibility(hidden) {
    var slugs = Object.keys(hidden).filter(function (k) { return hidden[k] === true && k !== 'home'; });
    if (!slugs.length) return;
    var files = slugs.map(function (s) { return s + '.html'; });
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = (a.getAttribute('href') || '').split('#')[0].split('?')[0];
      if (files.indexOf(h) < 0) return;
      var host = a.closest('nav, footer, header') ? (a.closest('li') || a) : a;
      host.style.display = 'none';
    });
    if (slugs.indexOf(slugHere()) >= 0) showNotice();
  }

  fetch('data-company.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (c) {
      if (!c) return;
      window.CASTLE_COMPANY = c;
      if (c.addressLines) setHTML('[data-cms="company.addressLines"]', c.addressLines.join('<br>'));
      if (c.phoneDisplay) setText('[data-cms="company.phoneDisplay"]', c.phoneDisplay);
      if (c.phoneDial) setHref('[data-cms-href="company.phoneDial"]', 'tel:' + c.phoneDial);
      if (c.email) {
        setText('[data-cms="company.email"]', c.email);
        setHref('[data-cms-href="company.email"]', 'mailto:' + c.email);
      }
      if (c.gstin) setText('[data-cms="company.gstin"]', c.gstin);
      if (c.whatsappNumber) setHref('[data-cms-href="company.whatsapp"]', 'https://wa.me/' + c.whatsappNumber);
      if (c.instagram) setHref('[data-cms-href="company.instagram"]', c.instagram);
      if (c.facebook) setHref('[data-cms-href="company.facebook"]', c.facebook);
      if (c.twitter) setHref('[data-cms-href="company.twitter"]', c.twitter);
    })
    .catch(function () { /* keep static fallback content */ });

  var grid = document.querySelector('[data-cms-collection="products"]');
  if (grid) {
    fetch('data-products.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.products || !d.products.length) return;
        var html = d.products.map(function (p) {
          var variantClass = p.variantColor === 'sage' ? ' v-sage' : (p.variantColor === 'kraft' ? ' v-kraft' : '');
          return (
            '<div class="card product-card">' +
              '<div class="product-visual"><img src="' + p.image + '" alt="Castle Packaging ' + p.name + '"></div>' +
              '<div class="product-body">' +
                '<h3>' + p.name + '</h3>' +
                '<div class="variants' + variantClass + '">' + p.variant + '</div>' +
                '<p>' + p.description + '</p>' +
                (p.soldBy ? '<p class="product-soldby">' + p.soldBy + '</p>' : '') +
              '</div>' +
            '</div>'
          );
        }).join('');
        grid.innerHTML = html;
      })
      .catch(function () { /* keep static fallback cards */ });
  }

  fetch('data-pages.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (p) {
      if (!p) return;
      Object.keys(p).forEach(function (page) {
        var section = p[page];
        if (page.charAt(0) === '_' || page === 'hidden' || !section || typeof section !== 'object') return;
        Object.keys(section).forEach(function (key) {
          setText('[data-cms="pages.' + page + '.' + key + '"]', section[key]);
          setRich('[data-cms-rich="pages.' + page + '.' + key + '"]', section[key]);
        });
      });
      applyVisibility(p.hidden || {});
    })
    .catch(function () { /* keep static fallback content */ });

  var newsGrid = document.querySelector('[data-cms-collection="news"]');
  if (newsGrid) {
    fetch('data-news.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.posts || !d.posts.length) return;
        var html = d.posts.map(function (p) {
          var imgs = [p.image1, p.image2].filter(Boolean);
          var visual = '';
          if (imgs.length === 1) {
            visual = '<div class="news-visual"><img src="' + imgs[0] + '" alt="' + p.title + '"></div>';
          } else if (imgs.length > 1) {
            visual = '<div class="news-visual two-up"><img src="' + imgs[0] + '" alt="' + p.title + '"><img src="' + imgs[1] + '" alt="' + p.title + '"></div>';
          }
          return (
            '<div class="card news-card">' +
              visual +
              '<div class="news-card-body">' +
                '<p class="news-date">' + p.date + '</p>' +
                '<h3>' + p.title + '</h3>' +
                '<p>' + p.excerpt + '</p>' +
              '</div>' +
            '</div>'
          );
        }).join('');
        newsGrid.innerHTML = html;
      })
      .catch(function () { /* keep static fallback cards */ });
  }
})();
