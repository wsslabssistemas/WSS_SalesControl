// Alvos de prospecção por NOME, não por código.
//
// POR QUE ISTO EXISTE. A prospecção já funcionava, mas exigia que a pessoa
// digitasse `9313-1/00`. Ninguém sabe CNAE de cabeça — e foi exatamente assim
// que o ICP de uma academia real ficou com CNAE de instalação elétrica e a
// palavra "climatização": alguém testou, funcionou, e ficou. Filtro que só
// aceita código não é filtro configurável, é filtro para quem já sabe.
//
// ISTO É DADO, NÃO CÓDIGO — a mesma lei que vale para as Skills. Acrescentar um
// ramo aqui é acrescentar uma linha; nenhuma tela muda.
//
// DUAS FAMÍLIAS, e a separação é a resposta a uma pergunta do fundador:
// *"não sei como a academia faz prospecção sem lista de contatos, a não ser
// varrer as empresas próximas oferecendo uma espécie de convênio."*
//
//   • `ramo`      — quem VENDE para outras empresas prospecta o ramo do cliente
//                   (a distribuidora procura mercadinho, a automação procura
//                   construtora). É o uso original do módulo.
//   • `convenio`  — quem atende PESSOA no bairro não pode prospectar pessoa:
//                   prospecção fria B2C é proibida por LGPD e é decisão fechada
//                   da casa. Mas pode prospectar o EMPREGADOR dela. Academia,
//                   salão, clínica, escola e pet vendem convênio corporativo —
//                   e isso é B2B com dado público, que é permitido.
//
// O LIMITE, dito antes que alguém descubra na prática: a busca pública filtra
// por CNAE e MUNICÍPIO, não por porte nem por raio de distância. Para convênio,
// o que decide é quantos funcionários a empresa tem e quão perto ela fica — e
// isso só aparece no detalhamento de cada CNPJ, depois. O preset abaixo é um
// bom começo, não a régua final.

export type Familia = "ramo" | "convenio";

export type Alvo = {
  key: string;
  rotulo: string;
  familia: Familia;
  /** Códigos CNAE, no formato que a busca pública aceita. */
  cnaes: string[];
  /** Para quem este alvo faz sentido. Aparece na tela. */
  nota?: string;
};

export const ALVOS: Alvo[] = [
  // ------------------------------------------------ RAMOS (venda B2B direta)
  { key: "academia", rotulo: "Academias e estúdios", familia: "ramo", cnaes: ["9313-1/00"] },
  { key: "escola_esportiva", rotulo: "Escolas esportivas e clubes", familia: "ramo", cnaes: ["9313-1/00", "9311-5/00", "8591-1/00"] },
  { key: "salao", rotulo: "Salões, barbearias e estética", familia: "ramo", cnaes: ["9602-5/01", "9602-5/02"] },
  { key: "clinica_odonto", rotulo: "Clínicas odontológicas", familia: "ramo", cnaes: ["8630-5/04"] },
  { key: "clinica_medica", rotulo: "Clínicas e consultórios médicos", familia: "ramo", cnaes: ["8630-5/03", "8630-5/01"] },
  { key: "pet", rotulo: "Pet shops e banho e tosa", familia: "ramo", cnaes: ["9609-2/08", "4789-0/04"] },
  { key: "oficina", rotulo: "Oficinas mecânicas e autopeças", familia: "ramo", cnaes: ["4520-0/01", "4520-0/05", "4530-7/03"] },
  { key: "curso_idiomas", rotulo: "Escolas de idiomas", familia: "ramo", cnaes: ["8593-7/00"] },
  { key: "curso_profissional", rotulo: "Cursos profissionalizantes", familia: "ramo", cnaes: ["8599-6/04", "8599-6/03"] },
  { key: "casa_de_festa", rotulo: "Casas de festa e buffets", familia: "ramo", cnaes: ["5620-1/02", "9329-8/99"] },
  { key: "marcenaria", rotulo: "Marcenarias e móveis sob medida", familia: "ramo", cnaes: ["3101-2/00", "4754-7/01"] },
  { key: "serralheria", rotulo: "Serralherias e esquadrias", familia: "ramo", cnaes: ["2512-8/00", "4322-3/01"] },
  { key: "construtora", rotulo: "Construtoras e incorporadoras", familia: "ramo", cnaes: ["4120-4/00", "4110-7/00"] },
  { key: "eletrica", rotulo: "Instalação elétrica e climatização", familia: "ramo", cnaes: ["4321-5/00", "4322-3/02"] },
  { key: "material_construcao", rotulo: "Lojas de material de construção", familia: "ramo", cnaes: ["4744-0/05", "4744-0/99"] },
  { key: "mercado", rotulo: "Mercados e mercadinhos", familia: "ramo", cnaes: ["4712-1/00", "4711-3/02"] },
  { key: "restaurante", rotulo: "Restaurantes e lanchonetes", familia: "ramo", cnaes: ["5611-2/01", "5611-2/03"] },
  { key: "farmacia", rotulo: "Farmácias e drogarias", familia: "ramo", cnaes: ["4771-7/01"] },
  { key: "confeccao", rotulo: "Confecção e vestuário", familia: "ramo", cnaes: ["1412-6/01", "1412-6/02"] },
  { key: "metalurgica", rotulo: "Metalúrgicas e usinagem", familia: "ramo", cnaes: ["2599-3/99", "2539-0/01"] },
  { key: "software", rotulo: "Software e TI", familia: "ramo", cnaes: ["6201-5/01", "6202-3/00", "6209-1/00"] },

  // ------------------------------------- EMPREGADORES (convênio corporativo)
  {
    key: "conv_escritorios",
    rotulo: "Escritórios (contabilidade, advocacia, engenharia)",
    familia: "convenio",
    cnaes: ["6920-6/01", "6911-7/01", "7112-0/00", "7119-7/03"],
    nota: "Equipe sentada o dia inteiro. É o público que mais responde a convênio de academia e de clínica.",
  },
  {
    key: "conv_industria",
    rotulo: "Indústrias e fábricas",
    familia: "convenio",
    cnaes: ["2599-3/99", "1412-6/01", "3101-2/00", "2229-3/99"],
    nota: "Muitos funcionários no mesmo endereço. Convênio costuma passar pelo RH, não pelo dono.",
  },
  {
    key: "conv_saude",
    rotulo: "Hospitais e clínicas grandes",
    familia: "convenio",
    cnaes: ["8610-1/01", "8630-5/99"],
    nota: "Turnos longos e equipe numerosa.",
  },
  {
    key: "conv_varejo",
    rotulo: "Supermercados e varejo grande",
    familia: "convenio",
    cnaes: ["4711-3/02", "4713-0/04"],
    nota: "Rotatividade alta — o convênio entra como benefício de retenção.",
  },
  {
    key: "conv_call_center",
    rotulo: "Call centers e serviços administrativos",
    familia: "convenio",
    cnaes: ["8220-2/00", "8219-9/99"],
    nota: "Concentração grande de gente num prédio só.",
  },
  {
    key: "conv_transporte",
    rotulo: "Transportadoras e logística",
    familia: "convenio",
    cnaes: ["4930-2/02", "5211-7/01"],
    nota: "Motorista e operador — público de clínica, oficina e academia 24h.",
  },
];

export const alvosPorFamilia = (f: Familia) => ALVOS.filter((a) => a.familia === f);

/** As linhas de CNAE que a busca espera, a partir das chaves escolhidas. */
export function cnaesDosAlvos(keys: string[]): string[] {
  const escolhidos = ALVOS.filter((a) => keys.includes(a.key));
  const linhas = new Set<string>();
  for (const a of escolhidos) for (const c of a.cnaes) linhas.add(`${c} ${a.rotulo.toLowerCase()}`);
  return [...linhas];
}

/** Quais alvos um conjunto de linhas de CNAE representa (para remarcar a tela). */
export function alvosDasLinhas(linhas: string[]): string[] {
  const codigos = new Set(linhas.map((l) => l.replace(/\D/g, "").slice(0, 7)).filter((c) => c.length >= 5));
  return ALVOS.filter((a) => a.cnaes.every((c) => codigos.has(c.replace(/\D/g, "")))).map((a) => a.key);
}
