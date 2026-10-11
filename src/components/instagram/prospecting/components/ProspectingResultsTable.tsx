import { useMemo, useState } from "react";
import { EllipsisVertical, ExternalLink, Loader2, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ProspectProfileItem {
  id: string;
  name: string;
  username: string;
  category: string;
  location: string;
  followers: string;
  followersCount: number | null;
  engagement: string;
  engagementRate: number | null;
  relevance: "Alta" | "Média" | "Baixa" | "—";
  avatarUrl?: string;
  instagramUrl?: string;
  commercial: boolean;
}

export function ProspectProfileAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <Avatar className="size-12 shrink-0 rounded-2xl border border-slate-200/80 bg-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/80">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} referrerPolicy="no-referrer" /> : null}
      <AvatarFallback className="rounded-2xl text-xs font-semibold text-slate-500">
        {initials || "IG"}
      </AvatarFallback>
    </Avatar>
  );
}

interface ProspectingResultsTableProps {
  profiles?: ProspectProfileItem[];
  state?:
    | "idle"
    | "loading"
    | "success"
    | "empty"
    | "error"
    | "partial"
    | "limit"
    | "provider_unavailable";
  errorMessage?: string | null;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onSaveToCrm?: (profile: ProspectProfileItem) => Promise<void>;
}

const relevanceWeight = { Alta: 3, Média: 2, Baixa: 1, "—": 0 } as const;

export function ProspectingResultsTable({
  profiles = [],
  state = "idle",
  errorMessage,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onSaveToCrm,
}: ProspectingResultsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("relevance");
  const [filterType, setFilterType] = useState("all");

  const visibleProfiles = useMemo(() => {
    const filtered = profiles.filter((profile) => {
      if (filterType === "commercial") return profile.commercial;
      if (filterType === "high_engagement")
        return profile.engagementRate != null && profile.engagementRate >= 3;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sortBy === "followers") return (b.followersCount ?? -1) - (a.followersCount ?? -1);
      if (sortBy === "engagement") return (b.engagementRate ?? -1) - (a.engagementRate ?? -1);
      return relevanceWeight[b.relevance] - relevanceWeight[a.relevance];
    });
  }, [filterType, profiles, sortBy]);

  const allSelected =
    visibleProfiles.length > 0 && visibleProfiles.every((profile) => selectedIds.has(profile.id));
  const toggleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(visibleProfiles.map((profile) => profile.id)) : new Set());
  const toggleSelectOne = (id: string, checked: boolean) =>
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  const copyUrl = async (username: string) => {
    await navigator.clipboard.writeText(`https://www.instagram.com/${username}`);
    toast.success("Link do perfil copiado.");
  };
  const saveToCrm = async (profile: ProspectProfileItem) => {
    if (!onSaveToCrm || savingIds.has(profile.id)) return;
    setSavingIds((current) => new Set(current).add(profile.id));
    try {
      await onSaveToCrm(profile);
      toast.success(`${profile.name} adicionado ao CRM.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar no CRM.");
    } finally {
      setSavingIds((current) => {
        const next = new Set(current);
        next.delete(profile.id);
        return next;
      });
    }
  };

  const statusMessage =
    state === "loading"
      ? "Buscando perfis no Instagram…"
      : state === "error" || state === "limit" || state === "provider_unavailable"
        ? (errorMessage ?? "Não foi possível carregar os perfis.")
        : state === "empty"
          ? "Nenhum perfil corresponde aos filtros informados."
          : state === "idle" && profiles.length === 0
            ? "Use os filtros para iniciar uma busca."
            : null;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#E1306C]/10 text-[#E1306C]">
            <Target className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Perfis encontrados
            </h3>
            <p className="text-xs text-slate-500">
              {profiles.length} perfis encontrados com base nos seus filtros
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] rounded-xl border-slate-200 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="relevance">Relevância</SelectItem>
              <SelectItem value="followers">Seguidores</SelectItem>
              <SelectItem value="engagement">Engajamento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-xl border-slate-200 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">Todos os perfis</SelectItem>
              <SelectItem value="commercial">Apenas comerciais</SelectItem>
              <SelectItem value="high_engagement">Alto engajamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {statusMessage ? (
        <div className="flex min-h-64 items-center justify-center px-6 text-center text-sm text-slate-500">
          {state === "loading" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {statusMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400">
                <th className="w-12 px-5 py-3 text-center">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(value) => toggleSelectAll(value === true)}
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Seguidores</th>
                <th className="px-4 py-3">Engajamento</th>
                <th className="px-4 py-3">Relevância</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleProfiles.map((profile) => {
                const selected = selectedIds.has(profile.id);
                const username = profile.username.replace(/^@/, "");
                const url = profile.instagramUrl ?? `https://www.instagram.com/${username}`;
                const saving = savingIds.has(profile.id);
                return (
                  <tr
                    key={profile.id}
                    className={cn(
                      "transition-colors",
                      selected ? "bg-blue-50/30" : "hover:bg-slate-50/70",
                    )}
                  >
                    <td className="px-5 py-3.5 text-center">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(value) => toggleSelectOne(profile.id, value === true)}
                        aria-label={`Selecionar ${profile.name}`}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-[220px] items-center gap-3.5">
                        <ProspectProfileAvatar name={profile.name} avatarUrl={profile.avatarUrl} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{profile.name}</p>
                          <p className="truncate text-[11px] text-slate-400">@{username}</p>
                          <p className="mt-0.5 truncate text-[10.5px] text-slate-400">
                            {profile.category} • {profile.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-700">
                      {profile.followers}
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-700">
                      {profile.engagement}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2.5 py-0.5 text-[11px] font-semibold",
                          profile.relevance === "Alta"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                            : profile.relevance === "Média"
                              ? "border-amber-200 bg-amber-50 text-amber-600"
                              : "border-slate-200 bg-slate-50 text-slate-600",
                        )}
                      >
                        {profile.relevance}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 rounded-xl px-3 text-xs"
                        >
                          <a href={url} target="_blank" rel="noreferrer">
                            Ver perfil
                            <ExternalLink className="ml-1 size-3" />
                          </a>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <EllipsisVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={saving}
                              onClick={() => void saveToCrm(profile)}
                            >
                              {saving ? "Salvando…" : "Salvar no CRM"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void copyUrl(username)}>
                              Copiar link do perfil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {(state === "partial" || hasMore) && profiles.length > 0 ? (
        <div className="border-t border-slate-100 p-4 text-center">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={onLoadMore}
            className="rounded-xl"
          >
            {loadingMore ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Carregar mais
          </Button>
        </div>
      ) : null}
    </div>
  );
}
