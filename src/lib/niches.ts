// Catálogo de nichos por categoria (pt-BR) para o seletor da tela de busca.
// Fonte única — a UI só lê daqui.

export type CategoriaNichos = {
  categoria: string;
  icone: string; // emoji leve só para escanear a lista
  nichos: string[];
};

export const NICHOS_POR_CATEGORIA: CategoriaNichos[] = [
  {
    categoria: "Saúde & Bem-estar",
    icone: "🩺",
    nichos: [
      "Dentista", "Clínica odontológica", "Ortodontista", "Clínica médica",
      "Clínica de estética", "Cirurgia plástica", "Dermatologista", "Cardiologista",
      "Ortopedia", "Ginecologista", "Pediatria", "Psicólogo", "Psiquiatria",
      "Nutricionista", "Fisioterapeuta", "Academia", "Pilates", "Studio de yoga",
      "Crossfit", "Personal trainer", "Spa", "Clínica de depilação", "Esmalteria",
      "Podologia", "Estúdio de tatuagem", "Clínica de micropigmentação",
      "Laboratório de análises", "Farmácia",
    ],
  },
  {
    categoria: "Pet & Veterinária",
    icone: "🐾",
    nichos: ["Pet shop", "Veterinária", "Clínica veterinária", "Pet grooming", "Hotel para pets", "Adestramento"],
  },
  {
    categoria: "Beleza & Estética",
    icone: "💅",
    nichos: ["Salão de beleza", "Barbearia", "Cabeleireiro", "Instituto de beleza", "Manicure", "Design de sobrancelhas", "Limpeza de pele", "Lash designer"],
  },
  {
    categoria: "Automotivo",
    icone: "🚗",
    nichos: [
      "Oficina mecânica", "Lava a jato", "Borracharia", "Auto elétrica",
      "Funilaria e pintura", "Concessionária", "Revenda de veículos", "Som automotivo",
      "Insulfilm", "Estacionamento", "Locadora de veículos", "Troca de óleo",
    ],
  },
  {
    categoria: "Alimentação",
    icone: "🍽️",
    nichos: [
      "Restaurante", "Pizzaria", "Hamburgueria", "Churrascaria", "Comida japonesa",
      "Sushi", "Bar", "Padaria", "Cafeteria", "Sorveteria", "Confeitaria",
      "Lanchonete", "Food truck", "Marmitaria", "Hortifruti", "Peixaria", "Açougue",
    ],
  },
  {
    categoria: "Hospedagem & Turismo",
    icone: "🏨",
    nichos: ["Hotel", "Pousada", "Hostel", "Agência de viagens"],
  },
  {
    categoria: "Educação",
    icone: "🎓",
    nichos: [
      "Escola particular", "Colégio", "Creche", "Pré-vestibular", "Cursinho preparatório",
      "Escola de idiomas", "Autoescola", "Escola de música", "Escola de dança",
      "Escola de artes marciais", "Escola de programação", "Faculdade",
    ],
  },
  {
    categoria: "Varejo",
    icone: "🛍️",
    nichos: [
      "Loja de roupas", "Loja de calçados", "Joalheria", "Ótica", "Livraria",
      "Papelaria", "Artigos esportivos", "Móveis e decoração", "Floricultura",
      "Loja de eletrônicos", "Loja de brinquedos", "Material de construção",
      "Farmácia de manipulação",
    ],
  },
  {
    categoria: "Construção & Reforma",
    icone: "🧱",
    nichos: ["Eletricista", "Encanador", "Pintor", "Serralheria", "Marmoraria", "Vidraçaria", "Piscinas e spas"],
  },
  {
    categoria: "Serviços",
    icone: "🧰",
    nichos: ["Lavanderia", "Chaveiro", "Jardinagem e paisagismo", "Fotografia", "Gráfica"],
  },
  {
    categoria: "Jurídico & Contábil",
    icone: "⚖️",
    nichos: ["Advogado", "Escritório de advocacia", "Contabilidade", "Contador", "Imobiliária", "Corretora de seguros"],
  },
  {
    categoria: "Tech & Negócios",
    icone: "💻",
    nichos: ["Agência de marketing", "Agência de publicidade", "Coworking"],
  },
  {
    categoria: "Eventos",
    icone: "🎉",
    nichos: ["Espaço de eventos", "Decoração de festas", "Fotógrafo de eventos"],
  },
  {
    categoria: "Indústria Alimentícia B2B",
    icone: "🏭",
    nichos: ["Fabricante de máquinas de padaria", "Fabricante de equipamentos para restaurantes"],
  },
  {
    categoria: "Transporte & Logística",
    icone: "🚚",
    nichos: ["Oficina para caminhões"],
  },
  {
    categoria: "Metalurgia & Usinagem",
    icone: "⚙️",
    nichos: ["Tornearia mecânica"],
  },
  {
    categoria: "Saúde Hospitalar B2B",
    icone: "🏥",
    nichos: ["Distribuidor de equipamentos médicos", "Fabricante de móveis hospitalares", "Fornecedor de gases medicinais", "Distribuidora de medicamentos"],
  },
];

export const TOTAL_NICHOS = NICHOS_POR_CATEGORIA.reduce((n, c) => n + c.nichos.length, 0);
