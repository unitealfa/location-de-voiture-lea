const express = require("express");
const { trackPublicSiteVisit } = require("../services/siteVisitService");
const { ensureDatabaseBootstrap } = require("../services/databaseBootstrapService");

const router = express.Router();

router.post("/track", async (request, response) => {
  try {
    await ensureDatabaseBootstrap();

    const tracked = await trackPublicSiteVisit(request, response, {
      requestPath: request.body?.path,
      clientContext: request.body?.context
    });

    return response.status(202).json({ tracked });
  } catch (error) {
    console.error("Unable to track site visit.", error);
    return response.status(202).json({ tracked: false });
  }
});

module.exports = router;
