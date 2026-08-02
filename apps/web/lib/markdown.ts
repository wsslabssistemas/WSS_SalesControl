// Markdown mínimo para o corpo das lições do curso.
//
// Arquivo separado e SEM IMPORTS de propósito: é lógica pura, então dá para
// testar em Node puro, fora do bundler do Next. Enquanto morava junto do
// acesso a dados, testá-la exigia variáveis de ambiente e conexão — e teste
// que precisa de banco para verificar formatação de texto ninguém roda.
//
// O corpo das lições usa só `###`, `**negrito**`, `>` e listas. Escrever 40
// linhas evita uma dependência nova e evita `dangerouslySetInnerHTML`, que
// aqui não teria justificativa nenhuma.

export type Bloco =
  | { tipo: "titulo"; texto: string }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "citacao"; texto: string }
  | { tipo: "lista"; itens: string[] };

export function paraBlocos(md: string): Bloco[] {
  const linhas = String(md ?? "").split(/\r?\n/);
  const blocos: Bloco[] = [];
  let paragrafo: string[] = [];
  let lista: string[] = [];
  let citacao: string[] = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) blocos.push({ tipo: "paragrafo", texto: paragrafo.join(" ") });
    paragrafo = [];
  };
  const fecharLista = () => {
    if (lista.length) blocos.push({ tipo: "lista", itens: lista });
    lista = [];
  };
  const fecharCitacao = () => {
    if (citacao.length) blocos.push({ tipo: "citacao", texto: citacao.join(" ") });
    citacao = [];
  };
  const fecharTudo = () => {
    fecharParagrafo();
    fecharLista();
    fecharCitacao();
  };

  for (const linha of linhas) {
    const t = linha.trim();
    if (!t) { fecharTudo(); continue; }
    if (t.startsWith("### ")) { fecharTudo(); blocos.push({ tipo: "titulo", texto: t.slice(4) }); continue; }
    if (t.startsWith("> ")) { fecharParagrafo(); fecharLista(); citacao.push(t.slice(2)); continue; }
    if (/^[-*]\s+/.test(t)) { fecharParagrafo(); fecharCitacao(); lista.push(t.replace(/^[-*]\s+/, "")); continue; }
    fecharLista();
    fecharCitacao();
    paragrafo.push(t);
  }
  fecharTudo();
  return blocos;
}

/** Quebra um texto em pedaços, marcando o que está entre ** ** como forte. */
export function pedacos(texto: string): { texto: string; forte: boolean }[] {
  return String(texto ?? "")
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((p) =>
      p.startsWith("**") && p.endsWith("**")
        ? { texto: p.slice(2, -2), forte: true }
        : { texto: p, forte: false },
    );
}
