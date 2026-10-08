import {
  Briefcase,
  Handshake,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

const networkTracks = [
  {
    Icon: Handshake,
    title: "Parcerias Estratégicas & Co-Selling",
    description:
      "Conecte-se com agências e operadores complementares para formar alianças, atender clientes maiores e trocar indicações qualificadas.",
  },
  {
    Icon: Briefcase,
    title: "Bolsa de Demandas & Projetos",
    description:
      "Compartilhe overflow de demandas, contrate squads especializados e encontre parceiros de execução para seus projetos.",
  },
  {
    Icon: Users,
    title: "Rodadas de Negócios & Networking",
    description:
      "Encontros exclusivos e rodadas estratégicas para discutir benchmarks de mercado, ofertas validadas e novas oportunidades.",
  },
  {
    Icon: ShieldCheck,
    title: "Selo de Membro Verificado",
    description:
      "Ganhe visibilidade e credibilidade com perfil corporativo verificado e histórico comprovado dentro da plataforma.",
  },
];

export function BusinessNetworkComingSoon() {
  return (
    <div className="mx-auto w-full max-w-6xl py-4 sm:py-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-sidebar px-6 py-12 text-sidebar-foreground shadow-xl sm:px-10 sm:py-16 lg:px-16">
        <div className="absolute -right-24 -top-28 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 size-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl border border-sidebar-border bg-sidebar-accent shadow-lg">
            <Network className="size-8 text-gold" />
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            <Sparkles className="size-3.5" />
            Em breve
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            Business Network
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-sidebar-foreground/65 sm:text-base sm:leading-7">
            O ecossistema exclusivo de conexões corporativas e novos negócios. Um ambiente seguro
            para agências, consultorias e empresas gerarem sinergia, indicações e parcerias de alto impacto.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/70 px-4 py-3 text-sm text-sidebar-foreground/70">
            <LockKeyhole className="size-4 text-gold" />
            Rede corporativa exclusiva em preparação
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {networkTracks.map(({ Icon, title, description }) => (
          <article
            key={title}
            className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{title}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Em breve
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
