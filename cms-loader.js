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
  var RICH_OK = { STRONG: 1, EM: 1, BR: 1, UL: 1, OL: 1, LI: 1, A: 1, SPAN: 1 };
  var SPAN_CLASSES = ['cms-c-gold', 'cms-c-ink', 'cms-c-muted', 'cms-f-serif', 'cms-f-sans', 'cms-s-sm', 'cms-s-lg', 'cms-s-xl'];
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
        Array.prototype.slice.call(c.attributes).forEach(function (a) { if (!(c.tagName === 'A' && a.name === 'href') && !(c.tagName === 'SPAN' && a.name === 'class')) c.removeAttribute(a.name); });
        if (c.tagName === 'SPAN') {
          var keep = (c.getAttribute('class') || '').split(' ').filter(function (x) { return SPAN_CLASSES.indexOf(x) >= 0; });
          if (keep.length) c.setAttribute('class', keep.join(' '));
          else { while (c.firstChild) n.insertBefore(c.firstChild, c); n.removeChild(c); return; }
        }
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
  // A list of questions and answers from the ERP: [{ q: 'text', a: 'rich text' }].
  function setFaq(selector, items) {
    if (!Array.isArray(items) || !items.length) return;
    document.querySelectorAll(selector).forEach(function (el) {
      el.innerHTML = '';
      items.forEach(function (it) {
        if (!it || typeof it.q !== 'string') return;
        var d = document.createElement('div');
        d.style.marginBottom = '28px';
        var h = document.createElement('h3');
        h.style.cssText = 'font-size:20px;margin:0 0 8px;';
        h.textContent = it.q;
        var p = document.createElement('p');
        p.innerHTML = cleanRich(it.a);
        d.appendChild(h);
        d.appendChild(p);
        el.appendChild(d);
      });
    });
  }
  // Look presets chosen in the ERP (size, colour, font) for text fields: p._styles = { page: { key: { size, color, font } } }.
  var ST_CSS = '.cms-c-gold{color:var(--gold)!important}.cms-c-ink{color:var(--ink)!important}.cms-c-muted{color:var(--muted)!important}.cms-f-serif{font-family:var(--serif)!important}.cms-f-sans{font-family:var(--sans)!important}';
  var SCALE = { sm: 0.85, lg: 1.2, xl: 1.5 };
  (function () {
    var st = document.createElement('style');
    st.textContent = ST_CSS + '.cms-s-sm{font-size:.85em}.cms-s-lg{font-size:1.2em}.cms-s-xl{font-size:1.5em}';
    document.head.appendChild(st);
  })();
  // Edit mode: the ERP (Website Control) opens this page in a frame with ?cmsedit=1 and edits text in place.
  var EDIT = window.parent !== window && location.search.indexOf('cmsedit=1') >= 0;
  function loadEditor() {
    var s = document.createElement('script');
    s.src = 'cms-editor.js?v=1';
    document.body.appendChild(s);
  }
  var scaled = [];
  function rescale() {
    scaled.forEach(function (it) {
      it.el.style.fontSize = '';
      var px = parseFloat(getComputedStyle(it.el).fontSize);
      if (px) it.el.style.fontSize = (px * it.k) + 'px';
    });
  }
  function applyStyles(st) {
    if (!st || typeof st !== 'object') return;
    var any = false;
    Object.keys(st).forEach(function (page) {
      Object.keys(st[page] || {}).forEach(function (key) {
        var s = st[page][key] || {};
        document.querySelectorAll('[data-cms="pages.' + page + '.' + key + '"],[data-cms-rich="pages.' + page + '.' + key + '"]').forEach(function (el) {
          if (s.color === 'gold' || s.color === 'ink' || s.color === 'muted') { el.classList.add('cms-c-' + s.color); any = true; }
          if (s.font === 'serif' || s.font === 'sans') { el.classList.add('cms-f-' + s.font); any = true; }
          if (Object.prototype.hasOwnProperty.call(SCALE, s.size)) { scaled.push({ el: el, k: SCALE[s.size] }); any = true; }
        });
      });
    });
    if (!any) return;
    var tag = document.createElement('style');
    tag.textContent = ST_CSS;
    document.head.appendChild(tag);
    rescale();
    var tm;
    window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(rescale, 150); });
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
  function addShop(hidden) {
    if (hidden.shop === true) return;
    fetch('shop.html', { method: 'HEAD', cache: 'no-store' }).then(function (r) {
      if (!r.ok) return;
      document.querySelectorAll('nav a[href="products.html"], footer a[href="products.html"]').forEach(function (a) {
        if (a.parentNode.querySelector('a[href="shop.html"]')) return;
        var s = document.createElement('a');
        s.href = 'shop.html';
        s.textContent = 'Shop';
        a.insertAdjacentElement('afterend', s);
      });
    }).catch(function () { /* no shop page */ });
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
      if (EDIT) { loadEditor(); return; }
      if (!p) return;
      Object.keys(p).forEach(function (page) {
        var section = p[page];
        if (page.charAt(0) === '_' || page === 'hidden' || !section || typeof section !== 'object') return;
        Object.keys(section).forEach(function (key) {
          setText('[data-cms="pages.' + page + '.' + key + '"]', section[key]);
          if (typeof section[key] === 'string') setRich('[data-cms-rich="pages.' + page + '.' + key + '"]', section[key]);
          if (Array.isArray(section[key])) setFaq('[data-cms-faq="pages.' + page + '.' + key + '"]', section[key]);
        });
      });
      applyStyles(p._styles);
      applyVisibility(p.hidden || {});
      addShop(p.hidden || {});
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
