export async function getHomePageContent() {
  const response = await fetch("/api/content/home");

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response.json();
}
