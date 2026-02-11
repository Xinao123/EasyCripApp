import Link from "next/link";

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
    answer:
      "O EasyCrip permite gerar chave AES-256 para uso pessoal e gerar nonce vinculado ao key_id ativo.",
  },
  {
    question: "Preciso criar conta para usar?",
    answer:
      "Sim. Primeiro registre um usuario, depois faca login para acessar o dashboard protegido.",
  },
  {
    question: "Como gero minha chave AES-256?",
    answer:
      "No dashboard, use o botao 'Gerar nova chave AES-256'. A chave ativa fica associada ao seu usuario.",
  },
  {
    question: "Como gero nonce corretamente?",
    answer:
      "Informe um key_id e clique em 'Gerar Nonce'. O sistema valida se o key_id esta ativo antes de liberar o nonce.",
  },
  {
    question: "Posso reutilizar o mesmo nonce?",
    answer:
      "Nao e recomendado reutilizar nonce com a mesma chave. Gere um novo nonce para cada operacao AES-GCM.",
  },
  {
    question: "O que fazer se a sessao expirar?",
    answer:
      "Faca login novamente. Se necessario, limpe o token da sessao e entre outra vez.",
  },
];

const usageSteps = [
  "Crie sua conta na tela inicial.",
  "Faca login e abra o dashboard.",
  "Gere uma nova chave AES-256.",
  "Confirme o key_id ativo.",
  "Gere um nonce para esse key_id.",
  "Copie o bundle JSON para uso no seu fluxo.",
];

const exampleItems: ExampleItem[] = [
  {
    title: "Backup pessoal de documentos",
    objective: "Proteger arquivos sensiveis antes de enviar para nuvem.",
    flow: [
      "No dashboard, gere uma nova chave AES-256.",
      "Gere um nonce para o key_id ativo.",
      "Use key_id + nonce + sua integracao para criptografar os documentos.",
    ],
    expectedResult:
      "Se o arquivo for vazado, o conteudo continua ilegivel sem o contexto correto da chave.",
  },
  {
    title: "Compartilhamento interno de configuracoes",
    objective: "Enviar dados tecnicos para outro servico sem trafegar texto puro.",
    flow: [
      "Gere a chave e copie o key_id ativo.",
      "Gere nonce unico para cada payload.",
      "Envie o payload cifrado junto com key_id e nonce para processamento seguro.",
    ],
    expectedResult:
      "Cada mensagem usa nonce novo, reduzindo risco criptografico por reutilizacao.",
  },
  {
    title: "Rotacao operacional de chaves",
    objective: "Manter higiene de seguranca com troca periodica.",
    flow: [
      "Gere nova chave no dashboard quando iniciar um novo ciclo.",
      "Use sempre o key_id ativo para novas operacoes.",
      "Nao reaproveite nonce antigo da chave anterior.",
    ],
    expectedResult:
      "Fluxo previsivel de renovacao e menor impacto em caso de comprometimento de uma chave antiga.",
  },
];

const keyConcepts: KeyConcept[] = [
  {
    title: "key_id",
    description:
      "E o identificador da chave. Voce usa esse ID para referenciar a chave correta nas operacoes.",
  },
  {
    title: "Chave AES-256",
    description:
      "A chave real e gerada e gerenciada no backend. O frontend mostra o key_id para uso seguro no fluxo.",
  },
  {
    title: "Nonce (AES-GCM)",
    description:
      "E um valor unico por operacao. Nao precisa ser secreto, mas nao deve ser reutilizado com a mesma chave.",
  },
  {
    title: "Bundle JSON",
    description:
      "Pacote com key_id + nonce + algorithm + generated_at para facilitar integracao e rastreabilidade.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dcfce7,_transparent_33%),radial-gradient(circle_at_bottom_right,_#fde68a,_transparent_34%),#f4f0e6] px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-xl shadow-zinc-900/5 backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Central de ajuda
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                FAQ e formas de uso
              </h1>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-300"
              >
                Inicio
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <p className="mt-4 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            Guia rapido para reduzir erros e melhorar o uso do produto.
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur sm:p-6">
          <h2 className="text-lg font-bold">Como usar em 6 passos</h2>
          <ol className="mt-3 grid gap-2 text-sm text-zinc-700">
            {usageSteps.map((step, index) => (
              <li
                key={step}
                className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-3 py-2"
              >
                <span className="font-semibold text-zinc-900">{index + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur sm:p-6">
          <h2 className="text-lg font-bold">Perguntas frequentes</h2>
          <div className="mt-3 space-y-3">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-4 py-3"
              >
                <h3 className="text-sm font-bold text-zinc-900">{item.question}</h3>
                <p className="mt-1 text-sm text-zinc-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur sm:p-6">
          <h2 className="text-lg font-bold">Exemplos praticos de uso</h2>
          <p className="mt-1 text-sm text-zinc-700">
            Cenarios reais para aplicar as chaves geradas no produto.
          </p>
          <div className="mt-3 space-y-3">
            {exampleItems.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-4 py-3"
              >
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
                  <span className="font-semibold text-zinc-900">Resultado esperado:</span>{" "}
                  {item.expectedResult}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur sm:p-6">
          <h2 className="text-lg font-bold">Como as chaves funcionam</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {keyConcepts.map((concept) => (
              <article
                key={concept.title}
                className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-3 py-3"
              >
                <h3 className="text-sm font-bold text-zinc-900">{concept.title}</h3>
                <p className="mt-1 text-sm text-zinc-700">{concept.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-300/75 bg-white/80 p-5 shadow-lg shadow-zinc-900/5 backdrop-blur sm:p-6">
          <h2 className="text-lg font-bold">Boas praticas rapidas</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-3 py-2">
              Sempre use key_id ativo para gerar nonce.
            </li>
            <li className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-3 py-2">
              Gere um novo nonce para cada operacao AES-GCM.
            </li>
            <li className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-3 py-2">
              Nao compartilhe token de sessao nem dados sensiveis em canais inseguros.
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}
