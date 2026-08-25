// Castle Packaging website — Firebase configuration for Website Enquiry Sync
//
// This is what lets a "Request a Quote" submission on this website land
// directly in the Business Suite app's "Website Enquiries" inbox (Leads
// page), instead of only arriving as an email you'd have to retype.
//
// HOW TO FILL THIS IN:
//   Use the EXACT SAME values you already pasted into the Business Suite
//   app's firebase-config.js — this must point at the same Firebase
//   project, not a new one. Open that file (or your Firebase Console →
//   Project Settings → your Web app) and copy the same six values here.
//
// Until you do this, the Quote Request form on this website keeps working
// exactly as it does today (a plain submission, with your usual email
// notification) — nothing breaks, it just skips the extra sync step.
//
// Is it safe to put these values in a public website file? Yes — this is
// the normal, documented way Firebase web apps work. These values identify
// *which* database to talk to, not a password; the actual security is
// enforced separately by Firestore's rules (firestore.rules in the
// Business Suite project), which only allow this website to ADD a new,
// tightly-validated enquiry — never read, change, or delete anything.

window.CPSiteFirebaseConfig = {
  apiKey: "AIzaSyCvoM3MgyIx8QeTfCbqCqYyA4CxEDICbx8",
  authDomain: "castle-business-suite.firebaseapp.com",
  projectId: "castle-business-suite",
  storageBucket: "castle-business-suite.firebasestorage.app",
  messagingSenderId: "1059960077494",
  appId: "1:1059960077494:web:62bd28fc419f3d2cd57a17",
};
