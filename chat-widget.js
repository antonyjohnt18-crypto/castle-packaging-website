// Castle Packaging website — Product Chatbot widget
//
// Injects a small floating chat bubble bottom-right on every page that
// includes this script (the floating WhatsApp button that used to share
// this corner was removed — WhatsApp is still reachable via the header
// button and footer contact details). Only appears once chat-config.js
// has a real secret set (see that file for setup steps) — until then this
// script exits immediately and nothing is added to the page.
//
// Conversation history + a per-browser session ID are saved to
// localStorage (not sessionStorage), so closing the tab — or the whole
// browser — and coming back later within CHAT_HISTORY_TTL_MS continues the
// same conversation right where it left off, including any in-progress
// enquiry the backend is building up (see chat.js's save_enquiry tool).
// This only works on the same browser/device the visitor started on —
// there's no visitor login here, so switching devices always starts fresh.
// A "Start over" link clears it manually if someone wants a clean slate
// sooner. The per-visit message cap now lives alongside the history in
// localStorage for the same reason (a plain sessionStorage counter would
// reset every time the persisted history was restored, defeating the cap).

(function () {
  var MAX_MESSAGES_PER_SESSION = 15;
  var HISTORY_KEY = 'cp_chat_history';
  var SESSION_ID_KEY = 'cp_chat_session_id';
  var COUNT_KEY = 'cp_chat_msg_count';
  var SAVED_AT_KEY = 'cp_chat_saved_at';
  var CONTACT_SAVED_KEY = 'cp_chat_contact_saved';
  var CHAT_HISTORY_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

  // ---------- conversation tracking (separate from the sessionId above) ----------
  // sessionId/HISTORY_KEY above are about the VISITOR's own experience —
  // resuming a chat panel that looks the same for up to 3 days. This is a
  // separate concept for the ERP's "Chat Sessions" staff page: one row per
  // actual sitting at the keyboard, so a visitor who chats today and comes
  // back in 3 days to continue (still same sessionId, same visible history)
  // shows up as TWO conversations there, not one giant one spanning days.
  // A conversation "closes" after CONVERSATION_IDLE_MS of no messages; the
  // next message after that mints a fresh conversationId instead of
  // reusing the old one.
  var CONVERSATION_ID_KEY = 'cp_chat_conversation_id';
  var CONVERSATION_LAST_ACTIVE_KEY = 'cp_chat_conversation_last_active';
  // Index into HISTORY_KEY's array marking where the CURRENT conversation
  // starts — history itself can span days (see CHAT_HISTORY_TTL_MS above),
  // so this is what lets sendMessage() below send the backend only "this
  // conversation's own messages" for the Chat Sessions transcript, without
  // dragging in everything said in an earlier, already-idle conversation.
  var CONVERSATION_START_INDEX_KEY = 'cp_chat_conversation_start_index';
  var CONVERSATION_IDLE_MS = 15 * 60 * 1000; // 15 minutes

  // First-touch attribution (how this visitor arrived) uses the browser's
  // native sessionStorage rather than localStorage: it already does exactly
  // what's needed here — persists across page navigations in this same tab,
  // but clears when the tab closes — so document.referrer/UTM params get
  // captured once, on the visitor's actual entry page, rather than
  // re-captured on every internal page view (which would just show the
  // previous castlepkg.com page as the "referrer" instead of e.g. Google).
  var FIRST_TOUCH_KEY = 'cp_chat_first_touch';
  function getFirstTouch() {
    try {
      var raw = sessionStorage.getItem(FIRST_TOUCH_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }
    function utm(name) { return (params && params.get(name)) || ''; }
    var touch = {
      referrer: (document.referrer || '').slice(0, 500),
      landingPage: (window.location.pathname || '').slice(0, 200),
      utmSource: utm('utm_source').slice(0, 100),
      utmMedium: utm('utm_medium').slice(0, 100),
      utmCampaign: utm('utm_campaign').slice(0, 100),
      utmTerm: utm('utm_term').slice(0, 100),
      utmContent: utm('utm_content').slice(0, 100),
    };
    try { sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch)); } catch (e) { /* ignore */ }
    return touch;
  }

  function deviceType() {
    return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '') ? 'mobile' : 'desktop';
  }

  // Returns the current conversationId, minting a fresh one (and re-reading
  // first-touch attribution) if there wasn't one yet or the last message in
  // it was more than CONVERSATION_IDLE_MS ago. Call this right before every
  // /chat or /chat/contact request — it also bumps the "last active" clock,
  // which is what the idle check above is based on.
  function ensureConversation() {
    var lastActive = Number(localStorage.getItem(CONVERSATION_LAST_ACTIVE_KEY) || '0');
    var id = localStorage.getItem(CONVERSATION_ID_KEY);
    var isNew = false;
    if (!id || !lastActive || (Date.now() - lastActive) > CONVERSATION_IDLE_MS) {
      id = 'cv' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(CONVERSATION_ID_KEY, id);
      isNew = true;
    }
    localStorage.setItem(CONVERSATION_LAST_ACTIVE_KEY, String(Date.now()));
    var touch = getFirstTouch();
    return {
      conversationId: id,
      isNew: isNew,
      meta: {
        referrer: touch.referrer,
        landingPage: touch.landingPage,
        utmSource: touch.utmSource,
        utmMedium: touch.utmMedium,
        utmCampaign: touch.utmCampaign,
        utmTerm: touch.utmTerm,
        utmContent: touch.utmContent,
        deviceType: deviceType(),
      },
    };
  }

  // Same format check the backend uses (see server/routes/chat.js's
  // isPlausiblePhone) — duplicated here so a visitor gets instant feedback
  // without waiting on a network round trip for something this simple. The
  // backend re-checks it regardless, so this copy only needs to catch the
  // obvious stuff; it's not the last line of defense.
  function isPlausiblePhone(raw) {
    var digits = String(raw || '').replace(/[\s\-().]/g, '');
    if (!digits) return false;
    if (/^(?:\+?91|0)?[6-9]\d{9}$/.test(digits)) return true;
    if (/^\+\d{8,15}$/.test(digits)) return true;
    return false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!(window.isChatConfigured && window.isChatConfigured())) return;

    // A stale, days-old conversation resuming unannounced would be more
    // confusing than helpful — past the TTL, wipe it and start clean.
    var savedAt = Number(localStorage.getItem(SAVED_AT_KEY) || '0');
    if (savedAt && (Date.now() - savedAt) > CHAT_HISTORY_TTL_MS) {
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(SESSION_ID_KEY);
      localStorage.removeItem(COUNT_KEY);
      localStorage.removeItem(SAVED_AT_KEY);
      localStorage.removeItem(CONTACT_SAVED_KEY);
    }

    var history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { history = []; }

    function getSessionId() {
      var id = localStorage.getItem(SESSION_ID_KEY);
      if (!id) {
        id = 'cs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(SESSION_ID_KEY, id);
      }
      return id;
    }
    var sessionId = getSessionId();

    function persist() {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      localStorage.setItem(SAVED_AT_KEY, String(Date.now()));
    }

    // ---------- styles ----------
    var style = document.createElement('style');
    style.textContent = [
      '.cp-chat-bubble{position:fixed;bottom:22px;right:22px;width:56px;height:56px;border-radius:50%;background:var(--gold,#A9791F);color:#fff;border:none;box-shadow:0 6px 18px rgba(0,0,0,0.25);cursor:pointer;z-index:61;display:flex;align-items:center;justify-content:center;}',
      '.cp-chat-bubble svg{width:26px;height:26px;}',
      // Panel height is 600px (the conversation area's actual target size)
      // PLUS roughly the contact mini-form's own height, so adding that
      // form never shrinks the conversation view — the panel just grows to
      // make room for it. If the form collapses to its short "saved" state
      // later, .cp-chat-body's flex:1 automatically reclaims that space.
      '.cp-chat-panel{position:fixed;bottom:88px;right:22px;width:400px;max-width:calc(100vw - 32px);height:710px;max-height:calc(100vh - 100px);background:#fff;border-radius:14px;box-shadow:0 10px 34px rgba(0,0,0,0.28);z-index:61;display:none;flex-direction:column;overflow:hidden;font-family:Arial,"Helvetica Neue",Helvetica,sans-serif;}',
      '.cp-chat-panel.open{display:flex;}',
      '.cp-chat-head{background:var(--ink,#17130D);color:#fff;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;}',
      '.cp-chat-head strong{font-size:14px;}',
      '.cp-chat-head span{font-size:11px;opacity:0.75;display:block;}',
      '.cp-chat-head-actions{display:flex;align-items:center;gap:10px;}',
      '.cp-chat-restart{background:none;border:none;color:rgba(255,255,255,0.75);font-size:11px;cursor:pointer;text-decoration:underline;padding:0;}',
      '.cp-chat-restart:hover{color:#fff;}',
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
      '.cp-chat-contact{flex:none;padding:8px 12px;border-top:1px solid var(--border,#E9E2D2);background:var(--bg-alt,#FAF7F1);}',
      '.cp-chat-contact-title{font-size:11px;color:var(--muted,#756C5C);margin:0 0 6px;}',
      '.cp-chat-contact-row{display:flex;gap:6px;margin-bottom:6px;}',
      '.cp-chat-contact-row:last-of-type{margin-bottom:0;}',
      '.cp-chat-contact input{flex:1;min-width:0;border:1px solid var(--border,#E9E2D2);border-radius:6px;padding:6px 8px;font-size:12px;font-family:inherit;}',
      '.cp-chat-contact input:disabled{opacity:0.6;}',
      '.cp-chat-contact-save{background:var(--gold,#A9791F);color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:bold;cursor:pointer;white-space:nowrap;}',
      '.cp-chat-contact-save:disabled{opacity:0.5;cursor:not-allowed;}',
      '.cp-chat-contact-error{color:#B3261E;font-size:11px;margin-top:6px;}',
      '.cp-chat-contact-done{font-size:12px;color:#1E7A34;padding:2px 0;font-weight:bold;}',
      '@media (max-width:480px){.cp-chat-panel{right:16px;bottom:80px;}.cp-chat-bubble{right:16px;bottom:16px;}}',
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
      '<div class="cp-chat-head"><div><strong>Angela</strong><span>Castle Packaging · Product Assistant</span></div><div class="cp-chat-head-actions"><button type="button" class="cp-chat-restart">Start over</button><button class="cp-chat-close" aria-label="Close chat">&times;</button></div></div>' +
      '<div class="cp-chat-body"></div>' +
      '<div class="cp-chat-contact"></div>' +
      '<div class="cp-chat-input-row"><input type="text" placeholder="Ask a question…" maxlength="600"><button type="button">Send</button></div>';

    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    var body = panel.querySelector('.cp-chat-body');
    var input = panel.querySelector('input');
    var sendBtn = panel.querySelector('.cp-chat-input-row button');
    var inputRow = panel.querySelector('.cp-chat-input-row');
    var restartBtn = panel.querySelector('.cp-chat-restart');
    var contactBox = panel.querySelector('.cp-chat-contact');

    // ---------- quick contact form ----------
    // Sits permanently above the message box (not gated behind anything
    // Angela says) so a visitor can leave their details whenever they want,
    // without it ever competing with the conversation for space — see the
    // panel height comment above. Saves directly to the backend, bypassing
    // the AI entirely: there's nothing here an LLM needs to interpret, and
    // going straight to the same validation the chat path uses is faster
    // and can't be misread the way free text occasionally can.
    function renderContactDone() {
      contactBox.innerHTML = '<div class="cp-chat-contact-done">&#10003; Thanks — we\'ve got your details.</div>';
    }
    function renderContactForm() {
      contactBox.innerHTML =
        '<p class="cp-chat-contact-title">Leave your details and we\'ll reach out</p>' +
        '<div class="cp-chat-contact-row">' +
          '<input type="text" class="cp-contact-name" placeholder="Your name" maxlength="100">' +
          '<input type="tel" class="cp-contact-phone" placeholder="Phone number" maxlength="20">' +
        '</div>' +
        '<div class="cp-chat-contact-row">' +
          '<input type="email" class="cp-contact-email" placeholder="Email (optional)" maxlength="150">' +
          '<input type="text" class="cp-contact-pincode" placeholder="PIN code (optional)" maxlength="6" inputmode="numeric">' +
          '<button type="button" class="cp-chat-contact-save">Save</button>' +
        '</div>' +
        '<div class="cp-chat-contact-error" style="display:none;"></div>';

      var nameEl = contactBox.querySelector('.cp-contact-name');
      var phoneEl = contactBox.querySelector('.cp-contact-phone');
      var emailEl = contactBox.querySelector('.cp-contact-email');
      var pincodeEl = contactBox.querySelector('.cp-contact-pincode');
      var saveBtn = contactBox.querySelector('.cp-chat-contact-save');
      var errorEl = contactBox.querySelector('.cp-chat-contact-error');

      function showContactError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
      }

      var contactSaving = false;
      saveBtn.addEventListener('click', async function () {
        if (contactSaving) return;
        var name = nameEl.value.trim();
        var phone = phoneEl.value.trim();
        var email = emailEl.value.trim();
        var pincode = pincodeEl.value.trim();

        errorEl.style.display = 'none';
        if (!name) { showContactError('Please enter your name.'); return; }
        if (!isPlausiblePhone(phone)) {
          showContactError("There's a mistake in that phone number — for an Indian mobile it should be exactly 10 digits, or include your country code if you're outside India.");
          return;
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showContactError('That email address doesn\'t look right.'); return; }
        if (pincode && !/^\d{6}$/.test(pincode)) { showContactError('PIN code should be 6 digits.'); return; }

        contactSaving = true;
        saveBtn.disabled = true;
        nameEl.disabled = true; phoneEl.disabled = true; emailEl.disabled = true; pincodeEl.disabled = true;
        saveBtn.textContent = 'Saving…';

        try {
          var conv = ensureConversation();
          var res = await fetch(window.CPChatConfig.apiBaseUrl + '/chat/contact', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ secret: window.CPChatConfig.sharedSecret, sessionId: sessionId, name: name, phone: phone, email: email, pincode: pincode, conversationId: conv.conversationId, meta: conv.meta }),
          });
          var data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || 'Something went wrong — please try again.');
          localStorage.setItem(CONTACT_SAVED_KEY, '1');
          renderContactDone();
        } catch (err) {
          contactSaving = false;
          saveBtn.disabled = false;
          nameEl.disabled = false; phoneEl.disabled = false; emailEl.disabled = false; pincodeEl.disabled = false;
          saveBtn.textContent = 'Save';
          showContactError(err.message || 'Something went wrong — please try again.');
        }
      });
    }
    if (localStorage.getItem(CONTACT_SAVED_KEY) === '1') renderContactDone(); else renderContactForm();

    function addMessage(role, text) {
      var el = document.createElement('div');
      el.className = 'cp-chat-msg ' + (role === 'user' ? 'user' : role === 'error' ? 'error' : 'bot');
      el.textContent = text;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }

    function getSessionCount() {
      return Number(localStorage.getItem(COUNT_KEY) || '0');
    }
    function bumpSessionCount() {
      var n = getSessionCount() + 1;
      localStorage.setItem(COUNT_KEY, String(n));
      return n;
    }
    function showLimitReached() {
      input.disabled = true;
      sendBtn.disabled = true;
      if (panel.querySelector('.cp-chat-limit-note')) return;
      var note = document.createElement('div');
      note.className = 'cp-chat-limit-note';
      note.textContent = 'That\'s the limit for this visit — for more help, WhatsApp us or request a quote and we\'ll follow up directly.';
      panel.insertBefore(note, inputRow);
    }

    var greeted = history.length > 0;
    function showGreeting() {
      if (getSessionCount() >= MAX_MESSAGES_PER_SESSION) {
        addMessage('bot', 'Hi! Thanks for stopping by.');
        showLimitReached();
      } else {
        addMessage('bot', 'Hi, I\'m Angela from Castle Packaging! Happy to help with our paper bags, covers, cups, tissues or printing service. Could I grab your name and a number to reach you, just in case we get disconnected?');
        input.focus();
      }
    }
    function openPanel() {
      panel.classList.add('open');
      if (!greeted) {
        greeted = true;
        showGreeting();
      }
    }
    function closePanel() {
      panel.classList.remove('open');
    }

    // Restore a conversation already in progress from an earlier visit,
    // instead of the usual first-open greeting.
    if (history.length) {
      history.forEach(function (m) { addMessage(m.role === 'assistant' ? 'bot' : 'user', m.content); });
      if (getSessionCount() >= MAX_MESSAGES_PER_SESSION) showLimitReached();
    }

    bubble.addEventListener('click', function () {
      if (panel.classList.contains('open')) closePanel(); else openPanel();
    });
    panel.querySelector('.cp-chat-close').addEventListener('click', closePanel);

    restartBtn.addEventListener('click', function () {
      if (!confirm('Start a new conversation? This clears what\'s been discussed so far.')) return;
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(SESSION_ID_KEY);
      localStorage.removeItem(COUNT_KEY);
      localStorage.removeItem(SAVED_AT_KEY);
      // A fresh session ID means a brand-new (empty) Firestore doc — the
      // previous session's saved contact info doesn't carry over to it, so
      // the "already saved" flag has to be cleared too, or the form would
      // stay collapsed claiming details are saved when this new session
      // actually has none yet.
      localStorage.removeItem(CONTACT_SAVED_KEY);
      // Also force a fresh conversationId on the next message, rather than
      // letting a restart within the 15-minute idle window keep appending
      // to what — from the staff Chat Sessions page's point of view — is a
      // clearly a deliberately-new conversation.
      localStorage.removeItem(CONVERSATION_ID_KEY);
      localStorage.removeItem(CONVERSATION_LAST_ACTIVE_KEY);
      localStorage.removeItem(CONVERSATION_START_INDEX_KEY);
      history = [];
      sessionId = getSessionId();
      body.innerHTML = '';
      renderContactForm();
      var limitNote = panel.querySelector('.cp-chat-limit-note');
      if (limitNote) limitNote.remove();
      input.disabled = false;
      sendBtn.disabled = false;
      showGreeting();
    });

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
      persist();

      var typing = document.createElement('div');
      typing.className = 'cp-chat-typing';
      typing.textContent = 'Typing…';
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      try {
        var conv = ensureConversation();
        if (conv.isNew) {
          // history already has this turn's user message pushed onto it
          // (a few lines up) — mark the conversation as starting there, so
          // conversationMessages below is just this message onward, not
          // everything said in whatever conversation was idle before it.
          localStorage.setItem(CONVERSATION_START_INDEX_KEY, String(history.length - 1));
        }
        var convStartIdx = Number(localStorage.getItem(CONVERSATION_START_INDEX_KEY) || '0');
        var conversationMessages = history.slice(convStartIdx);
        var res = await fetch(window.CPChatConfig.apiBaseUrl + '/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ secret: window.CPChatConfig.sharedSecret, messages: history, sessionId: sessionId, conversationId: conv.conversationId, conversationMessages: conversationMessages, meta: conv.meta }),
        });
        var data = await res.json();
        typing.remove();
        if (!res.ok) throw new Error(data.error || 'Something went wrong.');
        addMessage('bot', data.reply);
        history.push({ role: 'assistant', content: data.reply });
        persist();
        // If the visitor just gave their number to Angela directly in chat
        // (rather than using the quick-contact form), the form would
        // otherwise keep sitting there asking for details already saved —
        // collapse it the same way a form submission would.
        if (data.leadSaved && localStorage.getItem(CONTACT_SAVED_KEY) !== '1') {
          localStorage.setItem(CONTACT_SAVED_KEY, '1');
          renderContactDone();
        }
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
