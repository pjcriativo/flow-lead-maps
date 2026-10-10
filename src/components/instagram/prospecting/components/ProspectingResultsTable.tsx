import { useState } from "react";
import { EllipsisVertical, ExternalLink, Target } from "lucide-react";
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
  engagement: string;
  relevance: "Alta" | "Média" | "Baixa";
  avatarUrl: string;
  instagramUrl?: string;
}

export function getCuratedProfilePhoto(name = "", category = ""): string {
  const text = `${name} ${category}`.toLowerCase();

  // 1. Odontologia, Dentistas, Clínicas Médicas
  if (
    text.includes("dent") ||
    text.includes("odonto") ||
    text.includes("sorriso") ||
    text.includes("dental")
  ) {
    if (
      text.includes("dra") ||
      text.includes("angélica") ||
      text.includes("angelica") ||
      text.includes("luana")
    ) {
      return "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=160&h=160&fit=crop";
    }
    return "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=160&h=160&fit=crop";
  }

  if (
    text.includes("médic") ||
    text.includes("saúde") ||
    text.includes("clinic") ||
    text.includes("clínic") ||
    text.includes("dr.") ||
    text.includes("dr•") ||
    text.includes("dr ")
  ) {
    if (text.includes("bruno") || text.includes("andre") || text.includes("andré")) {
      return "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=160&h=160&fit=crop";
    }
    return "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=160&h=160&fit=crop";
  }

  // 2. Gastronomia, Restaurante, Pizzaria
  if (
    text.includes("pizza") ||
    text.includes("restaurante") ||
    text.includes("gastronom") ||
    text.includes("burger") ||
    text.includes("bar") ||
    text.includes("comida")
  ) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&h=160&fit=crop";
  }

  // 3. Beleza, Estética, Salão
  if (
    text.includes("beleza") ||
    text.includes("estética") ||
    text.includes("estetica") ||
    text.includes("salão") ||
    text.includes("salao") ||
    text.includes("hair") ||
    text.includes("sobrancelha")
  ) {
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=160&h=160&fit=crop";
  }

  // 4. Moda, Roupas, Vestuário
  if (
    text.includes("moda") ||
    text.includes("roupa") ||
    text.includes("vestuário") ||
    text.includes("loja") ||
    text.includes("fashion")
  ) {
    return "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=160&h=160&fit=crop";
  }

  // 5. Pets, Veterinária
  if (
    text.includes("pet") ||
    text.includes("vet") ||
    text.includes("cão") ||
    text.includes("gato")
  ) {
    return "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=160&h=160&fit=crop";
  }

  // 6. Fitness, Crossfit, Academia
  if (
    text.includes("fit") ||
    text.includes("cross") ||
    text.includes("treino") ||
    text.includes("academia")
  ) {
    return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=160&h=160&fit=crop";
  }

  // 7. Arquitetura, Design, Decoração
  if (
    text.includes("arquit") ||
    text.includes("decor") ||
    text.includes("design") ||
    text.includes("interiores")
  ) {
    return "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=160&h=160&fit=crop";
  }

  // 8. Tecnologia
  if (
    text.includes("tech") ||
    text.includes("tecnolog") ||
    text.includes("software")
  ) {
    return "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=160&h=160&fit=crop";
  }

  return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop";
}

export function ProspectProfileAvatar({
  name,
  category,
  avatarUrl,
}: {
  name: string;
  category?: string;
  avatarUrl?: string;
}) {
  const fallbackPhoto = getCuratedProfilePhoto(name, category);
  const [src, setSrc] = useState<string>(avatarUrl || fallbackPhoto);

  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-slate-100/80">
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="lazy"
        onError={() => {
          if (src !== fallbackPhoto) {
            setSrc(fallbackPhoto);
          }
        }}
        className="size-full object-cover transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
}

const DEFAULT_PROFILES: ProspectProfileItem[] = [
  {
    id: "1",
    name: "Baggio Pizzaria",
    username: "baggiopizzaria",
    category: "Restaurante",
    location: "São Paulo, SP",
    followers: "12.4K",
    engagement: "4.8%",
    relevance: "Alta",
    avatarUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&h=160&fit=crop",
    instagramUrl: "https://www.instagram.com/baggiopizzaria",
  },
  {
    id: "2",
    name: "Clínica Viva Mais",
    username: "clinicavivamais",
    category: "Saúde",
    location: "São Paulo, SP",
    followers: "8.7K",
    engagement: "5.2%",
    relevance: "Alta",
    avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=160&h=160&fit=crop",
    instagramUrl: "https://www.instagram.com/clinicavivamais",
  },
  {
    id: "3",
    name: "Studio Beleza Natural",
    username: "studiobelezanatural",
    category: "Beleza",
    location: "São Paulo, SP",
    followers: "15.1K",
    engagement: "3.9%",
    relevance: "Média",
    avatarUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=120&h=120&fit=crop",
    instagramUrl: "https://www.instagram.com/studiobelezanatural",
  },
  {
    id: "4",
    name: "Tech Solutions",
    username: "techsolutionsbr",
    category: "Tecnologia",
    location: "São Paulo, SP",
    followers: "28.3K",
    engagement: "2.1%",
    relevance: "Média",
    avatarUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&h=120&fit=crop",
    instagramUrl: "https://www.instagram.com/techsolutionsbr",
  },
  {
    id: "5",
    name: "Moda Urbana SP",
    username: "modaurbanasp",
    category: "Moda",
    location: "São Paulo, SP",
    followers: "9.6K",
    engagement: "4.5%",
    relevance: "Alta",
    avatarUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=120&h=120&fit=crop",
    instagramUrl: "https://www.instagram.com/modaurbanasp",
  },
  {
    id: "6",
    name: "Pet Care São Paulo",
    username: "petcaresp",
    category: "Pets",
    location: "São Paulo, SP",
    followers: "6.4K",
    engagement: "6.1%",
    relevance: "Alta",
    avatarUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=120&h=120&fit=crop",
    instagramUrl: "https://www.instagram.com/petcaresp",
  },
  {
    id: "7",
    name: "CrossFit Centro",
    username: "crossfitcentro",
    category: "Fitness",
    location: "São Paulo, SP",
    followers: "18.9K",
    engagement: "3.7%",
    relevance: "Média",
    avatarUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&h=120&fit=crop",
    instagramUrl: "https://www.instagram.com/crossfitcentro",
  },
  {
    id: "8",
    name: "Arquitetura & Design",
    username: "arquiteturadesign",
    category: "Arquitetura",
    location: "São Paulo, SP",
    followers: "11.2K",
    engagement: "4.2%",
    relevance: "Média",
    avatarUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=120&h=120&fit=crop",
    instagramUrl: "https://www.instagram.com/arquiteturadesign",
  },
];

interface ProspectingResultsTableProps {
  profiles?: ProspectProfileItem[];
  onSaveToCrm?: (profile: ProspectProfileItem) => void;
}

export function ProspectingResultsTable({
  profiles = DEFAULT_PROFILES,
  onSaveToCrm,
}: ProspectingResultsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("relevance");
  const [filterType, setFilterType] = useState("all");

  const allSelected = profiles.length > 0 && selectedIds.size === profiles.length;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(profiles.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const copyUrl = (username: string) => {
    void navigator.clipboard.writeText(`https://www.instagram.com/${username}`);
    toast.success("Link do perfil copiado.");
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#E1306C]/10 text-[#E1306C]">
            <Target className="size-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Perfis encontrados
            </h3>
            <p className="text-xs text-slate-500">
              {profiles.length} perfis encontrados com base nos seus filtros
            </p>
          </div>
        </div>

        {/* Dropdowns de ordenação e filtro */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden sm:inline">Ordenar por</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-auto min-w-[120px] rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-none">
                <SelectValue placeholder="Relevância" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="relevance">Relevância</SelectItem>
                <SelectItem value="followers">Seguidores</SelectItem>
                <SelectItem value="engagement">Engajamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-none">
              <SelectValue placeholder="Todos os perfis" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">Todos os perfis</SelectItem>
              <SelectItem value="commercial">Apenas comerciais</SelectItem>
              <SelectItem value="high_engagement">Alto engajamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Perfis */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400">
              <th className="w-12 px-5 py-3 text-center">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                  aria-label="Selecionar todos"
                  className="border-slate-300 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Perfil</th>
              <th className="px-4 py-3 font-semibold text-center sm:text-left">Seguidores</th>
              <th className="px-4 py-3 font-semibold text-center sm:text-left">Engajamento</th>
              <th className="px-4 py-3 font-semibold text-center sm:text-left">Relevância</th>
              <th className="px-5 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {profiles.map((profile) => {
              const selected = selectedIds.has(profile.id);
              const cleanUsername = profile.username.replace(/^@/, "");
              const url = profile.instagramUrl || `https://www.instagram.com/${cleanUsername}`;

              return (
                <tr
                  key={profile.id}
                  className={cn(
                    "transition-colors",
                    selected ? "bg-blue-50/30" : "hover:bg-slate-50/70",
                  )}
                >
                  {/* Checkbox */}
                  <td className="px-5 py-3.5 text-center">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => toggleSelectOne(profile.id, checked === true)}
                      aria-label={`Selecionar ${profile.name}`}
                      className="border-slate-300 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                    />
                  </td>

                  {/* Informações do Perfil */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3.5 min-w-[220px]">
                      <ProspectProfileAvatar
                        name={profile.name}
                        category={profile.category}
                        avatarUrl={profile.avatarUrl}
                      />

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 leading-snug truncate">
                          {profile.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          @{cleanUsername}
                        </p>
                        <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                          {profile.category} • {profile.location}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Seguidores */}
                  <td className="px-4 py-3.5 font-semibold text-slate-700 tabular-nums">
                    {profile.followers}
                  </td>

                  {/* Engajamento */}
                  <td className="px-4 py-3.5 font-semibold text-slate-700 tabular-nums">
                    {profile.engagement}
                  </td>

                  {/* Relevância */}
                  <td className="px-4 py-3.5">
                    {profile.relevance === "Alta" && (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600"
                      >
                        Alta
                      </Badge>
                    )}
                    {profile.relevance === "Média" && (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600"
                      >
                        Média
                      </Badge>
                    )}
                    {profile.relevance === "Baixa" && (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600"
                      >
                        Baixa
                      </Badge>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 rounded-xl border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <a href={url} target="_blank" rel="noreferrer">
                          <span>Ver perfil</span>
                          <ExternalLink className="size-3 text-slate-400 ml-1" />
                        </a>
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-slate-400 hover:text-slate-600"
                          >
                            <EllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => {
                              onSaveToCrm?.(profile);
                              toast.success(`${profile.name} adicionado ao CRM.`);
                            }}
                          >
                            Salvar no CRM
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyUrl(cleanUsername)}>
                            Copiar link do perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info(`Analisando oportunidade para @${cleanUsername}...`)
                            }
                          >
                            Analisar oportunidade
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
    </div>
  );
}
