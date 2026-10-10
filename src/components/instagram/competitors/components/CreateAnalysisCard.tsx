import { useState } from "react";
import { ChartNoAxesColumnIncreasing, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateAnalysisCardProps {
  onStartAnalysis?: (params: {
    analysisType: string;
    profiles: string[];
    period: string;
    metrics: string[];
  }) => Promise<void> | void;
  loading?: boolean;
}

export function CreateAnalysisCard({ onStartAnalysis, loading = false }: CreateAnalysisCardProps) {
  const [analysisType, setAnalysisType] = useState("concorrentes");
  const [profilesInput, setProfilesInput] = useState("");
  const [period, setPeriod] = useState("30d");

  const [metrics, setMetrics] = useState({
    followersGrowth: true,
    engagementRate: true,
    contentTypes: true,
    peakHours: false,
    hashtagsKeywords: false,
  });

  const toggleMetric = (key: keyof typeof metrics) => {
    setMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleStart = async () => {
    const parsed = profilesInput
      .split(/[\s,;]+/)
      .map((p) => p.trim().replace(/^@/, ""))
      .filter(Boolean);

    const activeMetricsList = Object.entries(metrics)
      .filter(([, checked]) => checked)
      .map(([k]) => k);

    if (onStartAnalysis) {
      await onStartAnalysis({
        analysisType,
        profiles: parsed,
        period,
        metrics: activeMetricsList,
      });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header do Card */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
          <Search className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Criar análise</h3>
          <p className="text-[11px] text-slate-400">Configure o que você quer analisar</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {/* Tipo de Análise */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Tipo de análise</label>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs text-slate-800 shadow-xs">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concorrentes">Concorrentes</SelectItem>
              <SelectItem value="nicho">Nicho de mercado</SelectItem>
              <SelectItem value="audiencia">Audiência comparada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Perfis do Instagram */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Perfis do Instagram</label>
          <div className="relative">
            <Input
              value={profilesInput}
              onChange={(e) => setProfilesInput(e.target.value)}
              placeholder="Ex: @usuario1, @usuario2..."
              className="h-10 rounded-xl border-slate-200 bg-white text-xs text-slate-800 shadow-xs placeholder:text-slate-400"
            />
          </div>
          <p className="text-[10.5px] text-slate-400">Adicione até 5 perfis para comparar</p>
        </div>

        {/* Período de Análise */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Período de análise</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs text-slate-800 shadow-xs">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="15d">Últimos 15 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Métricas para Analisar */}
        <div className="space-y-2.5 pt-1">
          <label className="text-xs font-semibold text-slate-700">Métricas para analisar</label>

          <div className="space-y-2.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700">
              <Checkbox
                checked={metrics.followersGrowth}
                onCheckedChange={() => toggleMetric("followersGrowth")}
                className="size-4 rounded border-slate-300 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
              />
              <span>Crescimento de seguidores</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700">
              <Checkbox
                checked={metrics.engagementRate}
                onCheckedChange={() => toggleMetric("engagementRate")}
                className="size-4 rounded border-slate-300 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
              />
              <span>Taxa de engajamento</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700">
              <Checkbox
                checked={metrics.contentTypes}
                onCheckedChange={() => toggleMetric("contentTypes")}
                className="size-4 rounded border-slate-300 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
              />
              <span>Tipos de conteúdo</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700">
              <Checkbox
                checked={metrics.peakHours}
                onCheckedChange={() => toggleMetric("peakHours")}
                className="size-4 rounded border-slate-300 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
              />
              <span>Horários de maior alcance</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700">
              <Checkbox
                checked={metrics.hashtagsKeywords}
                onCheckedChange={() => toggleMetric("hashtagsKeywords")}
                className="size-4 rounded border-slate-300 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
              />
              <span>Hashtags e palavras-chave</span>
            </label>
          </div>
        </div>

        {/* Botão Iniciar Análise */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="w-full gap-2 rounded-xl bg-[#2563EB] py-3 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#1D4ED8]"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ChartNoAxesColumnIncreasing className="size-4" />
            )}
            Iniciar análise
          </Button>
        </div>
      </div>
    </div>
  );
}
