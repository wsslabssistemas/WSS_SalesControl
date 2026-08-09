import Link from "next/link";
import { requireUser, listMemberships } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { criarEmpresa, listarRamos } from "./actions";
import { DIAS_DE_TESTE } from "@/lib/teste";

export const metadata = { title: "Sua empresa" };

export default async function NovaEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; nome?: string; cidade?: string }>;
}) {
  const { erro, nome, cidade } = await searchParams;
  await requireUser();

  const [ramos, jaTem] = await Promise.all([listarRamos(), listMemberships()]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>Qual é a sua empresa?</h1>
      <p className="text-dim" style={{ marginTop: 6 }}>
        O {BRAND_NAME} se molda ao seu ramo: a jornada do cliente, os campos do
        cadastro e a biblioteca de técnica de venda mudam por completo. Por isso
        esta é a primeira pergunta — e a única que não dá para mudar sem
        retrabalho depois.
      </p>

      {jaTem.length > 0 && (
        <p className="text-faint" style={{ fontSize: 13 }}>
          Você já participa de {jaTem.length} empresa{jaTem.length === 1 ? "" : "s"}.{" "}
          <Link href="/painel">Voltar ao painel</Link> ou crie mais uma abaixo.
        </p>
      )}

      {erro && (
        <p className="badge badge-danger mt-16"
           style={{ width: "100%", justifyContent: "center", padding: "10px 12px", whiteSpace: "normal", textAlign: "center" }}>
          {erro}
        </p>
      )}

      <form action={criarEmpresa} className="card mt-24 stack" style={{ gap: 18 }}>
        <label className="stack" style={{ gap: 6 }}>
          <span className="label" style={{ margin: 0 }}>Nome da empresa</span>
          <input name="nome" required defaultValue={nome ?? ""} placeholder="Como seus clientes te chamam" autoFocus />
        </label>

        <label className="stack" style={{ gap: 6 }}>
          <span className="label" style={{ margin: 0 }}>Cidade</span>
          <input name="cidade" defaultValue={cidade ?? ""} placeholder="Porto Alegre/RS" />
        </label>

        {/* SE A LISTA VIER VAZIA, A TELA DIZ ISSO — nao mostra um formulario que
            o servidor vai recusar por uma escolha que nao existe na tela. Foi
            exatamente assim que a primeira usuaria externa travou: os ramos nao
            apareciam (RLS), e o botao respondia "escolha o ramo". */}
        {ramos.length === 0 ? (
          <p className="badge badge-danger" style={{ width: "100%", justifyContent: "center" }}>
            Não consegui carregar a lista de ramos. Não é você — é do nosso lado.
            Recarregue a página; se continuar, nos avise.
          </p>
        ) : (
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend className="label" style={{ padding: 0, marginBottom: 8 }}>
            Ramo <span className="text-faint" style={{ fontWeight: 400 }}>· escolha um</span>
          </legend>
          <div className="stack" style={{ gap: 8 }}>
            {ramos.map((r, i) => (
              <label
                key={r.key}
                className="card"
                style={{ padding: "10px 12px", cursor: "pointer", display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <input type="radio" name="skill_key" value={r.key} required defaultChecked={i === -1} style={{ marginTop: 3 }} />
                <span>
                  <strong style={{ fontSize: 14 }}>{r.name}</strong>
                  {r.cobertura && (
                    <span className="text-faint" style={{ display: "block", fontSize: 12, marginTop: 2 }}>
                      {r.cobertura}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <p className="text-faint" style={{ fontSize: 12, marginTop: 8 }}>
            Não achou o seu? Escolha o mais próximo — dá para trocar enquanto a
            base de contatos ainda está vazia.
          </p>
        </fieldset>
        )}

        <button type="submit" className="btn btn-primary" style={{ justifySelf: "start" }} disabled={ramos.length === 0}>
          Criar e começar os {DIAS_DE_TESTE} dias
        </button>
      </form>

      <p className="text-faint mt-16" style={{ fontSize: 12 }}>
        O teste libera tudo por {DIAS_DE_TESTE} dias, sem cartão. Depois disso a
        geração com IA é suspensa até você contratar — <strong>seus dados
        continuam aqui</strong>, nada é apagado.
      </p>
    </main>
  );
}
