export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function apiFetch(
  endpoint: string,
  method: string = "GET",
  body?: any,
  customToken?: string
) {
  const token = customToken || (typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle errors gracefully
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message || response.statusText || "API request failed";
    throw new Error(message);
  }

  return data;
}
