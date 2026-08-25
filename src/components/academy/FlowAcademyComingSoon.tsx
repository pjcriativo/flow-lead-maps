import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LockKeyhole,
  PlayCircle,
  Sparkles,
  Users,
} from "lucide-react";

const academyTracks = [
  {
    Icon: PlayCircle,
    title: "Aulas práticas",
    description:
      "Conteúdo direto ao ponto para transformar a plataforma em uma operação comercial.",
  },
  {
    Icon: BookOpen,
    title: "Playbooks privados",
    description: "Scripts, processos e estratégias aplicáveis a cada canal de prospecção.",
  },
  {
    Icon: CalendarDays,
    title: "Mentorias ao vivo",
    description: "Encontros para revisar campanhas, oferta, abordagem e execução.",
  },
  {
    Icon: Users,
    title: "Comunidade de execução",
    description: "Troca de aprendizados com quem também está construindo sua máquina de vendas.",
  },
];

export function FlowAcademyComingSoon() {
  return (
    <div className="mx-auto w-full max-w-6xl py-4 sm:py-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-sidebar px-6 py-12 text-sidebar-foreground shadow-xl sm:px-10 sm:py-16 lg:px-16">
        <div className="absolute -right-24 -top-28 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 size-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl border border-sidebar-border bg-sidebar-accent shadow-lg">
            <GraduationCap className="size-8 text-gold" />
          </div>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            <Sparkles className="size-3.5" />
            Em breve
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">Flow Academy</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-sidebar-foreground/65 sm:text-base sm:leading-7">
            Não queremos entregar apenas ferramentas. A Flow Academy será o ambiente privado para
            aprender a construir, operar e escalar uma prospecção que gera oportunidades reais.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/70 px-4 py-3 text-sm text-sidebar-foreground/70">
            <LockKeyhole className="size-4 text-gold" />
            Conteúdo exclusivo em preparação
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {academyTracks.map(({ Icon, title, description }) => (
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
