const express = require("express");
const { getHomePageContent } = require("../services/contentService");
const { getOrSetResponseCache } = require("../services/responseCacheService");

const router = express.Router();

router.get("/home", async (request, response) => {
  const payload = await getOrSetResponseCache("content:home", 1000 * 60 * 10, async () => getHomePageContent());
  response.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  response.json(payload);
});

module.exports = router;
