const express = require("express");
const {
  handleReservationUpload,
  optimizeReservationLicensePhoto,
  removeStoredReservationFile,
  removeUploadedReservationFile
} = require("../middleware/reservationUploadMiddleware");
const {
  requireAdminApiAuth
} = require("../middleware/adminAuthMiddleware");
const {
  acceptAdminReservation,
  createAdminReservation,
  deleteAdminReservation,
  getAdminReservationById,
  listAdminReservations,
  updateAdminReservation,
  rejectAdminReservation
} = require("../services/reservationService");

const router = express.Router();

function parseReservationId(value) {
  const reservationId = Number(value);
  return Number.isInteger(reservationId) && reservationId > 0
    ? reservationId
    : null;
}

router.use(requireAdminApiAuth);

router.get("/", async (request, response) => {
  try {
    const reservations = await listAdminReservations(request.query.scope);
    return response.json({ reservations });
  } catch (error) {
    console.error("Admin reservations list failed", error);
    return response.status(400).json({
      message: error.message || "Impossible de charger les reservations."
    });
  }
});

router.post("/", handleReservationUpload, async (request, response) => {
  let drivingLicensePhotoUrl = "";

  try {
    drivingLicensePhotoUrl = await optimizeReservationLicensePhoto(request.file);

    const reservation = await createAdminReservation({
      ...(request.body || {}),
      drivingLicensePhotoUrl
    });

    return response.status(201).json({
      message: "Reservation creee avec succes.",
      reservation
    });
  } catch (error) {
    await removeUploadedReservationFile(request.file);
    await removeStoredReservationFile(drivingLicensePhotoUrl);
    console.error("Admin reservation create failed", error);
    return response.status(400).json({
      message: error.message || "Impossible de creer cette reservation."
    });
  }
});

router.get("/:id", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const reservation = await getAdminReservationById(reservationId);

    if (!reservation) {
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    return response.json({ reservation });
  } catch (error) {
    console.error("Admin reservation detail failed", error);
    return response.status(500).json({
      message: "Impossible de charger cette reservation."
    });
  }
});

router.post("/:id/accept", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const reservation = await acceptAdminReservation(reservationId);

    if (!reservation) {
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    return response.json({
      message: "Reservation acceptee.",
      reservation
    });
  } catch (error) {
    console.error("Admin reservation accept failed", error);
    return response.status(400).json({
      message: error.message || "Impossible d'accepter cette reservation."
    });
  }
});

router.post("/:id/reject", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const reservationRemoved = await rejectAdminReservation(reservationId);

    if (!reservationRemoved) {
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    return response.json({
      message: "Reservation refusee."
    });
  } catch (error) {
    console.error("Admin reservation reject failed", error);
    return response.status(500).json({
      message: error.message || "Impossible de refuser cette reservation."
    });
  }
});

router.put("/:id", handleReservationUpload, async (request, response) => {
  let drivingLicensePhotoUrl = "";

  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      await removeUploadedReservationFile(request.file);
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    drivingLicensePhotoUrl = await optimizeReservationLicensePhoto(request.file);

    const reservation = await updateAdminReservation(reservationId, {
      ...(request.body || {}),
      drivingLicensePhotoUrl
    });

    if (!reservation) {
      await removeStoredReservationFile(drivingLicensePhotoUrl);
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    return response.json({
      message: "Reservation modifiee avec succes.",
      reservation
    });
  } catch (error) {
    await removeUploadedReservationFile(request.file);
    await removeStoredReservationFile(drivingLicensePhotoUrl);
    console.error("Admin reservation update failed", error);
    return response.status(400).json({
      message: error.message || "Impossible de modifier cette reservation."
    });
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const reservationId = parseReservationId(request.params.id);

    if (!reservationId) {
      return response.status(400).json({
        message: "Reservation invalide."
      });
    }

    const reservationDeleted = await deleteAdminReservation(reservationId);

    if (!reservationDeleted) {
      return response.status(404).json({
        message: "Reservation introuvable."
      });
    }

    return response.json({
      message: "Reservation supprimee."
    });
  } catch (error) {
    console.error("Admin reservation delete failed", error);
    return response.status(500).json({
      message: error.message || "Impossible de supprimer cette reservation."
    });
  }
});

module.exports = router;
