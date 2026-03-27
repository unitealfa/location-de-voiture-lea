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

export async function getAdminDashboardStats(filters = {}) {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const response = await fetch(`/api/admin/protected/dashboard?${query.toString()}`, {
    credentials: "same-origin"
  });

  const payload = await parseJsonResponse(
    response,
    "Impossible de charger le dashboard."
  );

  return payload.stats;
}
