const {
  createReservation,
  deleteReservation,
  findReservationById,
  findOverlappingAcceptedReservation,
  listAcceptedReservationsByVehicleId,
  listReservations,
  updateReservation,
  updateReservationStatus
} = require("../repositories/reservationRepository");
const {
  removeStoredReservationFile
} = require("../middleware/reservationUploadMiddleware");
const {
  getAdminVehicleById,
  getPublicVehicleById,
  syncVehicleAvailabilityForVehicle
} = require("./vehicleService");

const LOCATION_TYPES = new Set(["bureau", "aeroport", "commentaire"]);
const RESERVATION_STATUSES = new Set(["pending", "accepted"]);

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeOptionalEmail(value) {
  const normalizedValue = normalizeString(value);
  return normalizedValue || null;
}

function normalizeLocationType(value, label) {
  const normalizedValue = normalizeString(value).toLowerCase();

  if (!LOCATION_TYPES.has(normalizedValue)) {
    throw new Error(`${label} invalide.`);
  }

  return normalizedValue;
}

function normalizeDatetime(value, label) {
  const normalizedValue = normalizeString(value);
  const parsedDate = new Date(normalizedValue);

  if (!normalizedValue || Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${label} invalide.`);
  }

  const databaseValue = normalizedValue.replace("T", " ").slice(0, 19);
  return databaseValue.length === 16 ? `${databaseValue}:00` : databaseValue;
}

function formatDurationLabel(pickupDatetime, returnDatetime) {
  const pickupTime = new Date(pickupDatetime).getTime();
  const returnTime = new Date(returnDatetime).getTime();
  const durationMs = Math.max(returnTime - pickupTime, 0);
  const totalHours = Math.ceil(durationMs / (1000 * 60 * 60));

  if (totalHours < 24) {
    return `${totalHours} heure${totalHours > 1 ? "s" : ""}`;
  }

  const totalDays = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (remainingHours === 0) {
    return `${totalDays} jour${totalDays > 1 ? "s" : ""}`;
  }

  return `${totalDays} jour${totalDays > 1 ? "s" : ""} ${remainingHours} heure${remainingHours > 1 ? "s" : ""}`;
}

function withReservationComputedFields(reservation) {
  if (!reservation) {
    return null;
  }

  return {
    ...reservation,
    vehicleName: [
      reservation.vehicleBrand,
      reservation.vehicleModel
    ]
      .filter(Boolean)
      .join(" "),
    durationLabel: formatDurationLabel(
      reservation.pickupDatetime,
      reservation.returnDatetime
    ),
    isPending: reservation.status === "pending",
    isAccepted: reservation.status === "accepted"
  };
}

function mapVehicleToReservationSnapshot(vehicle) {
  return {
    vehicleId: vehicle.id,
    vehicleBrand: vehicle.brand,
    vehicleModel: vehicle.model,
    vehicleVersion: vehicle.version,
    vehiclePhotoUrl: vehicle.photoUrls[0]
  };
}

async function validateReservationVehicle(vehicleId, { adminView }) {
  const vehicle = adminView
    ? await getAdminVehicleById(vehicleId)
    : await getPublicVehicleById(vehicleId);

  if (!vehicle) {
    throw new Error("Vehicule introuvable.");
  }

  if (adminView && vehicle.availabilityStatus === "maintenance") {
    throw new Error("Ce vehicule est en maintenance.");
  }

  return vehicle;
}

async function buildReservationPayload(vehicleId, payload, options = {}) {
  const {
    adminView = false,
    requiredLicensePhoto = true,
    fallbackLicensePhotoUrl = "",
    status = "pending"
  } = options;
  const vehicle = await validateReservationVehicle(vehicleId, {
    adminView
  });

  const firstName = normalizeString(payload.firstName);
  const lastName = normalizeString(payload.lastName);
  const phone = normalizeString(payload.phone);
  const comment = normalizeString(payload.comment);
  const drivingLicensePhotoUrl =
    normalizeString(payload.drivingLicensePhotoUrl) ||
    normalizeString(fallbackLicensePhotoUrl);
  const pickupLocationType = normalizeLocationType(
    payload.pickupLocationType,
    "Lieu de recuperation"
  );
  const returnLocationType = normalizeLocationType(
    payload.returnLocationType,
    "Lieu de retour"
  );
  const pickupDatetime = normalizeDatetime(
    payload.pickupDatetime,
    "Date de recuperation"
  );
  const returnDatetime = normalizeDatetime(
    payload.returnDatetime,
    "Date de retour"
  );
  const privacyPolicyAccepted =
    payload.privacyPolicyAccepted === true ||
    payload.privacyPolicyAccepted === "true" ||
    payload.privacyPolicyAccepted === "on";

  if (
    !firstName ||
    !lastName ||
    !phone ||
    !comment ||
    (requiredLicensePhoto && !drivingLicensePhotoUrl)
  ) {
    throw new Error("Tous les champs obligatoires de reservation doivent etre remplis.");
  }

  if (!privacyPolicyAccepted) {
    throw new Error("La politique de confidentialite doit etre acceptee.");
  }

  if (new Date(returnDatetime).getTime() <= new Date(pickupDatetime).getTime()) {
    throw new Error("La date de retour doit etre apres la date de recuperation.");
  }

  return {
    ...mapVehicleToReservationSnapshot(vehicle),
    firstName,
    lastName,
    drivingLicensePhotoUrl,
    email: normalizeOptionalEmail(payload.email),
    phone,
    comment,
    pickupLocationType,
    returnLocationType,
    pickupDatetime,
    returnDatetime,
    status,
    privacyPolicyAccepted
  };
}

async function ensureReservationAvailability(vehicleId, pickupDatetime, returnDatetime, excludedReservationId = null, errorMessage = "") {
  const overlappingAcceptedReservation = await findOverlappingAcceptedReservation(
    vehicleId,
    pickupDatetime,
    returnDatetime,
    excludedReservationId
  );

  if (overlappingAcceptedReservation) {
    throw new Error(
      errorMessage ||
        "Ce vehicule est deja reserve sur cette periode. Merci de choisir une autre date."
    );
  }
}

async function createVehicleReservation(vehicleId, payload) {
  const reservationPayload = await buildReservationPayload(vehicleId, payload, {
    adminView: false,
    requiredLicensePhoto: true,
    status: "pending"
  });

  await ensureReservationAvailability(
    reservationPayload.vehicleId,
    reservationPayload.pickupDatetime,
    reservationPayload.returnDatetime
  );

  const reservation = await createReservation(reservationPayload);

  return withReservationComputedFields(reservation);
}

function normalizeReservationScope(scope) {
  const normalizedScope = normalizeString(scope).toLowerCase();

  if (!normalizedScope) {
    return "pending";
  }

  if (normalizedScope === "all") {
    return "all";
  }

  if (!RESERVATION_STATUSES.has(normalizedScope)) {
    throw new Error("Filtre de reservation invalide.");
  }

  return normalizedScope;
}

async function listAdminReservations(scope = "pending") {
  const normalizedScope = normalizeReservationScope(scope);
  const reservations = await listReservations({
    status: normalizedScope === "all" ? null : normalizedScope,
    futureOnly: normalizedScope === "accepted"
  });

  return reservations.map(withReservationComputedFields);
}

async function getAdminReservationById(id) {
  const reservation = await findReservationById(id);
  return withReservationComputedFields(reservation);
}

async function listVehicleAcceptedReservationSlots(vehicleId) {
  const reservations = await listAcceptedReservationsByVehicleId(vehicleId);

  return reservations.map((reservation) => ({
    id: reservation.id,
    pickupDatetime: reservation.pickupDatetime,
    returnDatetime: reservation.returnDatetime
  }));
}

async function acceptAdminReservation(id) {
  const reservation = await findReservationById(id);

  if (!reservation) {
    return null;
  }

  if (reservation.status === "accepted") {
    return withReservationComputedFields(reservation);
  }

  if (reservation.status !== "pending") {
    throw new Error("Cette reservation ne peut plus etre acceptee.");
  }

  if (!reservation.vehicleId) {
    throw new Error("Le vehicule de cette reservation est introuvable.");
  }

  const vehicle = await getAdminVehicleById(reservation.vehicleId);

  if (!vehicle) {
    throw new Error("Le vehicule de cette reservation est introuvable.");
  }

  if (vehicle.availabilityStatus === "maintenance") {
    throw new Error("Ce vehicule est en maintenance et ne peut pas etre reserve.");
  }

  await ensureReservationAvailability(
    reservation.vehicleId,
    reservation.pickupDatetime,
    reservation.returnDatetime,
    reservation.id,
    "Ce vehicule est deja reserve sur cette periode. La demande ne peut pas etre acceptee."
  );

  const acceptedReservation = await updateReservationStatus(id, "accepted");
  await syncVehicleAvailabilityForVehicle(reservation.vehicleId);

  return withReservationComputedFields(acceptedReservation);
}

async function createAdminReservation(payload) {
  const vehicleId = Number(payload.vehicleId);

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new Error("Vehicule invalide.");
  }

  const reservationPayload = await buildReservationPayload(vehicleId, payload, {
    adminView: true,
    requiredLicensePhoto: true,
    status: "accepted"
  });

  await ensureReservationAvailability(
    reservationPayload.vehicleId,
    reservationPayload.pickupDatetime,
    reservationPayload.returnDatetime,
    null,
    "Ce vehicule est deja reserve sur cette periode."
  );

  const reservation = await createReservation(reservationPayload);
  await syncVehicleAvailabilityForVehicle(reservation.vehicleId);

  return withReservationComputedFields(reservation);
}

async function updateAdminReservation(id, payload) {
  const currentReservation = await findReservationById(id);

  if (!currentReservation) {
    return null;
  }

  const vehicleId = Number(payload.vehicleId || currentReservation.vehicleId);

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new Error("Vehicule invalide.");
  }

  const reservationPayload = await buildReservationPayload(vehicleId, payload, {
    adminView: true,
    requiredLicensePhoto: false,
    fallbackLicensePhotoUrl: currentReservation.drivingLicensePhotoUrl,
    status: currentReservation.status
  });

  if (currentReservation.status === "accepted") {
    await ensureReservationAvailability(
      reservationPayload.vehicleId,
      reservationPayload.pickupDatetime,
      reservationPayload.returnDatetime,
      currentReservation.id,
      "Ce vehicule est deja reserve sur cette periode. La demande ne peut pas etre acceptee."
    );
  }

  const updatedReservation = await updateReservation(id, reservationPayload);

  if (
    currentReservation.drivingLicensePhotoUrl &&
    currentReservation.drivingLicensePhotoUrl !==
      updatedReservation.drivingLicensePhotoUrl
  ) {
    await removeStoredReservationFile(currentReservation.drivingLicensePhotoUrl);
  }

  if (currentReservation.vehicleId) {
    await syncVehicleAvailabilityForVehicle(currentReservation.vehicleId);
  }

  if (
    updatedReservation.vehicleId &&
    updatedReservation.vehicleId !== currentReservation.vehicleId
  ) {
    await syncVehicleAvailabilityForVehicle(updatedReservation.vehicleId);
  }

  return withReservationComputedFields(updatedReservation);
}

async function rejectAdminReservation(id) {
  const reservation = await findReservationById(id);

  if (!reservation) {
    return null;
  }

  await deleteReservation(id);
  await removeStoredReservationFile(reservation.drivingLicensePhotoUrl);

  if (reservation.vehicleId) {
    await syncVehicleAvailabilityForVehicle(reservation.vehicleId);
  }

  return true;
}

async function deleteAdminReservation(id) {
  const reservation = await findReservationById(id);

  if (!reservation) {
    return null;
  }

  await deleteReservation(id);
  await removeStoredReservationFile(reservation.drivingLicensePhotoUrl);

  if (reservation.vehicleId) {
    await syncVehicleAvailabilityForVehicle(reservation.vehicleId);
  }

  return true;
}

module.exports = {
  acceptAdminReservation,
  createAdminReservation,
  createVehicleReservation,
  deleteAdminReservation,
  getAdminReservationById,
  listAdminReservations,
  listVehicleAcceptedReservationSlots,
  updateAdminReservation,
  rejectAdminReservation
};
