import { useState } from "react";
import { Filter, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface ProspectingFilterSidebarProps {
  onSearch: (filters: {
    keyword: string;
    location: string;
    distance: string;
    category: string;
    profileSize: number;
    commercialOnly: boolean;
    hasEmail: boolean;
    hasWhatsapp: boolean;
    highEngagement: boolean;
  }) => void;
  loading?: boolean;
}

export function ProspectingFilterSidebar({
  onSearch,
  loading = false,
}: ProspectingFilterSidebarProps) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("São Paulo, SP");
  const [distance, setDistance] = useState("25");
  const [category, setCategory] = useState("all");
  const [profileSize, setProfileSize] = useState([50]);
  const [commercialOnly, setCommercialOnly] = useState(true);
  const [hasEmail, setHasEmail] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(true);
  const [highEngagement, setHighEngagement] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      keyword,
      location,
      distance,
      category,
      profileSize: profileSize[0],
      commercialOnly,
      hasEmail,
      hasWhatsapp,
      highEngagement,
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
        <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
          <Filter className="size-4" />
        </div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Filtros de busca
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo 1: Palavra-chave ou nicho */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Palavra-chave ou nicho
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Ex: restaurante, clínica, loja..."
              className="pl-9 h-10 rounded-xl border-slate-200 text-xs bg-slate-50/50 focus:bg-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Campo 2: Localização */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Localização
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="São Paulo, SP"
                className="pl-9 h-10 rounded-xl border-slate-200 text-xs bg-slate-50/50 focus:bg-white"
              />
            </div>

            <Select value={distance} onValueChange={setDistance}>
              <SelectTrigger className="h-10 w-24 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Campo 3: Categoria */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">
            Categoria
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 text-xs font-medium">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="gastronomia">Restaurantes e Bares</SelectItem>
              <SelectItem value="beleza">Beleza e Estética</SelectItem>
              <SelectItem value="saude">Saúde e Bem-estar</SelectItem>
              <SelectItem value="moda">Moda e Acessórios</SelectItem>
              <SelectItem value="tecnologia">Tecnologia e Serviços</SelectItem>
              <SelectItem value="fitness">Fitness e Academias</SelectItem>
              <SelectItem value="pets">Pets e Veterinárias</SelectItem>
              <SelectItem value="arquitetura">Arquitetura e Design</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campo 4: Tamanho do perfil */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center text-xs">
            <Label className="font-semibold text-slate-700">Tamanho do perfil</Label>
          </div>

          <Slider
            value={profileSize}
            onValueChange={setProfileSize}
            max={100}
            min={1}
            step={1}
            className="py-1"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
            <span>1K</span>
            <span>10K</span>
            <span>50K</span>
            <span>100K+</span>
          </div>
        </div>

        {/* Campo 5: Filtros avançados */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-900 tracking-tight">
            Filtros avançados
          </p>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Perfis comerciais</span>
            <Switch
              checked={commercialOnly}
              onCheckedChange={setCommercialOnly}
              className="data-[state=checked]:bg-[#2563EB]"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Com e-mail na bio</span>
            <Switch
              checked={hasEmail}
              onCheckedChange={setHasEmail}
              className="data-[state=checked]:bg-[#2563EB]"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Com WhatsApp</span>
            <Switch
              checked={hasWhatsapp}
              onCheckedChange={setHasWhatsapp}
              className="data-[state=checked]:bg-[#2563EB]"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Alta taxa de engajamento</span>
            <Switch
              checked={highEngagement}
              onCheckedChange={setHighEngagement}
              className="data-[state=checked]:bg-[#2563EB]"
            />
          </div>
        </div>

        {/* Botão Buscar perfis */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full gap-2 rounded-xl bg-[#2563EB] py-3 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#1D4ED8]"
        >
          <Search className="size-4" />
          <span>{loading ? "Buscando perfis..." : "Buscar perfis"}</span>
        </Button>
      </form>
    </div>
  );
}
