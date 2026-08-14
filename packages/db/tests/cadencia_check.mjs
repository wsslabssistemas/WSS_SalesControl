/**
 * TODA ETAPA VIVA PRECISA SABER O QUE DIZER — sem banco e sem chave.
 *
 * ⚠ O DEFEITO QUE ESTA TRAVA GUARDA, e por que ele passou um ano invisível.
 *
 * Em 11/ago/2026, **39 das 80 etapas vivas** dos 15 segmentos não declaravam
 * cadência. Quando o toque vencia numa delas, o núcleo escrevia a própria
 * frase — *"Retomar o contato — ninguém falou com ele desde então."* — igual
 * para academia e para indústria, para um lead de mensalidade e para um
 * pedido de três mil metros de feltro.
 *
 * E não eram etapas de borda: eram **primeiro contato, descoberta, proposta e
 * negociação**. O miolo da venda. O produto que existe para vender técnica
 * estava mudo exatamente onde a técnica decide.
 *
 * **Por que ninguém viu:** não é erro, não é tela vazia, não é log. É uma
 * frase educada e plausível no lugar certo. O mesmo padrão do resto deste
 * repositório — o defeito se apresenta como funcionamento.
 *
 * A trava mede DUAS coisas, e a segunda é a que importa:
 *
 *   1. Toda etapa viva declara `cadence` ou, no mínimo, `goal`.
 *   2. **Os passos de uma cadência dizem coisas DIFERENTES.** Três toques
 *      repetindo a mesma frase é pior que um toque só: ensina o cliente a
 *      ignorar, e ensina o vendedor a desligar a régua. Cadência é escada,
 *      não eco — se o toque 3 diz o que o toque 1 já disse, não havia
 *      cadência, havia insistência.
 *
 * ESPERADO: 15/15 segmentos, 0 etapas mudas.
 *
 *   node packages/db/tests/cadencia_check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DIR = path.join(ROOT, "packages/skills");

let falhas = 0;
const erro = (m) => { falhas++; console.log(`✗ ${m}`); };

/** Normaliza para comparar intenção: sem acento, sem pontuação, minúscula. */
const chave = (s) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3).sort().join(" ");

const segmentos = fs.readdirSync(DIR).filter((d) =>
  fs.existsSync(path.join(DIR, d, "manifest.yaml")));

let vivas = 0, comCadencia = 0, passos = 0;

for (const seg of segmentos) {
  const m = YAML.parse(fs.readFileSync(path.join(DIR, seg, "manifest.yaml"), "utf8"));
  const stages = m?.journey?.stages ?? [];
  const cadencias = new Map((m?.cadences ?? []).map((c) => [c.key, c]));

  for (const st of stages) {
    // ⚠ ESTE FILTRO ESPELHA `computeDueTouches`, E TEM QUE ESPELHAR.
    //
    // A primeira versão usava a regra da RECOMPRA (`(terminal && !won) ||
    // lost`) e acusou 13 etapas a mais — todas `won` e `terminal`, como
    // "Carteira ativa" e "Cliente fiel". Elas não são mudas: o motor de
    // follow-up **pula terminal**, ponto, então cadência ali seria dado
    // morto. Quem fala com essa gente é a recompra, que usa outra regra.
    //
    // O erro foi meu e é o mesmo que o `retrieval_check` já pagou: **teste
    // que guarda uma cópia da regra diverge do código na primeira mudança.**
    // Aqui a cópia divergiu antes até de rodar uma vez. Se `computeDueTouches`
    // mudar o filtro, esta linha muda junto.
    //
    // O outro lado da moeda continua valendo, e está escrito em
    // `ESTADO_DO_PROJETO.md`: **cadência declarada em etapa terminal é dado
    // morto** — foi assim que a carteira fiel da barbearia sumiu da recompra.
    if (st.terminal || st.lost) continue;
    vivas++;

    if (!st.cadence && !st.goal) {
      erro(`${seg}/${st.key} — etapa viva sem \`cadence\` e sem \`goal\`: o motor não tem o que dizer, e vai cair no texto de último recurso do núcleo.`);
      continue;
    }
    if (!st.cadence) {
      // Aceito, mas é o piso: `goal` dá o assunto e não dá o RITMO. Um toque
      // repetido é o que o mercado já faz de errado.
      console.log(`· ${seg}/${st.key} — só \`goal\`, sem cadência. Funciona, mas não escalona.`);
      continue;
    }
    comCadencia++;

    const cad = cadencias.get(st.cadence);
    if (!cad) {
      erro(`${seg}/${st.key} — aponta para a cadência "${st.cadence}", que não existe no manifesto. Etapa fica muda em silêncio.`);
      continue;
    }
    const steps = cad.steps ?? [];
    if (steps.length === 0) {
      erro(`${seg}/${st.key} — cadência "${st.cadence}" sem passo nenhum.`);
      continue;
    }

    // O DIA TEM QUE AVANÇAR, e o motivo mudou junto com o motor (ago/2026).
    //
    // Antes: `computeDueTouches` pegava o ÚLTIMO passo vencido, então dois
    // passos no mesmo dia disparavam juntos e o segundo nunca era alcançado.
    // Hoje o passo é escolhido por CONTAGEM de toques e o vencimento sai do
    // intervalo entre um passo e o anterior — offset repetido daria intervalo
    // ZERO, e o núcleo teria que arredondar para 1 dia por conta própria.
    // Régua que só funciona porque o núcleo corrige o manifesto é régua que
    // mente sobre o que foi curado: melhor reprovar aqui.
    const dias = steps.map((s) => s.offset_days);
    for (let i = 1; i < dias.length; i++) {
      if (dias[i] <= dias[i - 1]) {
        erro(`${seg}/${st.cadence} — passo ${i + 1} cai no dia ${dias[i]}, que não é depois do dia ${dias[i - 1]}. Passo que não avança nunca dispara.`);
      }
    }

    // ⚠ A VERIFICAÇÃO QUE IMPORTA: os passos dizem coisas diferentes?
    const vistas = new Map();
    for (const [i, s] of steps.entries()) {
      passos++;
      const t = (s.intent ?? "").trim();
      if (t.length < 25) {
        erro(`${seg}/${st.cadence} passo ${i + 1} — intenção curta demais ("${t}"). O motor recebe isto como a única instrução do toque.`);
        continue;
      }
      const k = chave(t);
      if (vistas.has(k)) {
        erro(`${seg}/${st.cadence} — passo ${i + 1} repete o passo ${vistas.get(k) + 1}. Cadência é escada, não eco.`);
      } else {
        vistas.set(k, i);
      }
    }
  }
}

// ---------------------------------------------------------------------
// RENOVAÇÃO E RECOMPRA — os outros dois lugares onde o núcleo escrevia
// prosa de venda.
//
// A cadência era o buraco maior, mas não era o único. `computeRenovacoes`
// carregava três textos nascidos na academia ("pergunte o que ele já
// conseguiu que não conseguia") e `construirFila` carregava o da recompra —
// o mesmo para o corte de 21 dias da barbearia e para a reposição de estoque
// da distribuidora. Hábito pessoal de um lado, ruptura de prateleira do
// outro: conversas diferentes com a mesma frase.
//
// Cobrado de quem TEM a capacidade: só faz sentido exigir texto de renovação
// de quem declara `contract.enabled`, e texto de recompra de quem declara
// `recurrence`. Cobrar de todo mundo produziria curadoria de mentira para
// preencher trava — que é pior que trava nenhuma.
// ---------------------------------------------------------------------
let comContrato = 0, comCiclo = 0;
for (const seg of segmentos) {
  const m = YAML.parse(fs.readFileSync(path.join(DIR, seg, "manifest.yaml"), "utf8"));

  if (m?.contract?.enabled) {
    comContrato++;
    const r = m.contract.renewal;
    if (!r?.janelas?.length) {
      erro(`${seg} — tem contrato com vigência e não declara \`contract.renewal\`. As três janelas vão sair na voz do núcleo, que é genérica por construção.`);
    } else {
      const chaves = new Set(r.janelas.map((j) => j.key));
      for (const k of ["resultado", "continuidade", "condicao"]) {
        if (!chaves.has(k)) erro(`${seg} — \`contract.renewal\` não declara a janela "${k}".`);
      }
      // ⚠ A REGRA DE TÉCNICA, e ela vale em todo ramo: o PRIMEIRO toque não
      // fala de renovação, fala do resultado. Quem só aparece para cobrar
      // assinatura ensina o cliente a lembrar do produto como despesa.
      const prim = r.janelas.find((j) => j.key === "resultado");
      const t = (prim?.intencao ?? "").toLowerCase();
      if (t && /\brenov(ar|ação|ac)/.test(t) && !/n[ãa]o mencione/.test(t)) {
        erro(`${seg} — a janela "resultado" fala de renovação. O primeiro toque fala do RESULTADO; é isso que separa renovar de cobrar.`);
      }
      if (!r.vencido?.intencao) {
        erro(`${seg} — \`contract.renewal\` não declara o texto do vencido, que é o caso mais caro da lista.`);
      }
    }
  }

  if (m?.recurrence) {
    comCiclo++;
    const i = (m.recurrence.intent ?? "").trim();
    if (i.length < 25) {
      erro(`${seg} — tem ciclo de recompra e não declara \`recurrence.intent\`. O toque vai sair com a frase genérica do núcleo.`);
    }
  }
}

console.log(`\nSegmentos: ${segmentos.length} · etapas vivas: ${vivas} · com cadência: ${comCadencia} · passos curados: ${passos}`);
console.log(`Com contrato: ${comContrato} (renovação declarada) · com ciclo: ${comCiclo} (recompra declarada)`);
console.log(falhas === 0
  ? `✓ PASSOU — nenhuma etapa viva muda em ${segmentos.length} segmentos`
  : `✗ FALHOU — ${falhas} problema(s)`);
process.exit(falhas === 0 ? 0 : 1);
