// Castle Packaging — CMS content loader
// Reads castle-website-data-company.json and castle-website-data-products.json
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
  function setHref(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) { el.setAttribute('href', value); });
  }

  fetch('castle-website-data-company.json', { cache: 'no-store' })
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
    fetch('castle-website-data-products.json', { cache: 'no-store' })
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
              '</div>' +
            '</div>'
          );
        }).join('');
        grid.innerHTML = html;
      })
      .catch(function () { /* keep static fallback cards */ });
  }
})();
