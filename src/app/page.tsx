"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL, apiRequest, getStoredToken, setStoredToken } from "@/lib/easycrip";

type AuthMode = "register" | "login";

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type NoticeType = "info" | "success" | "error";

function noticeStyle(type: NoticeType) {
  if (type === "success") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
  if (type === "error") {
    return "border-rose-300 bg-rose-50 text-rose-900";
  }
  return "border-zinc-300 bg-zinc-50 text-zinc-700";
}

export default function HomePage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: NoticeType; message: string }>({
    type: "info",
    message: "Crie sua conta ou entre para acessar o painel de chaves.",
  });

  useEffect(() => {
    if (getStoredToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function onRegister() {
    if (!API_BASE_URL) {
      setNotice({
        type: "error",
        message: "NEXT_PUBLIC_API_URL nao foi configurada no frontend.",
      });
      return;
    }

    if (password.length < 8) {
      setNotice({ type: "error", message: "A senha precisa ter no minimo 8 caracteres." });
      return;
    }

    if (password !== confirmPassword) {
      setNotice({ type: "error", message: "As senhas nao coincidem." });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest({
        path: "/api/auth/register",
        method: "POST",
        body: { username, email, password },
      });

      setNotice({ type: "success", message: "Cadastro concluido. Agora faca login." });
      setMode("login");
      setConfirmPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no cadastro.";
      setNotice({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onLogin() {
    if (!API_BASE_URL) {
      setNotice({
        type: "error",
        message: "NEXT_PUBLIC_API_URL nao foi configurada no frontend.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiRequest<LoginResponse>({
        path: "/api/auth/login",
        method: "POST",
        body: { username, password },
      });

      setStoredToken(data.access_token);
      setNotice({ type: "success", message: "Login realizado com sucesso." });
      router.push("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no login.";
      setNotice({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3efe4] px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-6 h-80 w-80 rounded-full bg-emerald-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-amber-200/55 blur-3xl" />

      <section className="relative z-10 mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-zinc-300/75 bg-white/80 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur sm:p-8">
          <p className="inline-flex rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-zinc-700">
            EASYCRIP PLATFORM
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Criptografia AES
            <br />
            para testes reais.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-700 sm:text-base">
            Fluxo de producao simplificado: cadastre o usuario, faca login e acesse um painel protegido
            para gerar chave AES-256 e IV para uso pessoal.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Etapa 1</p>
              <p className="mt-1 text-sm font-medium">Cadastro</p>
            </div>
            <div className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Etapa 2</p>
              <p className="mt-1 text-sm font-medium">Autenticacao</p>
            </div>
            <div className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Etapa 3</p>
              <p className="mt-1 text-sm font-medium">Chave e IV</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <p className="text-xs text-zinc-500">
              Backend configurado por ambiente: <span className="font-mono">NEXT_PUBLIC_API_URL</span>
            </p>
            <Link
              href="/faq"
              className="rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-300"
            >
              Ver FAQ e formas de uso
            </Link>
          </div>
        </article>

        <article className="rounded-3xl border border-zinc-300/70 bg-zinc-950 p-6 text-zinc-100 shadow-2xl shadow-zinc-900/20 sm:p-8">
          <div className="inline-flex rounded-xl border border-zinc-700 bg-zinc-900 p-1">
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === "register" ? "bg-zinc-100 text-zinc-900" : "text-zinc-300 hover:text-white"
              }`}
              onClick={() => setMode("register")}
              type="button"
            >
              Registrar
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-zinc-100 text-zinc-900" : "text-zinc-300 hover:text-white"
              }`}
              onClick={() => setMode("login")}
              type="button"
            >
              Login
            </button>
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight">
            {mode === "register" ? "Criar conta" : "Entrar na conta"}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {mode === "register"
              ? "Use dados validos para iniciar seus testes." 
              : "Entre com usuario e senha para liberar o dashboard."}
          </p>

          <div className="mt-5 grid gap-3">
            <input
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              autoComplete="username"
            />

            {mode === "register" && (
              <input
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
              />
            )}

            <input
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />

            {mode === "register" && (
              <input
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar senha"
                autoComplete="new-password"
              />
            )}
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={mode === "register" ? onRegister : onLogin}
            className="mt-5 w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Processando..."
              : mode === "register"
                ? "Concluir cadastro"
                : "Entrar"}
          </button>

          <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${noticeStyle(notice.type)}`}>
            {notice.message}
          </p>

          <p className="mt-3 text-center text-xs text-zinc-400">
            Precisa de ajuda?{" "}
            <Link href="/faq" className="font-semibold text-emerald-300 hover:text-emerald-200">
              Leia o FAQ
            </Link>
          </p>
        </article>
      </section>
    </main>
  );
}
