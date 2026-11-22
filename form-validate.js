/* Castle Packaging — friendly inline form validation.
   Replaces the browser's default pop-up bubble with a message under the field,
   styled in the site's design (see "form validation v7" in styles.css).
   The rules themselves are still the HTML attributes (required, pattern, type),
   so changing a rule means changing the input, not this file.
   Runs on every form.site-form. Safe to load before or after the sync scripts:
   it stops the submit only when something is invalid. */
(function () {
  'use strict';

  var PHONE_MSG = 'Please enter a valid 10-digit mobile number.';
  var EMAIL_MSG = 'Please enter a valid email address, for example name@company.com.';

  function isCheckable(el) {
    if (!el || el.disabled) return false;
    if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.type === 'reset') return false;
    if (el.name === 'bot-field') return false;
    return el.offsetParent !== null; // skip fields the visitor cannot see
  }

  function messageFor(el) {
    var v = el.validity;
    if (v.valueMissing) {
      if (el.type === 'tel') return 'Please enter your mobile number.';
      if (el.type === 'email') return 'Please enter your email address.';
      if (el.tagName === 'SELECT') return 'Please choose an option.';
      if (el.type === 'checkbox') return 'Please tick this box to continue.';
      return 'Please fill in this field.';
    }
    if (el.type === 'tel') return PHONE_MSG;
    if (el.type === 'email') return EMAIL_MSG;
    if (v.tooShort || v.tooLong) return 'Please check the length of this entry.';
    if (v.rangeUnderflow || v.rangeOverflow) return 'Please check this number.';
    return 'Please check this entry.';
  }

  function holder(el) {
    return el.closest('.field') || el.parentNode;
  }

  function clearError(el) {
    var h = holder(el);
    var old = h.querySelector('.field-error');
    if (old) old.parentNode.removeChild(old);
    h.classList.remove('has-error');
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  }

  function showError(el) {
    clearError(el);
    var h = holder(el);
    var id = (el.id || el.name || 'field') + '_err';
    var box = document.createElement('div');
    box.className = 'field-error';
    box.id = id;
    box.setAttribute('role', 'alert');
    box.textContent = messageFor(el);
    h.appendChild(box);
    h.classList.add('has-error');
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', id);
  }

  function check(el) {
    if (el.checkValidity()) {
      clearError(el);
      return true;
    }
    showError(el);
    return false;
  }

  function fieldsOf(form) {
    return [].slice.call(form.querySelectorAll('input, select, textarea')).filter(isCheckable);
  }

  function init(form) {
    if (form.getAttribute('data-validate-ready')) return;
    form.setAttribute('data-validate-ready', '1');
    form.setAttribute('novalidate', ''); // we show our own messages instead

    // Live feedback: validate a field when the visitor leaves it, and clear the
    // message as soon as it becomes valid.
    form.addEventListener('focusout', function (e) {
      var el = e.target;
      if (!isCheckable(el)) return;
      if (el.value === '' && !holder(el).classList.contains('has-error')) return; // do not nag empty untouched fields
      check(el);
    });
    form.addEventListener('input', function (e) {
      var el = e.target;
      if (isCheckable(el) && holder(el).classList.contains('has-error') && el.checkValidity()) clearError(el);
    });
    form.addEventListener('change', function (e) {
      var el = e.target;
      if (isCheckable(el) && holder(el).classList.contains('has-error') && el.checkValidity()) clearError(el);
    });
  }

  // Capture phase on document: runs before the form's own submit handlers
  // (the Firebase sync scripts), so an invalid form never reaches them.
  document.addEventListener(
    'submit',
    function (e) {
      var form = e.target;
      if (!form || !form.matches || !form.matches('form.site-form')) return;
      init(form);
      var first = null;
      fieldsOf(form).forEach(function (el) {
        if (!check(el) && !first) first = el;
      });
      if (first) {
        e.preventDefault();
        e.stopImmediatePropagation();
        try {
          first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) {
          first.scrollIntoView();
        }
        first.focus({ preventScroll: true });
      }
    },
    true
  );

  function boot() {
    [].forEach.call(document.querySelectorAll('form.site-form'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
