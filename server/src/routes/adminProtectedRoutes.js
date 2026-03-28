const express = require("express");
const {
  requireAdminApiAuth
} = require("../middleware/adminAuthMiddleware");
const {
  getAdminDashboardStats
} = require("../services/adminDashboardService");
const {
  getVisualSettings,
  updateVisualSettings,
  getCurrentSiteContent
} = require("../services/contentService");
const {
  handleBrandingImageUpload,
  saveBrandingImage,
  removeStoredBrandingImage
} = require("../middleware/brandingUploadMiddleware");
const {
  getOrSetResponseCache,
  clearResponseCacheByPrefixes
} = require("../services/responseCacheService");

const router = express.Router();

router.use(requireAdminApiAuth);

router.get("/me", (request, response) => {
  response.json({
    admin: request.admin
  });
});

router.get("/visual-settings", async (request, response) => {
  response.json({
    admin: request.admin,
    settings: await getVisualSettings()
  });
});

router.post("/visual-settings/upload", handleBrandingImageUpload, async (request, response, next) => {
  try {
    const slot = String(request.body?.slot || "branding").trim();
    const nextUrl = await saveBrandingImage(request.file, slot);

    response.json({
      admin: request.admin,
      url: nextUrl,
      content: await getCurrentSiteContent()
    });
  } catch (error) {
    next(error);
  }
});

router.put("/visual-settings", async (request, response, next) => {
  try {
    const previousContent = await getCurrentSiteContent();
    const payload = await updateVisualSettings(request.body || {});
    clearResponseCacheByPrefixes(["content:"]);

    const previousBrandingUrls = [
      previousContent.brand?.faviconImagePath,
      previousContent.brand?.logoImagePath,
      previousContent.footer?.logoImagePath
    ].filter(Boolean);

    const nextBrandingUrls = new Set(
      [
        payload.content.brand?.faviconImagePath,
        payload.content.brand?.logoImagePath,
        payload.content.footer?.logoImagePath
      ].filter(Boolean)
    );

    Promise.all(
      previousBrandingUrls
        .filter((url) => url.startsWith("/uploads/branding/") && !nextBrandingUrls.has(url))
        .map((url) => removeStoredBrandingImage(url))
    ).catch(() => {});

    response.json({
      admin: request.admin,
      settings: payload.visualSettings,
      content: payload.content
    });
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", async (request, response, next) => {
  try {
    const queryKey = new URLSearchParams(request.query || {}).toString();
    const cacheKey = `dashboard:${request.admin?.id || "admin"}:${queryKey}`;
    const stats = await getOrSetResponseCache(cacheKey, 1000 * 20, async () => getAdminDashboardStats(request.query || {}));

    response.set("Cache-Control", "private, max-age=15, stale-while-revalidate=60");
    response.json({
      admin: request.admin,
      stats
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    next(error);
  }
});

module.exports = router;
