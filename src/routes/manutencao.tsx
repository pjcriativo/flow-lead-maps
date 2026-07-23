import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";

// Página exibida quando o modo manutenção está ATIVO (admin → Configurações → Painel de
// controle) e o visitante não é super_admin. O guard fica em _authenticated/route.tsx.
export const Route = createFileRoute("/manutencao")({
  head: () => ({
    meta: [{ title: "Manutenção — Flow Leads" }],
  }),
  component: ManutencaoPage,
});

function ManutencaoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <FlowLeadsLogo className="h-10 w-auto" />
        </div>
        <Wrench className="mx-auto mb-4 h-10 w-10 text-gold" />
        <h1 className="text-xl font-semibold tracking-tight">Em manutenção</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos fazendo um ajuste rápido na plataforma. Volte em alguns minutos.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
