const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const {
  createBrandingMediaAsset,
  deleteBrandingMediaAsset
} = require("../repositories/brandingMediaAssetRepository");
const { resolveUploadsRoot } = require("../services/storagePathService");

const uploadsRoot = resolveUploadsRoot();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 25 * 1024 * 1024
  }
});

function handleBrandingImageUpload(request, response, next) {
  upload.single("image")(request, response, (error) => {
    if (error) {
      return response.status(400).json({
        message: "Upload du logo impossible."
      });
    }

    if (!request.file) {
      return response.status(400).json({
        message: "Aucune image selectionnee."
      });
    }

    return next();
  });
}

function buildManagedUrl(filename) {
  return `/api/media/branding/${filename}`;
}

function parseBrandingAssetId(url) {
  if (typeof url !== "string") {
    return null;
  }

  const match = url.match(/^\/api\/media\/branding\/(\d+)$/);

  if (!match) {
    return null;
  }

  const assetId = Number(match[1]);
  return Number.isInteger(assetId) && assetId > 0 ? assetId : null;
}

function toManagedUploadPath(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/branding/")) {
    return null;
  }

  const relativePath = url.replace(/^\/uploads\//, "");
  return path.resolve(uploadsRoot, relativePath);
}

async function saveBrandingImage(file, slot = "branding") {
  const normalizedSlot = String(slot || "branding").trim() || "branding";
  const originalFileName = String(file.originalname || `${normalizedSlot}.bin`);
  const originalExtension = path.extname(originalFileName || "").toLowerCase() || ".bin";
  let contentType = String(file.mimetype || "").trim() || "application/octet-stream";
  let binaryData = file.buffer;

  try {
    binaryData = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 82
      })
      .toBuffer();
    contentType = "image/webp";
  } catch (error) {
  }

  const asset = await createBrandingMediaAsset({
    contentType,
    originalFileName,
    originalExtension,
    binaryData
  });

  return buildManagedUrl(asset.id);
}

async function removeStoredBrandingImage(url) {
  const assetId = parseBrandingAssetId(url);

  if (assetId) {
    await deleteBrandingMediaAsset(assetId).catch(() => {});
    return;
  }

  const filePath = toManagedUploadPath(url);

  if (!filePath) {
    return;
  }

  await fs.unlink(filePath).catch(() => {});
}

module.exports = {
  handleBrandingImageUpload,
  saveBrandingImage,
  removeStoredBrandingImage
};
