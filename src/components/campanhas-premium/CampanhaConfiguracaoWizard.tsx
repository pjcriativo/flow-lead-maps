import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { carregarListasEstudio, type SimpleListaItem } from "@/services/campaign-studio-service";
import { obterContextoOrgAtiva } from "@/services/templates-service";

export type ConfigStep =
  "destinatarios" | "remetente" | "conteudo" | "programacao" | "revisao" | "concluido";

const CONFIG_STEPS: ConfigStep[] = [
  "destinatarios",
  "remetente",
  "conteudo",
  "programacao",
  "revisao",
];

interface CampanhaConfiguracaoWizardProps {
  listaId: string;
  onClose: () => void;
  onConfigComplete: (config: {
    nomeCampanha: string;
    listaId: string;
    remetenteNome: string;
    remetenteEmail: string;
    assunto: string;
    preCabecalho: string;
    mensagem: string;
    variaveis: Record<string, string>;
    horarioEnvio: "rascunho" | "imediato" | "agendado";
    dataAgendamento?: string;
    fusoHorario: string;
  }) => void;
}

export function CampanhaConfiguracaoWizard({
  listaId,
  onClose,
  onConfigComplete,
}: CampanhaConfiguracaoWizardProps) {
  const [step, setStep] = useState<ConfigStep>("destinatarios");
  const [loading, setLoading] = useState(false);
  const [lista, setLista] = useState<SimpleListaItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [nomeCampanha, setNomeCampanha] = useState("");
  const [remetenteNome, setRemetenteNome] = useState("");
  const [remetenteEmail, setRemetenteEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [preCabecalho, setPreCabecalho] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [variaveis, setVariaveis] = useState<Record<string, string>>({});
  const [horarioEnvio, setHorarioEnvio] = useState<"rascunho" | "imediato" | "agendado">(
    "rascunho",
  );
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [fusoHorario, setFusoHorario] = useState("America/Sao_Paulo");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const context = await obterContextoOrgAtiva();
        const lists = await carregarListasEstudio(context.orgId);
        const selectedList = lists.find((item) => item.id === listaId);
        if (!selectedList) {
          throw new Error("Lista não encontrada ou sem acesso na organização ativa.");
        }
        if (!active) return;
        setLista(selectedList);
        setRemetenteNome(context.userName);
        setRemetenteEmail(context.userEmail);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Falha ao carregar lista");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [listaId]);

  const currentIndex = CONFIG_STEPS.indexOf(step);

  const handleBack = () => {
    if (currentIndex > 0) {
      setStep(CONFIG_STEPS[currentIndex - 1]);
    } else {
      onClose();
    }
  };

  const handleNext = async () => {
    // Basic validation per step
    if (step === "destinatarios" && !lista) {
      toast.error("Erro ao carregar dados da lista");
      return;
    }

    if (step === "remetente" && (!remetenteNome || !remetenteEmail)) {
      toast.error("Por favor, preencha nome e e-mail do remetente");
      return;
    }

    if (step === "conteudo" && (!assunto || !mensagem)) {
      toast.error("Por favor, preencha assunto e mensagem");
      return;
    }

    if (step === "programacao" && horarioEnvio === "agendado" && !dataAgendamento) {
      toast.error("Por favor, selecione uma data para o agendamento");
      return;
    }

    if (currentIndex < CONFIG_STEPS.length - 1) {
      setStep(CONFIG_STEPS[currentIndex + 1]);
    } else {
      // Final step - complete configuration
      try {
        setLoading(true);
        // Here we would normally save the campaign, but according to Prompt 49
        // we should not automatically create an active campaign
        // Instead, we just complete the configuration and let the user decide

        const config = {
          nomeCampanha: nomeCampanha || lista?.nome || "Nova Campanha",
          listaId,
          remetenteNome,
          remetenteEmail,
          assunto,
          preCabecalho,
          mensagem,
          variaveis,
          horarioEnvio,
          ...(dataAgendamento ? { dataAgendamento } : {}),
          fusoHorario,
        };

        onConfigComplete(config);
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao completar configuração");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-home-border bg-[#101720] p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-home-border/60 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-home-orange" />
            <h3 className="text-sm font-bold text-white">Configurar Campanha</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-home-muted hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="flex flex-col space-y-2 text-xs text-home-muted">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                step === "destinatarios" ? "bg-home-orange" : "bg-home-surface/60",
              )}
            />
            <span>Destinatários</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                step === "remetente" ? "bg-home-orange" : "bg-home-surface/60",
              )}
            />
            <span>Remetente</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                step === "conteudo" ? "bg-home-orange" : "bg-home-surface/60",
              )}
            />
            <span>Conteúdo</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                step === "programacao" ? "bg-home-orange" : "bg-home-surface/60",
              )}
            />
            <span>Programação</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                step === "revisao" ? "bg-home-orange" : "bg-home-surface/60",
              )}
            />
            <span>Revisão</span>
          </div>
        </div>

        {/* Step Content */}
        {step === "destinatarios" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Seus destinatários</h3>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="size-4 animate-spin text-home-orange" />
                Carregando lista...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
                {error}
              </div>
            ) : lista ? (
              <div className="space-y-3">
                <div className="border-home-border/60 bg-home-surface/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{lista.nome}</p>
                      <p className="text-xs text-home-muted">
                        {lista.nicho} {lista.cidade ? `· ${lista.cidade}` : ""}
                        {lista.uf ? `/${lista.uf}` : ""}
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-home-muted font-semibold">Leads</p>
                      <p className="text-2xl font-bold tabular-nums text-home-foreground">
                        {lista.totalLeads}
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-home-muted font-semibold">Com e-mail</p>
                      <p className="text-2xl font-bold tabular-nums text-home-foreground">
                        {lista.leadsComEmail}
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs text-home-muted font-semibold">Contatos habilitados</p>
                      <p className="text-2xl font-bold tabular-nums text-home-foreground">
                        {lista.leadsQualificados}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="nome-campanha" className="text-xs font-semibold text-white">
                    Nome da Campanha (opcional)
                  </Label>
                  <Input
                    id="nome-campanha"
                    placeholder="ex.: Odonto Prime Reativação Outubro"
                    value={nomeCampanha}
                    onChange={(e) => setNomeCampanha(e.target.value)}
                    className="border-home-border bg-home-background text-xs text-home-foreground placeholder:text-home-muted focus:border-home-orange"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-home-muted">Nenhuma lista selecionada</p>
              </div>
            )}
          </div>
        )}

        {step === "remetente" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Remetente da campanha</h3>
            <div className="space-y-3">
              <Label htmlFor="remetente-nome" className="text-xs font-semibold text-white">
                Nome do remetente
              </Label>
              <Input
                id="remetente-nome"
                placeholder="Seu nome ou nome da empresa"
                value={remetenteNome}
                onChange={(e) => setRemetenteNome(e.target.value)}
                className="border-home-border bg-home-background text-xs text-home-foreground placeholder:text-home-muted focus:border-home-orange"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="remetente-email" className="text-xs font-semibold text-white">
                E-mail de envio
              </Label>
              <Input
                id="remetente-email"
                placeholder="seunome@empresa.com.br"
                value={remetenteEmail}
                onChange={(e) => setRemetenteEmail(e.target.value)}
                className="border-home-border bg-home-background text-xs text-home-foreground placeholder:text-home-muted focus:border-home-orange"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-white">Domínio de envio</Label>
              <p className="text-xs text-home-muted">
                A verificação do domínio será configurada em uma etapa posterior.
              </p>
            </div>
          </div>
        )}

        {step === "conteudo" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Conteúdo da mensagem</h3>
            <div className="space-y-3">
              <Label htmlFor="assunto" className="text-xs font-semibold text-white">
                Assunto do e-mail
              </Label>
              <Input
                id="assunto"
                placeholder="Ex: Oferta especial para você!"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="border-home-border bg-home-background text-xs text-home-foreground placeholder:text-home-muted focus:border-home-orange"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="pre-cabecalho" className="text-xs font-semibold text-white">
                Pré-cabeçalho (opcional)
              </Label>
              <Input
                id="pre-cabecalho"
                placeholder="Texto que aparece após o assunto na caixa de entrada"
                value={preCabecalho}
                onChange={(e) => setPreCabecalho(e.target.value)}
                className="border-home-border bg-home-background text-xs text-home-foreground placeholder:text-home-muted focus:border-home-orange"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="mensagem" className="text-xs font-semibold text-white">
                Mensagem principal
              </Label>
              <Textarea
                id="mensagem"
                placeholder="Escreva sua mensagem aqui... Você pode usar variáveis como {{nome}}, {{empresa}}, etc."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="border-home-border bg-home-background text-xs text-home-foreground placeholder:text-home-muted focus:border-home-orange h-24"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="variaveis" className="text-xs font-semibold text-white">
                Variáveis personalizadas (opcional)
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // In a full implementation, this would open a modal to manage variables
                      toast.info("Gerenciador de variáveis em breve");
                    }}
                  >
                    Gerenciar variáveis
                  </Button>
                </div>
                <div className="text-xs text-home-muted">
                  Variáveis atuais: {Object.keys(variaveis).length}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "programacao" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Programação do envio</h3>
            <div className="space-y-3">
              <Label htmlFor="horario-envio" className="text-xs font-semibold text-white">
                Quando enviar
              </Label>
              <Select
                value={horarioEnvio}
                onValueChange={(value) => {
                  if (value === "rascunho" || value === "imediato" || value === "agendado") {
                    setHorarioEnvio(value);
                  }
                }}
              >
                <SelectTrigger id="horario-envio">
                  <SelectValue placeholder="Selecione uma opção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Salvar como rascunho</SelectItem>
                  <SelectItem value="imediato">Envio imediato</SelectItem>
                  <SelectItem value="agendado">Agendar para futura data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {horarioEnvio === "agendado" && (
              <div className="space-y-3">
                <Label htmlFor="data-agendamento" className="text-xs font-semibold text-white">
                  Data e hora do agendamento
                </Label>
                <input
                  type="datetime-local"
                  id="data-agendamento"
                  value={dataAgendamento || ""}
                  onChange={(e) => setDataAgendamento(e.target.value)}
                  className="border-home-border bg-home-background text-xs text-home-foreground placeholder:text-home-muted focus:border-home-orange w-full"
                />
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="fuso-horario" className="text-xs font-semibold text-white">
                Fuso horário
              </Label>
              <Select value={fusoHorario} onValueChange={setFusoHorario}>
                <SelectTrigger id="fuso-horario">
                  <SelectValue placeholder="Selecione o fuso horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Horário de Brasília</SelectItem>
                  <SelectItem value="America/Rio_Branco">Horário do Acre</SelectItem>
                  <SelectItem value="America/Manaus">Horário do Amazonas</SelectItem>
                  <SelectItem value="America/Bahia">Horário da Bahia</SelectItem>
                  <SelectItem value="America/Fortaleza">Horário do Ceará</SelectItem>
                  <SelectItem value="America/Recife">Horário de Pernambuco</SelectItem>
                  <SelectItem value="America/Araguaina">Horário do Tocantins</SelectItem>
                  <SelectItem value="America/Argentina/Buenos_Aires">
                    Horário da Argentina
                  </SelectItem>
                  <SelectItem value="America/Santiago">Horário do Chile</SelectItem>
                  <SelectItem value="America/Bogota">Horário da Colômbia</SelectItem>
                  <SelectItem value="America/Lima">Horário do Peru</SelectItem>
                  <SelectItem value="America/Bogota">Horário da Colômbia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === "revisao" && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-white">Revisar configuração</h3>
            <div className="space-y-6">
              <div className="border-home-border/60 bg-home-surface/50 rounded-xl p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-home-muted">Nome da campanha:</span>
                    <span className="font-semibold text-white">
                      {nomeCampanha || "(não definido)"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-home-muted">Lista selecionada:</span>
                    <span className="font-semibold text-white">
                      {lista?.nome || "(não definida)"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-home-muted">Quantidade de destinatários:</span>
                    <span className="font-semibold text-white tabular-nums">
                      {lista?.totalLeads || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-home-border/60 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={currentIndex === 0 || loading}
            className="border-home-border bg-home-surface text-xs font-semibold text-white hover:bg-home-surface-strong"
          >
            Voltar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleNext}
            disabled={loading}
            className="bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
            {currentIndex === CONFIG_STEPS.length - 1 ? "Concluir configuração" : "Avançar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
