const {
  createVehicle,
  deleteVehicle,
  findVehicleById,
  listVehicles,
  updateVehicle,
  updateVehicleAvailabilityStatus
} = require("../repositories/vehicleRepository");
const {
  listVehicleIdsWithFutureAcceptedReservations
} = require("../repositories/reservationRepository");
const {
  removeStoredVehicleMedia
} = require("../middleware/vehicleUploadMiddleware");

const AVAILABILITY_STATUSES = new Set(["available", "maintenance", "reserved"]);
const TRANSMISSION_OPTIONS = ["Automatique", "Manuelle"];
const FUEL_TYPE_OPTIONS = ["Essence", "Diesel", "GPL"];

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeOption(value, options, label) {
  const normalizedValue = normalizeString(value).toLowerCase();
  const matchedOption = options.find(
    (option) => option.toLowerCase() === normalizedValue
  );

  if (!matchedOption) {
    throw new Error(`${label} invalide.`);
  }

  return matchedOption;
}

function parseRequiredNumber(value, label) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`${label} invalide.`);
  }

  return parsedValue;
}

function parseInteger(value, label) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${label} invalide.`);
  }

  return parsedValue;
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "1" || value === "on";
  }

  return Boolean(value);
}

function normalizePhotoUrls(photoUrls) {
  if (Array.isArray(photoUrls)) {
    return photoUrls
      .map((item) => normalizeString(item))
      .filter(Boolean);
  }

  return normalizeString(photoUrls)
    .split("\n")
    .map((item) => normalizeString(item))
    .filter(Boolean);
}

function normalizeAvailabilityStatus(value, defaultValue) {
  const normalizedValue = normalizeString(value) || defaultValue;

  if (!AVAILABILITY_STATUSES.has(normalizedValue)) {
    throw new Error("Disponibilite invalide.");
  }

  return normalizedValue;
}

function normalizeVehiclePayload(payload, { isCreate, currentVehicle = null }) {
  const submittedPhotoUrls = normalizePhotoUrls(payload.photoUrls);
  const shouldUseSubmittedPhotoUrls =
    payload.photoUrlsConfigured === true ||
    payload.photoUrlsConfigured === "true";
  const photoUrls =
    shouldUseSubmittedPhotoUrls
      ? submittedPhotoUrls
      : currentVehicle?.photoUrls || [];
  const submittedVideoUrl = normalizeString(payload.videoUrl);

  if (photoUrls.length === 0) {
    throw new Error("Au moins une photo du vehicule est requise.");
  }

  const vehicle = {
    brand: normalizeString(payload.brand),
    model: normalizeString(payload.model),
    version: normalizeString(payload.version),
    fuelType: normalizeOption(payload.fuelType, FUEL_TYPE_OPTIONS, "Carburant"),
    transmission: normalizeOption(
      payload.transmission,
      TRANSMISSION_OPTIONS,
      "Boite de vitesse"
    ),
    seats: parseInteger(payload.seats, "Nombre de places"),
    isConvertible: parseBoolean(payload.isConvertible),
    horsepower: parseInteger(payload.horsepower, "Puissance"),
    dailyPrice: parseRequiredNumber(payload.dailyPrice, "Prix journalier"),
    weeklyPrice: parseRequiredNumber(payload.weeklyPrice, "Prix hebdomadaire"),
    monthlyPrice: parseRequiredNumber(payload.monthlyPrice, "Prix mensuel"),
    securityDeposit: parseRequiredNumber(
      payload.securityDeposit,
      "Depot de garantie"
    ),
    includedKmPerDay: parseInteger(
      payload.includedKmPerDay,
      "Kilometrage autorise par jour"
    ),
    extraKmPrice: parseRequiredNumber(
      payload.extraKmPrice,
      "Prix des kilometres supplementaires"
    ),
    pricingDescription: currentVehicle?.pricingDescription || "",
    rentalConditions: currentVehicle?.rentalConditions || "",
    videoUrl: submittedVideoUrl || currentVehicle?.videoUrl || null,
    photoUrls,
    availabilityStatus: normalizeAvailabilityStatus(
      payload.availabilityStatus,
      isCreate ? "available" : currentVehicle?.availabilityStatus || "available"
    )
  };

  if (
    !vehicle.brand ||
    !vehicle.model ||
    !vehicle.version ||
    !vehicle.fuelType ||
    !vehicle.transmission
  ) {
    throw new Error("Tous les champs obligatoires du vehicule doivent etre remplis.");
  }

  return vehicle;
}

async function listPublicVehicles() {
  await syncVehicleReservationAvailability();
  return listVehicles({ includeMaintenance: false });
}

async function listAdminVehicles() {
  await syncVehicleReservationAvailability();
  return listVehicles({ includeMaintenance: true });
}

async function getPublicVehicleById(id) {
  await syncVehicleReservationAvailability();
  const vehicle = await findVehicleById(id);

  if (
    !vehicle ||
    (vehicle.availabilityStatus !== "available" &&
      vehicle.availabilityStatus !== "reserved")
  ) {
    return null;
  }

  return vehicle;
}

async function getAdminVehicleById(id) {
  await syncVehicleAvailabilityForVehicle(id);
  return findVehicleById(id);
}

async function createAdminVehicle(payload) {
  const vehicle = normalizeVehiclePayload(payload, {
    isCreate: true,
    currentVehicle: null
  });
  vehicle.availabilityStatus = "available";
  return createVehicle(vehicle);
}

async function updateAdminVehicle(id, payload, currentVehicle) {
  const hadNewVideo = Boolean(normalizeString(payload.videoUrl));
  const vehicle = normalizeVehiclePayload(payload, {
    isCreate: false,
    currentVehicle
  });
  const updatedVehicle = await updateVehicle(id, vehicle);
  const removedMedia = (currentVehicle?.photoUrls || []).filter(
    (photoUrl) => !updatedVehicle.photoUrls.includes(photoUrl)
  );

  if (
    hadNewVideo &&
    currentVehicle?.videoUrl &&
    currentVehicle.videoUrl !== updatedVehicle.videoUrl
  ) {
    removedMedia.push(currentVehicle.videoUrl);
  }

  if (removedMedia.length > 0) {
    await removeStoredVehicleMedia(removedMedia);
  }

  return updatedVehicle;
}

async function deleteAdminVehicle(id) {
  const currentVehicle = await findVehicleById(id);

  await deleteVehicle(id);

  if (currentVehicle) {
    await removeStoredVehicleMedia([
      ...(currentVehicle.photoUrls || []),
      currentVehicle.videoUrl
    ]);
  }

  return true;
}

async function markVehicleAsMaintenance(id) {
  return updateVehicleAvailabilityStatus(id, "maintenance");
}

async function markVehicleAsAvailable(id) {
  const hasAcceptedReservation = await hasFutureAcceptedReservation(id);
  return updateVehicleAvailabilityStatus(
    id,
    hasAcceptedReservation ? "reserved" : "available"
  );
}

async function hasFutureAcceptedReservation(vehicleId) {
  const reservedVehicleIds = await listVehicleIdsWithFutureAcceptedReservations();
  return reservedVehicleIds.includes(Number(vehicleId));
}

async function syncVehicleAvailabilityForVehicle(vehicleId) {
  const vehicle = await findVehicleById(vehicleId);

  if (!vehicle || vehicle.availabilityStatus === "maintenance") {
    return vehicle;
  }

  const nextStatus = (await hasFutureAcceptedReservation(vehicleId))
    ? "reserved"
    : "available";

  if (vehicle.availabilityStatus === nextStatus) {
    return vehicle;
  }

  return updateVehicleAvailabilityStatus(vehicleId, nextStatus);
}

async function syncVehicleReservationAvailability() {
  const vehicles = await listVehicles({ includeMaintenance: true });
  const reservedVehicleIds = new Set(
    await listVehicleIdsWithFutureAcceptedReservations()
  );

  await Promise.all(
    vehicles.map(async (vehicle) => {
      if (vehicle.availabilityStatus === "maintenance") {
        return;
      }

      const nextStatus = reservedVehicleIds.has(vehicle.id)
        ? "reserved"
        : "available";

      if (vehicle.availabilityStatus !== nextStatus) {
        await updateVehicleAvailabilityStatus(vehicle.id, nextStatus);
      }
    })
  );
}

module.exports = {
  createAdminVehicle,
  deleteAdminVehicle,
  getAdminVehicleById,
  getPublicVehicleById,
  hasFutureAcceptedReservation,
  listAdminVehicles,
  markVehicleAsAvailable,
  listPublicVehicles,
  markVehicleAsMaintenance,
  syncVehicleAvailabilityForVehicle,
  updateAdminVehicle
};
