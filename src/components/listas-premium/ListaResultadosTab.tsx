// Aba Resultados da Lista Selecionada
import { BarChart3, TrendingUp, Users, Phone, CheckCircle, Award } from "lucide-react";
import type { LeadListWithFullStats } from "./listas-premium-data";

interface ListaResultadosTabProps {
  lista: LeadListWithFullStats;
}

export function ListaResultadosTab({ lista }: ListaResultadosTabProps) {
  const total = lista.leads_atuais;
  const comContato = lista.com_contato_count;
  const taxaContato = lista.taxa_contato;
  const campanhas = lista.campanhas_count;

  return (
    <div className="space-y-4">
      {/* 4 Cards Principais de Resultados */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-home-muted">Total de Leads</span>
            <Users className="size-4 text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums">
            {total.toLocaleString("pt-BR")}
          </p>
          <p className="mt-1 text-[11px] text-home-muted">Capturados e qualificados</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-home-muted">Com Contato Válido</span>
            <Phone className="size-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums">
            {comContato.toLocaleString("pt-BR")}
          </p>
          <p className="mt-1 text-[11px] text-emerald-400 font-semibold">
            {taxaContato}% de aproveitamento
          </p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-home-muted">Campanhas Conectadas</span>
            <BarChart3 className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-white tabular-nums">
            {campanhas}
          </p>
          <p className="mt-1 text-[11px] text-home-muted">Disparos em andamento</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-home-muted">Cliente Ouro / Qualificados</span>
            <Award className="size-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400 tabular-nums">
            {lista.gold_count.toLocaleString("pt-BR")}
          </p>
          <p className="mt-1 text-[11px] text-home-muted">Maior probabilidade de conversão</p>
        </div>
      </div>

      {/* Funil Visual da Lista */}
      <div className="rounded-2xl border border-home-border bg-home-surface/90 p-5 backdrop-blur-md">
        <h4 className="text-xs sm:text-sm font-bold text-white mb-3">
          Funil Comercial de Conversão da Lista
        </h4>

        <div className="space-y-3">
          {/* Etapa 1 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-home-muted font-medium">1. Leads Coletados no Banco</span>
              <span className="text-white font-bold tabular-nums">{total} (100%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-home-surface-strong overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Etapa 2 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-home-muted font-medium">2. Contatos Validados (Telefone/Email/Whats)</span>
              <span className="text-white font-bold tabular-nums">
                {comContato} ({taxaContato}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-home-surface-strong overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, taxaContato))}%` }}
              />
            </div>
          </div>

          {/* Etapa 3 */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-home-muted font-medium">3. Ativação em Campanhas</span>
              <span className="text-white font-bold tabular-nums">
                {campanhas > 0 ? "Campanhas ativas" : "Aguardando ativação"}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-home-surface-strong overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: campanhas > 0 ? "75%" : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
