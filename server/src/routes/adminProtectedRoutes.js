const express = require("express");
const {
  requireAdminApiAuth
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(requireAdminApiAuth);

router.get("/me", (request, response) => {
  response.json({
    admin: request.admin
  });
});

router.get("/dashboard", (request, response) => {
  response.json({
    message: "Zone admin protegee.",
    admin: request.admin
  });
});

module.exports = router;
