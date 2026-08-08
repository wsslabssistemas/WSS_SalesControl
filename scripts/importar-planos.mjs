#!/usr/bin/env node
// IMPORTA PLANOS E VIGÊNCIA de um relatório da academia.
//
// É o que destrava a Renovação: sem `contract_end` a tela abre vazia e as três
// janelas (60/30/7) não têm o que disparar.
//
// SIMULA POR PADRÃO. Só grava com `--aplicar`. O padrão seguro não é
// preciosismo: são 300+ cadastros de clientes reais e pagantes, e o pior
// desfecho possível aqui não é falhar — é gravar errado em silêncio.
//
//   node scripts/importar-planos.mjs <arquivo.csv> --tenant be-fitness
//   node scripts/importar-planos.mjs <arquivo.csv> --tenant be-fitness --aplicar
//
// COLUNAS ESPERADAS: codigo, nome, telefone, nascimento, plano, periodicidade,
// inicio (AAAA-MM-DD), fim (AAAA-MM-DD), situacao.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { paraE164BR, variantesArmazenadas, normalizePhone } from "../apps/web/lib/phone.ts";

// ---------------------------------------------------------------------
function env(chave) {
  if (process.env[chave]) return process.env[chave];
  try {
    const txt = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
    const l = txt.split(/\r?\n/).find((x) => x.startsWith(`${chave}=`));
    return l ? l.slice(chave.length + 1).trim().replace(/^["']|["']$/g, "") : null;
  } catch { return null; }
}

/** CSV com aspas — nome de pessoa tem vírgula, e um split(",") cru embaralha colunas. */
function lerCSV(texto) {
  const linhas = [];
  let campo = "", linha = [], dentro = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentro) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') dentro = false;
      else campo += c;
    } else if (c === '"') dentro = true;
    else if (c === ",") { linha.push(campo); campo = ""; }
    else if (c === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  const cab = linhas.shift().map((h) => h.trim());
  return linhas.filter((l) => l.some((v) => v.trim())).map((l) => {
    const o = {};
    cab.forEach((h, i) => (o[h] = (l[i] ?? "").trim()));
    return o;
  });
}

const argv = process.argv.slice(2);
const arquivo = argv.find((a) => !a.startsWith("--"));
const slug = (argv.find((a) => a.startsWith("--tenant=")) ?? "").split("=")[1]
  ?? argv[argv.indexOf("--tenant") + 1];
const APLICAR = argv.includes("--aplicar");

if (!arquivo || !slug) {
  console.error("uso: node scripts/importar-planos.mjs <arquivo.csv> --tenant <slug> [--aplicar]");
  process.exit(1);
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) { console.error("Faltam credenciais do Supabase."); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

// ---------------------------------------------------------------------
const { data: tenant } = await db.from("tenants").select("id, name, skill_key").eq("slug", slug).maybeSingle();
if (!tenant) { console.error(`Empresa "${slug}" não encontrada.`); process.exit(1); }

const linhas = lerCSV(readFileSync(arquivo, "utf8"));
console.log(`\n${tenant.name} — ${linhas.length} linhas no arquivo`);
console.log(APLICAR ? "MODO: APLICANDO (grava no banco)\n" : "MODO: SIMULAÇÃO (nada é gravado)\n");

// Contatos existentes, PAGINADO — o PostgREST corta em 1.000 sem avisar, e ler
// menos aqui faria o script achar que todo mundo é novo e duplicar a base.
const existentes = [];
for (let de = 0; ; de += 1000) {
  const { data, error } = await db
    .from("contacts").select("id, name, phone, custom, journey_stage, contract_end")
    .eq("tenant_id", tenant.id).is("deleted_at", null).order("id").range(de, de + 999);
  if (error) { console.error("erro lendo contatos:", error.message); process.exit(1); }
  existentes.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}
console.log(`contatos já cadastrados: ${existentes.length}`);

// Índices de busca: código do sistema da academia primeiro (é o identificador
// de verdade), telefone depois. Nome NÃO entra: homônimo em base de 9 mil é
// certeza, e casar por nome funde duas pessoas sem volta.
const porCodigo = new Map();
const porTelefone = new Map();
for (const c of existentes) {
  const cod = c.custom?.codigo_sistema;
  if (cod) porCodigo.set(String(cod), c);
  const d = normalizePhone(c.phone);
  if (d) porTelefone.set(d, c);
}

const achar = (linha) => {
  if (linha.codigo && porCodigo.has(linha.codigo)) return porCodigo.get(linha.codigo);
  const e164 = paraE164BR(linha.telefone);
  if (e164.ok) {
    for (const v of variantesArmazenadas(e164.digitos)) {
      if (porTelefone.has(v)) return porTelefone.get(v);
    }
  }
  return null;
};

const ESTAGIO = { vigente: "convertido", vencido: "perdido", sem_vigencia: "perdido" };

const plano = { criar: [], atualizar: [], semTelefone: [], ignorado: [] };

for (const l of linhas) {
  if (!l.nome) { plano.ignorado.push({ l, motivo: "sem nome" }); continue; }
  const achado = achar(l);
  const e164 = paraE164BR(l.telefone);
  if (!e164.ok) plano.semTelefone.push({ nome: l.nome, telefone: l.telefone, motivo: e164.motivo });

  const campos = {
    contract_start: l.inicio || null,
    contract_end: l.fim || null,
  };

  if (achado) {
    // NÃO MEXE NA ETAPA de quem já existe. Os 273 contatos do piloto têm
    // histórico e desfecho registrados; sobrescrever a jornada deles com o que
    // a planilha acha apagaria a única base de aprendizado real que existe.
    plano.atualizar.push({ id: achado.id, nome: l.nome, de: achado.contract_end, para: l.fim, campos, codigo: l.codigo });
  } else {
    plano.criar.push({
      tenant_id: tenant.id,
      name: l.nome,
      phone: normalizePhone(l.telefone),
      journey_stage: ESTAGIO[l.situacao] ?? "perdido",
      source: "outro",
      ...campos,
      custom: {
        codigo_sistema: l.codigo,
        plano: l.plano || null,
        periodicidade: l.periodicidade || null,
        nascimento: l.nascimento || null,
      },
    });
  }
}

console.log(`\n  criar:     ${String(plano.criar.length).padStart(5)}`);
console.log(`  atualizar: ${String(plano.atualizar.length).padStart(5)}  (etapa e histórico preservados)`);
console.log(`  ignorado:  ${String(plano.ignorado.length).padStart(5)}`);
console.log(`  sem telefone utilizável: ${plano.semTelefone.length} (entram assim mesmo; só não recebem WhatsApp)`);

const porEtapa = {};
for (const c of plano.criar) porEtapa[c.journey_stage] = (porEtapa[c.journey_stage] ?? 0) + 1;
console.log("\n  novos por etapa:", porEtapa);

console.log("\n  --- amostra do que seria criado ---");
for (const c of plano.criar.slice(0, 5)) {
  console.log(`    ${c.name.slice(0, 30).padEnd(30)} ${c.journey_stage.padEnd(11)} vence ${c.contract_end ?? "—"}`);
}
console.log("\n  --- amostra do que seria atualizado ---");
for (const a of plano.atualizar.slice(0, 5)) {
  console.log(`    ${a.nome.slice(0, 30).padEnd(30)} vencimento ${a.de ?? "(vazio)"} -> ${a.para || "(vazio)"}`);
}
if (plano.semTelefone.length) {
  console.log("\n  --- sem telefone utilizável ---");
  for (const s of plano.semTelefone.slice(0, 5)) console.log(`    ${s.nome}: "${s.telefone}" (${s.motivo})`);
}

if (!APLICAR) {
  console.log("\nSIMULAÇÃO — nada foi gravado. Rode de novo com --aplicar para valer.\n");
  process.exit(0);
}

// ---------------------------------------------------------------------
let criados = 0, atualizados = 0, falhas = 0;
const recusados = [];

for (let i = 0; i < plano.criar.length; i += 200) {
  const lote = plano.criar.slice(i, i + 200);
  const { error } = await db.from("contacts").insert(lote);
  if (!error) { criados += lote.length; continue; }

  // UM LOTE É TUDO OU NADA. Uma linha recusada derruba as outras 199, e a
  // primeira versão disto contou 200 falhas para um problema de 1 — o número
  // no relatório passou a mentir sobre o tamanho do estrago.
  // Na falha do lote, refaz linha a linha para separar quem realmente não
  // entrou de quem só estava na carona.
  for (const linha of lote) {
    const { error: e1 } = await db.from("contacts").insert(linha);
    if (!e1) { criados++; continue; }

    // TELEFONE COMPARTILHADO (casal, mãe e filho). Enquanto o `0053` não
    // rodar, o índice único recusa a segunda pessoa. Ela entra SEM telefone,
    // com o número guardado em `custom`, porque a alternativa é pior:
    // deixá-la de fora faz um aluno pagante sumir da renovação em silêncio.
    // Sem telefone ela aparece na fila com o aviso "sem telefone válido" —
    // uma falha visível, que alguém conserta.
    if (/ux_contacts_tenant_phone|duplicate key/i.test(e1.message)) {
      const { error: e2 } = await db.from("contacts").insert({
        ...linha,
        phone: null,
        custom: { ...linha.custom, telefone_compartilhado: linha.phone },
      });
      if (!e2) { criados++; recusados.push({ nome: linha.name, telefone: linha.phone }); continue; }
    }
    console.error(`  ✗ ${linha.name}: ${e1.message}`);
    falhas++;
  }
}

if (recusados.length) {
  console.log(`\n  ⚠ ${recusados.length} entraram SEM telefone — o número já pertence a outra pessoa:`);
  for (const r of recusados) console.log(`      ${r.nome}  (${r.telefone})`);
  console.log(`  Rode a migration 0053 e depois o script de novo para devolver o telefone a eles.`);
}

for (const a of plano.atualizar) {
  // `custom` é mesclado, não substituído: o cadastro pode ter campos que a
  // planilha não conhece, e sobrescrever apagaria o que o vendedor anotou.
  const { data: atual } = await db.from("contacts").select("custom").eq("id", a.id).maybeSingle();
  const custom = { ...(atual?.custom ?? {}), codigo_sistema: a.codigo };
  const { error } = await db.from("contacts").update({ ...a.campos, custom }).eq("id", a.id);
  if (error) { console.error(`  ✗ ${a.nome}: ${error.message}`); falhas++; }
  else atualizados++;
}

console.log(`\n✓ criados: ${criados}   atualizados: ${atualizados}   falhas: ${falhas}`);

// CONFERÊNCIA INDEPENDENTE: conta no banco em vez de confiar no que o script
// acha que escreveu. Relatório que só mostra a própria saída não enxerga o que
// ele derrubou ao lado — a lição que custou o curso inteiro em ago/2026.
const { count } = await db
  .from("contacts").select("id", { count: "exact", head: true })
  .eq("tenant_id", tenant.id).not("contract_end", "is", null);
console.log(`conferido no banco: ${count} contatos com data de vencimento.\n`);
