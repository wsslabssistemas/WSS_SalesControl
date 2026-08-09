// RÓTULO DE COLUNA — a chave do manifesto virando português na tela.
//
// POR QUE ISTO EXISTE
// As colunas de tabela do DNA são declaradas como chave de máquina no
// manifesto (`columns: [modulo, o_que_faz, incluso]`), e o formulário as
// imprimia CRUAS. Quem estava cadastrando via literalmente `o_que_faz` acima
// da caixa de texto.
//
// É a mesma classe de defeito que o `next_objective` já causou na biblioteca:
// campo que parece chave de máquina, e não é — alguém lê. A diferença é que
// aqui quem lê é o cliente novo, no primeiro contato com o produto, tentando
// entender o que digitar.
//
// POR QUE NÃO BASTA TROCAR `_` POR ESPAÇO
// Chave de manifesto é ASCII por convenção. A tradução mecânica produz
// "Condicao", "Duracao", "Servico", "Observacao" — sem acento, numa tela que o
// cliente lê. Trocaria um defeito visível por um defeito feio, e ainda
// derrubaria a trava de acentuação do CI se este texto vivesse na curadoria.
//
// Por isso: dicionário para o que existe, e regra mecânica só para o que
// aparecer depois. O dicionário cobre as 23 colunas usadas hoje pelos 15
// manifestos.

const DICIONARIO: Record<string, string> = {
  capacidade: "Capacidade",
  condicao: "Condição",
  dia: "Dia",
  duracao: "Duração",
  especialidade: "Especialidade",
  fidelidade: "Fidelidade",
  hora: "Hora",
  incluso: "Incluso?",
  material: "Material",
  modulo: "Módulo",
  nivel: "Nível",
  nome: "Nome",
  o_que_faz: "O que faz",
  o_que_inclui: "O que inclui",
  observacao: "Observação",
  pacote: "Pacote",
  procedimento: "Procedimento",
  profissional: "Profissional",
  publico: "Público",
  registro: "Registro",
  servico: "Serviço",
  tempo_medio: "Tempo médio",
  valor: "Valor",
};

/**
 * O rótulo legível de uma coluna de tabela do DNA.
 *
 * Chave desconhecida cai na regra mecânica (underscore vira espaço, primeira
 * letra maiúscula) — feio, mas legível, e melhor que quebrar a tela. Quando
 * um manifesto novo trouxer coluna nova, o teste `rotulos_test.mjs` aponta a
 * ausência antes de o cliente ver.
 */
export function rotuloDaColuna(chave: string): string {
  const k = (chave ?? "").trim();
  if (!k) return "";
  if (DICIONARIO[k]) return DICIONARIO[k];
  const solto = k.replace(/_/g, " ").trim();
  return solto.charAt(0).toUpperCase() + solto.slice(1);
}

/** As chaves que o dicionário conhece — para o teste conferir cobertura. */
export function colunasConhecidas(): string[] {
  return Object.keys(DICIONARIO);
}
