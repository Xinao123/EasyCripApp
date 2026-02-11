"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, API_BASE_URL } from "@/lib/easycrip";

type FaqItem = {
  question: string;
  answer: string;
};

type ExampleItem = {
  title: string;
  objective: string;
  flow: string[];
  expectedResult: string;
};

type KeyConcept = {
  title: string;
  description: string;
};

const faqItems: FaqItem[] = [
  {
    question: "O que o EasyCrip faz?",
    answer: "O EasyCrip permite gerar chave AES-256 para uso pessoal e gerar nonce vinculado ao key_id ativo.",
  },
  {
    question: "Preciso criar conta para usar?",
    answer: "Sim. Primeiro registre um usuario, depois faca login para acessar o dashboard protegido.",
  },
  {
    question: "Como gero minha chave AES-256?",
    answer: "No dashboard, clique em 'Gerar nova chave AES-256'. A chave ativa fica vinculada ao seu usuario.",
  },
  {
    question: "Como gero nonce corretamente?",
    answer: "Informe um key_id e clique em 'Gerar nonce'. O sistema valida se o key_id esta ativo antes de liberar.",
  },
  {
    question: "Posso reutilizar o mesmo nonce?",
    answer: "Nao. Gere novo nonce para cada operacao AES-GCM com a mesma chave.",
  },
  {
    question: "O que fazer se a sessao expirar?",
    answer: "Faca login novamente. Se necessario, limpe a sessao e entre outra vez.",
  },
];

const usageSteps = [
  "Crie sua conta na tela inicial.",
  "Faca login e abra o dashboard.",
  "Gere uma nova chave AES-256.",
  "Confirme o key_id ativo.",
  "Gere um nonce para esse key_id.",
  "Copie o bundle JSON para seu fluxo.",
];

const exampleItems: ExampleItem[] = [
  {
    title: "Backup pessoal de documentos",
    objective: "Proteger arquivos sensiveis antes de enviar para nuvem.",
    flow: [
      "Gere uma nova chave AES-256 no dashboard.",
      "Gere nonce para o key_id ativo.",
      "Use key_id + nonce no seu processo de criptografia.",
    ],
    expectedResult: "Mesmo se o arquivo for vazado, o conteudo segue ilegivel sem a chave correta.",
  },
  {
    title: "Compartilhamento interno de dados",
    objective: "Enviar payload sensivel sem texto puro no trafego.",
    flow: [
      "Recupere o key_id ativo.",
      "Gere nonce unico para cada payload.",
      "Transmita payload cifrado com key_id e nonce.",
    ],
    expectedResult: "Menor risco de exposicao por reutilizacao de nonce ou vazamento em transit.",
  },
  {
    title: "Rotacao operacional",
    objective: "Manter higiene de seguranca com ciclos previsiveis.",
    flow: [
      "Gere nova chave no inicio de um ciclo.",
      "Use somente key_id ativo para novas operacoes.",
      "Nao reaproveite nonce de operacoes antigas.",
    ],
    expectedResult: "Processo padronizado e menor impacto caso uma chave antiga seja exposta.",
  },
];

const keyConcepts: KeyConcept[] = [
  {
    title: "key_id",
    description: "Identificador da chave. Ele referencia qual chave deve ser usada no fluxo.",
  },
  {
    title: "Chave AES-256",
    description: "A chave real e gerada no backend. O frontend trabalha com key_id e controle de uso.",
  },
  {
    title: "Nonce (AES-GCM)",
    description: "Valor unico por operacao. Pode ser publico, mas nao deve se repetir para a mesma chave.",
  },
  {
    title: "Bundle JSON",
    description: "Pacote com key_id + nonce + algorithm + generated_at para facilitar integracao.",
  },
];

export default function FaqPage() {
  const [openItem, setOpenItem] = useState<number>(0);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!API_BASE_URL) return () => {};

    (async () => {
      try {
        await apiRequest({
          path: "/api/keys/active",
          method: "GET",
          requireAuth: true,
        });
        if (!cancelled) setHasSession(true);
      } catch {
        if (!cancelled) setHasSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <header className="section-shell animate-rise p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Central de ajuda</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                FAQ, exemplos e formas de uso
              </h1>
            </div>
            <div className="flex gap-2">
              <Link href="/" className="btn-secondary px-3 py-2 text-sm">
                Inicio
              </Link>
              {hasSession && (
                <Link href="/dashboard" className="btn-primary px-3 py-2 text-sm">
                  Ir para dashboard
                </Link>
              )}
            </div>
          </div>
          <p className="panel-soft mt-4 px-3 py-2 text-sm text-zinc-700">
            Guia objetivo para reduzir erros e usar o produto com mais seguranca.
          </p>
        </header>

        <section className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "70ms" }}>
          <h2 className="text-lg font-black">Como usar em 6 passos</h2>
          <ol className="mt-3 grid gap-2 text-sm text-zinc-700">
            {usageSteps.map((step, index) => (
              <li key={step} className="panel-soft px-3 py-2">
                <span className="font-semibold text-zinc-900">{index + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "110ms" }}>
          <h2 className="text-lg font-black">Perguntas frequentes</h2>
          <div className="mt-3 space-y-2">
            {faqItems.map((item, index) => {
              const open = openItem === index;
              return (
                <article key={item.question} className="panel-soft overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenItem(open ? -1 : index)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="text-sm font-bold text-zinc-900">{item.question}</span>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition ${
                        open ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-zinc-300 text-zinc-600"
                      }`}
                    >
                      {open ? "−" : "+"}
                    </span>
                  </button>
                  {open && <p className="animate-rise px-4 pb-3 text-sm text-zinc-700">{item.answer}</p>}
                </article>
              );
            })}
          </div>
        </section>

        <section className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "150ms" }}>
          <h2 className="text-lg font-black">Exemplos praticos de uso</h2>
          <p className="mt-1 text-sm text-zinc-700">Cenarios reais para aplicar as chaves geradas no produto.</p>
          <div className="mt-3 space-y-3">
            {exampleItems.map((item) => (
              <article key={item.title} className="panel-soft px-4 py-3">
                <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
                <p className="mt-1 text-sm text-zinc-700">
                  <span className="font-semibold text-zinc-900">Objetivo:</span> {item.objective}
                </p>
                <ol className="mt-2 space-y-1 text-sm text-zinc-700">
                  {item.flow.map((step, index) => (
                    <li key={step}>
                      <span className="font-semibold text-zinc-900">{index + 1}.</span> {step}
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-sm text-zinc-700">
                  <span className="font-semibold text-zinc-900">Resultado esperado:</span> {item.expectedResult}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "190ms" }}>
          <h2 className="text-lg font-black">Como as chaves funcionam</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {keyConcepts.map((concept) => (
              <article key={concept.title} className="panel-soft px-3 py-3">
                <h3 className="text-sm font-bold text-zinc-900">{concept.title}</h3>
                <p className="mt-1 text-sm text-zinc-700">{concept.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-shell animate-rise p-5 sm:p-6" style={{ animationDelay: "230ms" }}>
          <h2 className="text-lg font-black">Boas praticas rapidas</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li className="panel-soft px-3 py-2">Sempre use key_id ativo para gerar nonce.</li>
            <li className="panel-soft px-3 py-2">Gere novo nonce para cada operacao AES-GCM.</li>
            <li className="panel-soft px-3 py-2">Nao compartilhe token de sessao nem dados sensiveis em canais inseguros.</li>
          </ul>
          <div className="mt-4 flex justify-end">
            {hasSession && (
              <Link href="/dashboard" className="btn-primary px-4 py-2 text-sm">
                Comecar agora no dashboard
              </Link>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
