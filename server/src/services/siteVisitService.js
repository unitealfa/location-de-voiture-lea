const crypto = require("crypto");
const {
  ADMIN_SESSION_COOKIE_NAME
} = require("../utils/sessionCookie");
const {
  createSiteVisitEvent,
  getSiteVisitOverview,
  listDailySiteVisitTotals
} = require("../repositories/siteVisitRepository");

const SITE_VISITOR_COOKIE_NAME = "lea_site_visitor";
const SITE_VISITOR_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365 * 2;
const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short"
});

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
}

function createVisitorToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashVisitorToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setVisitorCookie(response, token) {
  response.cookie(SITE_VISITOR_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SITE_VISITOR_COOKIE_MAX_AGE_MS,
    path: "/"
  });
}

function shouldSkipTracking(request) {
  const cookies = parseCookies(request.headers.cookie || "");

  if (cookies[ADMIN_SESSION_COOKIE_NAME]) {
    return true;
  }

  return false;
}

function trackPublicSiteVisit(request, response) {
  if (shouldSkipTracking(request)) {
    return;
  }

  const cookies = parseCookies(request.headers.cookie || "");
  let visitorToken = cookies[SITE_VISITOR_COOKIE_NAME] || "";

  if (!visitorToken) {
    visitorToken = createVisitorToken();
    setVisitorCookie(response, visitorToken);
  }

  const visitorHash = hashVisitorToken(visitorToken);
  const requestPath = request.path || "/";

  void createSiteVisitEvent({
    visitorHash,
    requestPath
  }).catch((error) => {
    console.error("Unable to record site visit.", error);
  });
}

async function getSiteVisitDashboardStats() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const recentStartDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
  const [overview, recentDailyTotals] = await Promise.all([
    getSiteVisitOverview(monthStart),
    listDailySiteVisitTotals(recentStartDate)
  ]);

  const recentMap = new Map(
    recentDailyTotals.map((item) => [formatDateKey(new Date(item.visitDate)), item])
  );

  const recentVisits = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(recentStartDate);
    day.setDate(recentStartDate.getDate() + index);
    const key = formatDateKey(day);
    const row = recentMap.get(key);

    return {
      label: DAY_LABEL_FORMATTER.format(day),
      value: row ? row.totalVisits : 0,
      visitors: row ? row.totalVisitors : 0
    };
  });

  return {
    ...overview,
    recentVisits
  };
}

module.exports = {
  SITE_VISITOR_COOKIE_NAME,
  trackPublicSiteVisit,
  getSiteVisitDashboardStats
};
