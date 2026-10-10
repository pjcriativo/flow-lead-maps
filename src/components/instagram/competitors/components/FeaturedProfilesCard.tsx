import { EllipsisVertical, Flame, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FeaturedProfileItem {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  followersCount: string;
}

export const DEFAULT_FEATURED_PROFILES: FeaturedProfileItem[] = [
  {
    id: "feat-1",
    name: "Pizzaria Moderna",
    username: "pizzariamoderna",
    avatarUrl: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=160&h=160&fit=crop",
    followersCount: "62.1K",
  },
  {
    id: "feat-2",
    name: "Sabor Italiano",
    username: "saboritaliano",
    avatarUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&h=160&fit=crop",
    followersCount: "41.8K",
  },
  {
    id: "feat-3",
    name: "Arte da Pizza",
    username: "artedapizza",
    avatarUrl: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=160&h=160&fit=crop",
    followersCount: "38.5K",
  },
];

interface FeaturedProfilesCardProps {
  profiles?: FeaturedProfileItem[];
  onViewMore?: () => void;
  onAnalyze?: (profile: FeaturedProfileItem) => void;
}

export function FeaturedProfilesCard({
  profiles = DEFAULT_FEATURED_PROFILES,
  onViewMore,
  onAnalyze,
}: FeaturedProfilesCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header do Card */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <Flame className="size-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Perfis em destaque</h3>
        </div>

        <button
          type="button"
          onClick={onViewMore}
          className="rounded-lg border border-slate-200/90 px-2.5 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          Ver mais
        </button>
      </div>

      {/* Lista de Perfis */}
      <div className="mt-4 space-y-3">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center justify-between gap-2.5 rounded-xl p-1 transition-colors hover:bg-slate-50"
          >
            {/* Avatar + Nome */}
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar className="size-8.5 shrink-0 border border-slate-100 shadow-2xs">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" />
                <AvatarFallback className="text-[10px] font-bold text-slate-700">
                  {profile.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[11.5px] font-bold text-slate-900 leading-tight">
                  {profile.name}
                </div>
                <div className="truncate text-[10px] text-slate-400">@{profile.username}</div>
              </div>
            </div>

            {/* Seguidores + Botão Analisar + Menu */}
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="text-right leading-tight">
                <div className="text-[11.5px] font-bold text-slate-900">{profile.followersCount}</div>
                <div className="text-[9.5px] text-slate-400">seguidores</div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => onAnalyze?.(profile)}
                className="h-6.5 rounded-lg bg-[#2563EB] px-2.5 text-[10.5px] font-semibold text-white shadow-2xs hover:bg-[#1D4ED8]"
              >
                Analisar
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex size-6 items-center justify-center rounded text-slate-400 hover:text-slate-700"
                    aria-label="Ações do perfil"
                  >
                    <EllipsisVertical className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 text-xs">
                  <DropdownMenuItem onClick={() => onAnalyze?.(profile)}>
                    <Search className="mr-2 size-3.5" /> Analisar
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={`https://instagram.com/${profile.username}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver no Instagram
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
