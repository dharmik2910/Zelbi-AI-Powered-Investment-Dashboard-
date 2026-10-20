// Google Tag Manager. Loads only when REACT_APP_GTM_ID is set, e.g. GTM-ABC1234.
const GTM_ID = process.env.REACT_APP_GTM_ID;
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

// Paths whose last part is a secret, replaced before anything is sent to Google
const MASKED_PATHS = [[/^\/update-password\/[^/]+$/, "/update-password/:token"]];

let loaded = false;

export const maskPath = (path) => {
  for (const [pattern, replacement] of MASKED_PATHS) {
    if (pattern.test(path)) return replacement;
  }
  return path;
};

const isSensitivePath = (path) => maskPath(path) !== path;

/**
 * Loads the GTM container once. Skipped on pages with secrets in the URL, because Google
 * tags read the full address of the page they first load on.
 * @param {string} path - Current pathname
 */
export const loadGtm = (path) => {
  if (loaded || !GTM_ID || !GTM_ID_PATTERN.test(GTM_ID) || isSensitivePath(path)) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);
};

/**
 * Tells GTM a page was shown. The single-page app changes pages without reloading,
 * so GTM needs this event to count each one. Query strings are left out.
 * @param {string} path - Current pathname
 */
export const pushPageView = (path) => {
  if (!loaded) return;
  const safePath = maskPath(path);
  window.dataLayer.push({
    event: "page_view",
    page_path: safePath,
    page_location: `${window.location.origin}${safePath}`,
    page_title: document.title,
  });
};
