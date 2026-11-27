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
  function report(el) {
    if (!el) return;
    if (el.closest && el.closest('[data-cms-faq]')) { faqSend(); return; }
    send({ type: 'change', key: keyOf(el), html: outHtml(el) });
  }

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
    if (c === 'insertImage' || c === 'setImage' || c === 'hideImage' || c === 'showImage') { imgCmd(m); return; }
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

  var imgs = [].slice.call(document.querySelectorAll('img[data-cms-img^="pages."]'));
  var selImg = null;
  var previewBase = '';
  function prev(p) { return p.indexOf('uploads/') === 0 && previewBase ? previewBase + p : p; }
  function relSrc(el) { return el.getAttribute('data-cms-src') || el.getAttribute('src') || ''; }
  function relink(el) {
    [].forEach.call(el.querySelectorAll('img[src^="uploads/"]'), function (i) {
      i.setAttribute('data-rel', i.getAttribute('src'));
      i.setAttribute('src', prev(i.getAttribute('src')));
    });
  }
  function outHtml(el) {
    var c = el.cloneNode(true);
    [].forEach.call(c.querySelectorAll('img[data-rel]'), function (i) { i.setAttribute('src', i.getAttribute('data-rel')); i.removeAttribute('data-rel'); });
    return c.innerHTML;
  }
  function imgKey(el) { return (el.getAttribute('data-cms-img') || '').split('.').slice(2).join('.'); }
  function imgVal(el) {
    var o = { s: relSrc(el), a: el.getAttribute('alt') || '' };
    if (el.getAttribute('data-cms-hid') === '1') o.h = true;
    return JSON.stringify(o);
  }
  function imgMark(el, hid) {
    if (hid) { el.setAttribute('data-cms-hid', '1'); el.style.opacity = '.3'; el.style.outline = '3px dashed #c0392b'; }
    else { el.removeAttribute('data-cms-hid'); el.style.opacity = ''; el.style.outline = ''; }
  }
  function imgInfo(el) { send({ type: 'image', key: imgKey(el), src: relSrc(el), alt: el.getAttribute('alt') || '', hidden: el.getAttribute('data-cms-hid') === '1' }); }
  function imgPick(el) {
    imgs.forEach(function (x) { if (x.getAttribute('data-cms-hid') !== '1') x.style.outline = ''; });
    selImg = el;
    if (el.getAttribute('data-cms-hid') !== '1') el.style.outline = '3px solid #A67C26';
    imgInfo(el);
  }
  imgs.forEach(function (el) { el.style.cursor = 'pointer'; });
  function imgByKey(k) { return imgs.filter(function (x) { return imgKey(x) === k; })[0]; }
  function imgCmd(m) {
    if (m.cmd === 'insertImage') {
      if (!restore()) { send({ type: 'notice', text: 'Click inside a text on the page where the photo should go, then insert it.' }); return; }
      var a = String(m.alt || '').split('"').join('&quot;').split('<').join('&lt;');
      document.execCommand('insertHTML', false, '<img class="cms-img" data-rel="' + m.src + '" src="' + prev(m.src) + '" alt="' + a + '">');
      report(lastEl);
      return;
    }
    var el = imgByKey(m.key);
    if (!el) return;
    if (m.cmd === 'setImage') {
      if (m.src) { el.removeAttribute('srcset'); el.setAttribute('data-cms-src', m.src); el.setAttribute('src', prev(m.src)); }
      if (typeof m.alt === 'string') el.setAttribute('alt', m.alt);
    } else if (m.cmd === 'hideImage') imgMark(el, true);
    else if (m.cmd === 'showImage') imgMark(el, false);
    send({ type: 'imgchange', key: m.key, value: imgVal(el) });
    imgPick(el);
  }
  var faqBox = document.querySelector('[data-cms-faq^="pages."]');
  function faqKey() { return (faqBox.getAttribute('data-cms-faq') || '').split('.').slice(2).join('.'); }
  function faqItems() {
    return [].map.call(faqBox.querySelectorAll('[data-faq-item]'), function (d) {
      return { q: d.querySelector('h3').textContent.replace(/ +/g, ' ').trim(), a: d.querySelector('p').innerHTML };
    });
  }
  function faqSend() { send({ type: 'faq', key: faqKey(), items: faqItems() }); }
  function faqEditable(el, plain) {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('data-cms-edit', '1');
    var t;
    el.addEventListener('input', function () { clearTimeout(t); t = setTimeout(faqSend, 250); });
    el.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); if (!plain) document.execCommand('insertLineBreak'); }
    });
    el.addEventListener('paste', function (ev) {
      ev.preventDefault();
      document.execCommand('insertText', false, (ev.clipboardData || window.clipboardData).getData('text/plain'));
    });
  }
  function faqBtn(label, title, fn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.title = title;
    b.style.cssText = 'font:600 12px sans-serif;padding:3px 9px;border:1px solid #bbb;border-radius:6px;background:#fff;color:#222;cursor:pointer;';
    b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
    b.addEventListener('click', fn);
    return b;
  }
  function faqItem(q, a) {
    var d = document.createElement('div');
    d.setAttribute('data-faq-item', '1');
    d.style.cssText = 'margin-bottom:28px;';
    var bar = document.createElement('div');
    bar.setAttribute('contenteditable', 'false');
    bar.style.cssText = 'display:flex;gap:6px;margin-bottom:6px;';
    bar.appendChild(faqBtn('Up', 'Move this question up', function () {
      var p = d.previousElementSibling;
      if (p && p.hasAttribute('data-faq-item')) { d.parentNode.insertBefore(d, p); faqSend(); }
    }));
    bar.appendChild(faqBtn('Down', 'Move this question down', function () {
      var n = d.nextElementSibling;
      if (n && n.hasAttribute('data-faq-item')) { d.parentNode.insertBefore(n, d); faqSend(); }
    }));
    bar.appendChild(faqBtn('Delete', 'Delete this question', function () {
      if (faqBox.querySelectorAll('[data-faq-item]').length < 2) { send({ type: 'notice', text: 'Keep at least one question.' }); return; }
      if (window.confirm('Delete this question and its answer?')) { d.remove(); faqSend(); }
    }));
    var h = document.createElement('h3');
    h.style.cssText = 'font-size:20px;margin:0 0 8px;';
    h.textContent = q;
    faqEditable(h, true);
    var p = document.createElement('p');
    p.innerHTML = a;
    faqEditable(p, false);
    d.appendChild(bar);
    d.appendChild(h);
    d.appendChild(p);
    return d;
  }
  function faqRender(items) {
    faqBox.innerHTML = '';
    items.forEach(function (it) { faqBox.appendChild(faqItem(it.q, it.a)); });
    var add = faqBtn('+ Add question', 'Add a new question at the end', function () {
      var d = faqItem('New question', 'Type the answer here.');
      faqBox.insertBefore(d, add.parentNode);
      var h = d.querySelector('h3');
      h.focus();
      document.getSelection().selectAllChildren(h);
      faqSend();
    });
    add.style.cssText += 'font-size:14px;padding:8px 16px;';
    var wrap = document.createElement('div');
    wrap.setAttribute('contenteditable', 'false');
    wrap.appendChild(add);
    faqBox.appendChild(wrap);
  }
  document.addEventListener('click', function (ev) {
    if (ev.target.closest && ev.target.closest('a')) ev.preventDefault();
    var im = ev.target.closest && ev.target.closest('img[data-cms-img]');
    if (im) imgPick(im);
  }, true);
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
      previewBase = m.preview || '';
      fields.forEach(function (el) {
        var v = m.values && m.values[keyOf(el)];
        if (typeof v === 'string') { el.innerHTML = v; relink(el); }
      });
      imgs.forEach(function (el) {
        var iv = m.values && m.values[imgKey(el)];
        if (typeof iv !== 'string') return;
        try {
          var o = JSON.parse(iv);
          if (o.s) { el.setAttribute('data-cms-src', o.s); el.setAttribute('src', prev(o.s)); }
          if (typeof o.a === 'string') el.setAttribute('alt', o.a);
          imgMark(el, !!o.h);
        } catch (e) { /* keep the page photo */ }
      });
      if (faqBox) { var fv = m.values && m.values[faqKey()]; if (Array.isArray(fv) && fv.length) faqRender(fv); }
    } else if (m.type === 'cmd') run(m);
  });

  send({ type: 'ready', keys: fields.map(keyOf).concat(imgs.map(imgKey)) });
})();
