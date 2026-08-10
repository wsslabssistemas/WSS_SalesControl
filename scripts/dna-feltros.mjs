#!/usr/bin/env node
// DNA DA FELTROS BANDEIRANTES, escrito pela própria especialista.
//
// POR QUE ESTE SCRIPT EXISTE, e por que ele NÃO cria a empresa
// A Jeniffer respondeu as 20 situações do kit de revisão da `industria`, e as
// respostas dela vieram cheias de FATOS DA EMPRESA misturados com opinião
// sobre a técnica. Ela não sabia que estava preenchendo um DNA — só respondeu
// "como você diria" com a realidade da casa dela.
//
// Transcrever isso é legítimo: são as palavras DELA sobre a empresa DELA.
// Inventar o que ela não disse não seria — e por isso os campos que ela não
// tocou continuam VAZIOS aqui, para o motor escalar em vez de afirmar.
//
// A EMPRESA ELA CRIA. Este script só preenche depois. O fundador já recusou,
// com razão, o ritmo de o fabricante criar a empresa do cliente antes de ele
// chegar: "as pessoas têm que criar a conta e conseguir cadastrar a empresa".
// Então aqui o script FALHA se a empresa não existir, em vez de criá-la.
//
// O efeito para ela é o melhor dos dois: cria a própria empresa pelo caminho
// normal e encontra as próprias respostas já dentro do sistema.
//
//   node scripts/dna-feltros.mjs                  # simula
//   node scripts/dna-feltros.mjs --aplicar

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

function env(k) {
  if (process.env[k]) return process.env[k];
  const t = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
  const l = t.split(/\r?\n/).find((x) => x.startsWith(k + "="));
  return l ? l.slice(k.length + 1).trim().replace(/^["']|["']$/g, "") : null;
}

const APLICAR = process.argv.includes("--aplicar");
const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------
// Cada valor abaixo veio da planilha de revisão. O número entre colchetes é
// a situação em que ela escreveu aquilo — para conferir depois sem depender
// da memória de ninguém.
// ---------------------------------------------------------------------
const SECOES = {
  produto: {
    // [2] "necessárias para conseguirmos identificar qual o melhor feltro
    //      para a aplicação do cliente"
    especificacao:
      "Gramatura, composição e características de cada feltro vão no orçamento. " +
      "Elas são necessárias para identificar o feltro certo para a aplicação do " +
      "cliente, e servem de garantia para os dois lados se ele quiser devolver " +
      "um produto sem defeito.",
    // [8] "Enviamos laudos, fichas técnicas... Se não temos algum ensaio,
    //      fornecemos amostras para que o cliente possa fazer."
    certificacoes: [
      "Laudos e fichas técnicas enviados junto do orçamento",
      "Quando não temos o ensaio, enviamos amostra para o cliente fazer o dele",
    ],
  },

  producao: {
    // [1] "prazo de embarque está em até 15 dias após a confirmação de pedido
    //      ou após a confirmação de pagamento, no caso dos pedidos antecipados"
    prazo_producao:
      "Embarque em até 15 dias após a confirmação do pedido — ou após a " +
      "confirmação do pagamento, nos pedidos antecipados.",
    // [4] "Fazemos produto sob medida, sim. O cliente paga o custo da navalha...
    //      Não pintamos o feltro. Trabalhamos apenas com as cores já existentes."
    desenvolvimento:
      "Fazemos produto sob medida. O cliente paga o custo da navalha, e o pedido " +
      "mínimo depende do produto e do tempo de produção. NÃO pintamos feltro: " +
      "trabalhamos apenas com as cores já existentes.",
    // [4] e [20]
    lote_minimo:
      "O pedido mínimo depende do produto e do tempo de produção. Para revenda " +
      "que quer testar, reduzimos o mínimo para ela ver o resultado na prática.",
  },

  comercial: {
    // [16] "temos preço diferente para rolo fechado e quantidade de peças"
    // [13] "tenho margem pra negociação de preço e prazo de pagamento"
    politica_desconto:
      "Preço diferente para rolo fechado e por quantidade de peças — e deixo isso " +
      "claro desde o início, porque às vezes o cliente quer diminuir a quantidade " +
      "e manter o preço. Há margem para negociar preço e prazo de pagamento.",
    // [13] e [16] "NÃO TRABALHAMOS COM FRETE CIF"
    frete: "Não trabalhamos com CIF — o frete é por conta do cliente.",
  },

  canal: {
    // [7] "NÃO TRABALHAMOS COM REPRESENTANTES"
    // [3] "os clientes não gostam de ligações. Preferem resolver por e-mail ou
    //      WhatsApp. Marcamos visitas apenas quando necessário"
    forma_de_venda:
      "Venda direta da fábrica — não trabalhamos com representantes. O contato " +
      "acontece por e-mail e WhatsApp, que é como o cliente prefere resolver; " +
      "visita só quando é necessário, e amostra com frequência.",
    // [6] "AINDA N ACONTECEU"
    exclusividade: "Nunca precisou acontecer.",
    // [8] e [9]
    apoio_ao_cliente:
      "Enviamos amostras, laudos e fichas técnicas, e ajudamos na escolha: para " +
      "revenda, costumo recomendar uma espessura intermediária, que tem mais " +
      "saída e é um feltro mais em conta.",
  },

  diferencial: {
    // [8] "Estamos há mais de 60 anos no mercado"
    tempo_de_fabrica: "Mais de 60 anos de mercado.",
    // [8] e [11] "NUNCA CONFIRMO ALGO PRO CLIENTE QUE NÃO POSSO GARANTIR"
    motivo_trocar:
      "Sessenta anos de fábrica, com laudo e ficha técnica em toda proposta, e " +
      "transparência: nunca confirmamos ao cliente algo que não podemos garantir.",
  },

  // A régua de recompra que ela descreveu — e que o manifesto não tinha.
  // [18] cliente novo em 30 dias; recorrente antes de acabar o estoque
  // [10] "entro em contato nas épocas que ele compra"
  free_notes:
    "RÉGUA DE ACOMPANHAMENTO, como a Jeniffer descreveu no kit de revisão:\n" +
    "• Cliente NOVO: contato em 30 dias para saber o que achou do material e do " +
    "desempenho dele.\n" +
    "• Cliente RECORRENTE: já se sabe o intervalo de compra (a cada 2 ou 3 meses) " +
    "— o contato acontece ANTES de o estoque dele acabar.\n" +
    "• Cliente que parou: contato perguntando o motivo de não ter comprado mais, " +
    "e se está satisfeito com produto e atendimento.\n\n" +
    "PRÁTICA DE ORÇAMENTO: o orçamento vai ANTES da amostra. Se o cliente aceita " +
    "o valor, aí sim a amostra é enviada — já aconteceu de o cliente aprovar a " +
    "amostra e não fechar por causa do preço.\n\n" +
    "Preenchido a partir das respostas dela ao kit de revisão da indústria. " +
    "Campos não citados por ela ficaram VAZIOS de propósito: o motor escala neles " +
    "em vez de afirmar o que ninguém disse.",
};

// ---------------------------------------------------------------------
const { data: t } = await db
  .from("tenants").select("id, name, slug, skill_key")
  .or("slug.ilike.%feltros%,name.ilike.%feltros%").maybeSingle();

if (!t) {
  console.error(
    "\nA empresa da Feltros ainda NÃO existe.\n\n" +
    "Este script não a cria de propósito: quem cria a empresa é a própria pessoa,\n" +
    "pelo caminho normal do produto. Peça para a Jeniffer entrar em\n" +
    "kairos.wsslabs.com.br, criar a empresa com o ramo Indústria, e rode de novo.\n",
  );
  process.exit(1);
}

if (t.skill_key !== "industria") {
  console.error(`A empresa está no ramo "${t.skill_key}", e este DNA é de indústria.`);
  process.exit(1);
}

console.log(`\n${t.name} (${t.slug}) — ramo ${t.skill_key}`);
console.log(APLICAR ? "MODO: APLICANDO\n" : "MODO: SIMULAÇÃO (nada é gravado)\n");

for (const [sec, campos] of Object.entries(SECOES)) {
  if (typeof campos === "string") {
    console.log(`  ${sec}: (texto livre, ${campos.length} caracteres)`);
    continue;
  }
  console.log(`  ${sec}:`);
  for (const [k, v] of Object.entries(campos)) {
    const txt = Array.isArray(v) ? v.join(" | ") : String(v);
    console.log(`     ${k.padEnd(20)} ${txt.slice(0, 92)}${txt.length > 92 ? "…" : ""}`);
  }
}

if (!APLICAR) {
  console.log("\nSIMULAÇÃO — rode com --aplicar para gravar.\n");
  process.exit(0);
}

const { data: atual } = await db
  .from("commercial_dna").select("id, version, sections, section_updated_at")
  .eq("tenant_id", t.id).eq("is_current", true).maybeSingle();

// MESCLA, não substitui: se ela já preencheu algo pela tela, o que ela
// escreveu vence o que veio da planilha. Sobrescrever seria apagar trabalho
// dela com um dado mais velho.
const secoes = { ...(atual?.sections ?? {}) };
for (const [sec, campos] of Object.entries(SECOES)) {
  if (typeof campos === "string") {
    secoes[sec] = secoes[sec] || campos;
  } else {
    secoes[sec] = { ...campos, ...(secoes[sec] ?? {}) };
  }
}

const agora = new Date().toISOString();
const stamps = { ...(atual?.section_updated_at ?? {}) };
for (const sec of Object.keys(SECOES)) stamps[sec] = agora;

if (atual) await db.from("commercial_dna").update({ is_current: false }).eq("id", atual.id);
const { error } = await db.from("commercial_dna").insert({
  tenant_id: t.id,
  version: (atual?.version ?? 0) + 1,
  sections: secoes,
  source: "manual",
  is_current: true,
  section_updated_at: stamps,
});

if (error) { console.error("erro:", error.message); process.exit(1); }

const { count } = await db
  .from("commercial_dna").select("id", { count: "exact", head: true })
  .eq("tenant_id", t.id).eq("is_current", true);
console.log(`\n✓ DNA gravado. Versões correntes no banco: ${count} (tem que ser 1).\n`);
