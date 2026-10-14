import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOrganizationContext } from "@/lib/active-organization";

export interface GoogleMapsStats {
  leadsDisponiveisFormatado: string;
  leadsDisponiveisSub: string;
  buscasRealizadas: number;
  buscasRealizadasSub: string;
  listasCriadas: number;
  listasCriadasSub: string;
  taxaContatosFormatada: string;
  taxaContatosSub: string;
  ultimaProspeccaoData: string;
  ultimaProspeccaoSub: string;
  loading: boolean;
}

export function useGoogleMapsStats(): GoogleMapsStats {
  const [stats, setStats] = useState<GoogleMapsStats>({
    leadsDisponiveisFormatado: "—",
    leadsDisponiveisSub: "Plano Profissional",
    buscasRealizadas: 0,
    buscasRealizadasSub: "este mês",
    listasCriadas: 0,
    listasCriadasSub: "neste mês",
    taxaContatosFormatada: "—",
    taxaContatosSub: "com telefone, site ou e-mail",
    ultimaProspeccaoData: "—",
    ultimaProspeccaoSub: "Nenhuma busca realizada",
    loading: true,
  });

  useEffect(() => {
    let cancel = false;

    async function carregar() {
      try {
        const activeOrganization = await getActiveOrganizationContext();
        const { data: usageRows } = await supabase.rpc("google_maps_plan_usage", {
          p_org: activeOrganization.orgId,
        });
        const usage = usageRows?.[0];
        const planNome = usage?.plan_name ? `Plano ${usage.plan_name}` : "Plano da organização";
        const leadsDisponiveisFormatado =
          usage?.lead_limit == null
            ? "Ilimitado"
            : `${(usage.remaining ?? 0).toLocaleString("pt-BR")} / ${usage.lead_limit.toLocaleString("pt-BR")}`;

        // 2. Listas criadas e buscas do mês corrente
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);
        const { data: listas } = await supabase
          .from("lead_lists")
          .select("id, name, niche, city, uf, created_at")
          .eq("org_id", activeOrganization.orgId)
          .order("created_at", { ascending: false })
          .limit(100);

        const listasDoMes = (listas ?? []).filter(
          (l) => l.created_at && new Date(l.created_at) >= inicioMes,
        );

        const buscasCount = listasDoMes.length;
        const listasCount = listasDoMes.length;

        // Última prospecção
        let ultData = "—";
        let ultSub = "Nenhuma busca realizada";
        if (listas && listas.length > 0) {
          const ult = listas[0];
          if (ult.created_at) {
            const d = new Date(ult.created_at);
            ultData = d.toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          }
          const localStr = [ult.city, ult.uf].filter(Boolean).join("/");
          ultSub = [ult.niche || ult.name, localStr].filter(Boolean).join(" — ") || ult.name;
        }

        // 3. Taxa média de contatos disponíveis a partir de uma amostra de leads reais
        const { data: leadsAmostra } = await supabase
          .from("leads")
          .select("phone, website, email, instagram_url")
          .eq("org_id", activeOrganization.orgId)
          .limit(100);

        let taxaContatosFormatada = "—";
        if (leadsAmostra && leadsAmostra.length > 0) {
          const comContato = leadsAmostra.filter(
            (l) =>
              Boolean(l.phone) ||
              Boolean(l.website) ||
              Boolean(l.email) ||
              Boolean(l.instagram_url),
          ).length;
          const pct = Math.round((comContato / leadsAmostra.length) * 100);
          taxaContatosFormatada = `${pct}%`;
        }

        if (!cancel) {
          setStats({
            leadsDisponiveisFormatado,
            leadsDisponiveisSub: planNome,
            buscasRealizadas: buscasCount,
            buscasRealizadasSub: "este mês",
            listasCriadas: listasCount,
            listasCriadasSub: "neste mês",
            taxaContatosFormatada,
            taxaContatosSub: "com telefone, site ou e-mail",
            ultimaProspeccaoData: ultData,
            ultimaProspeccaoSub: ultSub,
            loading: false,
          });
        }
      } catch (err) {
        if (!cancel) {
          console.warn("[GoogleMapsStats] Erro ao carregar métricas da organização:", err);
          setStats((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    void carregar();

    return () => {
      cancel = true;
    };
  }, []);

  return stats;
}
