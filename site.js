// Castle Packaging — shared site behavior
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      var expanded = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  // Quote form: build a WhatsApp prefilled message as a fallback/alternate action
  var quoteForm = document.getElementById('quoteForm');
  var waBtn = document.getElementById('waPrefillBtn');
  if (quoteForm && waBtn) {
    waBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var name = (document.getElementById('q_name') || {}).value || '';
      var company = (document.getElementById('q_company') || {}).value || '';
      var product = (document.getElementById('q_product') || {}).value || '';
      var qty = (document.getElementById('q_quantity') || {}).value || '';
      var printing = (document.getElementById('q_printing') || {}).value || '';
      var details = (document.getElementById('q_message') || {}).value || '';
      var LBL = { sourcing: 'Products', material: 'Material', item: 'Item', c_prodtype: 'Product (made to size)', c_papertype: 'Paper type', c_size: 'Size', c_print: 'Printing', s_prodtype: 'Product (standard size)', s_paper: 'Paper', s_size: 'Size', s_print: 'Printing', bagtype: 'Bag type', bagsize: 'Bag size', designs: 'Designs', qty_unit: 'Unit', needed_by: 'Needed by', urgent: 'Urgent', artwork_link: 'Artwork link' };
      var extra = Object.keys(LBL).map(function (n) {
        var el = quoteForm.querySelector('[name="' + n + '"]:checked') || quoteForm.querySelector('[name="' + n + '"]');
        var v = el ? (el.type === 'checkbox' ? (el.checked ? 'Yes' : '') : String(el.value || '').trim()) : '';
        return v ? LBL[n] + ': ' + v : '';
      });
      var lines = [
        'Hi Castle Packaging, I would like a quote:',
        name ? 'Name: ' + name : '',
        company ? 'Company: ' + company : '',
        product ? 'Product: ' + product : '',
        qty ? 'Quantity: ' + qty : '',
        printing ? 'Artwork: ' + printing : '',
        details ? 'Details: ' + details : ''
      ].concat(extra).filter(Boolean);
      var text = encodeURIComponent(lines.join('\n'));
      window.open('https://wa.me/919611535171?text=' + text, '_blank', 'noopener');
    });
  }
});
