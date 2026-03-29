const crypto = require("crypto");
const {
  ADMIN_SESSION_COOKIE_NAME
} = require("../utils/sessionCookie");
const {
  createSiteVisitEvent,
  getSiteVisitOverviewInRange,
  listDailySiteVisitTotalsInRange
} = require("../repositories/siteVisitRepository");

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

function shouldSkipTracking(request) {
  const cookies = parseCookies(request.headers.cookie || "");
  return Boolean(cookies[ADMIN_SESSION_COOKIE_NAME]);
}

function getHeaderValue(request, headerName) {
  const headerValue = request.headers?.[headerName];
  return Array.isArray(headerValue) ? headerValue[0] || "" : String(headerValue || "");
}

function getRequestIp(request) {
  const forwardedFor = getHeaderValue(request, "x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return (
    request.ip ||
    request.socket?.remoteAddress ||
    getHeaderValue(request, "x-real-ip") ||
    ""
  ).trim();
}

function anonymizeIpAddress(ipAddress) {
  if (!ipAddress) {
    return "unknown";
  }

  if (ipAddress.includes(".")) {
    const parts = ipAddress.split(".").slice(0, 4);

    if (parts.length === 4) {
      parts[3] = "0";
      return parts.join(".");
    }
  }

  if (ipAddress.includes(":")) {
    const parts = ipAddress.split(":").slice(0, 8);
    return `${parts.slice(0, 4).join(":")}:0000:0000:0000:0000`;
  }

  return ipAddress;
}

function normalizeUserAgentProfile(request, clientContext = {}) {
  const userAgent = getHeaderValue(request, "user-agent").toLowerCase();
  const platformHint = String(
    clientContext.platform || getHeaderValue(request, "sec-ch-ua-platform")
  )
    .replace(/"/g, "")
    .toLowerCase();
  const mobileHint = String(
    clientContext.deviceClass || getHeaderValue(request, "sec-ch-ua-mobile")
  ).toLowerCase();
  const screenBucket = String(clientContext.screenBucket || "").trim().toLowerCase();
  const touchBucket = String(clientContext.touchBucket || "").trim().toLowerCase();
  let operatingSystem = "other";

  if (platformHint.includes("ios") || /iphone|ipad|ipod/.test(userAgent)) {
    operatingSystem = "ios";
  } else if (platformHint.includes("android") || userAgent.includes("android")) {
    operatingSystem = "android";
  } else if (platformHint.includes("windows") || userAgent.includes("windows")) {
    operatingSystem = "windows";
  } else if (
    platformHint.includes("mac") ||
    userAgent.includes("mac os") ||
    userAgent.includes("macintosh")
  ) {
    operatingSystem = "macos";
  } else if (platformHint.includes("linux") || userAgent.includes("linux")) {
    operatingSystem = "linux";
  }

  let deviceClass = "desktop";

  if (
    mobileHint === "mobile" ||
    mobileHint === "?1" ||
    /iphone|ipod|android.+mobile|windows phone/.test(userAgent)
  ) {
    deviceClass = "mobile";
  } else if (
    /ipad|tablet|android(?!.*mobile)/.test(userAgent) ||
    platformHint.includes("ipad")
  ) {
    deviceClass = "tablet";
  }

  return {
    operatingSystem,
    deviceClass,
    screenBucket: screenBucket || "unknown",
    touchBucket: touchBucket || "unknown"
  };
}

function normalizeLocaleProfile(request, clientContext = {}) {
  const languageHeader = getHeaderValue(request, "accept-language");
  const locale = String(clientContext.locale || languageHeader.split(",")[0] || "")
    .trim()
    .toLowerCase();
  const timezone = String(clientContext.timezone || "").trim().toLowerCase();

  return {
    locale: locale || "unknown",
    timezone: timezone || "unknown"
  };
}

function normalizeGeoProfile(request) {
  const country =
    getHeaderValue(request, "x-vercel-ip-country") ||
    getHeaderValue(request, "cf-ipcountry");
  const region = getHeaderValue(request, "x-vercel-ip-country-region");
  const city = getHeaderValue(request, "x-vercel-ip-city");

  return {
    country: String(country || "unknown").trim().toLowerCase(),
    region: String(region || "unknown").trim().toLowerCase(),
    city: String(city || "unknown").trim().toLowerCase()
  };
}

function createEstimatedVisitorHash(request, clientContext = {}) {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.RESERVATION_FILE_ENCRYPTION_KEY ||
    "lea-site-visit-fingerprint";
  const ipBucket = anonymizeIpAddress(getRequestIp(request));
  const agentProfile = normalizeUserAgentProfile(request, clientContext);
  const localeProfile = normalizeLocaleProfile(request, clientContext);
  const geoProfile = normalizeGeoProfile(request);
  const fingerprintPayload = JSON.stringify({
    version: 2,
    ipBucket,
    ...agentProfile,
    ...localeProfile,
    ...geoProfile
  });

  return crypto
    .createHmac("sha256", secret)
    .update(fingerprintPayload)
    .digest("hex");
}

function normalizeTrackedPath(requestPath) {
  const normalizedPath = String(requestPath || "/").trim();

  if (!normalizedPath || !normalizedPath.startsWith("/")) {
    return "/";
  }

  if (
    normalizedPath.startsWith("/api") ||
    normalizedPath.startsWith("/admin") ||
    normalizedPath.startsWith("/reservations") ||
    normalizedPath.startsWith("/clients") ||
    normalizedPath.startsWith("/commencer")
  ) {
    return "";
  }

  return normalizedPath;
}

async function trackPublicSiteVisit(request, response, options = {}) {
  if (shouldSkipTracking(request)) {
    return false;
  }

  const clientContext =
    options.clientContext && typeof options.clientContext === "object"
      ? options.clientContext
      : {};
  const requestPath = normalizeTrackedPath(options.requestPath || request.path || "/");

  if (!requestPath) {
    return false;
  }

  const visitorHash = createEstimatedVisitorHash(request, clientContext);

  await createSiteVisitEvent({
    visitorHash,
    requestPath
  });

  return true;
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
  trackPublicSiteVisit,
  getSiteVisitDashboardStats,
  formatDateKey,
  toDate,
  isValidDate
};
