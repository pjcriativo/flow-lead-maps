// Tela PAGAMENTOS — estado HONESTO, não construído agora (dívida registrada em
// docs/DIVIDAS.md item 2). Regra 1 do projeto: sem gasto/API nova sem necessidade real —
// integrar um gateway de cobrança é uma decisão do dono, não algo pra inventar aqui.
import { Wallet, CheckCircle2, Circle } from "lucide-react";

function Item({ feito, texto }: { feito: boolean; texto: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {feito ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
      )}
      <span className={feito ? "" : "text-muted-foreground"}>{texto}</span>
    </li>
  );
}

export function AdminPagamentos() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 font-serif text-xl">
          <Wallet className="h-5 w-5 text-gold" /> Pagamentos
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta tela chega junto com a integração de cobrança — ainda não construída de propósito
          (gateway a definir pelo dono). Nada aqui é decorativo: o que já existe está listado
          abaixo, e o que falta também.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h3 className="mb-3 font-serif text-lg">O que já existe (funciona hoje)</h3>
        <ul className="space-y-2">
          <Item
            feito
            texto='Catálogo de planos (tela "Planos") — nome, preço, período, limites por recurso.'
          />
          <Item feito texto="Cada org aponta para um plano (orgs.plano_id)." />
          <Item feito texto="Medição real de consumo por org e por mês (consumo_org)." />
          <Item
            feito
            texto="Bloqueio automático ao bater o limite do plano (consumir_ou_bloquear) — já em produção em leads, sites, mensagens e campanhas."
          />
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h3 className="mb-3 font-serif text-lg">O que falta (dívida registrada)</h3>
        <ul className="space-y-2">
          <Item
            feito={false}
            texto="Escolha do gateway de cobrança (Stripe / Mercado Pago) — decisão do dono."
          />
          <Item
            feito={false}
            texto="Cobrança recorrente de verdade (assinaturas, ciclo, webhook do gateway)."
          />
          <Item
            feito={false}
            texto="Troca de plano pela própria UI (hoje só muda por SQL/serviço)."
          />
          <Item
            feito={false}
            texto="Política de inadimplência: bloquear acesso até regularizar (já decidida pelo dono) — falta o refinamento de bloquear AÇÕES mas manter os DADOS visíveis (menos atrito de cobrança + exigência de LGPD de acesso aos próprios dados)."
          />
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Detalhes técnicos e o plano de implementação: docs/DIVIDAS.md, item 0.
        </p>
      </div>
    </div>
  );
}
