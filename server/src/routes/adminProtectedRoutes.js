const express = require("express");
const {
  requireAdminApiAuth
} = require("../middleware/adminAuthMiddleware");
const {
  getAdminDashboardStats
} = require("../services/adminDashboardService");

const router = express.Router();

router.use(requireAdminApiAuth);

router.get("/me", (request, response) => {
  response.json({
    admin: request.admin
  });
});

router.get("/dashboard", async (request, response, next) => {
  try {
    const stats = await getAdminDashboardStats();

    response.json({
      admin: request.admin,
      stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
