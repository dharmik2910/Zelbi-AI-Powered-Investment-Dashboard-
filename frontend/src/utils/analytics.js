const SESSION_KEY = "zelbi:session-id";

// A random id for this browser tab session, so the admin panel can count unique visitors
const getSessionId = () => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 64);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
};

/**
 * Records a page view. Never throws and never blocks the page.
 * @param {string} path - Pathname only; query strings are left out on purpose
 * @param {string} [token] - Attaches the signed-in user when present
 */
export const trackPageView = (path, token) => {
  try {
    fetch(`${process.env.REACT_APP_API_URL}/api/analytics/pageview`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ path, sessionId: getSessionId(), referrer: document.referrer || undefined }),
    }).catch(() => {});
  } catch {
    // Analytics must never break the site
  }
};
