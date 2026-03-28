import { readCachedValue, writeCachedValue } from "./cacheService";

const HOME_CONTENT_CACHE_KEY = "content:home";
const VISUAL_SETTINGS_CACHE_KEY = "content:visual-settings";

export function getCachedHomePageContent() {
  return readCachedValue(HOME_CONTENT_CACHE_KEY);
}

export function getCachedVisualSettings() {
  return readCachedValue(VISUAL_SETTINGS_CACHE_KEY);
}

export async function getHomePageContent() {
  const cachedContent = getCachedHomePageContent();

  try {
    const response = await fetch("/api/content/home", {
      credentials: "same-origin"
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const payload = await response.json();
    writeCachedValue(HOME_CONTENT_CACHE_KEY, payload);
    return payload;
  } catch (error) {
    if (cachedContent) {
      return cachedContent;
    }

    throw error;
  }
}

export async function getAdminVisualSettings() {
  const cachedSettings = getCachedVisualSettings();

  try {
    const response = await fetch("/api/admin/protected/visual-settings", {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les reglages visuels.");
    }

    const payload = await response.json();
    writeCachedValue(VISUAL_SETTINGS_CACHE_KEY, payload.settings);
    return payload.settings;
  } catch (error) {
    if (cachedSettings) {
      return cachedSettings;
    }

    throw error;
  }
}

export async function saveAdminVisualSettings(payload) {
  const response = await fetch("/api/admin/protected/visual-settings", {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const parsed = await response.json().catch(() => ({
    message: "Reponse serveur invalide."
  }));

  if (!response.ok) {
    throw new Error(parsed.message || "Impossible d'enregistrer les reglages visuels.");
  }

  if (parsed.content) {
    writeCachedValue(HOME_CONTENT_CACHE_KEY, parsed.content);
  }

  if (parsed.settings) {
    writeCachedValue(VISUAL_SETTINGS_CACHE_KEY, parsed.settings);
  }

  return parsed;
}

export async function uploadAdminVisualImage({ file, slot, previousUrl = "" }) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("slot", slot);
  formData.append("previousUrl", previousUrl);

  const response = await fetch("/api/admin/protected/visual-settings/upload", {
    method: "POST",
    credentials: "include",
    body: formData
  });

  const parsed = await response.json().catch(() => ({
    message: "Reponse serveur invalide."
  }));

  if (!response.ok) {
    throw new Error(parsed.message || "Impossible d'envoyer l'image.");
  }

  return parsed;
}
