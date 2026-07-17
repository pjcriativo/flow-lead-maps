// Aba SCRIPTS — mensagens/mídias salvas para reuso (cara do S-zap/Kaptar): à esquerda "Novo
// Script" (nome + tipo Texto/Imagem/Vídeo/Arquivo + conteúdo), à direita a lista de salvos.
// Mídia sobe de verdade pro bucket público wa-media (upload real, nada de fingir).
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Zap,
  Loader2,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { listarScripts, criarScript, excluirScript, type WaScript } from "@/services/whatsapp";

type Tipo = "texto" | "imagem" | "video" | "arquivo";
const TIPOS: { key: Tipo; label: string; icon: React.ReactNode }[] = [
  { key: "texto", label: "Texto", icon: <FileText className="h-4 w-4" /> },
  { key: "imagem", label: "Imagem", icon: <ImageIcon className="h-4 w-4" /> },
  { key: "video", label: "Vídeo", icon: <Video className="h-4 w-4" /> },
  { key: "arquivo", label: "Arquivo", icon: <File className="h-4 w-4" /> },
];
const ICON: Record<string, React.ReactNode> = {
  texto: <FileText className="h-4 w-4" />,
  imagem: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  arquivo: <File className="h-4 w-4" />,
};

export function WaScripts() {
  const [scripts, setScripts] = useState<WaScript[]>([]);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<Tipo>("texto");
  const [mensagem, setMensagem] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [subindo, setSubindo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    try {
      setScripts(await listarScripts());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao listar");
    }
  }, []);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const subirArquivo = async (file: File) => {
    setSubindo(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const ext = file.name.split(".").pop() || "bin";
      const path = `${u.user?.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("wa-media").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("wa-media").getPublicUrl(path);
      setMediaUrl(data.publicUrl);
      toast.success("Arquivo enviado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setSubindo(false);
    }
  };

  const salvar = async () => {
    if (!nome.trim()) {
      toast.error("Dê um nome ao script.");
      return;
    }
    if (tipo === "texto" && !mensagem.trim()) {
      toast.error("Escreva a mensagem.");
      return;
    }
    if (tipo !== "texto" && !mediaUrl) {
      toast.error("Envie o arquivo de mídia.");
      return;
    }
    setSalvando(true);
    try {
      await criarScript({ nome, tipo, mensagem, media_url: mediaUrl || undefined });
      toast.success("Script salvo.");
      setNome("");
      setMensagem("");
      setMediaUrl("");
      setTipo("texto");
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    setScripts((s) => s.filter((x) => x.id !== id));
    try {
      await excluirScript(id);
    } catch {
      carregar();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-emerald-600" />
        <div>
          <div className="font-semibold">Scripts</div>
          <div className="text-sm text-muted-foreground">
            Salve mensagens e mídias para usar rapidamente
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Novo script */}
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="font-medium">Novo Script</div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">
              Nome do script
            </label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Saudação inicial"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setTipo(t.key);
                    setMediaUrl("");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm transition",
                    tipo === t.key
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "hover:bg-accent",
                  )}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {tipo === "texto" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase text-muted-foreground">
                Mensagem
              </label>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite o prompt / mensagem..."
                rows={5}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">
                Arquivo ({tipo})
              </label>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept={tipo === "imagem" ? "image/*" : tipo === "video" ? "video/*" : undefined}
                onChange={(e) => e.target.files?.[0] && subirArquivo(e.target.files[0])}
              />
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={subindo}
                className="w-full"
              >
                {subindo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {mediaUrl ? "Trocar arquivo" : "Enviar arquivo"}
              </Button>
              {mediaUrl && <p className="truncate text-xs text-emerald-700">Enviado: {mediaUrl}</p>}
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Legenda (opcional)"
                rows={2}
              />
            </div>
          )}

          <Button onClick={salvar} disabled={salvando} className="w-full">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Salvar script
          </Button>
        </div>

        {/* Salvos */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 font-medium">
            Scripts salvos <span className="text-muted-foreground">({scripts.length})</span>
          </div>
          {scripts.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-12 text-center text-sm text-muted-foreground">
              <Zap className="h-7 w-7 text-muted-foreground/40" />
              Nenhum script salvo ainda
            </div>
          ) : (
            <div className="space-y-2">
              {scripts.map((s) => (
                <div key={s.id} className="flex items-start gap-2 rounded-lg border p-2.5 text-sm">
                  <span className="mt-0.5 text-muted-foreground">{ICON[s.tipo] ?? ICON.texto}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{s.nome}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.mensagem || s.media_url || s.tipo}
                    </div>
                  </div>
                  <button
                    onClick={() => excluir(s.id)}
                    className="shrink-0 text-rose-600 hover:text-rose-700"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
