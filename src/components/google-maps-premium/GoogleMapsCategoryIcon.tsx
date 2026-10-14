import {
  Bed,
  Building2,
  Car,
  Coffee,
  Dumbbell,
  GraduationCap,
  Heart,
  Hotel,
  PawPrint,
  Scissors,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Utensils,
  Wrench,
} from "lucide-react";

interface GoogleMapsCategoryIconProps {
  nicho: string;
  categoria?: string;
  className?: string;
}

export function GoogleMapsCategoryIcon({
  nicho,
  categoria = "",
  className = "size-8",
}: GoogleMapsCategoryIconProps) {
  const t = (nicho + " " + categoria).toLowerCase();

  // Odonto / Saúde / Médica
  if (t.includes("odont") || t.includes("dente") || t.includes("médic") || t.includes("saúde") || t.includes("clínica")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 ${className}`}>
        <Stethoscope className="size-4" />
      </div>
    );
  }

  // Alimentação / Restaurante
  if (t.includes("restaurante") || t.includes("alimenta") || t.includes("pizz") || t.includes("hambúrg") || t.includes("bar")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}>
        <Utensils className="size-4" />
      </div>
    );
  }

  // Cafeteria
  if (t.includes("café") || t.includes("cafeteria")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-amber-600/15 text-amber-500 border border-amber-600/30 ${className}`}>
        <Coffee className="size-4" />
      </div>
    );
  }

  // Academia / Fitness
  if (t.includes("academia") || t.includes("crossfit") || t.includes("fitness") || t.includes("treino") || t.includes("esport")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}>
        <Dumbbell className="size-4" />
      </div>
    );
  }

  // Salão de beleza / Estética
  if (t.includes("beleza") || t.includes("estética") || t.includes("salão") || t.includes("barbearia") || t.includes("cabel")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30 ${className}`}>
        <Scissors className="size-4" />
      </div>
    );
  }

  // Varejo / Moda / Lojas
  if (t.includes("roupa") || t.includes("loja") || t.includes("moda") || t.includes("varejo") || t.includes("calçado")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 ${className}`}>
        <ShoppingBag className="size-4" />
      </div>
    );
  }

  // Automotivo / Oficina
  if (t.includes("oficina") || t.includes("mecânica") || t.includes("auto") || t.includes("carro") || t.includes("pneu")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 ${className}`}>
        <Wrench className="size-4" />
      </div>
    );
  }

  // Turismo / Hotéis
  if (t.includes("hotel") || t.includes("pousada") || t.includes("turismo") || t.includes("hospedag")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 ${className}`}>
        <Hotel className="size-4" />
      </div>
    );
  }

  // Pets / Veterinária
  if (t.includes("veterinár") || t.includes("pet") || t.includes("animal") || t.includes("banho e tosa")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-lime-500/15 text-lime-400 border border-lime-500/30 ${className}`}>
        <PawPrint className="size-4" />
      </div>
    );
  }

  // Serviços / Contabilidade / Advocacia
  if (t.includes("contabil") || t.includes("escritório") || t.includes("advoc") || t.includes("imobili") || t.includes("serviço")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 ${className}`}>
        <Building2 className="size-4" />
      </div>
    );
  }

  // Educação
  if (t.includes("escola") || t.includes("curso") || t.includes("educa") || t.includes("faculdade")) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 ${className}`}>
        <GraduationCap className="size-4" />
      </div>
    );
  }

  // Padrão Geral
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-home-muted border border-zinc-700 ${className}`}>
      <Sparkles className="size-4 text-home-orange" />
    </div>
  );
}
