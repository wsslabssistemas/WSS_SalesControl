// O QUE FUNCIONA AQUI — a medição que fecha o ciclo entre técnica e desfecho.
//
// Sem banco e sem imports, para ser testável em Node puro.
//
// ⚠ ESTA PEÇA EXISTE PARA DIZER "AINDA NÃO SEI" NA MAIOR PARTE DAS VEZES.
//
// O pedido do fundador foi "o sistema deve entender qual técnica funciona e
// escolher ela quando a situação se repetir". Ele mesmo trouxe a objeção
// junto, e ela está certa: *"ele usou a técnica 1x e conseguiu uma matrícula,
// aí vai seguir só nessa? teria que ter dado suficiente para decidir."*
//
// O banco prova a objeção melhor que qualquer argumento. Contando fechamento
// puro nos 854 desfechos do piloto:
//
//   challenger .............. 14 usos, 1 ganhou → 7,1%  ← "campeã"
//   consultiva_spin ........ 185 usos, 6 ganhou → 3,2%
//   fechamento_classico .... 746 usos, 17 ganhou → 2,3%
//   negociacao_voss ......... 55 usos, 0 ganhou → 0,0%  ← "inútil"
//
// Um ranking ingênuo mandaria usar Challenger sempre — com base em UM
// fechamento — e aposentaria Voss, que é escola de negociação, etapa que
// pouca gente alcança. É exatamente o erro que o fundador já derrubou uma vez
// em ago/2026, quando Cialdini "liderou" com 1 fechamento em 53 pessoas.
//
// QUATRO MOTIVOS PELOS QUAIS O DESENHO INGÊNUO FALHA, e os quatro estão
// tratados aqui:
//
//   1. AMOSTRA. 14 fechamentos no total. Nada sobre conversão é dizível.
//      → piso de amostra + intervalo de confiança, e silêncio abaixo dele.
//   2. ATRIBUIÇÃO. `interactions.schools` é ARRAY: ~2,4 escolas por
//      atendimento, porque cada resposta usa várias juntas. "Qual converteu"
//      não existe como pergunta.
//      → mede-se PRESENÇA contra a base, nunca crédito exclusivo.
//   3. ORIGEM CONTAMINA. Convênio tem 15% de perda contra 46% do WhatsApp —
//      são coisas diferentes somadas numa taxa só.
//      → o recorte é obrigatório na chamada, não opcional.
//   4. CAÇA-NÍQUEIS. Se o motor sempre usa o vencedor atual, o dado sobre as
//      outras congela para sempre — e o vencedor pode estar ganhando por
//      sorte. → `deveExplorar()`, no fim deste arquivo.
//
// E A DECISÃO QUE GOVERNA TUDO: **a curadoria continua no comando.** A
// biblioteca carrega evidência de milhares de vendas (Rackham, Cialdini,
// Blount) e `sales_schools` guarda `when_to_use`, `when_to_avoid` e a FORÇA
// da evidência de cada uma. O dado de UMA empresa não derruba isso — ele
// refina dentro do recorte, e só quando tem peso. Medição aqui responde
// "concorda, discorda ou ainda não sei", nunca "troque a técnica".

/** Um desfecho observado, já resolvido para escolas e recorte. */
export type Evento = {
  /** As escolas presentes naquele atendimento. Array, e é o ponto. */
  escolas: string[];
  /** Canônico (`0044`): respondeu | avancou | ganhou | perdeu_decisao | perdeu_silencio */
  desfecho: string;
  origem: string | null;
  etapa: string | null;
};

/**
 * Abaixo disto, taxa não vira número na tela.
 *
 * Mesma disciplina do `N_MINIMO_CONVERSAO` do placar, e pelo mesmo motivo:
 * percentual, uma vez mostrado, é lido como verdade. 30 é o piso onde a
 * margem de erro de uma proporção começa a caber num palmo.
 */
export const N_MINIMO_ESCOLA = 30;

/**
 * AS DUAS MÉTRICAS, e por que a ordem entre elas importa.
 *
 * `fechamento` é a que todo mundo quer e a que quase nunca sustenta — 14
 * eventos no piloto inteiro.
 *
 * `resposta` é a que sustenta HOJE (centenas de eventos) **e é a que a tese
 * do produto pede**: a perda medida é silêncio, não objeção — perde-se 3,5×
 * mais gente por falta de follow-up do que por objeção. Medir se a mensagem
 * TIROU A PESSOA DO SILÊNCIO mede exatamente o que se quer consertar.
 *
 * Por isso `resposta` conta `perdeu_decisao` como SUCESSO: quem disse "não"
 * respondeu. Juntar o "não" com o silêncio esconderia a única coisa que dá
 * para consertar — e é o silêncio que se conserta.
 */
export type Metrica = "resposta" | "fechamento";

const sucesso = (m: Metrica, desfecho: string) =>
  m === "fechamento" ? desfecho === "ganhou" : desfecho !== "perdeu_silencio";

export type Medida = {
  escola: string;
  usos: number;
  sucessos: number;
  /** null quando a amostra não sustenta. Nunca 0 nesse caso — null é diferente de zero. */
  taxa: number | null;
  /** Margem de erro em pontos percentuais (95%). null junto com a taxa. */
  margem: number | null;
  sustenta: boolean;
  /** "acima" / "abaixo" só quando os intervalos NÃO se tocam. */
  contraBase: "acima" | "abaixo" | "indistinto" | "nao_sei";
};

export type Leitura = {
  recorte: string;
  metrica: Metrica;
  base: { usos: number; sucessos: number; taxa: number | null; margem: number | null };
  escolas: Medida[];
  /** Frase pronta para a tela quando NADA sustenta. */
  aviso: string | null;
};

/**
 * Margem de erro de uma proporção, 95%.
 *
 * É estatística de manual (1,96 × erro padrão), não invenção — e é o que
 * transforma "58% contra 39%" em "58% ±7 contra 39% ±3", que é uma frase que
 * dá para defender. Sem a margem, dois números viram um pódio.
 */
function margemDe(p: number, n: number): number {
  if (n <= 0) return 1;
  return 1.96 * Math.sqrt((p * (1 - p)) / n);
}

/**
 * Mede as escolas dentro de UM recorte.
 *
 * `eventos` já vem filtrado pelo recorte (origem, etapa, período) — filtrar
 * aqui dentro convidaria a chamar sem filtro e somar convênio com WhatsApp,
 * que é o erro que o fundador pegou em agosto.
 */
export function medir(
  eventos: Evento[],
  metrica: Metrica,
  recorte = "todos os contatos",
): Leitura {
  const baseN = eventos.length;
  const baseS = eventos.filter((e) => sucesso(metrica, e.desfecho)).length;
  const baseSustenta = baseN >= N_MINIMO_ESCOLA;
  const baseTaxa = baseSustenta ? baseS / baseN : null;
  const baseMargem = baseTaxa === null ? null : margemDe(baseTaxa, baseN);

  const porEscola = new Map<string, { usos: number; sucessos: number }>();
  for (const e of eventos) {
    // `new Set` porque a mesma escola repetida no array de um atendimento é
    // um atendimento só. Sem isso, um registro com ["spin","spin"] contaria
    // dobrado e inflaria justamente a escola mais anotada.
    for (const esc of new Set(e.escolas)) {
      const cur = porEscola.get(esc) ?? { usos: 0, sucessos: 0 };
      cur.usos++;
      if (sucesso(metrica, e.desfecho)) cur.sucessos++;
      porEscola.set(esc, cur);
    }
  }

  const escolas: Medida[] = [...porEscola.entries()]
    .map(([escola, v]) => {
      const sustenta = v.usos >= N_MINIMO_ESCOLA;
      const taxa = sustenta ? v.sucessos / v.usos : null;
      const margem = taxa === null ? null : margemDe(taxa, v.usos);

      // ⚠ SÓ DIZ "MELHOR" QUANDO OS INTERVALOS NÃO SE TOCAM.
      //
      // Duas taxas diferentes não são uma diferença. 58% e 52% com margem de
      // 7 pontos cada são o mesmo número dito duas vezes — e chamar isso de
      // pódio é o folclore que este produto existe para não repetir.
      let contraBase: Medida["contraBase"] = "nao_sei";
      if (taxa !== null && margem !== null && baseTaxa !== null && baseMargem !== null) {
        if (taxa - margem > baseTaxa + baseMargem) contraBase = "acima";
        else if (taxa + margem < baseTaxa - baseMargem) contraBase = "abaixo";
        else contraBase = "indistinto";
      }
      return { escola, usos: v.usos, sucessos: v.sucessos, taxa, margem, sustenta, contraBase };
    })
    // Ordena por USO, não por taxa. Ordenar por taxa é montar o pódio que a
    // amostra não sustenta — e a primeira linha de uma lista é lida como
    // recomendação, independentemente do que estiver escrito ao lado.
    .sort((a, b) => b.usos - a.usos || a.escola.localeCompare(b.escola, "pt-BR"));

  const nenhumaSustenta = escolas.every((e) => !e.sustenta);
  const aviso = !baseSustenta
    ? `Amostra pequena neste recorte (${baseN} ${baseN === 1 ? "desfecho" : "desfechos"}). Nada aqui sustenta um percentual — a biblioteca continua decidindo.`
    : nenhumaSustenta
      ? `Nenhuma escola foi usada ${N_MINIMO_ESCOLA} vezes neste recorte. Dá para ver o volume, não a comparação.`
      : null;

  return {
    recorte,
    metrica,
    base: { usos: baseN, sucessos: baseS, taxa: baseTaxa, margem: baseMargem },
    escolas,
    aviso,
  };
}

/**
 * Separa os eventos por origem — o recorte que o fundador exigiu, e com razão.
 *
 * Contato de convênio tem 15% de perda contra 46% do WhatsApp: ele não está
 * comprando, está usando um benefício que a empresa dele já paga. Somar as
 * duas origens numa taxa só mede duas coisas diferentes e chama de uma.
 */
export function porOrigem(eventos: Evento[]): Map<string, Evento[]> {
  const m = new Map<string, Evento[]>();
  for (const e of eventos) {
    const k = e.origem?.trim() || "sem origem";
    m.set(k, [...(m.get(k) ?? []), e]);
  }
  return m;
}

/**
 * ⚠ O CAÇA-NÍQUEIS: quando testar em vez de repetir o vencedor.
 *
 * Se o motor sempre usa a escola que está ganhando, o dado sobre as outras
 * **congela no dia em que ele decidir** — e ele pode ter decidido por sorte.
 * É o problema clássico de explorar × explorar, e ignorá-lo é como um sistema
 * que "aprende" fica preso na primeira coincidência que viu.
 *
 * A regra aqui é deliberadamente simples e conservadora: **explora enquanto
 * não sabe.** Quanto menor a amostra da alternativa, mais chance de ela ser
 * testada; quando todas passarem do piso, a exploração cai para um mínimo
 * que nunca zera — porque mercado muda, e uma verdade medida em março pode
 * ser mentira em novembro.
 *
 * Não decide sozinha: devolve SE vale explorar. Quem escolhe a alternativa é
 * a biblioteca, dentro do `when_to_use` da situação — explorar nunca
 * significa usar técnica que a curadoria desaconselha ali.
 */
export const EXPLORACAO_MINIMA = 0.1;

export function deveExplorar(
  usosDaAlternativa: number,
  sorteio: number = Math.random(),
): boolean {
  if (usosDaAlternativa >= N_MINIMO_ESCOLA) return sorteio < EXPLORACAO_MINIMA;
  // Abaixo do piso a chance cresce conforme falta amostra: com 0 usos
  // explora quase sempre, com 29 explora pouco mais que o mínimo.
  const falta = (N_MINIMO_ESCOLA - usosDaAlternativa) / N_MINIMO_ESCOLA;
  return sorteio < EXPLORACAO_MINIMA + (1 - EXPLORACAO_MINIMA) * falta;
}

/**
 * A frase que vai para o motor — e o que ela NUNCA diz.
 *
 * Devolve `null` quando não há o que acrescentar, e `null` é a resposta certa
 * na maior parte dos casos. O prompt já recebe a biblioteca curada; o que
 * esta função acrescenta é observação da casa, marcada como observação.
 *
 * Ela nunca manda trocar de técnica. A biblioteca decide; isto informa.
 */
export function notaParaOMotor(leitura: Leitura): string | null {
  const dizíveis = leitura.escolas.filter((e) => e.contraBase !== "nao_sei" && e.contraBase !== "indistinto");
  if (!dizíveis.length) return null;
  const m = leitura.metrica === "resposta" ? "tirar a pessoa do silêncio" : "fechar";
  const linhas = dizíveis.map((e) =>
    `- ${e.escola}: ${(e.taxa! * 100).toFixed(0)}% (±${(e.margem! * 100).toFixed(0)}, n=${e.usos}) — ${e.contraBase === "acima" ? "acima" : "abaixo"} da média da casa`,
  );
  return `OBSERVADO NESTA EMPRESA (${leitura.recorte}), para ${m}:\n${linhas.join("\n")}\n` +
    `→ Isto é observação, não instrução. A técnica da biblioteca continua valendo; use isto só para escolher entre alternativas que a biblioteca já considera adequadas à situação.`;
}
