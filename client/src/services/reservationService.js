async function parseJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({
    message: "Reponse serveur invalide."
  }));

  if (!response.ok) {
    throw new Error(payload.message || fallbackMessage);
  }

  return payload;
}

function appendReservationFormField(formData, key, value) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  formData.append(key, String(value));
}

function buildAdminReservationFormData(payload) {
  const formData = new FormData();

  [
    "vehicleId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "comment",
    "pickupLocationType",
    "returnLocationType",
    "pickupDatetime",
    "returnDatetime"
  ].forEach((key) => appendReservationFormField(formData, key, payload[key]));

  formData.append(
    "privacyPolicyAccepted",
    payload.privacyPolicyAccepted ? "true" : "false"
  );

  if (payload.drivingLicensePhoto) {
    formData.append("drivingLicensePhoto", payload.drivingLicensePhoto);
  }

  return formData;
}

export async function createVehicleReservation(vehicleId, payload) {
  const formData = new FormData();

  [
    "firstName",
    "lastName",
    "email",
    "phone",
    "comment",
    "pickupLocationType",
    "returnLocationType",
    "pickupDatetime",
    "returnDatetime"
  ].forEach((field) => {
    if (payload[field] !== undefined && payload[field] !== null) {
      formData.append(field, String(payload[field]));
    }
  });

  formData.append(
    "privacyPolicyAccepted",
    payload.privacyPolicyAccepted ? "true" : "false"
  );

  if (payload.drivingLicensePhoto) {
    formData.append("drivingLicensePhoto", payload.drivingLicensePhoto);
  }

  const response = await fetch(`/api/vehicles/${vehicleId}/reservations`, {
    method: "POST",
    body: formData
  });

  return parseJsonResponse(response, "Reservation impossible.");
}

export async function getVehicleReservationAvailability(vehicleId) {
  const response = await fetch(
    `/api/vehicles/${vehicleId}/reservation-availability`
  );

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger les disponibilites du vehicule."
  );

  return payload.reservations || [];
}

export async function listAdminReservations({ scope = "pending" } = {}) {
  const query = new URLSearchParams();

  if (scope) {
    query.set("scope", scope);
  }

  const response = await fetch(`/api/admin/reservations?${query.toString()}`, {
    credentials: "same-origin"
  });

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger les reservations."
  );

  return payload.reservations || [];
}

export async function getAdminReservationById(id) {
  const response = await fetch(`/api/admin/reservations/${id}`, {
    credentials: "same-origin"
  });

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger cette reservation."
  );

  return payload.reservation;
}

export async function acceptAdminReservation(id) {
  const response = await fetch(`/api/admin/reservations/${id}/accept`, {
    method: "POST",
    credentials: "same-origin"
  });

  const payload = await parseJsonResponse(
    response,
    "Impossible d'accepter cette reservation."
  );

  return payload.reservation;
}

export async function rejectAdminReservation(id) {
  const response = await fetch(`/api/admin/reservations/${id}/reject`, {
    method: "POST",
    credentials: "same-origin"
  });

  return parseJsonResponse(
    response,
    "Impossible de refuser cette reservation."
  );
}

export async function createAdminReservation(payload) {
  const response = await fetch("/api/admin/reservations", {
    method: "POST",
    credentials: "same-origin",
    body: buildAdminReservationFormData(payload)
  });

  const responsePayload = await parseJsonResponse(
    response,
    "Impossible de creer cette reservation."
  );

  return responsePayload.reservation;
}

export async function updateAdminReservation(id, payload) {
  const response = await fetch(`/api/admin/reservations/${id}`, {
    method: "PUT",
    credentials: "same-origin",
    body: buildAdminReservationFormData(payload)
  });

  const responsePayload = await parseJsonResponse(
    response,
    "Impossible de modifier cette reservation."
  );

  return responsePayload.reservation;
}

export async function deleteAdminReservation(id) {
  const response = await fetch(`/api/admin/reservations/${id}`, {
    method: "DELETE",
    credentials: "same-origin"
  });

  return parseJsonResponse(
    response,
    "Impossible de supprimer cette reservation."
  );
}
