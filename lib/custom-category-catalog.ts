// =============================================================
// CATÁLOGO DE CATEGORIAS "OUTROS" — sugestões do "teclado inteligente" do
// campo "O que é?" (mesmo motor do catálogo de itens, lib/item-catalog.ts).
//
// Regras:
// 1. São NOMES DE CATEGORIA / LUGAR / TEMA (ex.: "Adega", "Almoxarifado",
//    "Pesca") — NÃO itens/produtos (nada de "Detergente", "Parafuso").
// 2. `label` = pronto pra exibir (acento + maiúscula corretos). É o que entra
//    no item ao tocar.
// 3. `aliases` = como a pessoa DIGITA/abrevia/apelida (sinônimos, gírias). O
//    acento já é ignorado na busca, então não precisa repetir versão sem acento.
// 4. Local, instantâneo, offline. Pode crescer à vontade.
// =============================================================

export type CustomCategorySuggestion = { label: string; aliases?: string[] };

export const CUSTOM_CATEGORY_CATALOG: CustomCategorySuggestion[] = [
  // ─────────────── Lugares de guardar (casa) ───────────────
  { label: "Despensa", aliases: ["dispensa", "armario de mantimentos"] },
  { label: "Estoque", aliases: ["estoque de casa", "reserva"] },
  { label: "Almoxarifado", aliases: ["almox"] },
  { label: "Depósito", aliases: ["deposito de coisas"] },
  { label: "Garagem" },
  { label: "Área de serviço", aliases: ["area de servico", "lavanderia"] },
  { label: "Lavanderia" },
  { label: "Closet", aliases: ["guarda-roupa", "guarda roupa"] },
  { label: "Sótão", aliases: ["sotao"] },
  { label: "Porão", aliases: ["porao"] },
  { label: "Quintal" },
  { label: "Varanda", aliases: ["sacada"] },
  { label: "Edícula", aliases: ["edicula"] },

  // ─────────────── Bebidas & bar ───────────────
  { label: "Adega", aliases: ["vinhos", "cave", "adega de vinhos"] },
  { label: "Bar", aliases: ["bar de casa", "cantinho do bar"] },
  { label: "Bebidas", aliases: ["drinks", "birita"] },
  { label: "Cervejas", aliases: ["breja", "gelada", "cerveja"] },
  { label: "Vinhos", aliases: ["vinho"] },
  { label: "Cafés", aliases: ["cafe", "cantinho do cafe"] },

  // ─────────────── Comida (temas, não itens) ───────────────
  { label: "Churrasco", aliases: ["churras", "churrasqueira"] },
  { label: "Marmita", aliases: ["rango", "quentinha", "marmitas"] },
  { label: "Doces", aliases: ["sobremesas", "confeitaria", "doce"] },
  { label: "Padaria", aliases: ["paes", "pao"] },
  { label: "Açougue", aliases: ["acougue", "carnes"] },
  { label: "Feira", aliases: ["hortifruti", "sacolao", "frutas e verduras"] },
  { label: "Cozinha", aliases: ["utensilios", "utensilios de cozinha"] },
  { label: "Café da manhã", aliases: ["cafe da manha"] },
  { label: "Lanches", aliases: ["lanche"] },
  { label: "Festa", aliases: ["festas", "aniversario", "decoracao de festa"] },

  // ─────────────── Pet ───────────────
  { label: "Pet", aliases: ["coisas do pet", "cantinho do pet"] },
  { label: "Cachorro", aliases: ["dog", "cao", "racao do cachorro"] },
  { label: "Gato", aliases: ["gatos", "areia do gato"] },
  { label: "Aquário", aliases: ["aquario", "peixes"] },
  { label: "Veterinário", aliases: ["veterinario", "vet"] },

  // ─────────────── Bebê & crianças ───────────────
  { label: "Bebê", aliases: ["bebe", "coisas do bebe", "nene", "nenem", "baby"] },
  { label: "Enxoval" },
  { label: "Fraldas", aliases: ["fralda"] },
  { label: "Brinquedos", aliases: ["brinquedo", "criancada"] },
  { label: "Escola das crianças", aliases: ["escola das criancas"] },

  // ─────────────── Ferramentas / obra / manutenção ───────────────
  { label: "Ferramentas", aliases: ["ferramenta", "ferragem", "oficina"] },
  { label: "Materiais de construção", aliases: ["material de construcao", "construcao", "obra"] },
  { label: "Elétrica", aliases: ["eletrica", "material eletrico"] },
  { label: "Hidráulica", aliases: ["hidraulica", "encanamento"] },
  { label: "Pintura", aliases: ["tintas", "material de pintura"] },
  { label: "Marcenaria", aliases: ["madeira"] },

  // ─────────────── Jardim & plantas ───────────────
  { label: "Jardim", aliases: ["jardinagem"] },
  { label: "Horta" },
  { label: "Plantas", aliases: ["planta", "vasos"] },

  // ─────────────── Carro / garagem ───────────────
  { label: "Carro", aliases: ["automovel", "auto", "veiculo"] },
  { label: "Moto", aliases: ["motocicleta"] },

  // ─────────────── Limpeza & casa ───────────────
  { label: "Material de limpeza", aliases: ["produtos de limpeza", "limpeza", "faxina"] },
  { label: "Banheiro", aliases: ["higiene"] },
  { label: "Roupa de cama", aliases: ["cama mesa e banho", "enxoval de cama"] },

  // ─────────────── Beleza & saúde ───────────────
  { label: "Maquiagem", aliases: ["make", "makeup"] },
  { label: "Beleza", aliases: ["cosmeticos", "perfumaria"] },
  { label: "Cabelo", aliases: ["cuidados com cabelo"] },
  { label: "Skincare", aliases: ["cuidados com a pele"] },
  { label: "Remédios", aliases: ["remedios", "farmacia", "medicamentos", "remedio"] },
  { label: "Primeiros socorros", aliases: ["farmacinha"] },

  // ─────────────── Lazer & esporte ───────────────
  { label: "Praia" },
  { label: "Piscina" },
  { label: "Pesca", aliases: ["pescaria"] },
  { label: "Camping", aliases: ["acampamento"] },
  { label: "Viagem", aliases: ["viagens", "mala"] },
  { label: "Academia", aliases: ["treino", "gym"] },
  { label: "Esporte", aliases: ["esportes", "futebol"] },
  { label: "Bicicleta", aliases: ["bike"] },

  // ─────────────── Trabalho / escritório / estudo ───────────────
  { label: "Escritório", aliases: ["escritorio", "home office", "trampo"] },
  { label: "Papelaria", aliases: ["material de escritorio"] },
  { label: "Material escolar", aliases: ["escola", "faculdade"] },
  { label: "Eletrônicos", aliases: ["eletronicos", "informatica", "tech"] },
  { label: "Livros", aliases: ["leitura"] },

  // ─────────────── Hobbies & organização ───────────────
  { label: "Costura", aliases: ["aviamentos"] },
  { label: "Artesanato", aliases: ["artes"] },
  { label: "Crochê", aliases: ["croche", "trico"] },
  { label: "Decoração", aliases: ["decoracao", "decor"] },
  { label: "Velas e aromas", aliases: ["aromaterapia", "aromas"] },
  { label: "Igreja", aliases: ["religiao"] },
  { label: "Música", aliases: ["musica", "instrumentos"] },
];
