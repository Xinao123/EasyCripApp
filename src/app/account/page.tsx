"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearStoredToken } from "@/lib/easycrip";

type NoticeType = "info" | "success" | "error";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  created_at: string;
  last_login: string | null;
};

function noticeStyle(type: NoticeType) {
  if (type === "success") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (type === "error") return "border-rose-300 bg-rose-50 text-rose-900";
  return "border-zinc-300 bg-zinc-50 text-zinc-700";
}

export default function AccountPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notice, setNotice] = useState<{ type: NoticeType; message: string }>({
    type: "info",
    message: "Carregando sua conta...",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await apiRequest<UserProfile>({
          path: "/api/auth/me",
          method: "GET",
          requireAuth: true,
        });

        if (cancelled) return;
        setProfile(me);
        setUsername(me.username);
        setEmail(me.email);
        setNotice({ type: "info", message: "Seus dados estao carregados. Atualize quando quiser." });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Nao foi possivel carregar a conta.";
        if (msg.toLowerCase().includes("sessao expirada")) {
          clearStoredToken();
          router.replace("/");
          return;
        }
        if (!cancelled) setNotice({ type: "error", message: msg });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSaveProfile() {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail) {
      setNotice({ type: "error", message: "Preencha username e email para salvar." });
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await apiRequest<UserProfile>({
        path: "/api/auth/profile",
        method: "PUT",
        body: {
          username: normalizedUsername,
          email: normalizedEmail,
        },
        requireAuth: true,
      });

      setProfile(updated);
      setUsername(updated.username);
      setEmail(updated.email);
      setNotice({ type: "success", message: "Dados de conta atualizados com sucesso." });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Nao foi possivel atualizar seu perfil.";
      setNotice({ type: "error", message: msg });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function onChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setNotice({ type: "error", message: "Preencha todos os campos de senha." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: "error", message: "Nova senha e confirmacao nao conferem." });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await apiRequest<{ message: string }>({
        path: "/api/auth/change-password",
        method: "POST",
        body: {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        requireAuth: true,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice({ type: "success", message: result.message || "Senha alterada. Entre novamente." });

      clearStoredToken();
      router.replace("/");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Nao foi possivel trocar sua senha.";
      setNotice({ type: "error", message: msg });
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function onLogoutAllDevices() {
    setIsLoggingOutAll(true);
    try {
      const result = await apiRequest<{ message: string }>({
        path: "/api/auth/logout-all",
        method: "POST",
        requireAuth: true,
      });
      setNotice({ type: "success", message: result.message || "Sessoes encerradas em todos os dispositivos." });
      clearStoredToken();
      router.replace("/");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Nao foi possivel encerrar todas as sessoes.";
      setNotice({ type: "error", message: msg });
    } finally {
      setIsLoggingOutAll(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-4xl space-y-4">
          <div className="section-shell animate-pulse-soft h-20" />
          <div className="section-shell animate-pulse-soft h-64" />
          <div className="section-shell animate-pulse-soft h-64" />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <header className="section-shell animate-rise p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Minha conta</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Gerencie seus dados e seguranca</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="btn-secondary px-3 py-2 text-sm">
                Voltar ao dashboard
              </Link>
              <Link href="/faq" className="btn-secondary px-3 py-2 text-sm">
                FAQ
              </Link>
            </div>
          </div>
          <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${noticeStyle(notice.type)}`}>{notice.message}</p>
        </header>

        <section className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "80ms" }}>
          <h2 className="text-lg font-black">Dados da conta</h2>
          <p className="mt-1 text-sm text-zinc-600">Atualize seu username e email para manter o acesso organizado.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Username</span>
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-[var(--ring)] transition focus:ring-4"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Email</span>
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-[var(--ring)] transition focus:ring-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
          </div>

          <div className="panel-soft mt-4 grid gap-2 p-3 text-sm text-zinc-700">
            <p>
              <span className="font-semibold text-zinc-900">Conta criada em:</span>{" "}
              {profile ? new Date(profile.created_at).toLocaleString() : "-"}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Ultimo login:</span>{" "}
              {profile?.last_login ? new Date(profile.last_login).toLocaleString() : "Sem registro"}
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onSaveProfile}
              disabled={isSavingProfile}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              {isSavingProfile ? "Salvando..." : "Salvar dados da conta"}
            </button>
          </div>
        </section>

        <section className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "120ms" }}>
          <h2 className="text-lg font-black">Seguranca da senha</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Use uma senha forte (10+ caracteres, maiuscula, minuscula, numero e simbolo).
          </p>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Senha atual</span>
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-[var(--ring)] transition focus:ring-4"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Nova senha</span>
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-[var(--ring)] transition focus:ring-4"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Confirmar nova senha</span>
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-[var(--ring)] transition focus:ring-4"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={onChangePassword}
              disabled={isChangingPassword}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              {isChangingPassword ? "Atualizando senha..." : "Atualizar senha"}
            </button>
          </div>
        </section>

        <section className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "160ms" }}>
          <h2 className="text-lg font-black">Sessoes</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Se voce suspeitar de acesso indevido, encerre agora todas as sessoes ativas.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={onLogoutAllDevices}
              disabled={isLoggingOutAll}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
            >
              {isLoggingOutAll ? "Encerrando..." : "Encerrar sessoes em todos os dispositivos"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
