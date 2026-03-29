const express = require("express");
const {
  findBrandingMediaAssetById
} = require("../repositories/brandingMediaAssetRepository");
const { DEFAULT_BRANDING_IMAGE_URL } = require("../services/mediaUrlService");

const router = express.Router();

function parseAssetId(value) {
  const assetId = Number(value);
  return Number.isInteger(assetId) && assetId > 0 ? assetId : null;
}

router.get("/:id", async (request, response) => {
  try {
    const assetId = parseAssetId(request.params.id);

    if (!assetId) {
      return response.redirect(307, DEFAULT_BRANDING_IMAGE_URL);
    }

    const asset = await findBrandingMediaAssetById(assetId);

    if (!asset) {
      return response.redirect(307, DEFAULT_BRANDING_IMAGE_URL);
    }

    response.set("Cache-Control", "public, max-age=31536000, immutable");
    response.set("Content-Type", asset.contentType || "application/octet-stream");
    return response.send(asset.binaryData);
  } catch (error) {
    console.error("Branding media load failed", error);
    return response.redirect(307, DEFAULT_BRANDING_IMAGE_URL);
  }
});

module.exports = router;
