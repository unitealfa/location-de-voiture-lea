const TRACK_DEDUP_WINDOW_MS = 15000;
let lastTrackedPath = "";
let lastTrackedAt = 0;

function getScreenBucket() {
  const width = Math.min(window.screen?.width || window.innerWidth || 0, 2400);
  const height = Math.min(window.screen?.height || window.innerHeight || 0, 2400);
  const roundedWidth = Math.max(320, Math.round(width / 160) * 160);
  const roundedHeight = Math.max(320, Math.round(height / 160) * 160);
  return `${roundedWidth}x${roundedHeight}`;
}

function buildVisitContext() {
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    locale: navigator.language || "",
    platform:
      navigator.userAgentData?.platform ||
      navigator.platform ||
      "",
    deviceClass:
      window.matchMedia?.("(max-width: 767px)").matches
        ? "mobile"
        : window.matchMedia?.("(max-width: 1023px)").matches
          ? "tablet"
          : "desktop",
    screenBucket: getScreenBucket(),
    touchBucket: navigator.maxTouchPoints > 0 ? "touch" : "no-touch"
  };
}

function shouldTrackPath(pathname) {
  return (
    typeof pathname === "string" &&
    pathname.startsWith("/") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/reservations") &&
    !pathname.startsWith("/clients") &&
    !pathname.startsWith("/commencer")
  );
}

export async function trackSiteVisit(pathname) {
  if (!shouldTrackPath(pathname)) {
    return false;
  }

  const now = Date.now();

  if (
    pathname === lastTrackedPath &&
    now - lastTrackedAt < TRACK_DEDUP_WINDOW_MS
  ) {
    return false;
  }

  lastTrackedPath = pathname;
  lastTrackedAt = now;

  try {
    await fetch("/api/site-visits/track", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: pathname,
        context: buildVisitContext()
      }),
      keepalive: true
    });
    return true;
  } catch (error) {
    return false;
  }
}
