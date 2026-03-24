const express = require("express");
const {
  handleReservationUpload,
  optimizeReservationLicensePhotos,
  removeStoredReservationFile,
  removeUploadedReservationFile
} = require("../middleware/reservationUploadMiddleware");
const {
  createVehicleReservation,
  listVehicleAcceptedReservationSlots
} = require("../services/reservationService");
const {
  getPublicVehicleById: getVehicleByPublicId,
  listPublicVehicles: listPublicVehiclesService
} = require("../services/vehicleService");

const router = express.Router();

function parseVehicleId(value) {
  const vehicleId = Number(value);
  return Number.isInteger(vehicleId) && vehicleId > 0 ? vehicleId : null;
}

router.get("/", async (request, response) => {
  try {
    const vehicles = await listPublicVehiclesService();
    response.json({ vehicles });
  } catch (error) {
    console.error("Public vehicles list failed", error);
    response.status(500).json({
      message: "Impossible de charger les vehicules."
    });
  }
});

router.post("/:id/reservations", handleReservationUpload, async (request, response) => {
  let drivingLicensePhotoUrl = "";

  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      await removeUploadedReservationFile(request.files);
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    drivingLicensePhotoUrl = await optimizeReservationLicensePhotos(request.files);

    const reservation = await createVehicleReservation(vehicleId, {
      ...(request.body || {}),
      drivingLicensePhotoUrl
    });

    return response.status(201).json({
      message: "Reservation envoyee avec succes.",
      reservation
    });
  } catch (error) {
    await removeUploadedReservationFile(request.files);
    await removeStoredReservationFile(drivingLicensePhotoUrl);
    return response.status(400).json({
      message: error.message || "Reservation impossible."
    });
  }
});

router.get("/:id/reservation-availability", async (request, response) => {
  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    const vehicle = await getVehicleByPublicId(vehicleId);

    if (!vehicle) {
      return response.status(404).json({
        message: "Vehicule introuvable."
      });
    }

    const reservations = await listVehicleAcceptedReservationSlots(vehicleId);

    return response.json({
      reservations
    });
  } catch (error) {
    console.error("Vehicle reservation availability failed", error);
    return response.status(500).json({
      message: "Impossible de charger les disponibilites de reservation."
    });
  }
});

router.get("/:id", async (request, response) => {
  try {
    const vehicleId = parseVehicleId(request.params.id);

    if (!vehicleId) {
      return response.status(400).json({
        message: "Vehicule invalide."
      });
    }

    const vehicle = await getVehicleByPublicId(vehicleId);

    if (!vehicle) {
      return response.status(404).json({
        message: "Vehicule introuvable."
      });
    }

    return response.json({ vehicle });
  } catch (error) {
    console.error("Public vehicle detail failed", error);
    return response.status(500).json({
      message: "Impossible de charger ce vehicule."
    });
  }
});

module.exports = router;
