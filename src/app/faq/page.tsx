import Link from "next/link";

type FaqItem = {
  question: string;
  answer: string;
};

const faqItems: FaqItem[] = [
  {
    question: "O que o EasyCrip faz?",
    answer:
      "O EasyCrip permite gerar chave AES-256 para uso pessoal e gerar IV vinculado ao key_id ativo.",
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
    question: "Como gero IV corretamente?",
    answer:
      "Informe um key_id e clique em 'Gerar IV'. O sistema valida se o key_id esta ativo antes de liberar o IV.",
  },
  {
    question: "Posso reutilizar o mesmo IV?",
    answer:
      "Nao e recomendado reutilizar IV com a mesma chave. Gere um novo IV para cada operacao.",
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
  "Gere um IV para esse key_id.",
  "Copie o bundle JSON para uso no seu fluxo.",
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
          <h2 className="text-lg font-bold">Boas praticas rapidas</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-3 py-2">
              Sempre use key_id ativo para gerar IV.
            </li>
            <li className="rounded-xl border border-zinc-300/70 bg-zinc-50/90 px-3 py-2">
              Gere um novo IV para cada operacao.
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
