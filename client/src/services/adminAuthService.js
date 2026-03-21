export async function loginAdmin(credentials) {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credentials)
  });

  const payload = await response.json().catch(() => ({
    message: "Reponse serveur invalide."
  }));

  if (!response.ok) {
    throw new Error(payload.message || "Connexion admin impossible.");
  }

  return payload;
}

export async function getAdminSession() {
  const response = await fetch("/api/admin/session", {
    credentials: "same-origin"
  });

  if (response.status === 401) {
    return null;
  }

  const payload = await response.json().catch(() => ({
    message: "Reponse serveur invalide."
  }));

  if (!response.ok) {
    throw new Error(payload.message || "Lecture de session impossible.");
  }

  return payload.admin;
}

export async function logoutAdmin() {
  const response = await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "same-origin"
  });

  const payload = await response.json().catch(() => ({
    message: "Reponse serveur invalide."
  }));

  if (!response.ok) {
    throw new Error(payload.message || "Deconnexion admin impossible.");
  }

  return payload;
}
