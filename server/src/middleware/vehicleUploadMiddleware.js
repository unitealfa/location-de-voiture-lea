const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");

const uploadsRoot = path.resolve(__dirname, "../../uploads");
const vehicleUploadsRoot = path.resolve(uploadsRoot, "vehicles");

async function ensureVehicleUploadsRoot() {
  await fs.mkdir(vehicleUploadsRoot, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination(request, file, callback) {
    ensureVehicleUploadsRoot()
      .then(() => callback(null, vehicleUploadsRoot))
      .catch(callback);
  },
  filename(request, file, callback) {
    const extension = path.extname(file.originalname || "").toLowerCase();

    callback(
      null,
      `${Date.now()}-${crypto.randomUUID()}${extension}`
    );
  }
});

const upload = multer({
  storage,
  limits: {
    files: 21,
    fileSize: 250 * 1024 * 1024
  }
});

function flattenUploadedFiles(files) {
  return Object.values(files || {}).flat();
}

function handleVehicleMediaUpload(request, response, next) {
  upload.fields([
    {
      name: "video",
      maxCount: 1
    },
    {
      name: "photos",
      maxCount: 20
    }
  ])(request, response, (error) => {
    if (error) {
      return response.status(400).json({
        message: "Upload des medias du vehicule impossible."
      });
    }

    return next();
  });
}

function buildManagedUrl(filename) {
  return `/uploads/vehicles/${filename}`;
}

function buildManagedPath(filename) {
  return path.resolve(vehicleUploadsRoot, filename);
}

function buildThumbnailFilename(filename) {
  const parsedPath = path.parse(filename);
  return `${parsedPath.name}--thumb.webp`;
}

function buildOptimizedFilename(filename) {
  const parsedPath = path.parse(filename);
  return `${parsedPath.name}.webp`;
}

async function optimizeUploadedPhoto(file) {
  const optimizedFilename = buildOptimizedFilename(file.filename);
  const thumbnailFilename = buildThumbnailFilename(file.filename);
  const optimizedPath = buildManagedPath(optimizedFilename);
  const thumbnailPath = buildManagedPath(thumbnailFilename);

  try {
    await sharp(file.path)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 72
      })
      .toFile(optimizedPath);

    await sharp(file.path)
      .rotate()
      .resize({
        width: 560,
        height: 560,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 66
      })
      .toFile(thumbnailPath);

    await fs.unlink(file.path).catch(() => {});

    return buildManagedUrl(optimizedFilename);
  } catch (error) {
    return buildManagedUrl(file.filename);
  }
}

async function mapUploadedVehicleMedia(files) {
  const photoUrls = await Promise.all(
    (files?.photos || []).map((file) => optimizeUploadedPhoto(file))
  );
  const videoUrl = files?.video?.[0]
    ? buildManagedUrl(files.video[0].filename)
    : "";

  return {
    photoUrls,
    videoUrl
  };
}

async function removeUploadedFiles(files) {
  await Promise.all(
    flattenUploadedFiles(files).map((file) =>
      fs.unlink(file.path).catch(() => {})
    )
  );
}

function toManagedUploadPath(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/vehicles/")) {
    return null;
  }

  const relativePath = url.replace(/^\/uploads\//, "");
  return path.resolve(uploadsRoot, relativePath);
}

function toManagedThumbnailPath(url) {
  const filePath = toManagedUploadPath(url);

  if (!filePath || !filePath.endsWith(".webp") || filePath.endsWith("--thumb.webp")) {
    return null;
  }

  return filePath.replace(/\.webp$/, "--thumb.webp");
}

async function removeStoredVehicleMedia(urls) {
  await Promise.all(
    (urls || [])
      .filter(Boolean)
      .flatMap((url) => [toManagedUploadPath(url), toManagedThumbnailPath(url)])
      .filter(Boolean)
      .map((filePath) => fs.unlink(filePath).catch(() => {}))
  );
}

module.exports = {
  handleVehicleMediaUpload,
  mapUploadedVehicleMedia,
  removeStoredVehicleMedia,
  removeUploadedFiles,
  uploadsRoot
};
