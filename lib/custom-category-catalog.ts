// =============================================================
// CATÁLOGO DE CATEGORIAS "OUTROS" — sugestões do "teclado inteligente" do
// campo "O que é?" (mesmo motor do catálogo de itens, lib/item-catalog.ts).
//
// Regras:
// 1. São NOMES DE CATEGORIA / LUGAR / TEMA (ex.: "Adega", "Almoxarifado",
//    "Pesca") — NÃO itens/produtos (nada de "Detergente", "Parafuso").
// 2. `label` = pronto pra exibir (acento + maiúscula corretos). É o que entra
//    no item ao tocar.
// 3. `aliases` = como a pessoa DIGITA/abrevia/apelida (sinônimos, gírias,
//    formas compostas e SEM ACENTO/erros comuns). O acento já é ignorado na
//    busca, mas inclua mesmo assim os apelidos/compostos.
// 4. Local, instantâneo, offline. Pode crescer à vontade.
// =============================================================

export type CustomCategorySuggestion = { label: string; aliases?: string[] };

export const CUSTOM_CATEGORY_CATALOG: CustomCategorySuggestion[] = [
  // ─────────────── Lugares de guardar (casa) ───────────────
  { label: "Despensa", aliases: ["dispensa", "armario de mantimentos", "despenssa"] },
  { label: "Estoque", aliases: ["estoque de casa", "reserva", "estoq"] },
  { label: "Almoxarifado", aliases: ["almox", "almoxerifado", "almoxarifado de ferramentas"] },
  { label: "Depósito", aliases: ["deposito", "deposito de coisas"] },
  { label: "Depósito de bebidas", aliases: ["deposito de bebidas", "deposito bebidas", "deposito de cerveja"] },
  { label: "Garagem", aliases: ["garage"] },
  { label: "Área de serviço", aliases: ["area de servico", "lavanderia", "area de servico de casa"] },
  { label: "Lavanderia" },
  { label: "Closet", aliases: ["guarda-roupa", "guarda roupa", "roupeiro"] },
  { label: "Sótão", aliases: ["sotao"] },
  { label: "Porão", aliases: ["porao"] },
  { label: "Quintal" },
  { label: "Varanda", aliases: ["sacada"] },
  { label: "Edícula", aliases: ["edicula"] },
  { label: "Galpão", aliases: ["galpao", "barracao"] },
  { label: "Quarto de bagunça", aliases: ["quarto de bagunca", "quarto de despejo", "quarto dos cacarecos"] },

  // ─────────────── Comércio / trabalho ───────────────
  { label: "Loja", aliases: ["loja", "minha loja", "lojinha"] },
  { label: "Estoque da loja", aliases: ["estoque da loja", "estoque loja"] },
  { label: "Comércio", aliases: ["comercio"] },
  { label: "Empresa", aliases: ["trabalho", "trampo", "firma"] },
  { label: "Escritório", aliases: ["escritorio", "home office", "office"] },
  { label: "Salão", aliases: ["salao", "salao de beleza", "barbearia"] },
  { label: "Ateliê", aliases: ["atelie"] },
  { label: "Oficina", aliases: ["oficina mecanica"] },

  // ─────────────── Bebidas & bar ───────────────
  { label: "Adega", aliases: ["adega", "vinhos", "cave", "adega de vinhos"] },
  { label: "Bar", aliases: ["bar de casa", "cantinho do bar", "barzinho"] },
  { label: "Bebidas", aliases: ["bebida", "drinks", "birita"] },
  { label: "Cervejas", aliases: ["cerveja", "breja", "gelada", "cervejaria"] },
  { label: "Vinhos", aliases: ["vinho"] },
  { label: "Cafés", aliases: ["cafe", "cantinho do cafe"] },

  // ─────────────── Comida (temas, não itens) ───────────────
  { label: "Churrasco", aliases: ["churras", "churrasqueira", "churrascada"] },
  { label: "Marmita", aliases: ["marmitas", "rango", "quentinha", "boia"] },
  { label: "Doces", aliases: ["doce", "sobremesas", "confeitaria", "guloseimas"] },
  { label: "Padaria", aliases: ["paes", "pao", "panificadora"] },
  { label: "Açougue", aliases: ["acougue", "carnes", "frigorifico"] },
  { label: "Feira", aliases: ["hortifruti", "sacolao", "feirinha", "frutas e verduras"] },
  { label: "Cozinha", aliases: ["utensilios", "utensilios de cozinha", "coisas da cozinha"] },
  { label: "Café da manhã", aliases: ["cafe da manha"] },
  { label: "Lanches", aliases: ["lanche", "salgados"] },
  { label: "Festa", aliases: ["festas", "aniversario", "decoracao de festa", "festinha"] },

  // ─────────────── Pet ───────────────
  { label: "Pet", aliases: ["pets", "coisas do pet", "cantinho do pet"] },
  { label: "Pet shop", aliases: ["petshop", "pet shop"] },
  { label: "Cachorro", aliases: ["dog", "cao", "cachorro", "racao do cachorro", "doguinho"] },
  { label: "Gato", aliases: ["gatos", "gata", "areia do gato", "gatinho"] },
  { label: "Aquário", aliases: ["aquario", "peixes"] },
  { label: "Veterinário", aliases: ["veterinario", "vet"] },

  // ─────────────── Bebê & crianças ───────────────
  { label: "Bebê", aliases: ["bebe", "coisas do bebe", "nene", "nenem", "baby"] },
  { label: "Enxoval" },
  { label: "Fraldas", aliases: ["fralda"] },
  { label: "Brinquedos", aliases: ["brinquedo", "criancada"] },
  { label: "Escola das crianças", aliases: ["escola das criancas", "coisas da escola"] },

  // ─────────────── Ferramentas / obra / manutenção ───────────────
  { label: "Ferramentas", aliases: ["ferramenta", "ferragem", "oficina", "ferramentaria"] },
  { label: "Materiais de construção", aliases: ["material de construcao", "construcao", "obra", "reforma"] },
  { label: "Elétrica", aliases: ["eletrica", "material eletrico", "parte eletrica"] },
  { label: "Hidráulica", aliases: ["hidraulica", "encanamento"] },
  { label: "Pintura", aliases: ["tintas", "material de pintura"] },
  { label: "Marcenaria", aliases: ["madeira"] },
  { label: "Manutenção", aliases: ["manutencao", "consertos"] },

  // ─────────────── Jardim & plantas ───────────────
  { label: "Jardim", aliases: ["jardinagem"] },
  { label: "Horta" },
  { label: "Plantas", aliases: ["planta", "vasos", "plantinhas"] },

  // ─────────────── Carro / garagem ───────────────
  { label: "Carro", aliases: ["automovel", "auto", "veiculo", "automotivo"] },
  { label: "Moto", aliases: ["motocicleta", "motoca"] },

  // ─────────────── Limpeza & casa ───────────────
  { label: "Material de limpeza", aliases: ["produtos de limpeza", "limpeza", "faxina", "produtos de faxina"] },
  { label: "Banheiro", aliases: ["coisas do banheiro"] },
  { label: "Roupa de cama", aliases: ["cama mesa e banho", "enxoval de cama"] },
  { label: "Toalhas", aliases: ["toalha"] },

  // ─────────────── Beleza & saúde ───────────────
  { label: "Maquiagem", aliases: ["make", "makeup"] },
  { label: "Beleza", aliases: ["cosmeticos", "perfumaria"] },
  { label: "Cabelo", aliases: ["cuidados com cabelo"] },
  { label: "Skincare", aliases: ["cuidados com a pele", "pele"] },
  { label: "Perfumaria", aliases: ["perfumes", "perfume"] },
  { label: "Remédios", aliases: ["remedios", "farmacia", "medicamentos", "remedio"] },
  { label: "Primeiros socorros", aliases: ["farmacinha", "kit primeiros socorros"] },

  // ─────────────── Lazer & esporte ───────────────
  { label: "Praia" },
  { label: "Piscina" },
  { label: "Pesca", aliases: ["pescaria"] },
  { label: "Camping", aliases: ["acampamento", "camping"] },
  { label: "Viagem", aliases: ["viagens", "mala", "bagagem"] },
  { label: "Academia", aliases: ["treino", "gym", "musculacao"] },
  { label: "Esporte", aliases: ["esportes", "futebol"] },
  { label: "Bicicleta", aliases: ["bike", "ciclismo"] },

  // ─────────────── Trabalho / escritório / estudo ───────────────
  { label: "Papelaria", aliases: ["material de escritorio"] },
  { label: "Material escolar", aliases: ["escola", "faculdade", "coisas da escola"] },
  { label: "Eletrônicos", aliases: ["eletronicos", "informatica", "tech"] },
  { label: "Livros", aliases: ["leitura"] },

  // ─────────────── Hobbies & organização ───────────────
  { label: "Costura", aliases: ["aviamentos"] },
  { label: "Artesanato", aliases: ["artes"] },
  { label: "Crochê", aliases: ["croche", "trico"] },
  { label: "Decoração", aliases: ["decoracao", "decor"] },
  { label: "Velas e aromas", aliases: ["aromaterapia", "aromas", "velas"] },
  { label: "Igreja", aliases: ["religiao"] },
  { label: "Música", aliases: ["musica", "instrumentos"] },
];
