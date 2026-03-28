const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");

const uploadsRoot = path.resolve(__dirname, "../../uploads");
const brandingUploadsRoot = path.resolve(uploadsRoot, "branding");

async function ensureBrandingUploadsRoot() {
  await fs.mkdir(brandingUploadsRoot, {
    recursive: true
  });
}

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
  return `/uploads/branding/${filename}`;
}

function toManagedUploadPath(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/branding/")) {
    return null;
  }

  const relativePath = url.replace(/^\/uploads\//, "");
  return path.resolve(uploadsRoot, relativePath);
}

async function saveBrandingImage(file, slot = "branding") {
  await ensureBrandingUploadsRoot();

  const filename = `${Date.now()}-${slot}-${crypto.randomUUID()}.webp`;
  const targetPath = path.resolve(brandingUploadsRoot, filename);

  await sharp(file.buffer)
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
    .toFile(targetPath);

  return buildManagedUrl(filename);
}

async function removeStoredBrandingImage(url) {
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
