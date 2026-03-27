const crypto = require("crypto");
const {
  ADMIN_SESSION_COOKIE_NAME
} = require("../utils/sessionCookie");
const {
  createSiteVisitEvent,
  getSiteVisitOverviewInRange,
  listDailySiteVisitTotalsInRange
} = require("../repositories/siteVisitRepository");

const SITE_VISITOR_COOKIE_NAME = "lea_site_visitor";
const SITE_VISITOR_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365 * 2;

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

function toDate(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === "string") {
    return new Date(value.includes("T") ? value : value.replace(" ", "T"));
  }

  return new Date(value);
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createUtcDateKey(dateValue) {
  const date = toDate(dateValue);

  if (!isValidDate(date)) {
    return "";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
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
  return Boolean(cookies[ADMIN_SESSION_COOKIE_NAME]);
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

async function getSiteVisitDashboardStats({ startDate = null, endDate = null } = {}) {
  const [overview, dailyTotals] = await Promise.all([
    getSiteVisitOverviewInRange(startDate, endDate),
    listDailySiteVisitTotalsInRange(startDate, endDate)
  ]);

  const dailyMap = new Map(
    dailyTotals
      .map((item) => [createUtcDateKey(item.visitDate), item])
      .filter(([key]) => Boolean(key))
  );

  return {
    totalVisits: overview.totalVisits,
    totalVisitors: overview.totalVisitors,
    dailyMap
  };
}

module.exports = {
  SITE_VISITOR_COOKIE_NAME,
  trackPublicSiteVisit,
  getSiteVisitDashboardStats,
  formatDateKey,
  toDate,
  isValidDate
};
