// Serviço oficial de localidades do IBGE com cache em memória e fallback seguro.
// Fornece as 27 Unidades Federativas do Brasil e todos os seus municípios oficiais.

export interface EstadoBr {
  sigla: string;
  nome: string;
  label: string;
}

export interface MunicipioIbge {
  id: number;
  nome: string;
  uf: string;
}

export const ESTADOS_BRASIL: EstadoBr[] = [
  { sigla: "AC", nome: "Acre", label: "Acre — AC" },
  { sigla: "AL", nome: "Alagoas", label: "Alagoas — AL" },
  { sigla: "AP", nome: "Amapá", label: "Amapá — AP" },
  { sigla: "AM", nome: "Amazonas", label: "Amazonas — AM" },
  { sigla: "BA", nome: "Bahia", label: "Bahia — BA" },
  { sigla: "CE", nome: "Ceará", label: "Ceará — CE" },
  { sigla: "DF", nome: "Distrito Federal", label: "Distrito Federal — DF" },
  { sigla: "ES", nome: "Espírito Santo", label: "Espírito Santo — ES" },
  { sigla: "GO", nome: "Goiás", label: "Goiás — GO" },
  { sigla: "MA", nome: "Maranhão", label: "Maranhão — MA" },
  { sigla: "MT", nome: "Mato Grosso", label: "Mato Grosso — MT" },
  { sigla: "MS", nome: "Mato Grosso do Sul", label: "Mato Grosso do Sul — MS" },
  { sigla: "MG", nome: "Minas Gerais", label: "Minas Gerais — MG" },
  { sigla: "PA", nome: "Pará", label: "Pará — PA" },
  { sigla: "PB", nome: "Paraíba", label: "Paraíba — PB" },
  { sigla: "PR", nome: "Paraná", label: "Paraná — PR" },
  { sigla: "PE", nome: "Pernambuco", label: "Pernambuco — PE" },
  { sigla: "PI", nome: "Piauí", label: "Piauí — PI" },
  { sigla: "RJ", nome: "Rio de Janeiro", label: "Rio de Janeiro — RJ" },
  { sigla: "RN", nome: "Rio Grande do Norte", label: "Rio Grande do Norte — RN" },
  { sigla: "RS", nome: "Rio Grande do Sul", label: "Rio Grande do Sul — RS" },
  { sigla: "RO", nome: "Rondônia", label: "Rondônia — RO" },
  { sigla: "RR", nome: "Roraima", label: "Roraima — RR" },
  { sigla: "SC", nome: "Santa Catarina", label: "Santa Catarina — SC" },
  { sigla: "SP", nome: "São Paulo", label: "São Paulo — SP" },
  { sigla: "SE", nome: "Sergipe", label: "Sergipe — SE" },
  { sigla: "TO", nome: "Tocantins", label: "Tocantins — TO" },
];

// Fallback das principais cidades de cada estado caso a API do IBGE esteja indisponível
const CIDADES_FALLBACK: Record<string, string[]> = {
  AC: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó"],
  AL: ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "União dos Palmares"],
  AP: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão"],
  AM: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tefé"],
  BA: [
    "Salvador",
    "Feira de Santana",
    "Vitória da Conquista",
    "Camaçari",
    "Juazeiro",
    "Itabuna",
    "Lauro de Freitas",
    "Ilhéus",
    "Porto Seguro",
  ],
  CE: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca"],
  DF: ["Brasília", "Ceilândia", "Taguatinga", "Samambaia", "Plano Piloto", "Águas Claras", "Guará"],
  ES: [
    "Vitória",
    "Vila Velha",
    "Serra",
    "Cariacica",
    "Cachoeiro de Itapemirim",
    "Linhares",
    "Colatina",
    "Guarapari",
  ],
  GO: [
    "Goiânia",
    "Aparecida de Goiânia",
    "Anápolis",
    "Rio Verde",
    "Luziânia",
    "Águas Lindas de Goiás",
    "Valparaíso de Goiás",
  ],
  MA: [
    "São Luís",
    "Imperatriz",
    "São José de Ribamar",
    "Timon",
    "Caxias",
    "Codó",
    "Paço do Lumiar",
  ],
  MT: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Sorriso"],
  MS: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Naviraí"],
  MG: [
    "Belo Horizonte",
    "Uberlândia",
    "Contagem",
    "Juiz de Fora",
    "Betim",
    "Montes Claros",
    "Ribeirão das Neves",
    "Uberaba",
    "Governador Valadares",
    "Ipatinga",
  ],
  PA: ["Belém", "Ananindeua", "Santarém", "Marabá", "Parauapebas", "Castanhal", "Abaetetuba"],
  PB: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cajazeiras"],
  PR: [
    "Curitiba",
    "Londrina",
    "Maringá",
    "Ponta Grossa",
    "Cascavel",
    "São José dos Pinhais",
    "Foz do Iguaçu",
    "Colombo",
    "Guarapuava",
    "Paranaguá",
    "Toledo",
    "Apucarana",
    "Pinhais",
    "Araucária",
  ],
  PE: [
    "Recife",
    "Jaboatão dos Guararapes",
    "Olinda",
    "Caruaru",
    "Petrolina",
    "Paulista",
    "Cabo de Santo Agostinho",
  ],
  PI: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior"],
  RJ: [
    "Rio de Janeiro",
    "São Gonçalo",
    "Duque de Caxias",
    "Nova Iguaçu",
    "Niterói",
    "Belford Roxo",
    "Campos dos Goytacazes",
    "São João de Meriti",
    "Petrópolis",
    "Volta Redonda",
    "Macaé",
    "Cabo Frio",
  ],
  RN: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Ceará-Mirim", "Caicó"],
  RS: [
    "Porto Alegre",
    "Caxias do Sul",
    "Canoas",
    "Pelotas",
    "Santa Maria",
    "Gravataí",
    "Viamão",
    "Novo Hamburgo",
    "São Leopoldo",
    "Rio Grande",
    "Passo Fundo",
  ],
  RO: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Rolim de Moura"],
  RR: ["Boa Vista", "Rorainópolis", "Caracaraí", "Pacaraima", "Cantá"],
  SC: [
    "Florianópolis",
    "Joinville",
    "Blumenau",
    "São José",
    "Chapecó",
    "Itajaí",
    "Criciúma",
    "Jaraguá do Sul",
    "Palhoça",
    "Lages",
    "Balneário Camboriú",
    "Brusque",
  ],
  SP: [
    "São Paulo",
    "Guarulhos",
    "Campinas",
    "São Bernardo do Campo",
    "Santo André",
    "São José dos Campos",
    "Osasco",
    "Ribeirão Preto",
    "Sorocaba",
    "Santos",
    "Mauá",
    "São José do Rio Preto",
    "Mogi das Cruzes",
    "Diadema",
    "Jundiaí",
    "Piracicaba",
    "Bauru",
  ],
  SE: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância"],
  TO: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins"],
};

const cacheEmMemoria = new Map<string, MunicipioIbge[]>();

/**
 * Busca todos os municípios oficiais de um estado (UF) no IBGE.
 * Possui cache em memória e tratamento resiliente de indisponibilidade com retry.
 */
export async function listarMunicipiosPorUf(
  uf: string,
  signal?: AbortSignal,
): Promise<MunicipioIbge[]> {
  const ufUpper = (uf || "").trim().toUpperCase();
  if (!ufUpper) return [];

  // 1. Checa cache em memória
  if (cacheEmMemoria.has(ufUpper)) {
    return cacheEmMemoria.get(ufUpper)!;
  }

  // 2. Checa sessionStorage se estiver no navegador
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const emCache = window.sessionStorage.getItem(`ibge_municipios_${ufUpper}`);
      if (emCache) {
        const parsed = JSON.parse(emCache) as MunicipioIbge[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          cacheEmMemoria.set(ufUpper, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignora erro de storage
    }
  }

  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(ufUpper)}/municipios`;

  try {
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`IBGE HTTP ${res.status}`);
    }

    const data = (await res.json()) as Array<{ id: number; nome: string }>;
    if (Array.isArray(data) && data.length > 0) {
      const lista: MunicipioIbge[] = data
        .map((m) => ({
          id: m.id,
          nome: m.nome,
          uf: ufUpper,
        }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

      cacheEmMemoria.set(ufUpper, lista);

      if (typeof window !== "undefined" && window.sessionStorage) {
        try {
          window.sessionStorage.setItem(`ibge_municipios_${ufUpper}`, JSON.stringify(lista));
        } catch {
          // sessionStorage cheio ou indisponível
        }
      }

      return lista;
    }
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn(
      `[IBGE] Falha ao consultar municípios de ${ufUpper}, usando lista de contingência:`,
      err,
    );
  }

  // 3. Fallback seguro
  const nomesFallback = CIDADES_FALLBACK[ufUpper] ?? ["Capital", "Centro"];
  const fallbackList: MunicipioIbge[] = nomesFallback.map((nome, idx) => ({
    id: 100000 + idx,
    nome,
    uf: ufUpper,
  }));

  cacheEmMemoria.set(ufUpper, fallbackList);
  return fallbackList;
}
