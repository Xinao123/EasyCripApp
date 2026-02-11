"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL, apiRequest, clearStoredToken } from "@/lib/easycrip";

type AuthMode = "register" | "login";
type NoticeType = "info" | "success" | "error";

type LoginResponse = {
  access_token?: string | null;
  token_type: string;
  expires_in: number;
};

type SessionProbe = {
  keys: unknown[];
  active_key: unknown | null;
};

const valuePills = [
  { title: "Seguranca", text: "AES-256-GCM com nonce unico por operacao" },
  { title: "Fluxo", text: "Cadastro, login e dashboard protegido" },
  { title: "Uso real", text: "Geracao de chave para uso pessoal" },
];

const quickSteps = [
  "Crie sua conta com um email valido.",
  "Entre na plataforma com seu login.",
  "No dashboard, gere sua chave e depois o nonce.",
];

function noticeStyle(type: NoticeType) {
  if (type === "success") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (type === "error") return "border-rose-300 bg-rose-50 text-rose-900";
  return "border-zinc-300 bg-zinc-50 text-zinc-700";
}

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function strengthMeta(score: number) {
  if (score <= 1) return { label: "Fraca", bar: "bg-rose-500", text: "text-rose-700" };
  if (score === 2) return { label: "Media", bar: "bg-amber-500", text: "text-amber-700" };
  if (score === 3) return { label: "Boa", bar: "bg-emerald-500", text: "text-emerald-700" };
  return { label: "Forte", bar: "bg-emerald-600", text: "text-emerald-800" };
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
    message: "Crie sua conta para comecar ou entre para continuar de onde parou.",
  });

  const strength = useMemo(() => strengthMeta(passwordStrength(password)), [password]);

  useEffect(() => {
    let cancelled = false;

    clearStoredToken(); // cleanup de versoes antigas que usavam localStorage

    if (!API_BASE_URL) return () => {};

    (async () => {
      try {
        await apiRequest<SessionProbe>({
          path: "/api/keys/list",
          method: "GET",
          requireAuth: true,
        });
        if (!cancelled) router.replace("/dashboard");
      } catch {
        // sem sessao ativa: permanece na pagina de login/registro
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onRegister() {
    if (!API_BASE_URL) {
      setNotice({
        type: "error",
        message: "Servico indisponivel no momento. Tente novamente em instantes.",
      });
      return;
    }
    if (password.length < 10) {
      setNotice({ type: "error", message: "A senha precisa ter no minimo 10 caracteres." });
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setNotice({
        type: "error",
        message: "Use ao menos 1 maiuscula, 1 minuscula, 1 numero e 1 simbolo.",
      });
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
        body: { username, email, password, confirm_password: confirmPassword },
      });
      setNotice({ type: "success", message: "Conta criada com sucesso. Agora entre para acessar o dashboard." });
      setMode("login");
      setPassword("");
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
        message: "Servico indisponivel no momento. Tente novamente em instantes.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest<LoginResponse>({
        path: "/api/auth/login",
        method: "POST",
        body: { username, password },
      });
      clearStoredToken();
      setNotice({ type: "success", message: "Login realizado. Redirecionando para o dashboard..." });
      router.push("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha no login.";
      setNotice({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 text-zinc-900 sm:px-6 lg:px-10">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="section-shell animate-rise p-6 sm:p-8">
          <p className="inline-flex rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
            EasyCrip
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Chaves AES com
            <br />
            <span className="text-gradient-brand">experiencia simples e segura</span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-700 sm:text-base">
            Plataforma focada em uso real: autenticacao, chave ativa, nonce e operacao clara para
            quem precisa trabalhar com criptografia sem complexidade visual.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {valuePills.map((item, index) => (
              <article
                key={item.title}
                className="panel-soft animate-rise px-3 py-3"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500">
                  {item.title}
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{item.text}</p>
              </article>
            ))}
          </div>

          <section className="panel-soft mt-6 animate-rise p-4" style={{ animationDelay: "190ms" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Primeiros passos</p>
            <ol className="mt-3 space-y-2 text-sm text-zinc-700">
              {quickSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-5 flex justify-end">
            <Link href="/faq" className="btn-secondary px-3 py-1.5 text-xs">
              Ver FAQ e exemplos de uso
            </Link>
          </div>
        </article>

        <article className="section-shell surface-dark animate-rise relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative">
            <div className="inline-flex rounded-xl border border-zinc-700 bg-zinc-900/80 p-1">
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "register" ? "bg-zinc-100 text-zinc-900" : "text-zinc-300 hover:text-white"
                }`}
              >
                Registrar
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === "login" ? "bg-zinc-100 text-zinc-900" : "text-zinc-300 hover:text-white"
                }`}
              >
                Login
              </button>
            </div>

            <h2 className="mt-5 text-2xl font-black tracking-tight">
              {mode === "register" ? "Criar conta segura" : "Entrar na plataforma"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {mode === "register"
                ? "Use credenciais fortes para proteger seu acesso."
                : "Acesse para gerenciar chave ativa e nonce."}
            </p>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Usuario</span>
                <input
                  className="field-core"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu_usuario"
                  autoComplete="username"
                />
              </label>

              {mode === "register" && (
                <label className="grid gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Email</span>
                  <input
                    className="field-core"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@dominio.com"
                    autoComplete="email"
                  />
                </label>
              )}

              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Senha</span>
                <input
                  className="field-core"
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
                      className="field-core"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="********"
                      autoComplete="new-password"
                    />
                  </label>

                  <div className="panel-soft bg-zinc-900/70 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-[0.12em] text-zinc-400">
                        Forca da senha
                      </span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map((idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 rounded-full ${
                            idx < passwordStrength(password) ? strength.bar : "bg-zinc-700"
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
              className="btn-primary mt-5 w-full px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Processando..." : mode === "register" ? "Criar minha conta" : "Entrar agora"}
            </button>

            <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${noticeStyle(notice.type)}`}>
              {notice.message}
            </p>

            <p className="mt-3 text-center text-xs text-zinc-400">
              Duvidas?{" "}
              <Link href="/faq" className="font-semibold text-emerald-300 hover:text-emerald-200">
                Consulte o FAQ
              </Link>
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
