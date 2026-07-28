const IS_SERVER = typeof window === "undefined";

// Use direct container hostname inside Docker compose network for SSR,
// and localhost gateway routing on the client side.
const API_BASE_URL = IS_SERVER
  ? "http://api:8000/api/v1"
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost/api/v1");

interface FetchOptions extends RequestInit {
  token?: string;
}

export class APIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || `API request failed with status: ${response.status}`;
    throw new APIError(message, response.status);
  }

  return response.json();
}
