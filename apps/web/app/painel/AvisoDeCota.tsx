/**
 * O aviso de cota de IA atingida.
 *
 * POR QUE ELE NÃO É VERMELHO. Teto atingido não é falha do produto — é a regra
 * funcionando. Pintar de erro faria a empresa em teste concluir que o sistema
 * quebrou e sumir, que é exatamente o oposto do que a cota existe para fazer.
 * O `COS_Kairos_Vende_Kairos.md` põe isso como parte do desenho: "nenhuma
 * empresa fica sem produto quando o teto de IA é atingido — ela volta ao modo
 * que sempre funcionou".
 *
 * E o aviso VENDE: é aqui que a pessoa sente a diferença entre o modo com IA e
 * o cockpit manual, e entende exatamente pelo que vai pagar.
 */
export function AvisoDeCota({ mensagem }: { mensagem: string }) {
  return (
    <div
      className="card mt-16"
      style={{ borderColor: "rgba(90,150,230,0.35)", background: "rgba(90,150,230,0.06)" }}
    >
      <div className="badge">Cota de IA</div>
      <p style={{ marginTop: 10, marginBottom: 0 }}>{mensagem}</p>
    </div>
  );
}
