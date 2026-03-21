const express = require("express");
const {
  getPublicVehicleById,
  listPublicVehicles
} = require("../services/vehicleService");

const router = express.Router();

function parseVehicleId(value) {
  const vehicleId = Number(value);
  return Number.isInteger(vehicleId) && vehicleId > 0 ? vehicleId : null;
}

router.get("/", async (request, response) => {
  try {
    const vehicles = await listPublicVehicles();
    response.json({ vehicles });
  } catch (error) {
    console.error("Public vehicles list failed", error);
    response.status(500).json({
      message: "Impossible de charger les vehicules."
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

    const vehicle = await getPublicVehicleById(vehicleId);

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
