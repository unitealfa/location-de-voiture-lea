const express = require("express");
const { trackPublicSiteVisit } = require("../services/siteVisitService");

const router = express.Router();

router.post("/track", async (request, response) => {
  try {
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
