async function parseJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({
    message: "Reponse serveur invalide."
  }));

  if (!response.ok) {
    throw new Error(payload.message || fallbackMessage);
  }

  return payload;
}

function appendFormField(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  formData.append(key, String(value));
}

function buildVehicleFormData(payload) {
  const formData = new FormData();

  [
    "brand",
    "model",
    "version",
    "fuelType",
    "transmission",
    "seats",
    "isConvertible",
    "horsepower",
    "dailyPrice",
    "weeklyPrice",
    "monthlyPrice",
    "securityDeposit",
    "includedKmPerDay",
    "extraKmPrice",
    "availabilityStatus"
  ].forEach((key) => appendFormField(formData, key, payload[key]));

  if (payload.videoFile) {
    formData.append("video", payload.videoFile);
  }

  (payload.photoFiles || []).forEach((file) => {
    formData.append("photos", file);
  });

  return formData;
}

export async function listVehicles({ adminView = false } = {}) {
  const response = await fetch(
    adminView ? "/api/admin/vehicles" : "/api/vehicles",
    {
      credentials: "same-origin"
    }
  );

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger les vehicules."
  );

  return payload.vehicles || [];
}

export async function getVehicleById(id, { adminView = false } = {}) {
  const response = await fetch(
    adminView ? `/api/admin/vehicles/${id}` : `/api/vehicles/${id}`,
    {
      credentials: "same-origin"
    }
  );

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger ce vehicule."
  );

  return payload.vehicle;
}

export async function createVehicle(payload) {
  const response = await fetch("/api/admin/vehicles", {
    method: "POST",
    credentials: "same-origin",
    body: buildVehicleFormData(payload)
  });

  return parseJsonResponse(response, "Creation du vehicule impossible.");
}

export async function updateVehicle(id, payload) {
  const response = await fetch(`/api/admin/vehicles/${id}`, {
    method: "PUT",
    credentials: "same-origin",
    body: buildVehicleFormData(payload)
  });

  return parseJsonResponse(response, "Modification du vehicule impossible.");
}

export async function deleteVehicle(id) {
  const response = await fetch(`/api/admin/vehicles/${id}`, {
    method: "DELETE",
    credentials: "same-origin"
  });

  return parseJsonResponse(response, "Suppression du vehicule impossible.");
}

export async function markVehicleAsMaintenance(id) {
  const response = await fetch(`/api/admin/vehicles/${id}/maintenance`, {
    method: "POST",
    credentials: "same-origin"
  });

  return parseJsonResponse(
    response,
    "Passage du vehicule en maintenance impossible."
  );
}

export async function markVehicleAsAvailable(id) {
  const response = await fetch(`/api/admin/vehicles/${id}/available`, {
    method: "POST",
    credentials: "same-origin"
  });

  return parseJsonResponse(
    response,
    "Remise du vehicule en disponibilite impossible."
  );
}
