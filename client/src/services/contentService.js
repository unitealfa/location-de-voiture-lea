import { readCachedValue, writeCachedValue } from "./cacheService";

const HOME_CONTENT_CACHE_KEY = "content:home";

export function getCachedHomePageContent() {
  return readCachedValue(HOME_CONTENT_CACHE_KEY);
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
