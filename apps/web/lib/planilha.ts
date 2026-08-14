// O LEITOR DA PLANILHA — transforma uma aba em linhas comparáveis.
//
// Sem rede: recebe o TEXTO do CSV e devolve estrutura. Quem busca é o
// chamador, e isso é de propósito — os dois caminhos de acesso decididos em
// 13/ago (conta de serviço ou CSV exportado à mão) entregam o mesmo texto, e
// nenhum deles precisa mudar uma linha daqui.
//
// ⚠ O QUE ESTE ARQUIVO NÃO FAZ: aplicar nada. Ele lê e DECLARA O QUE
// ENTENDEU. A aplicação é `lib/sincronizacao.ts`, que compara com o banco e
// bloqueia quando a fonte não é confiável.
//
// A REGRA QUE GOVERNA O ARQUIVO: **planilha lida errado em silêncio é pior
// que planilha não lida.** Este repositório já pagou por isso três vezes — o
// `;` perdido que sumiu com 3 entradas do seed da barbearia, o carregador que
// lia só o último `values`, e o PostgREST cortando em 1.000 linhas sem avisar.
// Todas se apresentaram como sucesso. Por isso `ler()` devolve o que
// reconheceu, o que ignorou e por quê — e nunca adivinha a chave.

import { parseCsv, parseDataBR, detectColumns } from "./csv.ts";
import type { LinhaDaFonte } from "./sincronizacao.ts";

/** Cabeçalhos que servem como CHAVE de reconciliação, em ordem de confiança. */
const CHAVE_H = ["codigo", "código", "cod", "matricula", "matrícula", "id", "registro"];

const strip = (s: string) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const soDigitos = (s: string) => (s ?? "").replace(/\D/g, "");

export type Leitura = {
  linhas: LinhaDaFonte[];
  /** O que o leitor entendeu — vai para a tela ANTES de qualquer aplicação. */
  entendeu: {
    chave: string;
    nome: string | null;
    vigencia: string | null;
    /** Total de linhas de dado (fora o cabeçalho). */
    lidas: number;
  };
  /** Linhas descartadas, com o motivo. Nunca em silêncio. */
  ignoradas: { linha: number; motivo: string }[];
  /** Impede o uso da aba. Preenchido = não dá para comparar. */
  erro: string | null;
};

/**
 * Lê uma aba.
 *
 * `exigeVigencia` separa os dois tipos de aba do fundador: `Matriculas` tem
 * vigência e alimenta a comparação de contratos; `Cadastros` e as de convênio
 * não têm, e servem para cruzamento e prospecção. Pedir vigência de todas
 * faria as três abas de cadastro falharem por um campo que elas não deviam
 * mesmo ter.
 */
export function ler(csv: string, opts: { exigeVigencia?: boolean } = {}): Leitura {
  const linhas = parseCsv(csv);
  if (linhas.length < 2) {
    return {
      linhas: [], ignoradas: [], erro: "A aba veio vazia ou só com cabeçalho.",
      entendeu: { chave: "—", nome: null, vigencia: null, lidas: 0 },
    };
  }

  const cab = linhas[0];
  const h = cab.map(strip);
  const det = detectColumns(cab);

  // ⚠ A CHAVE NUNCA É ADIVINHADA.
  //
  // Nome e telefone o detector pode chutar pela posição, porque errar ali
  // produz um cadastro torto que alguém vê. Errar a CHAVE é outra classe: a
  // comparação casaria pessoa errada com pessoa errada e o histórico sairia
  // trocado — em silêncio, e sem jeito de descobrir depois. Então ou existe
  // coluna de código, ou o telefone assume o papel explicitamente, ou para.
  const iChave = h.findIndex((c) => CHAVE_H.some((k) => c === k || c.startsWith(k)));
  const usaTelefone = iChave < 0 && det.phoneIdx >= 0 && !det.adivinhou.telefone;
  if (iChave < 0 && !usaTelefone) {
    return {
      linhas: [], ignoradas: [],
      erro:
        "Não achei coluna de código nem de telefone com cabeçalho reconhecível. " +
        "A comparação precisa de uma chave estável para não trocar o histórico de uma pessoa pelo de outra — " +
        `renomeie uma coluna para "Código" (ou "Matrícula") e tente de novo. Cabeçalhos lidos: ${cab.join(" | ")}`,
      entendeu: { chave: "—", nome: null, vigencia: null, lidas: 0 },
    };
  }

  if (opts.exigeVigencia && det.endIdx < 0) {
    return {
      linhas: [], ignoradas: [],
      erro:
        "Esta aba deveria ter a data de VENCIMENTO do contrato e eu não achei a coluna. " +
        "Sem ela não dá para saber quem renovou nem quem está a vencer — e deduzir seria inventar. " +
        `Cabeçalhos lidos: ${cab.join(" | ")}`,
      entendeu: { chave: "—", nome: null, vigencia: null, lidas: 0 },
    };
  }

  const out: LinhaDaFonte[] = [];
  const ignoradas: { linha: number; motivo: string }[] = [];
  const vistas = new Set<string>();

  for (let i = 1; i < linhas.length; i++) {
    const r = linhas[i];
    const bruta = iChave >= 0 ? (r[iChave] ?? "") : (r[det.phoneIdx] ?? "");
    // Código costuma vir com zero à esquerda, espaço ou apóstrofo do Excel.
    const chave = usaTelefone ? soDigitos(bruta) : bruta.trim().replace(/^'/, "");
    if (!chave) { ignoradas.push({ linha: i + 1, motivo: "sem chave (código/telefone vazio)" }); continue; }

    // ⚠ CHAVE REPETIDA NÃO É DESCARTE SILENCIOSO.
    //
    // A planilha da academia é um LOG: a mesma pessoa aparece uma vez por
    // contrato. Para vigência vale o contrato de MAIOR data de fim — e ficar
    // com a primeira linha encontrada daria o contrato ANTIGO como verdade,
    // que é exatamente o defeito da Maria Isabel reintroduzido pela porta dos
    // fundos.
    const vigencia = det.endIdx >= 0 ? parseDataBR(r[det.endIdx] ?? "") : null;
    if (vistas.has(chave)) {
      const ja = out.find((l) => l.chave === chave)!;
      if (vigencia && (!ja.vigencia_ate || vigencia > ja.vigencia_ate)) {
        ja.vigencia_ate = vigencia;
        ignoradas.push({ linha: i + 1, motivo: `chave ${chave} repetida — ficou a vigência mais longa (${vigencia})` });
      } else {
        ignoradas.push({ linha: i + 1, motivo: `chave ${chave} repetida — vigência igual ou mais curta, descartada` });
      }
      continue;
    }

    vistas.add(chave);
    out.push({
      chave,
      nome: (r[det.nameIdx] ?? "").trim() || null,
      vigencia_ate: vigencia,
    });
  }

  return {
    linhas: out,
    ignoradas,
    erro: null,
    entendeu: {
      chave: iChave >= 0 ? (cab[iChave] ?? "").trim() : `${det.phoneLabel} (telefone, na falta de código)`,
      nome: det.adivinhou.nome ? null : (cab[det.nameIdx] ?? "").trim(),
      vigencia: det.endIdx >= 0 ? (cab[det.endIdx] ?? "").trim() : null,
      lidas: linhas.length - 1,
    },
  };
}
