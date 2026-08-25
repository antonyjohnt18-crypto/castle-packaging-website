// Castle Packaging website — Contact Form Enquiry Sync
//
// Mirrors web-enquiry-sync.js (originally written for quote.html) for the
// simpler Contact page form. Needed because contact.html's form still had
// data-netlify="true" — Netlify Forms only works while Netlify is actually
// hosting the site, and now that hosting moved to DigitalOcean (and the old
// Netlify projects have been deleted), that submission path goes nowhere.
//
// This writes every Contact form submission straight into the same
// "webEnquiries" Firestore collection quote.html already uses, so it shows
// up in the same "Website Enquiries" inbox on the Business Suite's Leads
// page. The Product column is set to a fixed label so it's clear at a
// glance this came from Contact, not from a Quote Request.
//
// This file only runs on contact.html (it exits immediately if
// #contactForm isn't on the page), and only ever intercepts the form's
// submission once Firebase has actually started — see the guard at the top
// of the DOMContentLoaded handler below. If Firebase isn't configured yet,
// this script never attaches anything, so the form's original plain-POST
// behavior is completely untouched.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

function isConfigured(config) {
  return !!(config && config.apiKey && !String(config.apiKey).startsWith('PASTE_'));
}

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const config = window.CPSiteFirebaseConfig;
  if (!isConfigured(config)) return; // Not set up yet — leave the form entirely alone.

  let db;
  try {
    db = getFirestore(initializeApp(config));
  } catch (err) {
    console.warn('Contact enquiry sync: Firebase did not start — form still works normally.', err);
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
        // Contact form has no Company/Product/Quantity fields of its own —
        // Product is set to a fixed label purely so this enquiry reads as
        // distinct from a Quote Request in the Leads page's table.
        product: 'General Contact Enquiry',
        // Phone is optional on this form, but the Firestore security rule
        // (shared with the Quote form's write path) requires a non-empty
        // string — fall back to a placeholder rather than letting an
        // empty phone number silently fail the whole write.
        phone: (fieldVal('phone').slice(0, 29) || 'Not provided'),
        email: fieldVal('email').slice(0, 199),
        message: fieldVal('message').slice(0, 2999),
        submittedAt: serverTimestamp(),
        status: 'new',
        source: 'website',
      };
      // Best-effort, capped at 3 seconds — a slow or unreachable database
      // must never delay the customer's actual submission. Worst case if
      // this fails or times out: the visitor still reaches the thank-you
      // page, but this particular enquiry won't appear in the Leads inbox
      // and would need to be caught some other way (e.g. following up
      // directly if the visitor also called or WhatsApp'd).
      try {
        await Promise.race([
          addDoc(collection(db, 'webEnquiries'), entry),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch (err) {
        console.warn('Contact enquiry sync failed (your submission still goes through normally):', err);
      }
    }

    // The Firestore write above (or its 3-second timeout) has already
    // happened by this point — either way, send the visitor on to the
    // thank-you page. No further network request needed.
    window.location.href = form.getAttribute('action') || '/thank-you.html';
  }

  form.addEventListener('submit', onSubmit);
});
