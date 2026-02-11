"use client";

import { useEffect, useMemo, useState } from "react";
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

const highlights = [
  { label: "Seguranca", value: "AES-256-GCM" },
  { label: "Fluxo", value: "Conta -> Login -> Dashboard" },
  { label: "Gestao", value: "Key ID ativo + Nonce unico" },
];

const onboardingSteps = [
  "Crie seu usuario com email valido.",
  "Acesse o painel protegido apos login.",
  "Gere chave AES-256 e nonce para uso no seu fluxo.",
];

function noticeStyle(type: NoticeType) {
  if (type === "success") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
  if (type === "error") {
    return "border-rose-300 bg-rose-50 text-rose-900";
  }
  return "border-zinc-300 bg-zinc-50 text-zinc-700";
}

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function strengthMeta(score: number) {
  if (score <= 1) return { label: "Fraca", cls: "bg-rose-500", text: "text-rose-700" };
  if (score === 2) return { label: "Media", cls: "bg-amber-500", text: "text-amber-700" };
  if (score === 3) return { label: "Boa", cls: "bg-emerald-500", text: "text-emerald-700" };
  return { label: "Forte", cls: "bg-emerald-600", text: "text-emerald-800" };
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
    message: "Crie sua conta ou faca login para acessar seu painel de chaves.",
  });

  const strength = useMemo(() => strengthMeta(passwordStrength(password)), [password]);

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
      setPassword("");
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
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_0%_0%,_#c7f9cc_0%,_#f6f3ec_40%),radial-gradient(circle_at_100%_100%,_#fde68a_0%,_#f6f3ec_35%),#f6f3ec] px-4 py-8 text-zinc-900 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-amber-300/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-52 w-52 rounded-full bg-lime-200/35 blur-3xl" />

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <article className="rounded-[28px] border border-zinc-300/70 bg-white/80 p-6 shadow-[0_20px_80px_-35px_rgba(24,24,27,0.35)] backdrop-blur sm:p-8">
          <p className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
            EasyCrip Platform
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Sua entrada segura
            <br />
            para criptografia AES.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-700 sm:text-base">
            Onboarding rapido para gerar chaves AES-256, operar com nonce unico (GCM) e manter
            um fluxo claro para testes reais e integracoes.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-3 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-300/75 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Como funciona
            </p>
            <ol className="mt-3 space-y-2 text-sm text-zinc-700">
              {onboardingSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className="rounded-md bg-zinc-900 px-2 py-1 font-mono text-zinc-100">
              NEXT_PUBLIC_API_URL
            </span>
            <span>backend configurado por ambiente</span>
            <Link
              href="/faq"
              className="ml-auto rounded-lg bg-zinc-200 px-3 py-1.5 font-semibold text-zinc-800 transition hover:bg-zinc-300"
            >
              Ver FAQ
            </Link>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-[28px] border border-zinc-300/40 bg-zinc-950 p-6 text-zinc-100 shadow-[0_24px_90px_-35px_rgba(9,9,11,0.85)] sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-14 bottom-0 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative">
            <div className="inline-flex rounded-xl border border-zinc-700 bg-zinc-900/80 p-1">
              <button
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "register"
                    ? "bg-zinc-100 text-zinc-900 shadow"
                    : "text-zinc-300 hover:text-white"
                }`}
                onClick={() => setMode("register")}
                type="button"
              >
                Registrar
              </button>
              <button
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "login"
                    ? "bg-zinc-100 text-zinc-900 shadow"
                    : "text-zinc-300 hover:text-white"
                }`}
                onClick={() => setMode("login")}
                type="button"
              >
                Login
              </button>
            </div>

            <h2 className="mt-5 text-2xl font-black tracking-tight">
              {mode === "register" ? "Criar conta segura" : "Entrar na plataforma"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {mode === "register"
                ? "Use credenciais fortes para proteger o acesso ao seu dashboard."
                : "Autentique-se para gerenciar chave ativa e nonce."}
            </p>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Usuario
                </span>
                <input
                  className="rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm outline-none ring-emerald-400 transition placeholder:text-zinc-500 focus:ring"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu_usuario"
                  autoComplete="username"
                />
              </label>

              {mode === "register" && (
                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    Email
                  </span>
                  <input
                    className="rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm outline-none ring-emerald-400 transition placeholder:text-zinc-500 focus:ring"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@dominio.com"
                    autoComplete="email"
                  />
                </label>
              )}

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                  Senha
                </span>
                <input
                  className="rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm outline-none ring-emerald-400 transition placeholder:text-zinc-500 focus:ring"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </label>

              {mode === "register" && (
                <>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                      Confirmar senha
                    </span>
                    <input
                      className="rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-sm outline-none ring-emerald-400 transition placeholder:text-zinc-500 focus:ring"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="********"
                      autoComplete="new-password"
                    />
                  </label>

                  <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-[0.12em] text-zinc-400">
                        Forca da senha
                      </span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className={`h-1.5 rounded-full ${
                            index < passwordStrength(password) ? strength.cls : "bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={mode === "register" ? onRegister : onLogin}
              className="mt-5 w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-black text-zinc-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Processando..." : mode === "register" ? "Criar minha conta" : "Entrar agora"}
            </button>

            <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${noticeStyle(notice.type)}`}>
              {notice.message}
            </p>

            <p className="mt-3 text-center text-xs text-zinc-400">
              Duvidas?{" "}
              <Link href="/faq" className="font-semibold text-emerald-300 hover:text-emerald-200">
                Acesse o FAQ
              </Link>
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
