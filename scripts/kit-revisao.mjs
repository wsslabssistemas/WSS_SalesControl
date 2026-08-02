/**
 * KIT DE REVISÃO — leva a biblioteca de um segmento para quem VIVE o ramo.
 *
 *   node scripts/kit-revisao.mjs industria
 *   node scripts/kit-revisao.mjs energia_solar
 *
 * Por que existe: a curadoria é feita por pesquisa. Isso produz uma biblioteca
 * boa; excelente só vem de quem trabalha no ramo revisar. O que depende de nós
 * não é o tempo do especialista — é **deixar fácil**. Um especialista ocupado
 * não abre repositório, não lê YAML e não vai adivinhar o que esperamos dele.
 *
 * Gera dois arquivos em `revisao/`:
 *   • .html — para LER. Abre no celular, uma tela por situação, linguagem de
 *     gente. Sem jargão nosso, sem chave de banco.
 *   • .csv  — para RESPONDER. Uma linha por entrada, colunas que ele preenche
 *     e devolve. Planilha volta; PDF comentado não volta.
 *
 * A saída é gerada, não versionada: o conteúdo real mora no banco e nos seeds.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import yaml from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = path.join(ROOT, "revisao");

const skillKey = process.argv[2];
if (!skillKey) {
  console.error("Uso: node scripts/kit-revisao.mjs <skill_key>");
  process.exit(1);
}

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

const manifesto = yaml.parse(
  fs.readFileSync(path.join(ROOT, "packages/skills", skillKey, "manifest.yaml"), "utf8"),
);

const { data: entradas } = await db
  .from("knowledge_entries")
  .select("category, entry_type, trigger_questions, strategy, technique, common_errors, next_objective, required_facts, on_missing_facts")
  .is("tenant_id", null)
  .eq("skill_key", skillKey)
  .eq("source", "skill_seed")
  .eq("status", "active")
  .order("category");

if (!entradas?.length) {
  console.error(`Nenhuma entrada encontrada para "${skillKey}".`);
  process.exit(1);
}

// Chave de DNA → o rótulo que o dono da empresa vê na tela. O especialista não
// tem por que saber o que é `producao.lote_minimo`.
const rotuloDoFato = new Map();
for (const s of manifesto.dna_sections ?? []) {
  for (const f of s.fields ?? []) {
    rotuloDoFato.set(`${s.key}.${f.key}`, `${s.label} → ${f.label}`);
  }
}

const categorias = manifesto.categories ?? {};
const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const paragrafos = (texto) =>
  String(texto ?? "")
    .split(/\n(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/)
    .map((p) => p.trim())
    .filter(Boolean);

// ---------------------------------------------------------------- HTML -----
const blocos = entradas
  .map((e, i) => {
    const fatos = (e.required_facts ?? []).map((f) => rotuloDoFato.get(f) ?? f);
    return `
<article class="card">
  <div class="num">${i + 1} de ${entradas.length}</div>
  <h2>Quando o cliente diz…</h2>
  <ul class="falas">
    ${(e.trigger_questions ?? []).map((t) => `<li>“${esc(t)}”</li>`).join("\n    ")}
  </ul>

  <h3>…o sistema orienta o vendedor a fazer isto</h3>
  ${paragrafos(e.strategy).map((p) => `<p>${esc(p)}</p>`).join("\n  ")}

  <h3>E a evitar isto</h3>
  <ul class="evitar">
    ${(e.common_errors ?? []).map((c) => `<li>${esc(c)}</li>`).join("\n    ")}
  </ul>

  ${
    fatos.length
      ? `<p class="fatos"><strong>Só responde se a empresa tiver cadastrado:</strong> ${fatos.map(esc).join(" · ")}.
         ${e.on_missing_facts === "escalate" ? "Se faltar, o sistema NÃO responde — passa para uma pessoa." : "Se faltar, o sistema responde sem essa parte."}</p>`
      : ""
  }

  <div class="perguntas">
    <p><strong>${i + 1}.1</strong> Isso está certo no dia a dia?  ( ) sim  ( ) mais ou menos  ( ) não</p>
    <p><strong>${i + 1}.2</strong> O que está errado ou faltando aqui?</p>
    <p class="linha"></p>
    <p><strong>${i + 1}.3</strong> Como <em>você</em> diria isso para o cliente?</p>
    <p class="linha"></p>
  </div>
</article>`;
  })
  .join("\n");

const etapas = (manifesto.journey?.stages ?? []).map((s) => `<li><strong>${esc(s.label)}</strong>${s.goal ? ` — ${esc(s.goal)}` : ""}</li>`).join("\n    ");
const campos = (manifesto.contact_fields ?? [])
  .map((c) => `<li><strong>${esc(c.label)}</strong>: ${(c.options ?? []).map((o) => esc(o.replace(/_/g, " "))).join(", ")}</li>`)
  .join("\n    ");

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revisão — ${esc(manifesto.name)}</title>
<style>
  :root { color-scheme: light; }
  body { font-family: -apple-system, "Segoe UI", system-ui, sans-serif; line-height: 1.6;
         max-width: 720px; margin: 0 auto; padding: 24px 18px 80px; color: #16202e; background: #fff; }
  h1 { font-size: 26px; line-height: 1.25; margin: 0 0 6px; }
  h2 { font-size: 17px; margin: 0 0 8px; }
  h3 { font-size: 14px; text-transform: uppercase; letter-spacing: .04em; color: #5b6880;
       margin: 20px 0 6px; }
  p { margin: 0 0 10px; }
  .intro { background: #f4f7fb; border: 1px solid #dde5f0; border-radius: 12px; padding: 18px; margin: 20px 0 28px; }
  .card { border: 1px solid #dde5f0; border-radius: 12px; padding: 20px; margin: 0 0 22px; }
  .num { font-size: 12px; color: #8592a8; margin-bottom: 10px; }
  .falas li { margin-bottom: 4px; }
  .evitar li { margin-bottom: 4px; color: #8a3a3a; }
  .fatos { font-size: 14px; color: #5b6880; background: #f7f9fc; padding: 10px 12px; border-radius: 8px; }
  .perguntas { border-top: 2px dashed #cfd9e8; margin-top: 18px; padding-top: 14px; }
  .perguntas p { margin: 0 0 8px; }
  .linha { border-bottom: 1px solid #c9d4e4; height: 26px; margin-bottom: 14px !important; }
  ul { padding-left: 20px; margin: 0 0 10px; }
  .fim { background: #f4f7fb; border: 1px solid #dde5f0; border-radius: 12px; padding: 18px; }
  @media print { .card { break-inside: avoid; } body { padding: 0; } }
</style>
</head>
<body>

<h1>Revisão da biblioteca — ${esc(manifesto.name)}</h1>
<p style="color:#5b6880">WSS Kairós · gerado em ${new Date().toLocaleDateString("pt-BR")} · ${entradas.length} situações</p>

<div class="intro">
  <p><strong>O que é isto.</strong> Estamos construindo um sistema que ajuda vendedores
  a responder clientes. Para cada coisa que o cliente costuma dizer, o sistema
  orienta o vendedor sobre o que fazer.</p>
  <p><strong>Por que você.</strong> Escrevemos isto por pesquisa — lendo, estudando o
  ramo, conversando. Ninguém aqui vive o dia a dia deste mercado. Você vive.
  A diferença entre um material bom e um material que um comprador respeita
  está exatamente aí.</p>
  <p><strong>O que precisamos.</strong> Não precisa corrigir texto nem se preocupar com
  português. Precisamos de três coisas em cada situação:
  <em>isso está certo?</em>, <em>o que falta?</em> e <em>como você diria?</em>.
  Uma frase em cada já vale muito. Pode pular o que não conhecer.</p>
  <p><strong>Se preferir responder digitando</strong>, existe uma planilha junto com
  este arquivo (mesmo nome, final <code>.csv</code>) com uma linha por situação.</p>
  <p style="margin-bottom:0; font-size:14px; color:#5b6880"><strong>Um aviso sobre a
  escrita.</strong> O texto abaixo aparece sem acento — é a anotação interna do
  sistema, não o que o cliente recebe. A mensagem que chega ao cliente é escrita
  na hora, com português correto. Estamos te mostrando o conteúdo cru de
  propósito: é ele que precisa estar certo. Ignore a forma, julgue o conteúdo.</p>
</div>

${blocos}

<div class="fim">
  <h2>Para fechar — as perguntas que valem mais que todas</h2>
  <p><strong>A.</strong> Qual pergunta o cliente faz TODA semana e não apareceu em nenhuma
  das ${entradas.length} situações acima?</p>
  <p class="linha"></p>
  <p><strong>B.</strong> O que um vendedor pode dizer que faz o comprador perder a
  confiança na hora?</p>
  <p class="linha"></p>
  <p><strong>C.</strong> Tem alguma coisa aí que soa como “gente de fora falando”?
  Qual?</p>
  <p class="linha"></p>

  <h3 style="margin-top:24px">E sobre a estrutura da venda</h3>
  <p>O sistema entende a venda deste ramo assim:</p>
  <ul>
    ${etapas}
  </ul>
  <p><strong>D.</strong> Falta alguma etapa? Alguma sobra?</p>
  <p class="linha"></p>

  <p>E guarda estas informações de cada cliente:</p>
  <ul>
    ${campos}
  </ul>
  <p><strong>E.</strong> Falta alguma informação que você sempre quer saber de um cliente?</p>
  <p class="linha"></p>
</div>

</body>
</html>`;

// ----------------------------------------------------------------- CSV -----
const csvEsc = (v) => `"${String(v ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
const csv = [
  ["#", "Situação (o que o cliente diz)", "O que o sistema orienta", "Está certo? (sim / mais ou menos / não)", "O que falta ou está errado", "Como você diria"]
    .map(csvEsc)
    .join(";"),
  ...entradas.map((e, i) =>
    [
      i + 1,
      (e.trigger_questions ?? []).map((t) => `"${t}"`).join(" / "),
      e.strategy,
      "",
      "",
      "",
    ]
      .map(csvEsc)
      .join(";"),
  ),
].join("\r\n");

fs.mkdirSync(SAIDA, { recursive: true });
const base = path.join(SAIDA, `revisao-${skillKey}`);
fs.writeFileSync(`${base}.html`, html, "utf8");
// BOM para o Excel abrir acentuação certa em pt-BR.
fs.writeFileSync(`${base}.csv`, "﻿" + csv, "utf8");

console.log(`✓ ${entradas.length} situações de "${manifesto.name}"`);
console.log(`   ${base}.html   (para ler e imprimir)`);
console.log(`   ${base}.csv    (para responder e devolver)`);
