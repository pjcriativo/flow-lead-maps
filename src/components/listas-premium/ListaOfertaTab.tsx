// Aba Oferta da Lista Selecionada
import { useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createEmptyOffer,
  type LeadListWithFullStats,
  type OfferConfig,
} from "./listas-premium-data";

interface ListaOfertaTabProps {
  lista: LeadListWithFullStats;
}

export function ListaOfertaTab({ lista }: ListaOfertaTabProps) {
  const [offer, setOffer] = useState<OfferConfig>(() => createEmptyOffer());

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info(
      "Estrutura de oferta atualizada localmente para a sessão. Persistência de ofertas no banco depende de migration futura.",
    );
  };

  return (
    <div className="space-y-4">
      {/* Alerta Informativo Transparente (Regra Etapa 11 — Sem Mocks de Persistência) */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
        <ShieldAlert className="size-5 shrink-0 text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">Associação de Ofertas Comerciais</p>
          <p className="text-amber-200/90 leading-relaxed">
            Rascunho temporário para {lista.name}. Nenhum campo abaixo veio do banco e nenhuma
            alteração será persistida. A persistência de ofertas dedicadas por organização depende
            de migration futura.
          </p>
        </div>
      </div>

      {/* Formulário / Cards de Configuração da Oferta */}
      <form onSubmit={handleSaveDraft} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Card: Produto e Nome */}
          <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Produto ou Serviço
              </label>
              <input
                type="text"
                value={offer.produto_servico}
                placeholder="Informe o produto ou serviço"
                onChange={(e) => setOffer({ ...offer, produto_servico: e.target.value })}
                className="h-9 w-full rounded-xl border border-home-border bg-home-surface-strong px-3 text-xs text-white outline-none focus:border-amber-500/80"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Nome da Oferta Comercial
              </label>
              <input
                type="text"
                value={offer.nome_oferta}
                placeholder="Informe o nome da oferta"
                onChange={(e) => setOffer({ ...offer, nome_oferta: e.target.value })}
                className="h-9 w-full rounded-xl border border-home-border bg-home-surface-strong px-3 text-xs text-white outline-none focus:border-amber-500/80"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Público-Alvo</label>
              <input
                type="text"
                value={offer.publico_alvo}
                placeholder="Descreva o público-alvo"
                onChange={(e) => setOffer({ ...offer, publico_alvo: e.target.value })}
                className="h-9 w-full rounded-xl border border-home-border bg-home-surface-strong px-3 text-xs text-white outline-none focus:border-amber-500/80"
              />
            </div>
          </div>

          {/* Card: Proposta de Valor e Preço */}
          <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Proposta de Valor Principal
              </label>
              <input
                type="text"
                value={offer.proposta_valor}
                placeholder="Descreva a proposta de valor"
                onChange={(e) => setOffer({ ...offer, proposta_valor: e.target.value })}
                className="h-9 w-full rounded-xl border border-home-border bg-home-surface-strong px-3 text-xs text-white outline-none focus:border-amber-500/80"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Preço / Condição
                </label>
                <input
                  type="text"
                  value={offer.preco || ""}
                  onChange={(e) => setOffer({ ...offer, preco: e.target.value })}
                  placeholder="Ex: R$ 2.500 ou Sob consulta"
                  className="h-9 w-full rounded-xl border border-home-border bg-home-surface-strong px-3 text-xs text-white outline-none focus:border-amber-500/80"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Objetivo Comercial
                </label>
                <input
                  type="text"
                  value={offer.objetivo}
                  placeholder="Informe o objetivo"
                  onChange={(e) => setOffer({ ...offer, objetivo: e.target.value })}
                  className="h-9 w-full rounded-xl border border-home-border bg-home-surface-strong px-3 text-xs text-white outline-none focus:border-amber-500/80"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Diferenciais e Benefícios Chave
              </label>
              <input
                type="text"
                value={offer.beneficios}
                placeholder="Liste benefícios comprováveis"
                onChange={(e) => setOffer({ ...offer, beneficios: e.target.value })}
                className="h-9 w-full rounded-xl border border-home-border bg-home-surface-strong px-3 text-xs text-white outline-none focus:border-amber-500/80"
              />
            </div>
          </div>
        </div>

        {/* Descrição Detalhada */}
        <div className="rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
          <label className="block text-xs font-semibold text-white mb-1">
            Descrição Completa da Oferta
          </label>
          <textarea
            rows={3}
            value={offer.descricao}
            placeholder="Descreva a oferta"
            onChange={(e) => setOffer({ ...offer, descricao: e.target.value })}
            className="w-full rounded-xl border border-home-border bg-home-surface-strong p-3 text-xs text-white outline-none focus:border-amber-500/80"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            className="h-9 gap-1.5 bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
          >
            <CheckCircle2 className="size-4" />
            Atualizar rascunho temporário
          </Button>
        </div>
      </form>
    </div>
  );
}
