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

type KeyListResponse = {
  keys: KeyInfo[];
  active_key: KeyInfo | null;
};

type NoticeType = "info" | "success" | "error";
type KeyValidationState = "idle" | "checking" | "valid" | "invalid";

type IvBundle = {
  key_id: string;
  iv: string;
  algorithm: "AES-256-CBC";
  generated_at: string;
};

function noticeStyle(type: NoticeType) {
  if (type === "success") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (type === "error") return "border-rose-300 bg-rose-50 text-rose-900";
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
  const [token, setToken] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const [activeKey, setActiveKey] = useState<KeyInfo | null>(null);
  const [keyIdForIv, setKeyIdForIv] = useState("");
  const [ivBundle, setIvBundle] = useState<IvBundle | null>(null);
  const [keyValidation, setKeyValidation] = useState<{
    state: KeyValidationState;
    message: string;
  }>({
    state: "idle",
    message: "Informe o key_id para validar antes de gerar o IV.",
  });

  const [notice, setNotice] = useState<{ type: NoticeType; message: string }>({
    type: "info",
    message: "Carregando painel...",
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

        if (cancelled) return;

        setActiveKey(key);
        setKeyIdForIv(key.key_id);
        setKeyValidation({
          state: "valid",
          message: "key_id da chave ativa validado.",
        });
        setNotice({ type: "info", message: "Chave ativa carregada. Gere um IV para uso pessoal." });
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
          message: "Nenhuma chave ativa encontrada. Gere uma nova chave para continuar.",
        });
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
    const key = await runAction<KeyInfo>(
      () =>
        apiRequest({
          path: "/api/keys/generate",
          method: "POST",
          token,
          requireAuth: true,
        }),
      "Nova chave AES-256 gerada com sucesso.",
    );

    if (!key) return;

    setActiveKey(key);
    setKeyIdForIv(key.key_id);
    setKeyValidation({
      state: "valid",
      message: "key_id da nova chave ativo e pronto para gerar IV.",
    });
    setIvBundle(null);
  }

  async function onRefreshActiveKey() {
    const key = await runAction<KeyInfo>(
      () =>
        apiRequest({
          path: "/api/keys/active",
          method: "GET",
          token,
          requireAuth: true,
        }),
      "Chave ativa atualizada.",
    );

    if (!key) return;

    setActiveKey(key);
    setKeyIdForIv(key.key_id);
    setKeyValidation({
      state: "valid",
      message: "key_id da chave ativa validado.",
    });
  }

  function onGenerateIv() {
    const selectedKeyId = keyIdForIv.trim();
    if (!selectedKeyId) {
      setKeyValidation({
        state: "invalid",
        message: "Informe um key_id valido para gerar o IV.",
      });
      setNotice({ type: "error", message: "Informe um key_id valido para gerar o IV." });
      return;
    }

    if (!/^[A-Za-z0-9_-]{16,64}$/.test(selectedKeyId)) {
      setKeyValidation({
        state: "invalid",
        message: "Formato de key_id invalido. Use somente letras, numeros, '_' e '-'.",
      });
      setNotice({
        type: "error",
        message: "Formato de key_id invalido. Corrija antes de gerar o IV.",
      });
      return;
    }

    setKeyValidation({ state: "checking", message: "Validando key_id no backend..." });
    void validateAndGenerateIv(selectedKeyId);
  }

  async function validateAndGenerateIv(selectedKeyId: string) {
    setIsBusy(true);
    try {
      const keyList = await apiRequest<KeyListResponse>({
        path: "/api/keys/list",
        method: "GET",
        token,
        requireAuth: true,
      });

      const selectedKey = keyList.keys.find((k) => k.key_id === selectedKeyId);
      if (!selectedKey) {
        setKeyValidation({
          state: "invalid",
          message: "key_id nao encontrado para este usuario.",
        });
        setNotice({
          type: "error",
          message: "key_id nao encontrado para este usuario.",
        });
        return;
      }

      const activeKeyId = keyList.active_key?.key_id ?? "";
      const isActiveSelection = selectedKey.is_active && selectedKey.key_id === activeKeyId;
      if (!isActiveSelection) {
        setKeyValidation({
          state: "invalid",
          message: "Somente key_id ativo e aceito para gerar IV.",
        });
        setNotice({
          type: "error",
          message: "Este key_id nao esta ativo. Use a chave ativa atual.",
        });
        return;
      }

      setKeyValidation({
        state: "valid",
        message: "key_id ativo validado no backend.",
      });

      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);

      const bundle: IvBundle = {
        key_id: selectedKeyId,
        iv: toBase64(bytes),
        algorithm: "AES-256-CBC",
        generated_at: new Date().toISOString(),
      };

      setIvBundle(bundle);
      setNotice({ type: "success", message: "IV gerado com sucesso para o key_id selecionado." });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Falha ao validar key_id.";
      if (msg.toLowerCase().includes("sessao expirada")) {
        clearStoredToken();
        router.replace("/");
        return;
      }

      setKeyValidation({
        state: "invalid",
        message: "Nao foi possivel validar o key_id no backend.",
      });
      setNotice({ type: "error", message: msg });
    } finally {
      setIsBusy(false);
    }
  }

  function onKeyIdChange(value: string) {
    setKeyIdForIv(value);
    setKeyValidation({
      state: "idle",
      message: "Edicao detectada. Clique em Gerar IV para validar novamente.",
    });
  }

  function keyValidationClass() {
    if (keyValidation.state === "valid") {
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
    }
    if (keyValidation.state === "invalid") {
      return "border-rose-300 bg-rose-50 text-rose-900";
    }
    if (keyValidation.state === "checking") {
      return "border-amber-300 bg-amber-50 text-amber-900";
    }
    return "border-zinc-300 bg-zinc-50 text-zinc-700";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dcfce7,_transparent_33%),radial-gradient(circle_at_bottom_right,_#fde68a,_transparent_34%),#f4f0e6] px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-xl shadow-zinc-900/5 backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Produto real</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Gerador AES-256 para uso pessoal</h1>
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

        <section className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur sm:p-6">
          <h2 className="text-lg font-bold">Chave ativa</h2>

          <div className="mt-3 space-y-1 text-sm text-zinc-700">
            <p>
              <span className="font-semibold text-zinc-900">key_id:</span>{" "}
              {activeKey ? shortKey(activeKey.key_id) : "Nenhuma chave ativa"}
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
            <button
              onClick={onGenerateKey}
              disabled={isBusy}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Gerar nova chave AES-256
            </button>
            <button
              onClick={onRefreshActiveKey}
              disabled={isBusy}
              className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Atualizar chave ativa
            </button>
            <button
              onClick={() => copyText(activeKey?.key_id ?? "", "key_id")}
              disabled={!activeKey?.key_id}
              className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Copiar key_id
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur sm:p-6">
          <h2 className="text-lg font-bold">Gerar IV com key_id</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Gere um IV aleatorio (16 bytes, base64) associado ao seu key_id para uso nas operacoes AES-256-CBC.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label htmlFor="key-id" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                key_id
              </label>
              <input
                id="key-id"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none ring-emerald-400 transition focus:ring"
                value={keyIdForIv}
                onChange={(e) => onKeyIdChange(e.target.value)}
                placeholder="Cole ou use o key_id da chave ativa"
              />
            </div>

            <button
              onClick={onGenerateIv}
              disabled={isBusy || keyValidation.state === "checking"}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {keyValidation.state === "checking" ? "Validando..." : "Gerar IV"}
            </button>
          </div>

          <p className={`mt-3 rounded-xl border px-3 py-2 text-sm ${keyValidationClass()}`}>
            {keyValidation.message}
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">iv (base64)</label>
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none"
                value={ivBundle?.iv ?? ""}
                readOnly
                placeholder="IV gerado aparecera aqui"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">bundle (json)</label>
              <textarea
                className="min-h-28 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 font-mono text-xs outline-none"
                readOnly
                value={
                  ivBundle
                    ? JSON.stringify(ivBundle, null, 2)
                    : ""
                }
                placeholder="Bundle key_id + iv"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => copyText(ivBundle?.iv ?? "", "IV")}
              disabled={!ivBundle?.iv}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Copiar IV
            </button>
            <button
              onClick={() => copyText(ivBundle ? JSON.stringify(ivBundle) : "", "Bundle")}
              disabled={!ivBundle}
              className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Copiar bundle JSON
            </button>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Boa pratica: nao reutilize o mesmo IV com o mesmo key_id em multiplas operacoes.
          </p>
        </section>
      </section>
    </main>
  );
}
