const express = require("express");
const { getHomePageContent } = require("../services/contentService");

const router = express.Router();

router.get("/home", (request, response) => {
  response.json(getHomePageContent());
});

module.exports = router;
