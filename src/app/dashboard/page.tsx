"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  clearStoredToken,
  DEFAULT_API_URL,
  getStoredApiUrl,
  getStoredToken,
  normalizeApiUrl,
  pretty,
  setStoredApiUrl,
} from "@/lib/easycrip";

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

export default function DashboardPage() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [token, setToken] = useState("");

  const [message, setMessage] = useState("Mensagem secreta para teste do EasyCripApp");
  const [encryptKeyId, setEncryptKeyId] = useState("");
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [decryptKeyId, setDecryptKeyId] = useState("");
  const [iv, setIv] = useState("");

  const [status, setStatus] = useState("Painel pronto.");
  const [output, setOutput] = useState("Inicializado no painel.\n");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setApiUrl(getStoredApiUrl());
      setToken(getStoredToken());
      setIsHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.replace("/");
    }
  }, [isHydrated, token, router]);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredApiUrl(apiUrl);
  }, [apiUrl, isHydrated]);

  if (!isHydrated || !token) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-100">
        <p className="text-sm">Validando sessao...</p>
      </main>
    );
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

      if (/Not authenticated|401|Token invalido|Token inv/i.test(msg)) {
        clearStoredToken();
        router.replace("/");
      }

      return null;
    }
  }

  function log(title: string, data: unknown, isError = false) {
    const now = new Date().toLocaleTimeString();
    const line = `[${now}] ${isError ? "ERRO" : "OK"} ${title}\n${pretty(data)}\n\n`;
    setOutput((prev) => line + prev);
  }


  async function onHealth() {
    await runAction("Health", () =>
      apiRequest({ apiUrl, path: "/api/health", method: "GET", onStatus: setStatus }),
    );
  }

  async function onGenerateKey() {
    await runAction<KeyInfo>("Gerar chave", () =>
      apiRequest({
        apiUrl,
        path: "/api/keys/generate",
        method: "POST",
        token,
        requireAuth: true,
        onStatus: setStatus,
      }),
    );
  }

  async function onActiveKey() {
    const data = await runAction<KeyInfo>("Chave ativa", () =>
      apiRequest({
        apiUrl,
        path: "/api/keys/active",
        method: "GET",
        token,
        requireAuth: true,
        onStatus: setStatus,
      }),
    );

    if (data?.key_id) {
      setEncryptKeyId(data.key_id);
      setDecryptKeyId(data.key_id);
    }
  }

  async function onListKeys() {
    await runAction<KeyListResponse>("Listar chaves", () =>
      apiRequest({
        apiUrl,
        path: "/api/keys/list",
        method: "GET",
        token,
        requireAuth: true,
        onStatus: setStatus,
      }),
    );
  }

  async function onEncrypt() {
    const payload: { message: string; key_id?: string } = { message };
    if (encryptKeyId.trim()) payload.key_id = encryptKeyId.trim();

    const data = await runAction<EncryptResponse>("Criptografar", () =>
      apiRequest({
        apiUrl,
        path: "/api/encrypt",
        method: "POST",
        body: payload,
        token,
        requireAuth: true,
        onStatus: setStatus,
      }),
    );

    if (!data) return;
    setEncryptedMessage(data.encrypted_message);
    setIv(data.iv);
    setDecryptKeyId(data.key_id);
  }

  async function onDecrypt() {
    await runAction<DecryptResponse>("Descriptografar", () =>
      apiRequest({
        apiUrl,
        path: "/api/decrypt",
        method: "POST",
        body: {
          encrypted_message: encryptedMessage,
          key_id: decryptKeyId,
          iv,
        },
        token,
        requireAuth: true,
        onStatus: setStatus,
      }),
    );
  }

  async function onAudit() {
    await runAction("Auditoria (10)", () =>
      apiRequest({
        apiUrl,
        path: "/api/audit?limit=10",
        method: "GET",
        token,
        requireAuth: true,
        onStatus: setStatus,
      }),
    );
  }

  function resetApiUrl() {
    setApiUrl(normalizeApiUrl(DEFAULT_API_URL));
    setStatus("API URL redefinida.");
  }

  function onLogout() {
    clearStoredToken();
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ecfccb,_transparent_33%),radial-gradient(circle_at_bottom_right,_#fde68a,_transparent_32%),#f1ede2] px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl border border-zinc-300/80 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Painel de Chaves</h1>
              <p className="mt-1 text-sm text-zinc-600">Area protegida por login.</p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-bold text-white hover:bg-zinc-800"
            >
              Sair
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_auto_auto_auto] sm:items-center">
            <label className="text-sm font-semibold" htmlFor="api-url-dashboard">
              API URL
            </label>
            <input
              id="api-url-dashboard"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              onBlur={() => setApiUrl(normalizeApiUrl(apiUrl))}
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
            <button
              onClick={resetApiUrl}
              className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-300"
            >
              Reset API
            </button>
          </div>

          <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {status}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-300/80 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur">
            <h2 className="text-lg font-bold">Chaves</h2>
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

          <article className="rounded-2xl border border-zinc-300/80 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur">
            <h2 className="text-lg font-bold">Criptografar</h2>
            <div className="mt-3 grid gap-3">
              <textarea
                className="min-h-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="mensagem"
              />
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-400 transition focus:ring"
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

          <article className="rounded-2xl border border-zinc-300/80 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur lg:col-span-2">
            <h2 className="text-lg font-bold">Descriptografar</h2>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <textarea
                className="min-h-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-400 transition focus:ring lg:col-span-2"
                value={encryptedMessage}
                onChange={(e) => setEncryptedMessage(e.target.value)}
                placeholder="encrypted_message"
              />
              <div className="grid gap-3">
                <input
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-400 transition focus:ring"
                  value={decryptKeyId}
                  onChange={(e) => setDecryptKeyId(e.target.value)}
                  placeholder="key_id"
                />
                <input
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-400 transition focus:ring"
                  value={iv}
                  onChange={(e) => setIv(e.target.value)}
                  placeholder="iv"
                />
                <button
                  onClick={onDecrypt}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Descriptografar
                </button>
              </div>
            </div>
          </article>
        </div>

        <section className="rounded-2xl border border-zinc-300/80 bg-zinc-900 p-4 shadow-lg shadow-zinc-900/10">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-zinc-100">Output</h2>
            <button
              onClick={() => setOutput("")}
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
