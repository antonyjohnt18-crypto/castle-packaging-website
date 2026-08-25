// Castle Packaging website — RETIRED
//
// This function used to auto-post recent News & Updates entries to
// Facebook/Instagram once a day. It has been replaced by the Social Media
// Campaign Manager in the Business Suite app (see social-media.html
// there), which covers more platforms (Facebook, Instagram, LinkedIn, X,
// Google Business Profile), lets you plan and review a month of posts
// instead of blind auto-posting from News & Updates, and supports posting
// something one-off any time — not just news items.
//
// The scheduled trigger for this function has already been removed from
// netlify.toml, so it no longer runs automatically. This file is kept
// (rather than deleted) only so the deploy doesn't break if something
// still references it; it does nothing if invoked directly.
//
// The @netlify/blobs dependency this used to need has also been removed
// from package.json — nothing in this site needs it anymore.

exports.handler = async () => ({
  statusCode: 410,
  body: JSON.stringify({
    retired: true,
    message: 'This feature has moved to the Social Media Campaign Manager in the Business Suite app.',
  }),
});
