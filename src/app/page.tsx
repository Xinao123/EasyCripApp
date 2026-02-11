"use client";

import { useEffect, useMemo, useState } from "react";

type HttpMethod = "GET" | "POST";

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type KeyInfo = {
  key_id: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  version: number;
};

type KeyListResponse = {
  keys: KeyInfo[];
  active_key: KeyInfo | null;
};

type EncryptResponse = {
  encrypted_message: string;
  iv: string;
  key_id: string;
  encrypted_at: string;
  algorithm: string;
};

type DecryptResponse = {
  decrypted_message: string;
  decrypted_at: string;
};

const DEFAULT_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

function pretty(data: unknown) {
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export default function Home() {
  const [apiUrl, setApiUrl] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_API_URL;
    return window.localStorage.getItem("easycrip_api_url") || DEFAULT_API_URL;
  });
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("easycrip_token") || "";
  });

  const [username, setUsername] = useState("tester_easycrip");
  const [email, setEmail] = useState("tester.easycrip@example.com");
  const [password, setPassword] = useState("Senha12345!");

  const [message, setMessage] = useState("Mensagem secreta para teste do EasyCripApp");
  const [encryptKeyId, setEncryptKeyId] = useState("");

  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [decryptKeyId, setDecryptKeyId] = useState("");
  const [iv, setIv] = useState("");

  const [status, setStatus] = useState("Pronto para conectar ao backend.");
  const [output, setOutput] = useState("Inicializado.\n");

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token.trim()) {
      headers.Authorization = `Bearer ${token.trim()}`;
    }

    return headers;
  }, [token]);

  useEffect(() => {
    window.localStorage.setItem("easycrip_token", token);
  }, [token]);

  useEffect(() => {
    window.localStorage.setItem("easycrip_api_url", apiUrl);
  }, [apiUrl]);

  async function apiRequest<T>(
    path: string,
    method: HttpMethod,
    body?: unknown,
    requireAuth = false,
  ): Promise<T> {
    const url = `${apiUrl.replace(/\/$/, "")}${path}`;
    setStatus(`Chamando ${method} ${path}...`);

    const headers = requireAuth ? authHeaders : { "Content-Type": "application/json" };

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
      const msg = typeof data === "string" ? data : pretty(data);
      throw new Error(msg);
    }

    return data as T;
  }

  function log(title: string, data: unknown, isError = false) {
    const now = new Date().toLocaleTimeString();
    const line = `[${now}] ${isError ? "ERRO" : "OK"} ${title}\n${pretty(data)}\n\n`;
    setOutput((prev) => line + prev);
  }

  async function runAction<T>(title: string, fn: () => Promise<T>) {
    try {
      const data = await fn();
      log(title, data, false);
      setStatus(`${title}: sucesso`);
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(title, msg, true);
      setStatus(`${title}: falha`);
      return null;
    }
  }

  async function onRegister() {
    await runAction("Register", () =>
      apiRequest("/api/auth/register", "POST", {
        username,
        password,
        email,
      }),
    );
  }

  async function onLogin() {
    const data = await runAction<LoginResponse>("Login", () =>
      apiRequest("/api/auth/login", "POST", {
        username,
        password,
      }),
    );

    if (data?.access_token) {
      setToken(data.access_token);
    }
  }

  async function onHealth() {
    await runAction("Health", () => apiRequest("/api/health", "GET"));
  }

  async function onGenerateKey() {
    await runAction<KeyInfo>("Gerar chave", () =>
      apiRequest("/api/keys/generate", "POST", undefined, true),
    );
  }

  async function onActiveKey() {
    const data = await runAction<KeyInfo>("Chave ativa", () =>
      apiRequest("/api/keys/active", "GET", undefined, true),
    );

    if (data?.key_id) {
      setEncryptKeyId(data.key_id);
      setDecryptKeyId(data.key_id);
    }
  }

  async function onListKeys() {
    await runAction<KeyListResponse>("Listar chaves", () =>
      apiRequest("/api/keys/list", "GET", undefined, true),
    );
  }

  async function onEncrypt() {
    const payload: { message: string; key_id?: string } = { message };
    if (encryptKeyId.trim()) payload.key_id = encryptKeyId.trim();

    const data = await runAction<EncryptResponse>("Criptografar", () =>
      apiRequest("/api/encrypt", "POST", payload, true),
    );

    if (!data) return;

    setEncryptedMessage(data.encrypted_message);
    setIv(data.iv);
    setDecryptKeyId(data.key_id);
  }

  async function onDecrypt() {
    await runAction<DecryptResponse>("Descriptografar", () =>
      apiRequest(
        "/api/decrypt",
        "POST",
        {
          encrypted_message: encryptedMessage,
          key_id: decryptKeyId,
          iv,
        },
        true,
      ),
    );
  }

  async function onAudit() {
    await runAction("Auditoria (10)", () =>
      apiRequest("/api/audit?limit=10", "GET", undefined, true),
    );
  }

  function clearOutput() {
    setOutput("");
    setStatus("Output limpo.");
  }

  function clearSession() {
    setToken("");
    window.localStorage.removeItem("easycrip_token");
    setStatus("Token removido.");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff8ea,_transparent_38%),radial-gradient(circle_at_bottom_right,_#d5f5ec,_transparent_35%),#f3eee1] px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl border border-zinc-300/70 bg-white/80 p-5 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">EasyCripApp</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Frontend conectado ao backend AES no Vercel.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[130px_1fr_auto_auto] sm:items-center">
            <label className="text-sm font-medium" htmlFor="api-url">
              API URL
            </label>
            <input
              id="api-url"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 transition focus:ring"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://seu-backend.vercel.app"
            />
            <button
              onClick={onHealth}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Health
            </button>
            <button
              onClick={onAudit}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              Audit
            </button>
          </div>

          <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {status}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-300/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold">Autenticação</h2>
            <div className="mt-3 grid gap-3">
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 transition focus:ring"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
              />
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 transition focus:ring"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
              />
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 transition focus:ring"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="senha"
              />
              <input
                className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 outline-none"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer token"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onRegister}
                className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-400"
              >
                Register
              </button>
              <button
                onClick={onLogin}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Login
              </button>
              <button
                onClick={clearSession}
                className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-300"
              >
                Limpar token
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-300/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold">Chaves</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onGenerateKey}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Gerar chave
              </button>
              <button
                onClick={onActiveKey}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Chave ativa
              </button>
              <button
                onClick={onListKeys}
                className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-300"
              >
                Listar chaves
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-300/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold">Criptografar</h2>
            <div className="mt-3 grid gap-3">
              <textarea
                className="min-h-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-300 transition focus:ring"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="mensagem"
              />
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-300 transition focus:ring"
                value={encryptKeyId}
                onChange={(e) => setEncryptKeyId(e.target.value)}
                placeholder="key_id opcional"
              />
            </div>
            <div className="mt-4">
              <button
                onClick={onEncrypt}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Criptografar
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-300/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold">Descriptografar</h2>
            <div className="mt-3 grid gap-3">
              <textarea
                className="min-h-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-300 transition focus:ring"
                value={encryptedMessage}
                onChange={(e) => setEncryptedMessage(e.target.value)}
                placeholder="encrypted_message"
              />
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-300 transition focus:ring"
                value={decryptKeyId}
                onChange={(e) => setDecryptKeyId(e.target.value)}
                placeholder="key_id"
              />
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-300 transition focus:ring"
                value={iv}
                onChange={(e) => setIv(e.target.value)}
                placeholder="iv"
              />
            </div>
            <div className="mt-4">
              <button
                onClick={onDecrypt}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Descriptografar
              </button>
            </div>
          </article>
        </div>

        <section className="rounded-2xl border border-zinc-300/70 bg-zinc-900 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-100">Output</h2>
            <button
              onClick={clearOutput}
              className="rounded-md bg-zinc-700 px-2 py-1 text-xs font-semibold text-zinc-100 hover:bg-zinc-600"
            >
              Limpar
            </button>
          </div>
          <pre className="max-h-[380px] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-emerald-200">
            {output}
          </pre>
        </section>
      </section>
    </main>
  );
}
