"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, clearStoredToken, getStoredToken } from "@/lib/easycrip";

type KeyInfo = {
  key_id: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  version: number;
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

type NoticeType = "info" | "success" | "error";

function noticeStyle(type: NoticeType) {
  if (type === "success") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (type === "error") return "border-rose-300 bg-rose-50 text-rose-900";
  return "border-zinc-300 bg-zinc-50 text-zinc-700";
}

function shortKey(value: string) {
  if (!value) return "-";
  if (value.length <= 16) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

export default function DashboardPage() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [token, setToken] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const [activeKey, setActiveKey] = useState<KeyInfo | null>(null);
  const [message, setMessage] = useState("");

  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [decryptKeyId, setDecryptKeyId] = useState("");
  const [iv, setIv] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");

  const [notice, setNotice] = useState<{ type: NoticeType; message: string }>({
    type: "info",
    message: "Sessao ativa. Gere uma chave para comecar.",
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setToken(getStoredToken());
      setIsHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const key = await apiRequest<KeyInfo>({
          path: "/api/keys/active",
          method: "GET",
          token,
          requireAuth: true,
        });

        if (!cancelled) {
          setActiveKey(key);
          setNotice({ type: "info", message: "Chave ativa carregada." });
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Nao foi possivel carregar a chave ativa.";
        if (msg.toLowerCase().includes("sessao expirada")) {
          clearStoredToken();
          router.replace("/");
          return;
        }
        if (!cancelled) {
          setActiveKey(null);
          setNotice({ type: "info", message: "Sem chave ativa. Gere uma nova chave." });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, token, router]);

  if (!isHydrated || !token) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-100">
        <p className="text-sm">Validando sessao...</p>
      </main>
    );
  }

  async function runAction<T>(fn: () => Promise<T>, successMessage: string) {
    setIsBusy(true);
    try {
      const data = await fn();
      setNotice({ type: "success", message: successMessage });
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Falha na operacao.";
      if (msg.toLowerCase().includes("sessao expirada")) {
        clearStoredToken();
        router.replace("/");
        return null;
      }
      setNotice({ type: "error", message: msg });
      return null;
    } finally {
      setIsBusy(false);
    }
  }

  async function onGenerateKey() {
    const data = await runAction<KeyInfo>(
      () =>
        apiRequest({
          path: "/api/keys/generate",
          method: "POST",
          token,
          requireAuth: true,
        }),
      "Nova chave gerada com sucesso.",
    );

    if (!data) return;
    setActiveKey(data);
    setDecryptKeyId(data.key_id);
  }

  async function onRefreshActiveKey() {
    const data = await runAction<KeyInfo>(
      () =>
        apiRequest({
          path: "/api/keys/active",
          method: "GET",
          token,
          requireAuth: true,
        }),
      "Chave ativa atualizada.",
    );

    if (!data) return;
    setActiveKey(data);
  }

  async function onEncrypt() {
    if (!message.trim()) {
      setNotice({ type: "error", message: "Digite uma mensagem para criptografar." });
      return;
    }

    const payload: { message: string; key_id?: string } = { message };
    if (activeKey?.key_id) {
      payload.key_id = activeKey.key_id;
    }

    const data = await runAction<EncryptResponse>(
      () =>
        apiRequest({
          path: "/api/encrypt",
          method: "POST",
          body: payload,
          token,
          requireAuth: true,
        }),
      "Mensagem criptografada.",
    );

    if (!data) return;
    setEncryptedMessage(data.encrypted_message);
    setIv(data.iv);
    setDecryptKeyId(data.key_id);
    setDecryptedMessage("");
  }

  async function onDecrypt() {
    if (!encryptedMessage.trim() || !decryptKeyId.trim() || !iv.trim()) {
      setNotice({ type: "error", message: "Informe encrypted_message, key_id e iv para descriptografar." });
      return;
    }

    const data = await runAction<DecryptResponse>(
      () =>
        apiRequest({
          path: "/api/decrypt",
          method: "POST",
          body: {
            encrypted_message: encryptedMessage,
            key_id: decryptKeyId,
            iv,
          },
          token,
          requireAuth: true,
        }),
      "Mensagem descriptografada.",
    );

    if (!data) return;
    setDecryptedMessage(data.decrypted_message);
  }

  async function copyText(value: string, label: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setNotice({ type: "success", message: `${label} copiado.` });
    } catch {
      setNotice({ type: "error", message: `Nao foi possivel copiar ${label.toLowerCase()}.` });
    }
  }

  function onLogout() {
    clearStoredToken();
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#d9f99d,_transparent_33%),radial-gradient(circle_at_bottom_right,_#fde68a,_transparent_35%),#f3efe4] px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-xl shadow-zinc-900/5 backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Dashboard seguro</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Gestao de Chaves e Criptografia</h1>
            </div>
            <button
              onClick={onLogout}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Encerrar sessao
            </button>
          </div>

          <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${noticeStyle(notice.type)}`}>{notice.message}</p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur lg:col-span-1">
            <h2 className="text-lg font-bold">Chave ativa</h2>

            <div className="mt-4 space-y-2 text-sm text-zinc-700">
              <p>
                <span className="font-semibold text-zinc-900">ID:</span> {activeKey ? shortKey(activeKey.key_id) : "Nenhuma"}
              </p>
              <p>
                <span className="font-semibold text-zinc-900">Versao:</span> {activeKey ? activeKey.version : "-"}
              </p>
              <p>
                <span className="font-semibold text-zinc-900">Expira em:</span>{" "}
                {activeKey ? new Date(activeKey.expires_at).toLocaleString() : "-"}
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                onClick={onGenerateKey}
                disabled={isBusy}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Gerar nova chave
              </button>
              <button
                onClick={onRefreshActiveKey}
                disabled={isBusy}
                className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Atualizar chave ativa
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur lg:col-span-2">
            <h2 className="text-lg font-bold">Criptografar mensagem</h2>

            <textarea
              className="mt-4 min-h-36 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem que deseja criptografar"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={onEncrypt}
                disabled={isBusy}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy ? "Processando..." : "Criptografar"}
              </button>
              <button
                onClick={() => setMessage("")}
                disabled={isBusy}
                className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpar mensagem
              </button>
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur">
            <h2 className="text-lg font-bold">Payload criptografado</h2>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  encrypted_message
                </label>
                <textarea
                  className="min-h-28 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-400 transition focus:ring"
                  value={encryptedMessage}
                  onChange={(e) => setEncryptedMessage(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  key_id
                </label>
                <input
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-400 transition focus:ring"
                  value={decryptKeyId}
                  onChange={(e) => setDecryptKeyId(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  iv
                </label>
                <input
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none ring-emerald-400 transition focus:ring"
                  value={iv}
                  onChange={(e) => setIv(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onDecrypt}
                disabled={isBusy}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Descriptografar
              </button>
              <button
                onClick={() => copyText(encryptedMessage, "Encrypted message")}
                disabled={!encryptedMessage}
                className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Copiar encrypted_message
              </button>
              <button
                onClick={() => copyText(iv, "IV")}
                disabled={!iv}
                className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Copiar IV
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur">
            <h2 className="text-lg font-bold">Mensagem descriptografada</h2>

            <textarea
              className="mt-4 min-h-64 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-400 transition focus:ring"
              value={decryptedMessage}
              onChange={(e) => setDecryptedMessage(e.target.value)}
              placeholder="O resultado da descriptografia aparecera aqui"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => copyText(decryptedMessage, "Mensagem descriptografada")}
                disabled={!decryptedMessage}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Copiar texto
              </button>
              <button
                onClick={() => setDecryptedMessage("")}
                className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300"
              >
                Limpar
              </button>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
