async function parseJsonResponse(response, fallbackMessage) {
  const rawText = await response.text();
  let payload = null;

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    payload = {
      message: fallbackMessage
    };
  }

  if (!response.ok) {
    throw new Error(payload.message || fallbackMessage);
  }

  return payload;
}

export async function getAdminDashboardStats() {
  const response = await fetch("/api/admin/protected/dashboard", {
    credentials: "same-origin"
  });

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger le dashboard."
  );

  return payload.stats;
}
