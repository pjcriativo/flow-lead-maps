import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  Compass,
  Crown,
  DollarSign,
  Layers,
  MapPin,
  MessageSquare,
  Radio,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MontarEquipeModalProps {
  aberto: boolean;
  onFechar: () => void;
  onConcluir?: () => void;
}

export function MontarEquipeModal({ aberto, onFechar, onConcluir }: MontarEquipeModalProps) {
  const [etapa, setEtapa] = useState<number>(1);
  const [form, setForm] = useState({
    tipoNegocio: "B2B Serviços",
    produtos: "Consultoria e Soluções Empresariais",
    publicoAlvo: "Donos, Diretores e Gestores de PMEs",
    nichosRegioes: "Clínicas, Escritórios e Imobiliárias em SP e PR",
    ticketMedio: "R$ 3.500 / mês",
    metaFaturamento: "R$ 50.000 / mês",
    orcamentoDisponivel: "R$ 1.500 / mês em automações",
    canaisComerciais: ["WhatsApp", "Google Maps", "LinkedIn"],
    equipeHumana: "1 Closer humano (você) + 1 assistente",
    nivelAutonomia: "Copiloto com aprovação humana",
  });

  if (!aberto) return null;

  const toggleCanal = (canal: string) => {
    setForm((prev) => ({
      ...prev,
      canaisComerciais: prev.canaisComerciais.includes(canal)
        ? prev.canaisComerciais.filter((c) => c !== canal)
        : [...prev.canaisComerciais, canal],
    }));
  };

  const proximo = () => {
    if (etapa < 11) setEtapa((e) => e + 1);
  };

  const anterior = () => {
    if (etapa > 1) setEtapa((e) => e - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onFechar}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-orange-500/30 bg-[#0c1017] text-neutral-100 shadow-2xl shadow-orange-950/30">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#1b2232] bg-[#121620] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/20 text-[#f95d14]">
              <Crown className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Montar Equipe Comercial com CEO de IA
                </h3>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                  Em breve · funcionalidade futura
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                O CEO analisa sua operação e desenha a estrutura autônoma sob medida.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-amber-500/20 bg-amber-500/5 px-6 py-2 text-[11px] text-amber-200">
          Montagem completa da equipe (departamentos, enxames, metas e delegação) ainda não é operacional. Esta é uma
          prévia do planejamento: nada é criado nem ativado. Hoje somente o CEO de IA é configurado e ativado, pela
          tela Equipe &amp; Enxames.
        </div>

        {/* Stepper Progress bar (1 to 10 + 11 Result) */}
        <div className="border-b border-[#1b2232] bg-[#0d121c] px-6 py-3">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-400">
            <span>
              {etapa <= 10 ? `Etapa ${etapa} de 10: Diagnóstico Comercial` : "Estrutura Sugerida pelo CEO"}
            </span>
            <span className="text-[#f95d14]">
              {etapa <= 10 ? `${Math.round((etapa / 10) * 100)}% concluído` : "Pronto para Operar"}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-600 to-[#f95d14] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((etapa / 10) * 100))}%` }}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          {etapa === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Building2 className="size-4" />
                <span>Passo 1: Tipo de negócio</span>
              </div>
              <h4 className="text-lg font-bold text-white">Qual é o modelo principal do seu negócio?</h4>
              <p className="text-xs text-neutral-400">
                O CEO ajustará as abordagens conforme as dinâmicas de vendas da sua categoria.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { id: "B2B Serviços", desc: "Consultoria, agências, tecnologia, contabilidade e advocacia" },
                  { id: "Clínicas & Saúde", desc: "Odontologia, estética, medicina, fisioterapia e bem-estar" },
                  { id: "Comércio Local & Franquias", desc: "Varejo, academias, escolas e prestadores de serviços" },
                  { id: "Imobiliárias & Construção", desc: "Corretores, incorporadoras e engenharia civil" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setForm({ ...form, tipoNegocio: item.id })}
                    className={cn(
                      "flex flex-col rounded-xl border p-4 text-left transition-all",
                      form.tipoNegocio === item.id
                        ? "border-[#f95d14] bg-[#f95d14]/10 text-white ring-1 ring-[#f95d14]"
                        : "border-[#1b2232] bg-[#111723] text-neutral-300 hover:border-white/20",
                    )}
                  >
                    <span className="text-sm font-bold">{item.id}</span>
                    <span className="mt-1 text-xs text-neutral-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {etapa === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Briefcase className="size-4" />
                <span>Passo 2: Produtos ou serviços vendidos</span>
              </div>
              <h4 className="text-lg font-bold text-white">O que sua empresa comercializa?</h4>
              <p className="text-xs text-neutral-400">
                Descreva sucintamente sua oferta principal para alimentar a base de conhecimento dos agentes.
              </p>
              <textarea
                value={form.produtos}
                onChange={(e) => setForm({ ...form, produtos: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-[#1b2232] bg-[#111723] p-3 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                placeholder="Ex: Planos de consultoria de vendas, captação de clientes e automações..."
              />
            </div>
          )}

          {etapa === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Users className="size-4" />
                <span>Passo 3: Público-alvo e Decisores</span>
              </div>
              <h4 className="text-lg font-bold text-white">Quem é o tomador de decisão que compra de você?</h4>
              <p className="text-xs text-neutral-400">
                O SDR e o Prospecção focarão nestes cargos para encontrar números diretos e WhatsApps.
              </p>
              <input
                type="text"
                value={form.publicoAlvo}
                onChange={(e) => setForm({ ...form, publicoAlvo: e.target.value })}
                className="w-full rounded-xl border border-[#1b2232] bg-[#111723] p-3 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                placeholder="Ex: Sócios, Diretores Comerciais, Gerentes de RH..."
              />
            </div>
          )}

          {etapa === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <MapPin className="size-4" />
                <span>Passo 4: Nichos e Regiões de Prospecção</span>
              </div>
              <h4 className="text-lg font-bold text-white">Onde os agentes devem prospectar inicialmente?</h4>
              <p className="text-xs text-neutral-400">
                Segmentos prioritários e localização geográfica para mineração no Google Maps e redes.
              </p>
              <input
                type="text"
                value={form.nichosRegioes}
                onChange={(e) => setForm({ ...form, nichosRegioes: e.target.value })}
                className="w-full rounded-xl border border-[#1b2232] bg-[#111723] p-3 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                placeholder="Ex: Clínicas odontológicas em Curitiba e Maringá - PR"
              />
            </div>
          )}

          {etapa === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <DollarSign className="size-4" />
                <span>Passo 5: Ticket Médio da Venda</span>
              </div>
              <h4 className="text-lg font-bold text-white">Qual é o valor médio de cada novo cliente?</h4>
              <p className="text-xs text-neutral-400">
                Ajuda o CEO a calibrar o tempo de negociação e o nível de personalização do discurso.
              </p>
              <input
                type="text"
                value={form.ticketMedio}
                onChange={(e) => setForm({ ...form, ticketMedio: e.target.value })}
                className="w-full rounded-xl border border-[#1b2232] bg-[#111723] p-3 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                placeholder="Ex: R$ 2.500 pontual ou R$ 1.200/mês"
              />
            </div>
          )}

          {etapa === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Target className="size-4" />
                <span>Passo 6: Meta de Faturamento Mensal</span>
              </div>
              <h4 className="text-lg font-bold text-white">Quanto você deseja gerar em novos contratos?</h4>
              <p className="text-xs text-neutral-400">
                O CEO distribuirá essa meta em leads, qualificações e reuniões para os agentes.
              </p>
              <input
                type="text"
                value={form.metaFaturamento}
                onChange={(e) => setForm({ ...form, metaFaturamento: e.target.value })}
                className="w-full rounded-xl border border-[#1b2232] bg-[#111723] p-3 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                placeholder="Ex: R$ 30.000 / mês"
              />
            </div>
          )}

          {etapa === 7 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Coins className="size-4" />
                <span>Passo 7: Orçamento Operacional Disponível</span>
              </div>
              <h4 className="text-lg font-bold text-white">Qual é o limite mensal estimado para ferramentas e envios?</h4>
              <p className="text-xs text-neutral-400">
                O CEO dimensiona o volume de chips, disparos e requisições para nunca estourar seu teto.
              </p>
              <input
                type="text"
                value={form.orcamentoDisponivel}
                onChange={(e) => setForm({ ...form, orcamentoDisponivel: e.target.value })}
                className="w-full rounded-xl border border-[#1b2232] bg-[#111723] p-3 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                placeholder="Ex: R$ 1.000 / mês"
              />
            </div>
          )}

          {etapa === 8 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <MessageSquare className="size-4" />
                <span>Passo 8: Canais Comerciais Prioritários</span>
              </div>
              <h4 className="text-lg font-bold text-white">Onde sua operação prefere atuar?</h4>
              <p className="text-xs text-neutral-400">
                Selecione todos os canais que você quer que os agentes monitorem e executem.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {["WhatsApp", "Google Maps", "LinkedIn", "E-mail Corporativo", "Instagram", "Telefone / Voz"].map((c) => {
                  const ativo = form.canaisComerciais.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCanal(c)}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3 text-xs font-bold transition-all",
                        ativo
                          ? "border-[#f95d14] bg-[#f95d14]/10 text-white"
                          : "border-[#1b2232] bg-[#111723] text-neutral-400 hover:border-white/20",
                      )}
                    >
                      <span>{c}</span>
                      {ativo && <Check className="size-4 text-[#f95d14]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {etapa === 9 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Users className="size-4" />
                <span>Passo 9: Equipe Humana Disponível</span>
              </div>
              <h4 className="text-lg font-bold text-white">Quem da sua equipe conduzirá o fechamento final?</h4>
              <p className="text-xs text-neutral-400">
                Os agentes entregam a reunião pronta ou a proposta preparada para validação humana.
              </p>
              <input
                type="text"
                value={form.equipeHumana}
                onChange={(e) => setForm({ ...form, equipeHumana: e.target.value })}
                className="w-full rounded-xl border border-[#1b2232] bg-[#111723] p-3 text-xs text-white focus:border-[#f95d14] focus:outline-none"
                placeholder="Ex: Apenas eu (Dono) / Tenho 1 vendedor interno..."
              />
            </div>
          )}

          {etapa === 10 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <ShieldCheck className="size-4" />
                <span>Passo 10: Nível de Autonomia Desejado</span>
              </div>
              <h4 className="text-lg font-bold text-white">Como você quer supervisionar as ações dos agentes?</h4>
              <p className="text-xs text-neutral-400">
                O modelo padrão do Flow Business é o Copiloto: o agente prepara e você aprova em 1 clique.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  {
                    id: "Copiloto com aprovação humana",
                    titulo: "Copiloto Rigoroso (Recomendado)",
                    desc: "Listas, mensagens e propostas ficam em rascunho aguardando seu clique de aprovação.",
                  },
                  {
                    id: "Autônomo Supervisionado",
                    titulo: "Autônomo Supervisionado",
                    desc: "Agentes buscam e iniciam contato sozinhos. Apenas propostas financeiras exigem aprovação.",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setForm({ ...form, nivelAutonomia: item.id })}
                    className={cn(
                      "flex w-full flex-col rounded-xl border p-4 text-left transition-all",
                      form.nivelAutonomia === item.id
                        ? "border-[#f95d14] bg-[#f95d14]/10 text-white ring-1 ring-[#f95d14]"
                        : "border-[#1b2232] bg-[#111723] text-neutral-300 hover:border-white/20",
                    )}
                  >
                    <span className="text-sm font-bold">{item.titulo}</span>
                    <span className="mt-1 text-xs text-neutral-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Etapa 11: ESTRUTURA SUGERIDA PELO CEO */}
          {etapa === 11 && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400">
                      Plano Comercial Desenhado com Sucesso pelo CEO de IA
                    </h4>
                    <p className="text-xs text-neutral-300">
                      Operação estruturada para atingir {form.metaFaturamento} com foco em {form.nichosRegioes}.
                    </p>
                  </div>
                </div>
              </div>

              {/* Organograma Estruturado */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Organograma e Agentes Alocados
                </h5>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      dept: "Direção & Estratégia",
                      agente: "CEO de IA + Estrategista",
                      missao: "Coordenação geral e calibragem de nichos em tempo real",
                    },
                    {
                      dept: "Prospecção & Pré-vendas",
                      agente: "Prospecção + SDR",
                      missao: "Mineração no Google Maps e qualificação consultiva no WhatsApp",
                    },
                    {
                      dept: "Vendas & Auditoria",
                      agente: "Vendedor + Gerente Comercial",
                      missao: "Elaboração de propostas e auditoria de SLAs do funil",
                    },
                  ].map((org) => (
                    <div
                      key={org.dept}
                      className="rounded-xl border border-[#1b2232] bg-[#111723] p-3.5"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">
                        {org.dept}
                      </span>
                      <p className="mt-1 text-xs font-bold text-white">{org.agente}</p>
                      <p className="mt-1 text-[11px] text-neutral-400">{org.missao}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimativa de Custos e Metas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#111723] p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Estimativa Operacional
                  </span>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Ferramentas & Integrações:</span>
                      <span className="font-semibold text-white">Google Maps + WhatsApp + CRM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Custo estimado em APIs:</span>
                      <span className="font-semibold text-emerald-400">~R$ 280 / mês (dentro do teto)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Nível de Aprovação:</span>
                      <span className="font-semibold text-orange-400">Copiloto (100% Supervisionado)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#111723] p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Metas Semanais dos Agentes
                  </span>
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Leads minerados / sem:</span>
                      <span className="font-semibold text-white">1.250 leads</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Reuniões geradas / sem:</span>
                      <span className="font-semibold text-white">12 a 15 reuniões</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Propostas estimadas:</span>
                      <span className="font-semibold text-white">8 a 10 propostas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-[#1b2232] bg-[#121620] px-6 py-4">
          {etapa > 1 && etapa <= 10 ? (
            <button
              type="button"
              onClick={anterior}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="size-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <div />
          )}

          {etapa < 10 && (
            <button
              type="button"
              onClick={proximo}
              className="flex items-center gap-1.5 rounded-xl bg-[#f95d14] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#ff6c26]"
            >
              <span>Avançar</span>
              <ArrowRight className="size-4" />
            </button>
          )}

          {etapa === 10 && (
            <button
              type="button"
              onClick={() => setEtapa(11)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-[#f95d14] px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-orange-500/25 transition-all hover:opacity-90"
            >
              <Sparkles className="size-4" />
              <span>Gerar Estrutura com CEO</span>
            </button>
          )}

          {etapa === 11 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-white/10"
              >
                Reconfigurar
              </button>
              <button
                type="button"
                onClick={() => {
                  onFechar();
                  if (onConcluir) onConcluir();
                }}
                className="flex items-center gap-2 rounded-xl bg-[#f95d14] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-[#ff6c26]"
              >
                <Check className="size-4" />
                <span>Concluir prévia (nada é ativado)</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
