/** Base URL for the Node backend (no trailing slash). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined
  if (raw?.trim()) {
    return raw.replace(/\/$/, "")
  }
  return "http://localhost:5000"
}
