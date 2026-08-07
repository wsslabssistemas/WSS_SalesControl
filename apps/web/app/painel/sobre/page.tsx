import Link from "next/link";
import { BRAND_NAME, MAKER, TAGLINE } from "@/lib/brand";

export const metadata = { title: "Sobre" };

/**
 * QUEM ESTÁ POR TRÁS DO PRODUTO.
 *
 * Existe porque um sistema que atende o cliente do cliente precisa dizer com
 * quem a pessoa está falando. É o par da decisão de manter o rodapé fora da
 * personalização: a empresa pinta a marca dela na tela, e continua havendo um
 * lugar onde está escrito quem responde pelo dado, quem conserta e como falar
 * com o fabricante.
 *
 * O TEXTO É SOBRE LIMITE, NÃO SOBRE VENDA. Um "sobre" que só elogia o produto
 * não é informação — e este produto vende o oposto do atalho.
 */
export default function SobrePage() {
  return (
    <main style={{ maxWidth: 640 }}>
      <h1>Sobre o {BRAND_NAME}</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>{TAGLINE}</p>

      <div className="card mt-24">
        <p className="eyebrow" style={{ marginBottom: 8 }}>O fabricante</p>
        <p style={{ marginTop: 0, marginBottom: 0 }}>
          O {BRAND_NAME} é feito pela <strong>{MAKER}</strong>. O produto nasceu dentro
          de uma operação real — uma academia — e continua sendo usado nela todo dia,
          com dinheiro de verdade em jogo. É o mecanismo que encontra defeito mais
          rápido que qualquer teste.
        </p>
      </div>

      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 8 }}>O que o produto faz</p>
        <p style={{ marginTop: 0, marginBottom: 0 }}>
          Não vendemos um lugar para guardar contato — isso a sua empresa já tem.
          Vendemos <strong>a técnica de venda que falta</strong>: o que responder, quando
          cobrar de novo, e por quê. A maior lacuna que medimos é o follow-up: em
          serviços técnicos, mais de 70% dos orçamentos nunca recebem uma segunda
          mensagem.
        </p>
      </div>

      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 8 }}>O que ele NÃO faz</p>
        <ul className="text-dim" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Não emite nota fiscal, não controla estoque e não é financeiro.</li>
          <li>
            Não atende sozinho. A IA escreve e explica a técnica;{" "}
            <strong>quem lê, ajusta e envia é gente.</strong>
          </li>
          <li>
            Não faz disparo em massa. É decisão, não limitação: protege o seu número
            de ser banido e respeita a LGPD.
          </li>
          <li>
            Não inventa. Quando falta um fato no cadastro da sua empresa, o sistema{" "}
            <strong>escala em vez de chutar</strong> — e essa trava é verificação de
            código, não instrução de texto.
          </li>
        </ul>
      </div>

      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 8 }}>Seus dados</p>
        <p className="text-dim" style={{ marginTop: 0, marginBottom: 0 }}>
          O isolamento entre empresas é aplicado no próprio banco: uma empresa não
          consegue ler o dado de outra nem por engano de programação. A {MAKER} vê
          consumo e custo por empresa, para poder cobrar e sustentar o serviço. A
          política completa fica no seu contrato — e se ela não estiver escrita lá,
          cobre.
        </p>
      </div>

      <p className="text-faint mt-24" style={{ fontSize: 13 }}>
        <Link href="/painel">← Voltar ao painel</Link>
      </p>
    </main>
  );
}
