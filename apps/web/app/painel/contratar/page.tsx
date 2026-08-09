import Link from "next/link";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";
import { estadoDoTeste } from "@/lib/teste";
import { BRAND_NAME, MAKER } from "@/lib/brand";

export const metadata = { title: "Contratar" };

/**
 * OS PLANOS, por variável de ambiente.
 *
 * Os links de assinatura recorrente do Mercado Pago são criados na conta do
 * fabricante e não pertencem ao código — cada um é uma URL própria, e chumbar
 * URL de cobrança no repositório PÚBLICO é entregar o meio de pagamento junto
 * com o código.
 *
 * Sem os links configurados a tela NÃO inventa botão: ela mostra o caminho
 * humano (falar com o fabricante), que é o que existe de verdade hoje.
 */
const PLANOS = [
  { chave: "essencial", nome: "Essencial", env: "MP_PLANO_ESSENCIAL",
    resumo: "O núcleo: Responder com IA, Fila, Follow-up, Renovação, Contatos e Gestão." },
  { chave: "completo", nome: "Completo", env: "MP_PLANO_COMPLETO",
    resumo: "Tudo do Essencial mais o curso completo, com as 45 lições e a repescagem." },
];

export default async function ContratarPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Contratar</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  const teste = estadoDoTeste(ent.trialEndsAt);
  const encerrado = teste.fase === "encerrado";

  const links = PLANOS.map((p) => ({ ...p, url: process.env[p.env] ?? null }));
  const temLink = links.some((l) => l.url);

  return (
    <main style={{ maxWidth: 640 }}>
      <h1>Contratar o {BRAND_NAME}</h1>

      {encerrado ? (
        <div className="card mt-16" style={{ borderColor: "var(--danger)" }}>
          <p style={{ marginTop: 0 }}>
            <strong>Seu teste terminou.</strong> A geração com IA está suspensa.
          </p>
          <p className="text-dim" style={{ marginBottom: 0, fontSize: 14 }}>
            Seus contatos, o histórico e o DNA da empresa continuam aqui, intactos.
            Nada foi apagado e nada será — contratando, tudo volta a funcionar de onde parou.
          </p>
        </div>
      ) : teste.fase === "avisando" ? (
        <p className="badge badge-warn mt-16">{teste.texto}</p>
      ) : null}

      <div className="stack mt-24" style={{ gap: 12 }}>
        {links.map((p) => (
          <div key={p.chave} className="card">
            <div className="between" style={{ alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <strong>{p.nome}</strong>
                <p className="text-dim" style={{ fontSize: 13, margin: "6px 0 0" }}>{p.resumo}</p>
              </div>
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                  Assinar
                </a>
              ) : (
                <span className="text-faint" style={{ fontSize: 12 }}>a combinar</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!temLink && (
        <div className="card mt-24">
          <p className="eyebrow" style={{ marginBottom: 8 }}>Como funciona hoje</p>
          <p className="text-dim" style={{ marginTop: 0, fontSize: 14 }}>
            O preço do {BRAND_NAME} não é uma tabela fixa: ele depende do tamanho da
            sua operação e de quanto do motor você usa. Por isso a contratação
            passa por uma conversa — rápida, e com o número aberto na frente.
          </p>
          <p className="text-dim" style={{ marginBottom: 0, fontSize: 14 }}>
            Fale com a {MAKER} e a gente fecha por aqui mesmo.
          </p>
        </div>
      )}

      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        Cobrança por atendimento respondido com IA — nunca por usuário e nunca por
        token. Colocar mais gente da equipe não aumenta a conta, e o modo manual
        (busca na biblioteca) é ilimitado e não custa nada.
      </p>

      <p className="mt-16">
        <Link href="/painel" className="text-dim" style={{ fontSize: 13 }}>← Voltar ao painel</Link>
      </p>
    </main>
  );
}
