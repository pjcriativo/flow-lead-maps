import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Crown,
  HelpCircle,
  Save,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import {
  lerPerfilCompleto,
  atualizarPerfilUsuario,
  uploadAvatarUsuario,
  salvarReplyTo,
  emailValido,
  type PerfilUsuarioCompleto,
} from "@/services/perfil";

export function UserProfileSection() {
  const [perfil, setPerfil] = useState<PerfilUsuarioCompleto | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Estados dos formulários
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Estados de Senha
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  // Estados de Salvando
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [salvandoReply, setSalvandoReply] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const p = await lerPerfilCompleto();
      setPerfil(p);
      setNome(p.full_name);
      setTelefone(p.phone);
      setAvatarUrl(p.avatar_url);
      setReplyTo(p.reply_to_email);
    } catch (err) {
      toast.error("Erro ao carregar dados do perfil.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Handler para Upload de Foto
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    try {
      setUploadingFoto(true);
      const novaUrl = await uploadAvatarUsuario(file);
      setAvatarUrl(novaUrl);
      toast.success("Foto de perfil atualizada com sucesso!");
    } catch (err) {
      toast.error("Falha ao enviar a foto de perfil.");
      console.error(err);
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoverFoto = async () => {
    try {
      setUploadingFoto(true);
      await atualizarPerfilUsuario({ avatar_url: null });
      setAvatarUrl("");
      toast.success("Foto de perfil removida.");
    } catch (err) {
      toast.error("Falha ao remover a foto.");
      console.error(err);
    } finally {
      setUploadingFoto(false);
    }
  };

  // Handler para Salvar Nome e Telefone
  const handleSalvarPerfil = async () => {
    try {
      setSalvandoPerfil(true);
      await atualizarPerfilUsuario({
        full_name: nome.trim(),
        phone: telefone.trim(),
      });
      toast.success("Dados do perfil salvos com sucesso!");
    } catch (err) {
      toast.error("Falha ao salvar dados do perfil.");
      console.error(err);
    } finally {
      setSalvandoPerfil(false);
    }
  };

  // Handler para Salvar Reply-To
  const handleSalvarReplyTo = async () => {
    if (!replyTo.trim() || !emailValido(replyTo)) {
      toast.error("Digite um e-mail de resposta válido.");
      return;
    }
    try {
      setSalvandoReply(true);
      await salvarReplyTo(replyTo);
      toast.success("E-mail para respostas salvo com sucesso!");
    } catch (err) {
      toast.error("Falha ao salvar e-mail de resposta.");
      console.error(err);
    } finally {
      setSalvandoReply(false);
    }
  };

  // Handler para Mudar Senha
  const handleMudarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenha) {
      toast.error("Digite a nova senha.");
      return;
    }
    if (novaSenha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setAlterandoSenha(true);
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao alterar a senha.");
    } finally {
      setAlterandoSenha(false);
    }
  };

  // Iniciais para o Fallback do Avatar
  const iniciais = (nome || perfil?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  if (carregando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const replyInvalido = !!replyTo.trim() && !emailValido(replyTo);
  const percentualLeads = perfil
    ? Math.min(100, Math.round((perfil.leads_used_monthly / Math.max(1, perfil.monthly_lead_limit)) * 100))
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Cabeçalho da Página */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu Perfil & Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seus dados pessoais, foto de perfil, senha de acesso e detalhes do seu plano.
        </p>
      </div>

      {/* CARD DO PLANO & STATUS DO USUÁRIO */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Crown className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">
                  Plano {perfil?.plan ?? "Starter"}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {perfil?.acesso_liberado ? "Acesso Liberado" : "Pendente"}
                </span>
                {perfil?.is_super_admin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-500/30">
                    <ShieldCheck className="h-3.5 w-3.5" /> Super Admin
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Status da Assinatura: <b className="capitalize text-foreground">{perfil?.plan_status ?? "Ativo"}</b>
              </p>
            </div>
          </div>

          <div className="min-w-[200px] flex-1 max-w-xs space-y-1.5 rounded-xl border border-border/80 bg-background/80 p-3 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">Leads neste mês</span>
              <span className="font-semibold text-foreground">
                {perfil?.leads_used_monthly} / {perfil?.monthly_lead_limit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${percentualLeads}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-right">{percentualLeads}% utilizado</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* COLUNA DA ESQUERDA: FOTO DE PERFIL & RESUMO */}
        <div className="md:col-span-1 space-y-6">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-xs">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                <AvatarImage src={avatarUrl} alt={nome || "Foto de Perfil"} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {iniciais}
                </AvatarFallback>
              </Avatar>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                title="Alterar foto"
              >
                {uploadingFoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <h3 className="mt-4 font-semibold text-foreground text-base">
              {nome || "Seu Nome"}
            </h3>
            <p className="text-xs text-muted-foreground">{perfil?.email}</p>

            <div className="mt-4 flex flex-col gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="w-full gap-2 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadingFoto ? "Enviando..." : "Carregar Foto"}
              </Button>

              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoverFoto}
                  disabled={uploadingFoto}
                  className="w-full gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover Foto
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DA DIREITA: FORMULÁRIOS & CONFIGURAÇÕES */}
        <div className="md:col-span-2 space-y-6">
          {/* DADOS PESSOAIS */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <User className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground text-base">Informações Pessoais</h2>
            </div>

            {/* AVISO DO E-MAIL (E-MAIL BLOQUEADO) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="user-email" className="text-xs font-semibold text-muted-foreground uppercase">
                  E-mail de Acesso (Login)
                </Label>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="h-3 w-3" /> Alteração restrita
                </span>
              </div>
              <div className="relative">
                <Input
                  id="user-email"
                  type="email"
                  value={perfil?.email ?? ""}
                  disabled
                  readOnly
                  className="bg-secondary/50 font-medium text-foreground cursor-not-allowed pr-10"
                />
                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>

              {/* Banner Explicativo sobre o E-mail */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-950 space-y-2">
                <div className="flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Por que não posso alterar meu e-mail aqui?</p>
                    <p className="mt-0.5 text-blue-800 leading-relaxed">
                      O e-mail é o identificador único da sua conta. Para garantir a segurança dos dados da sua empresa, alterações de e-mail devem ser solicitadas e validadas através da nossa equipe de suporte.
                    </p>
                  </div>
                </div>
                <div className="pt-1 flex justify-end">
                  <a
                    href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20solicitar%20a%20altera%C3%A7%C3%A3o%20de%20e-mail%20da%20minha%20conta."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Falar com o suporte
                  </a>
                </div>
              </div>
            </div>

            {/* NOME COMPLETO */}
            <div className="space-y-1.5">
              <Label htmlFor="user-name" className="text-xs font-semibold text-muted-foreground uppercase">
                Seu Nome Completo (Assina E-mails & Propostas)
              </Label>
              <Input
                id="user-name"
                placeholder="Ex.: Marcos Pereira"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Nome pessoal que assina o final das propostas comerciais e e-mails de disparo.
              </p>
            </div>

            {/* NÚMERO DE TELEFONE */}
            <div className="space-y-1.5">
              <Label htmlFor="user-phone" className="text-xs font-semibold text-muted-foreground uppercase">
                Número de Telefone / WhatsApp
              </Label>
              <div className="relative">
                <Input
                  id="user-phone"
                  placeholder="Ex.: (11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
                <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={handleSalvarPerfil}
                disabled={salvandoPerfil}
                className="gap-2 font-medium"
              >
                {salvandoPerfil ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar Informações
              </Button>
            </div>
          </div>

          {/* ALTERAÇÃO DE SENHA */}
          <form onSubmit={handleMudarSenha} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground text-base">Segurança & Alteração de Senha</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nova-senha" className="text-xs font-semibold text-muted-foreground uppercase">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="nova-senha"
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmar-senha" className="text-xs font-semibold text-muted-foreground uppercase">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmar-senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Repita a nova senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={alterandoSenha || !novaSenha.trim()}
                variant="outline"
                className="gap-2 font-medium"
              >
                {alterandoSenha ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Atualizar Senha
              </Button>
            </div>
          </form>

          {/* E-MAIL PARA RESPOSTAS DOS LEADS */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground text-base">E-mail para Respostas (Reply-To)</h2>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reply-to-email" className="text-xs font-semibold text-muted-foreground uppercase">
                E-mail para Respostas dos Leads
              </Label>
              <div className="flex gap-2">
                <Input
                  id="reply-to-email"
                  type="email"
                  placeholder="Ex.: voce@suaempresa.com.br"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  aria-invalid={replyInvalido}
                />
                <Button
                  onClick={handleSalvarReplyTo}
                  disabled={salvandoReply || !replyTo.trim() || replyInvalido}
                  className="gap-2 font-medium"
                >
                  {salvandoReply ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
              {replyInvalido && (
                <p className="text-xs text-destructive">Por favor, digite um e-mail válido.</p>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                As respostas enviadas pelos seus leads chegarão neste endereço de e-mail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
