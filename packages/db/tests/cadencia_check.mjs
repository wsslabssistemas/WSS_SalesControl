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

    // O DIA TEM QUE AVANÇAR. Dois passos no mesmo offset disparam juntos e o
    // segundo nunca é alcançado — `computeDueTouches` pega o ÚLTIMO vencido.
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

console.log(`\nSegmentos: ${segmentos.length} · etapas vivas: ${vivas} · com cadência: ${comCadencia} · passos curados: ${passos}`);
console.log(falhas === 0
  ? `✓ PASSOU — nenhuma etapa viva muda em ${segmentos.length} segmentos`
  : `✗ FALHOU — ${falhas} problema(s)`);
process.exit(falhas === 0 ? 0 : 1);
