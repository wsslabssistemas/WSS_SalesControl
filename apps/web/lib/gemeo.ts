// O GÊMEO ATIVO — a pessoa que já é cliente e tem um cadastro velho solto.
//
// Arquivo sem imports, para ser testável em Node puro. Quem normaliza o
// telefone é quem chama (`lib/phone.ts`); aqui só entram dígitos prontos.
//
// ⚠ POR QUE ISTO EXISTE — o caso Lilian, 20/ago/2026.
//
// O fundador rodou a simulação e viu **Lilian Cabral Leão** na lista de
// reativação, sendo que ela tinha acabado de renovar. Ele nomeou o problema
// exato: *"não daria para automatizar e oferecer algo para alguém já
// matriculado."*
//
// A causa não foi a fila nem a importação. Quando ela veio renovar, alguém
// cadastrou **um contato novo** no painel em vez de achar o que já existia —
// e o telefone foi digitado com um dígito a menos (`5194473319` contra
// `51994473319`). Ficaram duas linhas: uma matriculada com plano anual, outra
// parada em `ex_aluno`. A régua de reativação olhou a segunda e fez o que devia.
//
// ⚠ O SINAL É O TELEFONE, NUNCA O NOME. Casar por nome parecia óbvio e é
// errado: a base tem uma contato chamada só "Leticia" que, por prefixo, casa
// com Leticia Frantz, Leticia Lopes, Leticia Nunes e Leticia Plada — quatro
// pessoas diferentes que seriam silenciadas de uma vez. Telefone normalizado
// não tem essa ambiguidade, e é exatamente onde o erro de digitação estava.
//
// E o custo de errar tem lado: deixar de falar com um ex-aluno que por acaso
// divide telefone com um ativo custa um contato; oferecer retorno para quem
// está matriculado custa a credibilidade do sistema inteiro na frente do
// cliente — e é o que o fundador chamou de "não podemos mais errar".

export type LinhaParaGemeo = {
  id: string;
  /** Telefone só com dígitos, JÁ normalizado por quem chamou. */
  digitos: string | null;
  /** Fim da vigência em ISO curto (`2027-08-09`), ou `null`. */
  contract_end: string | null;
};

/**
 * Quem NÃO pode receber toque proativo porque a mesma pessoa já é cliente.
 *
 * Devolve os ids a excluir: contatos cujo telefone coincide com o de OUTRO
 * contato que tem contrato vigente hoje.
 *
 * ⚠ O contato ativo não se exclui a si mesmo. Ele continua na fila pelos
 * motivos dele (renovação, recompra) — o que sai é o cadastro velho, que é o
 * que não deveria estar falando com ninguém.
 */
export function idsComGemeoAtivo(
  linhas: LinhaParaGemeo[],
  hojeISO: string,
): Set<string> {
  // Telefone → ids que têm contrato vigente.
  const ativosPorTelefone = new Map<string, Set<string>>();
  for (const l of linhas) {
    if (!l.digitos || !l.contract_end) continue;
    if (l.contract_end.slice(0, 10) < hojeISO.slice(0, 10)) continue;
    const s = ativosPorTelefone.get(l.digitos) ?? new Set<string>();
    s.add(l.id);
    ativosPorTelefone.set(l.digitos, s);
  }

  const excluir = new Set<string>();
  for (const l of linhas) {
    if (!l.digitos) continue;
    const ativos = ativosPorTelefone.get(l.digitos);
    if (!ativos) continue;
    // Só exclui quem NÃO é o próprio ativo. Se o único ativo naquele telefone
    // é ele mesmo, não há gêmeo — há uma pessoa só, e ela segue na fila.
    if (ativos.size === 1 && ativos.has(l.id)) continue;
    if (ativos.has(l.id)) continue;
    excluir.add(l.id);
  }
  return excluir;
}
