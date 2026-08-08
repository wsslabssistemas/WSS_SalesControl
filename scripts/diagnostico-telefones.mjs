#!/usr/bin/env node
// DIAGNÓSTICO DE TELEFONE — o que vai sair e o que vai ser recusado.
//
// POR QUE ESTE SCRIPT EXISTE
// A regra de E.164 (`lib/phone.ts`) recusa o que não consegue derivar com
// certeza, e isso é proposital: mensagem que não sai é problema visível,
// mensagem para o número errado é reclamação do cliente do cliente. Mas
// "recusa em silêncio, uma linha por vez, no meio da fila" é a pior maneira
// de descobrir que 40 pessoas da base têm telefone quebrado.
//
// Este relatório mostra a conta inteira ANTES: quantos saem direto, quantos
// dependem de uma interpretação (celular antigo que ganha o nono dígito) e
// quantos não têm conserto automático.
//
// Rode antes de qualquer importação grande. Ele não escreve nada.
//
//   node scripts/diagnostico-telefones.mjs                # todas as empresas
//   node scripts/diagnostico-telefones.mjs be-fitness     # uma só

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { paraE164BR } from "../apps/web/lib/phone.ts";

// Lê o .env.local sem depender de pacote — o mesmo caminho dos outros scripts.
function env(chave) {
  if (process.env[chave]) return process.env[chave];
  try {
    const txt = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
    const linha = txt.split(/\r?\n/).find((l) => l.startsWith(`${chave}=`));
    return linha ? linha.slice(chave.length + 1).trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const alvo = process.argv[2] ?? null;

const { data: tenants, error: tErr } = await db
  .from("tenants").select("id, slug, name").order("slug");
if (tErr) {
  console.error("Erro lendo empresas:", tErr.message);
  process.exit(1);
}

const lista = alvo ? tenants.filter((t) => t.slug === alvo) : tenants;
if (!lista.length) {
  console.error(alvo ? `Empresa "${alvo}" não encontrada.` : "Nenhuma empresa.");
  process.exit(1);
}

let problemasNoTotal = 0;

for (const t of lista) {
  // PAGINADO. O PostgREST corta em 1.000 linhas SEM AVISAR — já custou 53
  // interações sumidas em silêncio na canonização das técnicas. Uma base de
  // 3.000 contatos voltaria com 1.000 e o relatório diria que está tudo bem.
  const contatos = [];
  const passo = 1000;
  for (let de = 0; ; de += passo) {
    const { data, error } = await db
      .from("contacts").select("id, name, phone")
      .eq("tenant_id", t.id)
      .range(de, de + passo - 1);
    if (error) {
      console.error(`  erro lendo contatos de ${t.slug}: ${error.message}`);
      break;
    }
    contatos.push(...(data ?? []));
    if (!data || data.length < passo) break;
  }

  if (!contatos.length) continue;

  const direto = [];
  const ajustado = [];
  const recusado = [];

  for (const c of contatos) {
    const r = paraE164BR(c.phone);
    if (!r.ok) recusado.push({ ...c, motivo: r.motivo });
    else if (r.ajuste) ajustado.push({ ...c, para: r.e164 });
    else direto.push(c);
  }

  const pct = (n) => `${((n / contatos.length) * 100).toFixed(1)}%`;
  console.log(`\n${t.name} (${t.slug}) — ${contatos.length} contatos`);
  console.log(`  ✓ sai direto           ${String(direto.length).padStart(5)}  ${pct(direto.length)}`);
  console.log(`  ⚠ ganha o nono dígito  ${String(ajustado.length).padStart(5)}  ${pct(ajustado.length)}`);
  console.log(`  ✗ recusado             ${String(recusado.length).padStart(5)}  ${pct(recusado.length)}`);

  if (recusado.length) {
    problemasNoTotal += recusado.length;
    // Agrupa por motivo: 40 linhas iguais não ajudam ninguém a decidir.
    const porMotivo = new Map();
    for (const r of recusado) {
      if (!porMotivo.has(r.motivo)) porMotivo.set(r.motivo, []);
      porMotivo.get(r.motivo).push(r);
    }
    console.log("\n    Por que foram recusados:");
    for (const [motivo, quais] of [...porMotivo].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`      ${String(quais.length).padStart(4)} · ${motivo}`);
      for (const q of quais.slice(0, 3)) {
        console.log(`             ex.: ${q.name} — "${q.phone ?? ""}"`);
      }
      if (quais.length > 3) console.log(`             (+${quais.length - 3})`);
    }
  }

  if (ajustado.length) {
    console.log(
      `\n    O ajuste é a regra da Anatel de 2016 (celular ficou com 9 dígitos).\n` +
      `    O cadastro NÃO é alterado — a derivação acontece na hora de enviar, e\n` +
      `    a fila mostra o aviso a quem clica. Exemplos:`,
    );
    for (const a of ajustado.slice(0, 3)) {
      console.log(`      ${a.name}: "${a.phone}" → ${a.para}`);
    }
  }
}

console.log(
  problemasNoTotal
    ? `\n${problemasNoTotal} contato(s) sem telefone utilizável. Eles não somem da fila — ` +
      `aparecem sem o botão do WhatsApp, para a mensagem ser copiada à mão.\n`
    : "\nNenhum telefone recusado.\n",
);
