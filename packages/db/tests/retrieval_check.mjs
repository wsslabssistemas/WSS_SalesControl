/**
 * A escolha da técnica, medida sem IA.
 *
 * O motor faz duas coisas antes de qualquer token ser gasto: escolhe QUAIS
 * entradas da biblioteca entram no contexto (`lib/match`) e resolve QUAL
 * ESCOLA governa a situação (`entrada.school ?? strategy_map[categoria]`).
 * Se essa parte erra, nenhum prompt salva — e ela é determinística, então dá
 * para testar de graça e a cada push.
 *
 * Cada caso abaixo declara o VALOR ESPERADO: a mensagem que um cliente real
 * mandaria, a categoria que deveria vencer e a escola que deveria governar.
 * "Parece certo" não é critério.
 *
 *   node packages/db/tests/retrieval_check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

// ---------------------------------------------------------------------------
// O ALGORITMO VEM DO APP, não de uma cópia.
//
// Até ago/2026 este arquivo mantinha uma reimplementação "fiel" do casamento,
// com um comentário admitindo o risco: se mudasse lá e não aqui, o teste
// passaria a medir um algoritmo que não está no ar. Na primeira vez que o
// ranking foi mexido de verdade, foi exatamente o que quase aconteceu.
// O Node lê TypeScript direto, então a duplicação não tinha mais motivo.
// ---------------------------------------------------------------------------
const { rankEntries } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/match.ts")).href
);

// ---------------------------------------------------------------------------
// OS CASOS. Mensagem real → o que o motor DEVE escolher.
// ---------------------------------------------------------------------------
const CASOS = [
  // Preço: em ticket baixo pode fechar; em ticket alto tem que descobrir antes.
  { skill: "barbearia", msg: "quanto ta o corte?", categoria: "pricing", escola: "oferta_valor" },
  { skill: "industria", msg: "me passa o preco do metro", categoria: "pricing", escola: "consultiva_spin" },
  { skill: "clinica", msg: "quanto custa um implante?", categoria: "pricing", escola: "consultiva_spin" },

  // Objeção de preço: negociação, nunca desconto reflexo.
  { skill: "sob_medida", msg: "achei caro esse orcamento", categoria: "objections", escola: "negociacao_voss" },
  { skill: "distribuidora", msg: "ta caro, o outro faz mais barato", categoria: "objections", escola: "negociacao_voss" },

  // A objeção nº1 da indústria brasileira.
  { skill: "industria", msg: "o importado sai mais barato que o seu", categoria: "objections", escola: "negociacao_voss" },

  // REGRESSÃO do ruído de ranking (ago/2026). Mensagem real da bateria com
  // IA: a entrada de INDECISÃO vencia porque a frase tem "amostra",
  // "desenvolvimento", "aprovou" e "como" — seis palavras banais espalhadas
  // pelos 7 gatilhos dela, contra as três que definem a mensagem
  // ("importado", "sai", "barato"). Importa mais do que parecia: a 1ª entrada
  // é quem VETA o que o motor pode afirmar.
  {
    skill: "industria",
    msg: "Bom dia. Recebi a amostra e o pessoal do desenvolvimento aprovou, mas o importado sai bem mais barato. Como fica?",
    categoria: "objections",
    escola: "negociacao_voss",
    primeiro: true,
  },

  // INDECISÃO — o cliente concordou e travou. Não é objeção.
  { skill: "sob_medida", msg: "vou pensar e depois te falo", categoria: "commitment_offer", escola: "indecisao_jolt" },
  // Este caso era "preciso pensar, vou conversar em casa" e cobrava
  // indecisão. A mensagem carrega DOIS sinais — medo ("preciso pensar") e
  // outra pessoa na decisão ("vou conversar em casa") — e a segunda metade é,
  // literalmente, o gatilho inteiro da entrada do decisor. Cobrar um vencedor
  // ali é declarar como verdade uma escolha que a própria curadoria não faz:
  // o M3 deu a frase de casa ao decisor e o medo à indecisão, de propósito.
  // Virou dois casos de sinal único — cobre mais, e cada um tem uma resposta
  // defensável. Na mensagem misturada as duas continuam chegando ao modelo.
  { skill: "clinica", msg: "tenho medo de nao dar certo, preciso pensar", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "clinica", msg: "vou conversar em casa antes de decidir", categoria: "objections", escola: "negociacao_voss" },
  { skill: "industria", msg: "vou aguardar a proxima colecao", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "academia", msg: "vou pensar com calma", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "escola_esportiva", msg: "vou ver com meu marido", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "automacao", msg: "vou levar para a diretoria", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "barbearia", msg: "depois eu marco, qualquer coisa eu chamo", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "distribuidora", msg: "vou pensar, preciso ver com o socio", categoria: "commitment_offer", escola: "indecisao_jolt" },

  // AUTOSSERVIÇO — quem não quer conversar.
  { skill: "industria", msg: "so me manda a ficha tecnica, nao precisa ligar", categoria: "catalog", escola: "consultiva_spin" },
  { skill: "distribuidora", msg: "prefiro por escrito, sem visita por enquanto", categoria: "catalog", escola: "consultiva_spin" },

  // Retenção e recompra.
  { skill: "industria", msg: "esse cliente nao repoe ha meses", categoria: "retention", escola: "cadencia_blount" },
  { skill: "barbearia", msg: "faz tempo que ele nao aparece", categoria: "retention", escola: "cadencia_blount" },

  // Agenda e disponibilidade.
  { skill: "barbearia", msg: "tem horario hoje?", categoria: "availability", escola: "fechamento_classico" },
  { skill: "industria", msg: "para quando fica pronto?", categoria: "availability", escola: "negociacao_voss" },

  // OFICINA (10º segmento, ago/2026). O sintoma não é pedido de serviço, e a
  // objeção nº 1 não é preço — é desconfiança fantasiada de opinião técnica.
  { skill: "oficina", msg: "quanto custa trocar a embreagem do meu carro?", categoria: "pricing", escola: "consultiva_spin" },
  { skill: "oficina", msg: "esta fazendo um barulho quando eu freio", categoria: "goal_matching", escola: "consultiva_spin" },
  { skill: "oficina", msg: "na outra oficina fizeram por menos", categoria: "objections", escola: "negociacao_voss" },
  { skill: "oficina", msg: "meu primo disse que e so a vela", categoria: "objections", escola: "negociacao_voss" },
  { skill: "oficina", msg: "vou pensar e te falo depois", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "oficina", msg: "quero a peca velha de volta, nao autorizei isso", categoria: "limits_and_ethics", escola: "relacionamento_carnegie" },

  // SALÃO DE BELEZA (11º). A prova de que o strategy_map faz efeito: a MESMA
  // pergunta de preço resolve para escolas OPOSTAS em barbearia e salão,
  // porque na barbearia o preço fecha e aqui ele depende de ver o cabelo.
  { skill: "salao_beleza", msg: "quanto custa a progressiva?", categoria: "pricing", escola: "consultiva_spin" },
  { skill: "salao_beleza", msg: "ja fiz hene, posso fazer progressiva?", categoria: "limits_and_ethics", escola: "relacionamento_carnegie" },
  { skill: "salao_beleza", msg: "quero ficar assim, mandei a foto", categoria: "goal_matching", escola: "consultiva_spin" },
  { skill: "salao_beleza", msg: "vou ver e te falo depois", categoria: "commitment_offer", escola: "indecisao_jolt" },
  { skill: "salao_beleza", msg: "minha amiga faz por menos", categoria: "objections", escola: "negociacao_voss" },
  { skill: "salao_beleza", msg: "por que precisa dar sinal antes?", categoria: "commitment_offer", escola: "fechamento_classico" },
  { skill: "salao_beleza", msg: "a raiz apareceu, esta na hora do retoque", categoria: "retention", escola: "cadencia_blount" },

  // ENERGIA SOLAR — casos vindos da REVISÃO DO ESPECIALISTA (ago/2026).
  // O primeiro é a pergunta que ele disse receber toda semana e que a
  // biblioteca não tinha; o segundo é a inversão de processo (homologar
  // antes de comprar) que virou etapa da jornada.
  { skill: "energia_solar", msg: "posso enviar a geracao para outro endereco?", categoria: "goal_matching", escola: "consultiva_spin" },
  { skill: "energia_solar", msg: "quando eu compro o material do kit?", categoria: "availability", escola: "consultiva_spin" },

  // Fornecedor atual: entrar pela fresta, não pedir substituição.
  { skill: "industria", msg: "ja tenho fornecedor, estou atendido", categoria: "objections", escola: "negociacao_voss" },
  { skill: "distribuidora", msg: "ja tenho fornecedor", categoria: "objections", escola: "negociacao_voss" },
];

// ---------------------------------------------------------------------------
function readEnv() {
  const env = {};
  for (const l of fs.readFileSync(path.join(ROOT, "apps/web/.env.local"), "utf8").split(/\r?\n/)) {
    const i = l.indexOf("=");
    if (i > 0 && !l.trim().startsWith("#")) env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = readEnv();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: skills } = await db.from("skills").select("key, manifest");
const mapas = Object.fromEntries((skills ?? []).map((s) => [s.key, s.manifest?.strategy_map ?? {}]));

const { data: entradas } = await db
  .from("knowledge_entries")
  .select("skill_key, category, school, trigger_questions, strategy, technique, answer")
  .is("tenant_id", null)
  .eq("source", "skill_seed")
  .eq("status", "active");

const porSkill = {};
for (const e of entradas ?? []) (porSkill[e.skill_key] ??= []).push(e);

// CONTRATO DO TESTE: o motor manda até 8 entradas para o modelo, então exigir
// que a certa seja sempre a 1ª mede algo que o produto não promete. O que
// importa é que a técnica certa CHEGUE com destaque — por isso o critério é
// estar entre as 3 primeiras. O 1º lugar é impresso sempre, para enxergar
// deriva antes de virar problema.
const POSICOES = 3;

let falhas = 0;
console.log(`mensagem → 1º lugar (esperado nas ${POSICOES} primeiras)\n`);
for (const caso of CASOS) {
  const ranked = rankEntries(caso.msg, porSkill[caso.skill] ?? []);

  const escolaDe = (e) => (e ? e.school ?? mapas[caso.skill]?.[e.category] ?? null : null);
  const top = ranked[0]?.entry;
  const topo = ranked.slice(0, POSICOES);
  const achou = topo.findIndex(
    (x) => x.entry.category === caso.categoria && escolaDe(x.entry) === caso.escola,
  );

  // `primeiro: true` exige o 1º lugar, não só o pódio. Reservado para os casos
  // em que a entrada certa é a que precisa VETAR — a regra do veto só olha a
  // primeira, então nesses o 2º lugar é uma falha, não um "quase".
  const reprovado = achou < 0 || (caso.primeiro && achou !== 0);
  if (reprovado) falhas++;
  const marca = reprovado ? "✗" : achou === 0 ? "✓" : "~";
  console.log(
    `${marca} [${caso.skill}] "${caso.msg.slice(0, 64)}${caso.msg.length > 64 ? "…" : ""}"  →  ` +
      `${top?.category ?? "(nada casou)"} / ${escolaDe(top) ?? "—"}` +
      (achou > 0 ? `   (o esperado veio em ${achou + 1}º)` : ""),
  );
  if (reprovado) {
    console.log(`     esperado: ${caso.categoria} / ${caso.escola}${caso.primeiro ? " EM 1º" : ""}`);
    console.log(
      `     top ${POSICOES}: ${topo.map((x) => `${x.entry.category}/${escolaDe(x.entry)} (${x.score.toFixed(1)})`).join(" · ") || "(vazio)"}`,
    );
  }
}

console.log(`\n${CASOS.length - falhas}/${CASOS.length} casos corretos`);

// ---------------------------------------------------------------------------
// SEGUNDA MEDIDA: cada gatilho curado deve trazer a PRÓPRIA entrada em 1º.
//
// Os casos acima são escolhidos à mão e cobrem o que a gente lembrou de cobrir.
// Esta parte é cega e cobre a biblioteca inteira: todo gatilho é uma pergunta
// que alguém escreveu de propósito para uma entrada, então trazer outra entrada
// na frente é um defeito — quase sempre porque DUAS entradas do mesmo segmento
// reivindicam a mesma frase.
//
// Foi exatamente o que aconteceu: "vou pensar" pertencia à entrada de indecisão
// E à de objeções em academia, e "vou conversar em casa" estava literalmente
// nas duas entradas da clínica. Nenhum ranking desempata dois donos. Esta
// medida teria apontado o dedo; os casos escolhidos a mão não apontaram.
//
// PISO: 95%. Medido em 1º/ago/2026 com 885 gatilhos: 95,5% (era 94,1% antes da
// correção do ranking). Os que sobram são gatilhos curtos demais para casar
// ("e so isso?"), não conflitos.
const PISO = 0.95;
let gatilhos = 0;
let noTopo = 0;
const conflitos = [];
for (const [skill, lista] of Object.entries(porSkill)) {
  for (const e of lista) {
    for (const g of e.trigger_questions ?? []) {
      gatilhos++;
      const primeiro = rankEntries(g, lista)[0]?.entry;
      if (primeiro === e) noTopo++;
      else if (primeiro) conflitos.push(`[${skill}] "${g}" → ${primeiro.category}/${primeiro.technique}`);
    }
  }
}
const taxa = gatilhos ? noTopo / gatilhos : 0;
console.log(
  `\n${noTopo}/${gatilhos} gatilhos trazem a própria entrada em 1º (${(taxa * 100).toFixed(1)}%, piso ${PISO * 100}%)`,
);
if (taxa < PISO) {
  falhas++;
  console.log("✗ abaixo do piso. Os 10 primeiros conflitos:");
  for (const c of conflitos.slice(0, 10)) console.log(`     ${c}`);
}

console.log(falhas ? "\n✗ FALHOU" : "\n✓ PASSOU — a escolha de técnica está coerente");
process.exit(falhas ? 1 : 0);
