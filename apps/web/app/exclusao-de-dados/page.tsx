import Link from "next/link";
import { BRAND_NAME, MAKER } from "@/lib/brand";
import { CONTATO_PRIVACIDADE } from "@/lib/contato";

/**
 * INSTRUÇÕES DE EXCLUSÃO DE DADOS — página própria, e ela é própria por um
 * motivo concreto.
 *
 * ⚠ A META VALIDA O CAMPO E RECUSA ÂNCORA. O endereço
 * `/privacidade#exclusao` foi rejeitado com *"Data deletion instructions URL
 * should represent a valid URL"* — o campo quer uma URL inteira, sem `#`.
 * Ancorar dentro de outra página parecia economia; custou uma tentativa.
 *
 * ⚠ E O CONTEÚDO PRECISA SER INSTRUÇÃO, NÃO POLÍTICA. Quem cai aqui quer
 * saber o que fazer, nesta ordem, com quem falar e em quanto tempo tem
 * resposta. Repetir a política inteira aqui esconderia justamente isso.
 *
 * O prazo e o canal daqui são os mesmos da política — um lugar só para o
 * e-mail (`lib/contato.ts`), porque dois lugares divergem no dia em que um
 * deles mudar, e o que fica errado é o menos visitado.
 */
export const metadata = {
  title: `Exclusão de dados — ${BRAND_NAME}`,
  description: `Como pedir a exclusão dos seus dados pessoais tratados no ${BRAND_NAME}.`,
};

export default function ExclusaoDeDadosPage() {
  return (
    <main className="container" style={{ maxWidth: 720, paddingBlock: 40 }}>
      <Link href="/" className="btn btn-sm btn-ghost">← Voltar</Link>

      <p className="eyebrow mt-24">{MAKER}</p>
      <h1 style={{ marginTop: 8 }}>Como pedir a exclusão dos seus dados</h1>

      <p className="text-dim">
        O <strong>{BRAND_NAME}</strong> é o sistema que algumas empresas usam para organizar o
        atendimento aos clientes delas. Se você trocou mensagens com uma dessas empresas, seus
        dados de contato e o histórico dessa conversa podem estar registrados aqui — e você
        pode pedir a exclusão a qualquer momento, sem justificar.
      </p>

      <div className="card mt-24">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>O pedido, em três passos</h2>
        <ol className="text-dim" style={{ marginBottom: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 10 }}>
            Escreva para <a href={`mailto:${CONTATO_PRIVACIDADE}`}>{CONTATO_PRIVACIDADE}</a> com
            o assunto <strong>&ldquo;Exclusão de dados&rdquo;</strong>.
          </li>
          <li style={{ marginBottom: 10 }}>
            Informe <strong>o nome e o telefone</strong> que você usou no atendimento e{" "}
            <strong>o nome da empresa</strong> com quem você se relacionou (a academia, a
            clínica, a loja). São esses dados que localizam o seu cadastro — sem eles não há
            como saber qual registro apagar.
          </li>
          <li>
            Pronto. Você recebe a confirmação em <strong>até 15 dias</strong>.
          </li>
        </ol>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>O que é apagado</h2>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          O cadastro (nome, telefone, e-mail, anotações) e o{" "}
          <strong>histórico de mensagens vinculado a ele</strong> — apagar o cadastro apaga a
          conversa junto. Pode ser mantido apenas o mínimo exigido por obrigação legal, como
          registros fiscais de uma compra que você fez.
        </p>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Só parar de receber mensagens</h2>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          Se você não quer apagar nada — só quer que parem de te mandar mensagem —{" "}
          <strong>responda no próprio WhatsApp</strong> com algo como{" "}
          <em>&ldquo;não quero mais receber&rdquo;</em> ou <em>&ldquo;me tire da lista&rdquo;</em>.
          O sistema reconhece o pedido e tira você de todas as listas de envio na hora, sem
          depender de alguém ler depois.
        </p>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Quem decide o quê</h2>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          A empresa com quem você se relacionou é a <strong>controladora</strong> dos seus
          dados; o {BRAND_NAME} é o <strong>operador</strong>, que executa. Ao receber o
          pedido, encaminhamos a ela e fazemos a exclusão. Você também pode pedir direto para a
          empresa, se preferir. Os detalhes estão na{" "}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
      </div>

      <p className="text-faint" style={{ textAlign: "center", marginTop: 40, fontSize: 13 }}>
        {BRAND_NAME} · {MAKER}
      </p>
    </main>
  );
}
