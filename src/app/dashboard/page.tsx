"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, clearStoredToken } from "@/lib/easycrip";

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

type NoticeType = "info" | "success" | "error";
type KeyValidationState = "idle" | "checking" | "valid" | "invalid";

type NonceBundle = {
  key_id: string;
  nonce: string;
  algorithm: "AES-256-GCM";
  generated_at: string;
};

function noticeStyle(type: NoticeType) {
  if (type === "success") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (type === "error") return "border-rose-300 bg-rose-50 text-rose-900";
  return "border-zinc-300 bg-zinc-50 text-zinc-700";
}

function keyValidationClass(state: KeyValidationState) {
  if (state === "valid") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (state === "invalid") return "border-rose-300 bg-rose-50 text-rose-900";
  if (state === "checking") return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-zinc-300 bg-zinc-50 text-zinc-700";
}

function shortKey(value: string) {
  if (!value) return "-";
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export default function DashboardPage() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [activeKey, setActiveKey] = useState<KeyInfo | null>(null);
  const [keyIdForNonce, setKeyIdForNonce] = useState("");
  const [nonceBundle, setNonceBundle] = useState<NonceBundle | null>(null);
  const [keyValidation, setKeyValidation] = useState<{ state: KeyValidationState; message: string }>({
    state: "idle",
    message: "Informe o key_id para validar antes de gerar o nonce.",
  });
  const [notice, setNotice] = useState<{ type: NoticeType; message: string }>({
    type: "info",
    message: "Carregando seu dashboard...",
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      clearStoredToken(); // cleanup de versoes antigas
      setIsHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    let cancelled = false;

    (async () => {
      try {
        const key = await apiRequest<KeyInfo>({
          path: "/api/keys/active",
          method: "GET",
          requireAuth: true,
        });

        if (cancelled) return;

        setActiveKey(key);
        setKeyIdForNonce(key.key_id);
        setKeyValidation({ state: "valid", message: "key_id da chave ativa validado." });
        setNotice({ type: "info", message: "Chave ativa carregada. Agora voce pode gerar um nonce com seguranca." });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Falha ao carregar a chave ativa.";
        if (msg.toLowerCase().includes("sessao expirada")) {
          clearStoredToken();
          router.replace("/");
          return;
        }

        if (cancelled) return;
        setActiveKey(null);
        setNotice({
          type: "info",
          message: "Voce ainda nao tem chave ativa. Gere sua primeira chave para continuar.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, router]);

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
    const key = await runAction<KeyInfo>(
      () =>
        apiRequest({
          path: "/api/keys/generate",
          method: "POST",
          requireAuth: true,
        }),
      "Nova chave AES-256 gerada com sucesso.",
    );

    if (!key) return;
    setActiveKey(key);
    setKeyIdForNonce(key.key_id);
    setKeyValidation({ state: "valid", message: "Pronto! key_id da nova chave validado para gerar nonce." });
    setNonceBundle(null);
  }

  async function onRefreshActiveKey() {
    const key = await runAction<KeyInfo>(
      () =>
        apiRequest({
          path: "/api/keys/active",
          method: "GET",
          requireAuth: true,
        }),
      "Chave ativa atualizada.",
    );

    if (!key) return;
    setActiveKey(key);
    setKeyIdForNonce(key.key_id);
    setKeyValidation({ state: "valid", message: "key_id da chave ativa validado." });
  }

  function onGenerateNonce() {
    const selectedKeyId = keyIdForNonce.trim();
    if (!selectedKeyId) {
      setKeyValidation({ state: "invalid", message: "Informe um key_id valido para gerar o nonce." });
      setNotice({ type: "error", message: "Informe um key_id valido para gerar o nonce." });
      return;
    }

    if (!/^[A-Za-z0-9_-]{16,64}$/.test(selectedKeyId)) {
      setKeyValidation({
        state: "invalid",
        message: "Formato de key_id invalido. Use somente letras, numeros, '_' e '-'.",
      });
      setNotice({ type: "error", message: "Formato de key_id invalido. Corrija antes de gerar o nonce." });
      return;
    }

    setKeyValidation({ state: "checking", message: "Validando key_id no backend..." });
    void validateAndGenerateNonce(selectedKeyId);
  }

  async function validateAndGenerateNonce(selectedKeyId: string) {
    setIsBusy(true);
    try {
      const keyList = await apiRequest<KeyListResponse>({
        path: "/api/keys/list",
        method: "GET",
        requireAuth: true,
      });

      const selectedKey = keyList.keys.find((k) => k.key_id === selectedKeyId);
      if (!selectedKey) {
        setKeyValidation({ state: "invalid", message: "key_id nao encontrado para este usuario." });
        setNotice({ type: "error", message: "key_id nao encontrado para este usuario." });
        return;
      }

      const activeKeyId = keyList.active_key?.key_id ?? "";
      const isActiveSelection = selectedKey.is_active && selectedKey.key_id === activeKeyId;
      if (!isActiveSelection) {
        setKeyValidation({ state: "invalid", message: "Somente key_id ativo e aceito para gerar nonce." });
        setNotice({ type: "error", message: "Este key_id nao esta ativo. Use a chave ativa atual." });
        return;
      }

      setKeyValidation({ state: "valid", message: "key_id ativo validado no backend." });

      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);

      const bundle: NonceBundle = {
        key_id: selectedKeyId,
        nonce: toBase64(bytes),
        algorithm: "AES-256-GCM",
        generated_at: new Date().toISOString(),
      };

      setNonceBundle(bundle);
      setNotice({ type: "success", message: "Nonce gerado com sucesso para o key_id informado." });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Falha ao validar key_id.";
      if (msg.toLowerCase().includes("sessao expirada")) {
        clearStoredToken();
        router.replace("/");
        return;
      }
      setKeyValidation({ state: "invalid", message: "Nao foi possivel validar o key_id no backend." });
      setNotice({ type: "error", message: msg });
    } finally {
      setIsBusy(false);
    }
  }

  function onKeyIdChange(value: string) {
    setKeyIdForNonce(value);
    setKeyValidation({ state: "idle", message: "Edicao detectada. Clique em Gerar Nonce para validar novamente." });
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

  async function onLogout() {
    try {
      await apiRequest({
        path: "/api/auth/logout",
        method: "POST",
        requireAuth: true,
      });
    } catch {
      // ignora erro e encerra sessao local de qualquer forma
    } finally {
      clearStoredToken();
      router.replace("/");
    }
  }

  if (!isHydrated) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-5xl space-y-4">
          <div className="section-shell animate-pulse-soft h-16" />
          <div className="section-shell animate-pulse-soft h-64" />
          <div className="section-shell animate-pulse-soft h-72" />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <header className="section-shell sticky top-4 z-20 animate-rise p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Dashboard seguro</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Seu gerador AES-256 pessoal</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${
                  activeKey ? "bg-emerald-100 text-emerald-800" : "bg-zinc-200 text-zinc-700"
                }`}
              >
                {activeKey ? "Chave ativa" : "Sem chave ativa"}
              </span>
              <Link href="/faq" className="btn-secondary px-3 py-2 text-sm">
                FAQ
              </Link>
              <Link href="/account" className="btn-secondary px-3 py-2 text-sm">
                Minha conta
              </Link>
              <button onClick={onLogout} className="btn-ghost-dark px-3 py-2 text-sm">
                Encerrar sessao
              </button>
            </div>
          </div>

          <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${noticeStyle(notice.type)}`}>{notice.message}</p>
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="section-shell animate-rise p-5 sm:p-6">
            <h2 className="text-lg font-black">Chave ativa</h2>
            <p className="mt-1 text-sm text-zinc-600">Veja seu key_id atual e gerencie a rotacao quando precisar.</p>

            <div className="panel-soft mt-4 space-y-2 p-3 text-sm text-zinc-700">
              <p>
                <span className="font-semibold text-zinc-900">key_id:</span>{" "}
                <span className="font-mono">{activeKey ? shortKey(activeKey.key_id) : "Nenhuma chave ativa"}</span>
              </p>
              <p>
                <span className="font-semibold text-zinc-900">versao:</span> {activeKey ? activeKey.version : "-"}
              </p>
              <p>
                <span className="font-semibold text-zinc-900">expira em:</span>{" "}
                {activeKey ? new Date(activeKey.expires_at).toLocaleString() : "-"}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={onGenerateKey} disabled={isBusy} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
                Gerar nova chave AES-256
              </button>
              <button onClick={onRefreshActiveKey} disabled={isBusy} className="btn-secondary px-4 py-2 text-sm disabled:opacity-60">
                Atualizar chave ativa
              </button>
              <button
                onClick={() => copyText(activeKey?.key_id ?? "", "key_id")}
                disabled={!activeKey?.key_id}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
              >
                Copiar key_id
              </button>
            </div>
          </article>

          <article className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "80ms" }}>
            <h2 className="text-lg font-black">Gerar nonce com key_id</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Gere um nonce (12 bytes, base64) apenas para o key_id ativo e use no fluxo AES-GCM.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="grid gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">key_id</span>
                <input
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none ring-[var(--ring)] transition focus:ring-4"
                  value={keyIdForNonce}
                  onChange={(e) => onKeyIdChange(e.target.value)}
                  placeholder="Cole ou use o key_id da chave ativa"
                />
              </label>

              <button onClick={onGenerateNonce} disabled={isBusy || keyValidation.state === "checking"} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
                {keyValidation.state === "checking" ? "Validando..." : "Gerar nonce"}
              </button>
            </div>

            <p className={`mt-3 rounded-xl border px-3 py-2 text-sm ${keyValidationClass(keyValidation.state)}`}>
              {keyValidation.message}
            </p>

            <p className="mt-3 text-xs text-zinc-500">
              Boa pratica: nunca reutilize nonce com o mesmo key_id em operacoes diferentes.
            </p>
          </article>
        </section>

        <section className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "130ms" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-black">Saida pronta para integracao</h2>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">AES-256-GCM</span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="panel-soft p-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                nonce (base64)
              </label>
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none"
                value={nonceBundle?.nonce ?? ""}
                readOnly
                placeholder="Nonce gerado aparecera aqui"
              />
            </div>

            <div className="panel-soft p-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                bundle (json)
              </label>
              <textarea
                className="min-h-28 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none"
                readOnly
                value={nonceBundle ? JSON.stringify(nonceBundle, null, 2) : ""}
                placeholder="Bundle key_id + nonce + algorithm + generated_at"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => copyText(nonceBundle?.nonce ?? "", "Nonce")}
              disabled={!nonceBundle?.nonce}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
            >
              Copiar nonce
            </button>
            <button
              onClick={() => copyText(nonceBundle ? JSON.stringify(nonceBundle) : "", "Bundle")}
              disabled={!nonceBundle}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
            >
              Copiar bundle JSON
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
