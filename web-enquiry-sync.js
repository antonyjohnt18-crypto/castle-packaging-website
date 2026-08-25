// Castle Packaging website — Website Enquiry Sync (Phase 7 Automation)
//
// When firebase-site-config.js has real values in it, this writes a copy
// of every Quote Request submission straight into the Business Suite
// app's Firestore database (a new "Website Enquiries" inbox on the Leads
// page picks these up), then sends the visitor to the thank-you page.
//
// This used to also POST the form to "/" so Netlify's own built-in form
// handler would send an email notification. That only works on Netlify —
// now that the site is hosted on DigitalOcean, that POST has nowhere to
// go and was causing a routing error on submission. Firestore (synced
// into the Leads page) is now the only submission path; nothing is lost
// since every enquiry already showed up there first.
//
// This file only runs on quote.html (it exits immediately if #quoteForm
// isn't on the page), and only ever intercepts the form's submission once
// Firebase has actually started — see the guard at the top of the
// DOMContentLoaded handler below. If Firebase isn't configured yet, this
// script never attaches anything, so the form's original plain-POST
// behavior is completely untouched.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

function isConfigured(config) {
  return !!(config && config.apiKey && !String(config.apiKey).startsWith('PASTE_'));
}

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('quoteForm');
  if (!form) return;

  const config = window.CPSiteFirebaseConfig;
  if (!isConfigured(config)) return; // Not set up yet — leave the form entirely alone.

  let db;
  try {
    db = getFirestore(initializeApp(config));
  } catch (err) {
    console.warn('Website enquiry sync: Firebase did not start — form still works normally.', err);
    return;
  }

  function fieldVal(name) {
    const el = form.querySelector('[name="' + name + '"]');
    return el ? String(el.value || '').trim() : '';
  }

  async function onSubmit(e) {
    e.preventDefault();

    // Honeypot field: a real visitor never fills this in. A filled
    // bot-field means a bot submitted the form — skip creating a sync
    // entry for it, but still send them on to the thank-you page below
    // so a bot can't tell its submission was ignored.
    const isBot = fieldVal('bot-field');
    if (!isBot) {
      const entry = {
        name: fieldVal('name').slice(0, 199),
        company: fieldVal('company').slice(0, 199),
        phone: fieldVal('phone').slice(0, 29),
        email: fieldVal('email').slice(0, 199),
        product: fieldVal('product').slice(0, 199),
        quantity: fieldVal('quantity').slice(0, 199),
        printing: fieldVal('printing').slice(0, 299),
        message: fieldVal('message').slice(0, 2999),
        submittedAt: serverTimestamp(),
        status: 'new',
        source: 'website',
      };
      // Best-effort, capped at 3 seconds — a slow or unreachable database
      // must never delay the customer's actual submission. Worst case if
      // this fails or times out: you still get the enquiry the way you
      // always have, by email, and can add it manually.
      try {
        await Promise.race([
          addDoc(collection(db, 'webEnquiries'), entry),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch (err) {
        console.warn('Website enquiry sync failed (your submission still goes through normally):', err);
      }
    }

    // The Firestore write above (or its 3-second timeout) has already
    // happened by this point — either way, send the visitor on to the
    // thank-you page. No further network request needed.
    window.location.href = form.getAttribute('action') || '/thank-you.html';
  }

  form.addEventListener('submit', onSubmit);
});
