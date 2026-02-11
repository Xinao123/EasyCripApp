export type HttpMethod = "GET" | "POST" | "PUT";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
export const API_BASE_URL = RAW_API_URL.replace(/\/$/, "");

const LEGACY_TOKEN_STORAGE_KEY = "easycrip_token";

export function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

type ApiRequestOptions = {
  path: string;
  method: HttpMethod;
  body?: unknown;
  token?: string;
  requireAuth?: boolean;
};

function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string") return payload;

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const detail = data.detail;
    if (typeof detail === "string") return detail;
    if (typeof data.message === "string") return data.message;
  }

  return `Erro HTTP ${status}`;
}

export async function apiRequest<T>({
  path,
  method,
  body,
  token,
  requireAuth = false,
}: ApiRequestOptions): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL nao configurada no frontend.");
  }

  if (!isAbsoluteHttpUrl(API_BASE_URL)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL invalida: \"${API_BASE_URL}\". Use URL completa, ex: https://seu-backend.vercel.app`,
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requireAuth && token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (typeof data === "string" && /<!doctype html>|<html/i.test(data)) {
      throw new Error("Backend retornou HTML em vez de JSON. Verifique o deploy da API.");
    }

    if (response.status === 401) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    throw new Error(extractErrorMessage(data, response.status));
  }

  return data as T;
}
