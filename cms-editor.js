// Castle Packaging - in-page text editor.
// Only active when this page is opened inside the ERP (Website Control) with ?cmsedit=1.
// It makes the marked text editable and talks to the ERP toolbar with postMessage.
// It never saves anything itself: the ERP saves drafts with its own login.
(function () {
  var ALLOWED = ['https://erp-castlepkg-sandbox-7bgs8.ondigitalocean.app'];
  var parentOrigin = '';
  try {
    var ao = (location.ancestorOrigins && location.ancestorOrigins[0]) || (document.referrer ? new URL(document.referrer).origin : '');
    if (ALLOWED.indexOf(ao) >= 0) parentOrigin = ao;
  } catch (e) { parentOrigin = ''; }
  if (!parentOrigin) return;

  var GROUPS = {
    size: ['cms-s-sm', 'cms-s-lg', 'cms-s-xl'],
    color: ['cms-c-gold', 'cms-c-ink', 'cms-c-muted'],
    font: ['cms-f-serif', 'cms-f-sans']
  };
  var fields = [];
  var saved = null;
  var lastEl = null;

  function send(msg) { msg.cms = 1; window.parent.postMessage(msg, parentOrigin); }
  function keyOf(el) { return (el.getAttribute('data-cms-rich') || '').split('.').slice(2).join('.'); }
  function editorOf(node) {
    var el = node && node.nodeType === 1 ? node : (node ? node.parentElement : null);
    return el && el.closest ? el.closest('[data-cms-edit]') : null;
  }
  function report(el) { if (el) send({ type: 'change', key: keyOf(el), html: el.innerHTML }); }

  var css = document.createElement('style');
  css.textContent = '[data-cms-edit]{cursor:text;outline:1px dashed transparent;outline-offset:4px;transition:outline-color .15s}[data-cms-edit]:hover{outline-color:#A67C26}[data-cms-edit]:focus{outline:2px solid #A67C26}';
  document.head.appendChild(css);

  function restore() {
    if (!saved) return false;
    var ed = editorOf(saved.commonAncestorContainer);
    if (!ed) return false;
    ed.focus();
    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(saved);
    lastEl = ed;
    return true;
  }

  function applyClass(group, value) {
    var list = GROUPS[group];
    if (!list || (value && list.indexOf(value) < 0)) return;
    var s = window.getSelection();
    if (!s.rangeCount || s.isCollapsed) { send({ type: 'notice', text: 'Select some words first, then choose a size, color or font.' }); return; }
    var box = document.createElement('div');
    box.appendChild(s.getRangeAt(0).cloneContents());
    box.querySelectorAll('span').forEach(function (sp) {
      list.forEach(function (c) { sp.classList.remove(c); });
      if (!sp.className.trim()) { while (sp.firstChild) sp.parentNode.insertBefore(sp.firstChild, sp); sp.remove(); }
    });
    var inner = box.innerHTML;
    document.execCommand('insertHTML', false, value ? '<span class="' + value + '">' + inner + '</span>' : inner);
  }

  function run(m) {
    var c = m.cmd;
    if (c === 'undo' || c === 'redo') {
      if (lastEl) { lastEl.focus(); document.execCommand(c, false, null); report(lastEl); }
      return;
    }
    if (!restore()) { send({ type: 'notice', text: 'Click inside a text on the page first, then use the toolbar.' }); return; }
    if (c === 'link') document.execCommand('createLink', false, m.arg);
    else if (c === 'style') applyClass(m.group, m.value);
    else if (['bold', 'italic', 'unlink', 'insertUnorderedList', 'removeFormat'].indexOf(c) >= 0) document.execCommand(c, false, null);
    report(lastEl);
  }

  document.querySelectorAll('[data-cms-rich^="pages."]').forEach(function (el) {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('data-cms-edit', '1');
    fields.push(el);
    var t;
    el.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { report(el); }, 250); });
    el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); document.execCommand('insertLineBreak'); } });
    el.addEventListener('paste', function (ev) {
      ev.preventDefault();
      document.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain'));
    });
  });
  document.addEventListener('click', function (ev) { if (ev.target.closest && ev.target.closest('a')) ev.preventDefault(); }, true);
  document.addEventListener('submit', function (ev) { ev.preventDefault(); }, true);
  document.addEventListener('selectionchange', function () {
    var s = window.getSelection();
    if (!s.rangeCount) return;
    var r = s.getRangeAt(0);
    var ed = editorOf(r.commonAncestorContainer);
    if (ed) { saved = r.cloneRange(); lastEl = ed; send({ type: 'select', collapsed: r.collapsed }); }
  });

  window.addEventListener('message', function (ev) {
    if (ev.origin !== parentOrigin || ev.source !== window.parent || !ev.data || ev.data.cms !== 1) return;
    var m = ev.data;
    if (m.type === 'init') {
      fields.forEach(function (el) {
        var v = m.values && m.values[keyOf(el)];
        if (typeof v === 'string') el.innerHTML = v;
      });
    } else if (m.type === 'cmd') run(m);
  });

  send({ type: 'ready', keys: fields.map(keyOf) });
})();
