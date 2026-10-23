// Modal de Criação de Campanha Semanal
// Permite cadastrar novas iniciativas comerciais para a semana corrente.
import React, { useState } from "react";
import {
  Check,
  Globe,
  Mail,
  Megaphone,
  MessageSquare,
  Users,
  X,
} from "lucide-react";
import type { CampanhaSemanalItem } from "./planejamento-data";

interface NovaCampanhaSemanalModalProps {
  aberto: boolean;
  onFechar: () => void;
  onAdicionar: (campanha: CampanhaSemanalItem) => void;
}

export function NovaCampanhaSemanalModal({
  aberto,
  onFechar,
  onAdicionar,
}: NovaCampanhaSemanalModalProps) {
  const [nome, setNome] = useState("");
  const [canal, setCanal] = useState("WhatsApp");
  const [nicho, setNicho] = useState("");
  const [status, setStatus] = useState<"ativa" | "pausada">("ativa");

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !nicho.trim()) return;

    let Icon = MessageSquare;
    let corIcone = "text-emerald-400";
    let corBg = "bg-emerald-500/15 border-emerald-500/25";

    if (canal === "LinkedIn") {
      Icon = Users;
      corIcone = "text-purple-400";
      corBg = "bg-purple-500/15 border-purple-500/25";
    } else if (canal === "Google") {
      Icon = Globe;
      corIcone = "text-blue-400";
      corBg = "bg-blue-500/15 border-blue-500/25";
    } else if (canal === "E-mail") {
      Icon = Mail;
      corIcone = "text-orange-400";
      corBg = "bg-orange-500/15 border-orange-500/25";
    }

    onAdicionar({
      id: `camp-${Date.now()}`,
      nome: nome.trim(),
      canal,
      nicho: nicho.trim(),
      status,
      leads: 0,
      conversao: "0%",
      icon: Icon,
      corIcone,
      corBg,
    });

    setNome("");
    setNicho("");
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
            <Megaphone className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Nova Campanha Semanal</h3>
            <p className="text-xs text-neutral-400">
              Cadastre um canal de aquisição focado em nicho para a semana.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">
              Nome da Campanha *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Prospecção Ativa B2B"
              className="w-full rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Canal de Aquisição
              </label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="WhatsApp">WhatsApp Direto</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Google">Google Ads</option>
                <option value="E-mail">E-mail Marketing</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-white/10 bg-[#141824] px-3 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none"
              >
                <option value="ativa">Ativa</option>
                <option value="pausada">Pausada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1.5">
              Nicho / Segmento Alvo *
            </label>
            <input
              type="text"
              required
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              placeholder="Ex: Clínicas Médicas, Escritórios de Advocacia"
              className="w-full rounded-xl border border-white/10 bg-[#141824] px-3.5 py-2.5 text-xs text-white focus:border-orange-500/60 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nome.trim() || !nicho.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF5500] hover:bg-[#e04b00] px-4 py-2 font-bold text-white shadow-lg shadow-orange-600/20 transition-colors disabled:opacity-50"
            >
              <Check className="size-4" />
              <span>Adicionar Campanha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
