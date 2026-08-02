// Repescagem espaçada — a regra de QUANDO uma pergunta volta.
//
// Arquivo separado e SEM IMPORTS de propósito, como `lib/markdown.ts`: é
// lógica pura, então dá para testar em Node puro, sem banco e sem bundler.
// Regra de espaçamento testada com relógio de mentira vale; regra testada
// "abrindo a tela e vendo se parece certo" não vale nada — o erro típico aqui
// é o intervalo que nunca vence, e ele se parece exatamente com "ainda não
// chegou a hora".
//
// A evidência: Hattie & Donoghue (242 estudos, 169.179 participantes) apontam
// prática de teste e prática DISTRIBUÍDA como as duas técnicas mais eficazes.
// O quiz do fim da lição entrega a primeira. Isto aqui entrega a segunda.

/** Uma pergunta candidata a voltar, com tudo que decide a escolha. */
export type Candidato = {
  question_id: string;
  lesson_key: string;
  /** Posição da lição no curso — desempata pelo que foi visto há mais tempo. */
  ordem: number;
  /** A pessoa errou esta questão quando fez a lição. */
  errou_na_licao: boolean;
  /** Quando a lição foi concluída (ISO). */
  concluida_em: string;
  /** Agendamento existente. `null` = nunca voltou desde a lição. */
  due_at: string | null;
  streak: number;
};

/**
 * Os intervalos, em dias, por acerto seguido na repescagem.
 *
 * Crescem porque o objetivo é recuperar da memória quando já custa esforço —
 * revisar o que ainda está fresco dá sensação de domínio e não fixa nada.
 * Quatro degraus bastam: acertar quatro vezes espaçadas em um mês é o
 * suficiente para o que este curso precisa. Não é sistema de flashcard.
 */
export const INTERVALOS_DIAS = [2, 5, 12, 30];

/** Errar zera: volta amanhã. É o comportamento de qualquer curva de esquecimento. */
export const INTERVALO_ERRO_DIAS = 1;

/** Nada volta antes disto, nem no primeiro agendamento. Repescar no mesmo dia é repetir, não espaçar. */
export const CARENCIA_DIAS = 2;

/** Quantas perguntas em uma sessão. Curta de propósito: 2 minutos cabem no dia; 20 perguntas não. */
export const TAMANHO_SESSAO = 5;

/** No máximo isto da mesma lição — variedade força recuperação em vez de reconhecimento de contexto. */
export const MAX_POR_LICAO = 2;

const DIA = 86_400_000;

/** O novo estado de agendamento depois de responder. */
export function agendar(
  streakAtual: number,
  acertou: boolean,
  agora: Date,
): { streak: number; due_at: string } {
  const streak = acertou ? streakAtual + 1 : 0;
  const dias = acertou
    ? INTERVALOS_DIAS[Math.min(streak - 1, INTERVALOS_DIAS.length - 1)]
    : INTERVALO_ERRO_DIAS;
  return { streak, due_at: new Date(agora.getTime() + dias * DIA).toISOString() };
}

/**
 * O que vai aparecer na sessão de agora.
 *
 * Ordem de prioridade, e cada uma tem motivo:
 *   1. o que JÁ VENCEU, do mais atrasado para o menos — atrasado é o que está
 *      mais perto de ser esquecido de vez;
 *   2. o que nunca voltou, com o que a pessoa ERROU na lição na frente;
 *   3. entre iguais, a lição mais antiga primeiro.
 *
 * Quem acertou na lição também volta — só depois. Repescar só erro vira
 * revisão do que a pessoa já sabe que não sabe, e o esquecimento não pergunta
 * se você acertou da primeira vez.
 */
export function escolherRepescagem(
  candidatos: Candidato[],
  agora: Date,
  limite: number = TAMANHO_SESSAO,
): Candidato[] {
  const t = agora.getTime();

  const maduros = candidatos.filter((c) => {
    // Já agendado: só entra quando vence.
    if (c.due_at) return new Date(c.due_at).getTime() <= t;
    // Nunca voltou: respeita a carência desde a conclusão da lição.
    return new Date(c.concluida_em).getTime() + CARENCIA_DIAS * DIA <= t;
  });

  const peso = (c: Candidato) => (c.due_at ? 0 : c.errou_na_licao ? 1 : 2);
  const quando = (c: Candidato) => new Date(c.due_at ?? c.concluida_em).getTime();

  const ordenados = maduros.sort(
    (a, b) => peso(a) - peso(b) || quando(a) - quando(b) || a.ordem - b.ordem,
  );

  const escolhidos: Candidato[] = [];
  const porLicao = new Map<string, number>();
  for (const c of ordenados) {
    if (escolhidos.length >= limite) break;
    const n = porLicao.get(c.lesson_key) ?? 0;
    if (n >= MAX_POR_LICAO) continue;
    porLicao.set(c.lesson_key, n + 1);
    escolhidos.push(c);
  }

  // Se a trava por lição deixou a sessão curta demais, ela cede — sessão de
  // uma pergunta só não é prática. Variedade é preferência, não invariante.
  if (escolhidos.length < limite) {
    for (const c of ordenados) {
      if (escolhidos.length >= limite) break;
      if (!escolhidos.includes(c)) escolhidos.push(c);
    }
  }
  return escolhidos;
}
