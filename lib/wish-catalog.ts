// =============================================================
// CATÁLOGO DE DESEJOS — sugestões do "teclado inteligente" da LISTA DE DESEJOS.
//
// Por que separado do item-catalog (mercado)?
//   Quando o usuário clica em "Desejos de compras!", ele NÃO está anotando arroz,
//   sabão ou leite — está guardando SONHOS de compra: air fryer, robô aspirador,
//   sofá novo, churrasqueira, notebook, cadeira de escritório… Puxar o catálogo de
//   mercado ali era sem sentido. Este catálogo é ASPIRACIONAL: eletro/cozinha,
//   casa/móveis/decor, praia/veraneio/lazer e escritório/empresa/tech.
//
// Regras (iguais às do item-catalog):
// 1. `category` sempre uma das 8 REAIS do app. Aqui só usamos "Outros" (uso
//    pessoal/casa) e "Escritório / Empresa" (uso empresarial) — desejo não tem
//    corredor de supermercado.
// 2. `aliases` = como as pessoas DIGITAM (apelidos, marcas, variações). Acento já
//    é ignorado na busca — não precisa repetir sem acento.
// 3. Catálogo LOCAL (sem IA/internet) = instantâneo, offline, nunca inventa.
//    Pode crescer à vontade (itens grandes/duráveis que a família ou o empresário
//    sonha em comprar). Gerado com curadoria premium.
// =============================================================

import type { SuggestedItem } from "@/lib/item-catalog";

const O = "Outros";
const E = "Escritório / Empresa";

export const WISH_SUGGESTIONS: SuggestedItem[] = [
  // ─────────── TECNOLOGIA & ELETRÔNICOS ───────────
  { name: "Smartphone", category: O, aliases: ["celular", "iphone", "aparelho", "telefone"] },
  { name: "Smart TV", category: O, aliases: ["tv", "televisao", "tv 4k", "tv led"] },
  { name: "Notebook", category: O, aliases: ["laptop", "note", "ultrabook", "macbook", "notebook gamer"] },
  { name: "Computador", category: O, aliases: ["pc", "desktop", "pc gamer", "gabinete", "cpu"] },
  { name: "Tablet", category: O, aliases: ["ipad", "tablet android"] },
  { name: "Monitor", category: O, aliases: ["tela", "monitor ultrawide", "segundo monitor", "monitor gamer"] },
  { name: "Fone de ouvido", category: O, aliases: ["fone", "headset", "fone bluetooth", "airpods", "fone sem fio", "headphone"] },
  { name: "Smartwatch", category: O, aliases: ["relogio inteligente", "apple watch", "relogio smart", "smart watch"] },
  { name: "Caixa de som", category: O, aliases: ["caixa de som bluetooth", "jbl", "speaker", "caixinha de som"] },
  { name: "Câmera", category: O, aliases: ["camera", "camera fotografica", "dslr", "mirrorless", "camera profissional"] },
  { name: "Drone", category: O, aliases: ["drone com camera", "dji"] },
  { name: "Console de videogame", category: O, aliases: ["videogame", "console", "playstation", "ps5", "xbox", "nintendo switch"] },
  { name: "Kindle", category: O, aliases: ["leitor de livros", "e-reader"] },
  { name: "Roteador Wi-Fi", category: O, aliases: ["roteador", "wifi", "roteador mesh", "modem"] },
  { name: "HD externo", category: O, aliases: ["hd", "ssd externo", "disco externo", "hd portatil"] },
  { name: "Placa de vídeo", category: O, aliases: ["placa de video", "gpu", "rtx"] },
  { name: "Teclado mecânico", category: O, aliases: ["teclado", "teclado mecanico", "teclado gamer"] },
  { name: "Mouse", category: O, aliases: ["mouse gamer", "mouse sem fio"] },
  { name: "Impressora", category: O, aliases: ["impressora multifuncional", "impressora a laser", "impressora colorida", "impressora jato de tinta"] },

  // ─────────── ELETRODOMÉSTICOS & COZINHA ───────────
  { name: "Geladeira", category: O, aliases: ["refrigerador", "geladeira frost free", "geladeira duplex", "geladeira inverse"] },
  { name: "Freezer", category: O, aliases: ["congelador", "freezer horizontal", "freezer vertical"] },
  { name: "Fogão", category: O, aliases: ["fogao", "fogao 4 bocas", "fogao 5 bocas", "fogao de mesa"] },
  { name: "Cooktop", category: O, aliases: ["cook top", "fogao cooktop", "cooktop inducao"] },
  { name: "Forno elétrico", category: O, aliases: ["forno de bancada", "forno eletrico de embutir"] },
  { name: "Micro-ondas", category: O, aliases: ["microondas", "micro ondas", "forno micro-ondas"] },
  { name: "Air fryer", category: O, aliases: ["airfryer", "fritadeira eletrica", "fritadeira sem oleo", "fritadeira a ar"] },
  { name: "Fritadeira elétrica", category: O, aliases: ["fritadeira de imersao", "fritadeira profissional"] },
  { name: "Máquina de lavar roupa", category: O, aliases: ["maquina de lavar", "lavadora", "lava roupa", "tanquinho"] },
  { name: "Máquina de lavar louça", category: O, aliases: ["lava loucas", "maquina de lavar louca"] },
  { name: "Lava e seca", category: O, aliases: ["maquina lava e seca", "lavadora e secadora"] },
  { name: "Secadora de roupas", category: O, aliases: ["secadora", "maquina de secar"] },
  { name: "Robô aspirador", category: O, aliases: ["robo aspirador", "aspirador robo", "roomba"] },
  { name: "Aspirador de pó", category: O, aliases: ["aspirador", "aspirador vertical", "aspirador portatil"] },
  { name: "Ar-condicionado", category: O, aliases: ["ar condicionado", "split", "climatizador"] },
  { name: "Ventilador", category: O, aliases: ["ventilador de teto", "ventilador de mesa", "ventilador de coluna", "circulador de ar"] },
  { name: "Purificador de água", category: O, aliases: ["purificador", "filtro de agua eletrico"] },
  { name: "Cafeteira", category: O, aliases: ["cafeteira eletrica", "maquina de cafe", "cafeteira expresso", "nespresso"] },
  { name: "Liquidificador", category: O, aliases: ["liquidifiquador"] },
  { name: "Batedeira", category: O, aliases: ["batedeira planetaria"] },
  { name: "Mixer", category: O, aliases: ["mixer de mao", "mixer eletrico"] },
  { name: "Processador de alimentos", category: O, aliases: ["processador", "multiprocessador"] },
  { name: "Espremedor de frutas", category: O, aliases: ["espremedor", "espremedor de laranja", "centrifuga"] },
  { name: "Torradeira", category: O, aliases: ["torradeira de paes"] },
  { name: "Sanduicheira", category: O, aliases: ["sanduicheira grill", "maquina de sanduiche"] },
  { name: "Grill elétrico", category: O, aliases: ["grill", "churrasqueira eletrica"] },
  { name: "Máquina de waffle", category: O, aliases: ["waffle", "waffleira"] },
  { name: "Chaleira elétrica", category: O, aliases: ["chaleira", "chaleira de agua"] },
  { name: "Panela de pressão elétrica", category: O, aliases: ["panela de pressao eletrica", "panela eletrica", "panela de pressao"] },
  { name: "Panela elétrica de arroz", category: O, aliases: ["panela de arroz eletrica", "panela de arroz", "cozedor de arroz"] },
  { name: "Jogo de panelas", category: O, aliases: ["conjunto de panelas", "kit de panelas", "panelas"] },
  { name: "Frigideira", category: O, aliases: ["frigideira antiaderente", "frigideira de ferro"] },
  { name: "Ferro de passar", category: O, aliases: ["ferro", "ferro a vapor", "ferro de passar roupa"] },

  // ─────────── MÓVEIS & DECORAÇÃO ───────────
  { name: "Sofá", category: O, aliases: ["sofa retratil", "sofa reclinavel", "sofa de canto", "estofado"] },
  { name: "Poltrona", category: O, aliases: ["poltrona decorativa", "poltrona reclinavel"] },
  { name: "Cama box", category: O, aliases: ["cama", "cama box casal", "cama de casal", "cama queen", "cama king"] },
  { name: "Colchão", category: O, aliases: ["colchao", "colchao de molas", "colchao ortopedico", "colchao casal"] },
  { name: "Cabeceira de cama", category: O, aliases: ["cabeceira", "cabeceira estofada"] },
  { name: "Criado-mudo", category: O, aliases: ["criado mudo", "mesa de cabeceira"] },
  { name: "Cômoda", category: O, aliases: ["comoda de quarto"] },
  { name: "Guarda-roupa", category: O, aliases: ["guarda roupa", "roupeiro", "armario de quarto"] },
  { name: "Mesa de jantar", category: O, aliases: ["conjunto de mesa", "mesa com cadeiras"] },
  { name: "Cadeiras", category: O, aliases: ["cadeira", "jogo de cadeiras", "cadeira de jantar"] },
  { name: "Rack", category: O, aliases: ["rack de tv", "painel de tv", "home theater"] },
  { name: "Estante", category: O, aliases: ["estante de livros", "estante decorativa", "prateleira"] },
  { name: "Buffet / Aparador", category: O, aliases: ["aparador", "buffet", "balcao de sala"] },
  { name: "Sapateira", category: O, aliases: ["organizador de sapatos"] },
  { name: "Luminária", category: O, aliases: ["luminaria", "abajur", "luminaria de piso", "luminaria de mesa"] },
  { name: "Espelho", category: O, aliases: ["espelho de parede", "espelho de corpo inteiro", "espelho decorativo"] },
  { name: "Quadro decorativo", category: O, aliases: ["quadro", "quadro de parede", "quadros decorativos"] },
  { name: "Painel de parede", category: O, aliases: ["painel ripado", "painel decorativo"] },
  { name: "Cortina", category: O, aliases: ["cortina blackout", "persiana"] },
  { name: "Tapete", category: O, aliases: ["tapete de sala", "passadeira"] },
  { name: "Jogo de cama", category: O, aliases: ["roupa de cama", "lencol", "jogo de lencol"] },
  { name: "Edredom", category: O, aliases: ["edredon", "cobreleito", "coberta"] },
  { name: "Cofre", category: O, aliases: ["cofre eletronico", "cofre digital"] },

  // ─────────── PRAIA · VERANEIO · LAZER · ÁREA EXTERNA ───────────
  { name: "Churrasqueira", category: O, aliases: ["churrasqueira a carvao", "churrasqueira a gas", "churrasqueira de tijolo", "churras"] },
  { name: "Forno a lenha", category: O, aliases: ["forno de pizza", "forno de barro"] },
  { name: "Kit de churrasco", category: O, aliases: ["conjunto de churrasco", "kit churrasqueiro", "kit espeto"] },
  { name: "Piscina", category: O, aliases: ["piscina de fibra", "piscina inflavel", "piscina intex"] },
  { name: "Deck de madeira", category: O, aliases: ["deck", "deck para piscina", "deck de varanda"] },
  { name: "Pergolado", category: O, aliases: ["pergola", "pergolado de madeira"] },
  { name: "Toldo", category: O, aliases: ["toldo retratil", "cobertura de area externa", "toldo de varanda"] },
  { name: "Guarda-sol", category: O, aliases: ["guarda sol", "guarda-sol de praia", "ombrelone"] },
  { name: "Cadeira de praia", category: O, aliases: ["cadeira de praia dobravel", "espreguicadeira de praia", "cadeira de praia alta"] },
  { name: "Espreguiçadeira", category: O, aliases: ["espreguicadeira", "espreguicadeira de piscina", "chaise"] },
  { name: "Rede de descanso", category: O, aliases: ["rede de dormir", "rede", "rede de balanco"] },
  { name: "Jogo de mesa e cadeiras para varanda", category: O, aliases: ["conjunto de varanda", "jogo de varanda", "mesa de area externa", "conjunto para jardim"] },
  { name: "Cooler", category: O, aliases: ["caixa termica", "cooler termico", "isopor grande"] },
  { name: "Boia inflável", category: O, aliases: ["boia", "boia de piscina", "boia gigante", "boia flamingo"] },
  { name: "Barraca de camping", category: O, aliases: ["barraca", "tenda de praia", "barraca de praia"] },
  { name: "Prancha de surf", category: O, aliases: ["prancha", "prancha de surfe", "surfboard"] },
  { name: "Stand up paddle", category: O, aliases: ["sup", "prancha de stand up", "stand up", "prancha sup"] },
  { name: "Caiaque", category: O, aliases: ["caiaque inflavel", "kayak", "caiaque de pesca"] },
  { name: "Trampolim", category: O, aliases: ["cama elastica", "pula-pula", "jump"] },

  // ─────────── MOBILIDADE & FITNESS ───────────
  { name: "Bicicleta", category: O, aliases: ["bike", "bicicleta aro 29", "bike aro 29"] },
  { name: "Bicicleta elétrica", category: O, aliases: ["bike eletrica", "e-bike"] },
  { name: "Bicicleta ergométrica", category: O, aliases: ["bike ergometrica", "ergometrica", "bicicleta ergometrica"] },
  { name: "Esteira", category: O, aliases: ["esteira ergometrica", "esteira eletrica", "esteira de caminhada"] },
  { name: "Patinete elétrico", category: O, aliases: ["patinete eletrico", "scooter eletrico"] },

  // ─────────── ESCRITÓRIO / EMPRESA ───────────
  { name: "Cadeira de escritório", category: E, aliases: ["cadeira gamer", "cadeira ergonomica", "cadeira de trabalho"] },
  { name: "Mesa de escritório", category: E, aliases: ["mesa de trabalho", "mesa home office", "mesa gamer", "estacao de trabalho"] },
  { name: "Escrivaninha", category: O, aliases: ["mesa de estudo", "escrivaninha home office"] },
  { name: "Nobreak", category: E, aliases: ["no-break", "estabilizador", "ups"] },
  { name: "Projetor", category: E, aliases: ["datashow", "projetor de slides"] },
  { name: "Webcam", category: E, aliases: ["camera de reuniao", "camera para pc"] },
  { name: "Frigobar", category: E, aliases: ["mini geladeira", "geladeira pequena"] },
  { name: "Bebedouro", category: E, aliases: ["bebedouro de agua", "purificador de agua"] },
  { name: "Fogão industrial", category: E, aliases: ["fogao industrial", "fogao profissional", "fogao de restaurante"] },
  { name: "Geladeira comercial", category: E, aliases: ["expositor refrigerado", "geladeira de comercio", "camara fria"] },
  { name: "Máquina de café profissional", category: E, aliases: ["cafeteira comercial", "maquina de cafe expresso profissional"] },
  { name: "Batedeira planetária profissional", category: E, aliases: ["batedeira industrial", "batedeira de padaria"] },
  { name: "Forno industrial", category: E, aliases: ["forno combinado", "forno de padaria", "forno profissional"] },
];
