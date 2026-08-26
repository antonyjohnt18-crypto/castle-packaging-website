// Castle Packaging website — Product Chatbot widget
//
// Injects a small floating chat bubble (above the WhatsApp button) on
// every page that includes this script. Only appears once chat-config.js
// has a real secret set (see that file for setup steps) — until then this
// script exits immediately and nothing is added to the page.
//
// Conversation history lives only in memory for the current page view
// (it resets on navigation/reload, same as any normal page). A session
// counter in sessionStorage caps how many messages one visitor can send
// per browser tab, as a simple cost-control measure independent of the
// shared-secret check the backend /chat route itself does.

(function () {
  var MAX_MESSAGES_PER_SESSION = 15;
  var SESSION_KEY = 'cp_chat_msg_count';

  document.addEventListener('DOMContentLoaded', function () {
    if (!(window.isChatConfigured && window.isChatConfigured())) return;

    var history = []; // { role: 'user'|'assistant', content: string }

    // ---------- styles ----------
    var style = document.createElement('style');
    style.textContent = [
      '.cp-chat-bubble{position:fixed;bottom:90px;right:22px;width:56px;height:56px;border-radius:50%;background:var(--gold,#A9791F);color:#fff;border:none;box-shadow:0 6px 18px rgba(0,0,0,0.25);cursor:pointer;z-index:61;display:flex;align-items:center;justify-content:center;}',
      '.cp-chat-bubble svg{width:26px;height:26px;}',
      '.cp-chat-panel{position:fixed;bottom:156px;right:22px;width:320px;max-width:calc(100vw - 32px);height:420px;max-height:calc(100vh - 190px);background:#fff;border-radius:14px;box-shadow:0 10px 34px rgba(0,0,0,0.28);z-index:61;display:none;flex-direction:column;overflow:hidden;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;}',
      '.cp-chat-panel.open{display:flex;}',
      '.cp-chat-head{background:var(--ink,#17130D);color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;}',
      '.cp-chat-head strong{font-size:14px;}',
      '.cp-chat-head span{font-size:11px;opacity:0.75;display:block;}',
      '.cp-chat-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1;padding:0 4px;}',
      '.cp-chat-body{flex:1;overflow-y:auto;padding:12px;background:var(--bg-alt,#FAF7F1);}',
      '.cp-chat-msg{max-width:85%;margin-bottom:10px;padding:8px 11px;border-radius:10px;font-size:13px;line-height:1.4;white-space:pre-wrap;}',
      '.cp-chat-msg.user{margin-left:auto;background:var(--gold,#A9791F);color:#fff;border-bottom-right-radius:2px;}',
      '.cp-chat-msg.bot{margin-right:auto;background:#fff;color:var(--ink,#17130D);border:1px solid var(--border,#E9E2D2);border-bottom-left-radius:2px;}',
      '.cp-chat-msg.error{margin-right:auto;background:#FDECEA;color:#7A1F16;border:1px solid #F3C6C0;}',
      '.cp-chat-typing{font-size:12px;color:var(--muted,#756C5C);margin-bottom:10px;}',
      '.cp-chat-input-row{display:flex;gap:6px;padding:10px;border-top:1px solid var(--border,#E9E2D2);background:#fff;}',
      '.cp-chat-input-row input{flex:1;border:1px solid var(--border,#E9E2D2);border-radius:8px;padding:8px 10px;font-size:13px;}',
      '.cp-chat-input-row button{background:var(--gold,#A9791F);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13px;cursor:pointer;}',
      '.cp-chat-input-row button:disabled{opacity:0.5;cursor:not-allowed;}',
      '.cp-chat-limit-note{font-size:11.5px;color:var(--muted,#756C5C);padding:8px 12px;border-top:1px solid var(--border,#E9E2D2);background:#fff;}',
      '@media (max-width:480px){.cp-chat-panel{right:16px;bottom:148px;}.cp-chat-bubble{right:16px;}}',
    ].join('\n');
    document.head.appendChild(style);

    // ---------- markup ----------
    var bubble = document.createElement('button');
    bubble.className = 'cp-chat-bubble';
    bubble.setAttribute('aria-label', 'Chat with us');
    bubble.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4c-1.3-.1-2-.3-2.9-.7L4 20l1-4.8c-.5-.9-.8-1.9-.8-3A8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z"/></svg>';

    var panel = document.createElement('div');
    panel.className = 'cp-chat-panel';
    panel.innerHTML =
      '<div class="cp-chat-head"><div><strong>Castle Packaging</strong><span>Ask about our products</span></div><button class="cp-chat-close" aria-label="Close chat">&times;</button></div>' +
      '<div class="cp-chat-body"></div>' +
      '<div class="cp-chat-input-row"><input type="text" placeholder="Ask a question…" maxlength="600"><button type="button">Send</button></div>';

    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    var body = panel.querySelector('.cp-chat-body');
    var input = panel.querySelector('input');
    var sendBtn = panel.querySelector('.cp-chat-input-row button');
    var inputRow = panel.querySelector('.cp-chat-input-row');

    function addMessage(role, text) {
      var el = document.createElement('div');
      el.className = 'cp-chat-msg ' + (role === 'user' ? 'user' : role === 'error' ? 'error' : 'bot');
      el.textContent = text;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }

    function getSessionCount() {
      return Number(sessionStorage.getItem(SESSION_KEY) || '0');
    }
    function bumpSessionCount() {
      var n = getSessionCount() + 1;
      sessionStorage.setItem(SESSION_KEY, String(n));
      return n;
    }
    function showLimitReached() {
      input.disabled = true;
      sendBtn.disabled = true;
      var note = document.createElement('div');
      note.className = 'cp-chat-limit-note';
      note.textContent = 'That\'s the limit for this visit — for more help, WhatsApp us or request a quote and we\'ll follow up directly.';
      panel.insertBefore(note, inputRow);
    }

    var greeted = false;
    function openPanel() {
      panel.classList.add('open');
      if (!greeted) {
        greeted = true;
        if (getSessionCount() >= MAX_MESSAGES_PER_SESSION) {
          addMessage('bot', 'Hi! Thanks for stopping by.');
          showLimitReached();
        } else {
          addMessage('bot', 'Hi! Ask me about our paper bags, covers, cups or tissues — for pricing or bulk quotes, I\'ll point you to Request a Quote or WhatsApp.');
          input.focus();
        }
      }
    }
    function closePanel() {
      panel.classList.remove('open');
    }

    bubble.addEventListener('click', function () {
      if (panel.classList.contains('open')) closePanel(); else openPanel();
    });
    panel.querySelector('.cp-chat-close').addEventListener('click', closePanel);

    var sending = false;
    async function sendMessage() {
      var text = input.value.trim();
      if (!text || sending) return;
      if (getSessionCount() >= MAX_MESSAGES_PER_SESSION) { showLimitReached(); return; }

      sending = true;
      input.value = '';
      input.disabled = true;
      sendBtn.disabled = true;
      addMessage('user', text);
      history.push({ role: 'user', content: text });
      bumpSessionCount();

      var typing = document.createElement('div');
      typing.className = 'cp-chat-typing';
      typing.textContent = 'Typing…';
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      try {
        var res = await fetch(window.CPChatConfig.apiBaseUrl + '/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ secret: window.CPChatConfig.sharedSecret, messages: history }),
        });
        var data = await res.json();
        typing.remove();
        if (!res.ok) throw new Error(data.error || 'Something went wrong.');
        addMessage('bot', data.reply);
        history.push({ role: 'assistant', content: data.reply });
      } catch (err) {
        typing.remove();
        addMessage('error', 'Sorry, I couldn\'t get a reply just now. Please try again, or reach us directly via WhatsApp or Request a Quote.');
      } finally {
        sending = false;
        if (getSessionCount() >= MAX_MESSAGES_PER_SESSION) {
          showLimitReached();
        } else {
          input.disabled = false;
          sendBtn.disabled = false;
          input.focus();
        }
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMessage();
    });
  });
})();
