const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");

const uploadsRoot = path.resolve(__dirname, "../../uploads");
const reservationUploadsRoot = path.resolve(uploadsRoot, "reservations");

async function ensureReservationUploadsRoot() {
  await fs.mkdir(reservationUploadsRoot, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination(request, file, callback) {
    ensureReservationUploadsRoot()
      .then(() => callback(null, reservationUploadsRoot))
      .catch(callback);
  },
  filename(request, file, callback) {
    const extension = path.extname(file.originalname || "").toLowerCase();

    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    files: 1,
    fileSize: 20 * 1024 * 1024
  }
});

function handleReservationUpload(request, response, next) {
  upload.single("drivingLicensePhoto")(request, response, (error) => {
    if (error) {
      return response.status(400).json({
        message: "Upload du permis impossible."
      });
    }

    return next();
  });
}

async function optimizeReservationLicensePhoto(file) {
  if (!file) {
    return "";
  }

  const optimizedFilename = `${path.parse(file.filename).name}.webp`;
  const optimizedPath = path.resolve(reservationUploadsRoot, optimizedFilename);

  try {
    await sharp(file.path)
      .rotate()
      .resize({
        width: 1800,
        height: 1800,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 74
      })
      .toFile(optimizedPath);

    await fs.unlink(file.path).catch(() => {});

    return `/uploads/reservations/${optimizedFilename}`;
  } catch (error) {
    return `/uploads/reservations/${file.filename}`;
  }
}

async function removeUploadedReservationFile(file) {
  if (!file?.path) {
    return;
  }

  await fs.unlink(file.path).catch(() => {});
}

function toManagedReservationPath(url) {
  if (
    typeof url !== "string" ||
    !url.startsWith("/uploads/reservations/")
  ) {
    return null;
  }

  return path.resolve(uploadsRoot, url.replace(/^\/uploads\//, ""));
}

async function removeStoredReservationFile(url) {
  const filePath = toManagedReservationPath(url);

  if (!filePath) {
    return;
  }

  await fs.unlink(filePath).catch(() => {});
}

module.exports = {
  handleReservationUpload,
  optimizeReservationLicensePhoto,
  removeStoredReservationFile,
  removeUploadedReservationFile
};
