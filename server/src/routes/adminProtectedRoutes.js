const express = require("express");
const {
  requireAdminApiAuth
} = require("../middleware/adminAuthMiddleware");
const {
  getAdminDashboardStats
} = require("../services/adminDashboardService");
const { getOrSetResponseCache } = require("../services/responseCacheService");

const router = express.Router();

router.use(requireAdminApiAuth);

router.get("/me", (request, response) => {
  response.json({
    admin: request.admin
  });
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
