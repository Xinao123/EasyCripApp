"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  DEFAULT_API_URL,
  getStoredApiUrl,
  getStoredToken,
  normalizeApiUrl,
  pretty,
  setStoredApiUrl,
  setStoredToken,
} from "@/lib/easycrip";

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

function badgeClass(mode: "ok" | "error") {
  return mode === "ok"
    ? "border-emerald-300/70 bg-emerald-100/80 text-emerald-900"
    : "border-rose-300/70 bg-rose-100/90 text-rose-900";
}

export default function Home() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [username, setUsername] = useState("tester_easycrip");
  const [email, setEmail] = useState("tester.easycrip@example.com");
  const [password, setPassword] = useState("Senha12345!");

  const [status, setStatus] = useState("Pronto para registro/login.");
  const [output, setOutput] = useState("Inicializado.\n");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setApiUrl(getStoredApiUrl());
      setIsHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    setStoredApiUrl(apiUrl);
  }, [apiUrl, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [isHydrated, router]);

  function log(title: string, data: unknown, mode: "ok" | "error") {
    const now = new Date().toLocaleTimeString();
    const line = `[${now}] ${mode === "ok" ? "OK" : "ERRO"} ${title}\n${pretty(data)}\n\n`;
    setOutput((prev) => line + prev);
  }

  async function runAction<T>(title: string, fn: () => Promise<T>) {
    try {
      const data = await fn();
      log(title, data, "ok");
      setStatus(`${title}: sucesso`);
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(title, msg, "error");
      setStatus(`${title}: falha`);
      return null;
    }
  }

  async function onHealth() {
    await runAction("Health", () =>
      apiRequest({ apiUrl, path: "/api/health", method: "GET", onStatus: setStatus }),
    );
  }

  async function onRegister() {
    await runAction("Register", () =>
      apiRequest({
        apiUrl,
        path: "/api/auth/register",
        method: "POST",
        body: { username, email, password },
        onStatus: setStatus,
      }),
    );
  }

  async function onLogin() {
    const data = await runAction<LoginResponse>("Login", () =>
      apiRequest({
        apiUrl,
        path: "/api/auth/login",
        method: "POST",
        body: { username, password },
        onStatus: setStatus,
      }),
    );

    if (!data?.access_token) return;

    setStoredToken(data.access_token);
    setStatus("Login realizado. Redirecionando para o painel...");
    router.push("/dashboard");
  }

  function resetApiUrl() {
    setApiUrl(normalizeApiUrl(DEFAULT_API_URL));
    setStatus("API URL redefinida.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f3ec] px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-emerald-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-amber-300/35 blur-3xl" />

      <section className="relative z-10 mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-3xl border border-zinc-300/80 bg-white/75 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur sm:p-8">
          <p className="inline-flex rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-700">
            EASYCRIP APP
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
            Registro primeiro.
            <br />
            Criptografia depois.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-700 sm:text-base">
            Esta tela inicial e dedicada ao cadastro e login. A area de chaves fica
            protegida e so abre apos autenticacao bem-sucedida.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-zinc-300/80 bg-zinc-50/90 p-3 text-sm">
              <span className="font-semibold">1.</span> Configure a URL do backend.
            </div>
            <div className="rounded-xl border border-zinc-300/80 bg-zinc-50/90 p-3 text-sm">
              <span className="font-semibold">2.</span> Registre um usuario.
            </div>
            <div className="rounded-xl border border-zinc-300/80 bg-zinc-50/90 p-3 text-sm">
              <span className="font-semibold">3.</span> Faça login para abrir o painel.
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-zinc-300/80 bg-zinc-950 p-6 text-zinc-100 shadow-2xl shadow-zinc-900/20 sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight">Entrar no sistema</h2>
          <p className="mt-1 text-sm text-zinc-400">Conecte ao backend e autentique.</p>

          <div className="mt-5 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400" htmlFor="api-url">
              API URL
            </label>
            <input
              id="api-url"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-400 transition focus:ring"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              onBlur={() => setApiUrl(normalizeApiUrl(apiUrl))}
              placeholder="https://seu-backend.vercel.app"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onHealth}
                className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-900 hover:bg-white"
              >
                Testar Health
              </button>
              <button
                onClick={resetApiUrl}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-100 hover:bg-zinc-700"
              >
                Reset API
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <input
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
            <input
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
            />
            <input
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="senha"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={onRegister}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-amber-300"
            >
              Registrar
            </button>
            <button
              onClick={onLogin}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-emerald-400"
            >
              Login
            </button>
          </div>

          <p className={`mt-5 rounded-xl border px-3 py-2 text-sm ${badgeClass(status.includes("falha") ? "error" : "ok")}`}>
            {status}
          </p>

          <div className="mt-4 rounded-xl border border-zinc-700 bg-black/35 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Log</h3>
              <button
                onClick={() => setOutput("")}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] font-bold text-zinc-300 hover:bg-zinc-800"
              >
                Limpar
              </button>
            </div>
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-emerald-200">
              {output}
            </pre>
          </div>
        </article>
      </section>
    </main>
  );
}
