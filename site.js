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
      var lines = [
        'Hi Castle Packaging, I would like a quote:',
        name ? 'Name: ' + name : '',
        company ? 'Company: ' + company : '',
        product ? 'Product: ' + product : '',
        qty ? 'Quantity: ' + qty : '',
        printing ? 'Custom printing: ' + printing : '',
        details ? 'Details: ' + details : ''
      ].filter(Boolean);
      var text = encodeURIComponent(lines.join('\n'));
      window.open('https://wa.me/919611535171?text=' + text, '_blank', 'noopener');
    });
  }
});
