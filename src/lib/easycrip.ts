export type HttpMethod = "GET" | "POST";

export const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export const STORAGE_KEYS = {
  apiUrl: "easycrip_api_url",
  token: "easycrip_token",
} as const;

export function normalizeApiUrl(value: string) {
  const cleaned = value.trim();
  return (cleaned || DEFAULT_API_URL).replace(/\/$/, "");
}

export function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function pretty(data: unknown) {
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function getStoredApiUrl() {
  if (typeof window === "undefined") return DEFAULT_API_URL;
  const stored = window.localStorage.getItem(STORAGE_KEYS.apiUrl) || DEFAULT_API_URL;
  const normalized = normalizeApiUrl(stored);
  return isAbsoluteHttpUrl(normalized) ? normalized : DEFAULT_API_URL;
}

export function setStoredApiUrl(value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.apiUrl, normalizeApiUrl(value));
}

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEYS.token) || "";
}

export function setStoredToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.token, token);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.token);
}

type ApiRequestOptions = {
  apiUrl: string;
  path: string;
  method: HttpMethod;
  body?: unknown;
  token?: string;
  requireAuth?: boolean;
  onStatus?: (message: string) => void;
};

export async function apiRequest<T>({
  apiUrl,
  path,
  method,
  body,
  token,
  requireAuth = false,
  onStatus,
}: ApiRequestOptions): Promise<T> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!isAbsoluteHttpUrl(baseUrl)) {
    throw new Error(
      `API URL invalida: "${apiUrl}". Use URL completa, ex: https://seu-backend.vercel.app`,
    );
  }

  const url = `${baseUrl}${path}`;
  onStatus?.(`Chamando ${method} ${path}...`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requireAuth && token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (typeof data === "string" && /<!doctype html>|<html/i.test(data)) {
      throw new Error(
        `A API retornou HTML em vez de JSON. Verifique API URL (${baseUrl}) e protecao do Vercel no backend.`,
      );
    }
    const msg = typeof data === "string" ? data : pretty(data);
    throw new Error(msg);
  }

  return data as T;
}
