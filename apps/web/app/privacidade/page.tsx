import Link from "next/link";
import { BRAND_NAME, MAKER } from "@/lib/brand";

/**
 * A POLÍTICA DE PRIVACIDADE — página pública, sem login.
 *
 * ⚠ POR QUE ELA EXISTE, e por que é código e não um PDF no Drive.
 *
 * A Meta exige uma **URL** de política de privacidade para publicar o app, e
 * ela ABRE o endereço para conferir. Documento em Drive, Notion ou anexo não
 * serve: precisa ser página aberta, sem login, no domínio do produto.
 *
 * ⚠ E ELA PRECISA DESCREVER O QUE O SISTEMA FAZ DE VERDADE. Política copiada
 * de modelo é pior que nenhuma: promete o que o produto não cumpre, e no dia
 * de um pedido de exclusão a diferença entre o texto e o comportamento é o
 * problema. Cada afirmação daqui foi conferida no código — os campos são os
 * de `contacts` e `interactions`, os subprocessadores são os que estão no
 * `package.json` e nas variáveis de ambiente, e o descadastro por frase é o
 * `lib/optout.ts`.
 *
 * ⚠ A DISTINÇÃO QUE ORGANIZA O TEXTO: numa plataforma multi-tenant existem
 * DOIS papéis e eles não podem ser misturados. Da lista de clientes de uma
 * academia, quem decide é a academia (controladora) e nós só executamos
 * (operador). Já dos usuários que entram no painel, quem decide somos nós.
 * Escrever "somos os controladores de tudo" seria assumir uma obrigação que
 * não é nossa e tirar da empresa uma que é.
 */
export const metadata = {
  title: `Política de Privacidade — ${BRAND_NAME}`,
  description: `Como o ${BRAND_NAME} trata dados pessoais, quem são os subprocessadores e como pedir exclusão.`,
};

/**
 * ⚠ O CANAL DE CONTATO É REAL E PRECISA CONTINUAR REAL.
 *
 * A Meta escreve para cá durante a análise, e o titular de dados escreve para
 * cá para pedir exclusão. E-mail que não existe transforma o direito da LGPD
 * em texto decorativo — é a mesma classe do campo que some: parece que existe.
 * Trocar é uma linha; conferir que responde é obrigação de quem trocar.
 */
const CONTATO = "wsslabs.sistemas@gmail.com";

/** Última revisão do texto. Muda quando o CONTEÚDO muda, não quando o build roda. */
const ATUALIZADO_EM = "22 de agosto de 2026";

export default function PrivacidadePage() {
  return (
    <main className="container" style={{ maxWidth: 760, paddingBlock: 40 }}>
      <Link href="/" className="btn btn-sm btn-ghost">← Voltar</Link>

      <p className="eyebrow mt-24">{MAKER}</p>
      <h1 style={{ marginTop: 8 }}>Política de Privacidade</h1>
      <p className="text-faint" style={{ fontSize: 13 }}>
        Última atualização: {ATUALIZADO_EM}
      </p>

      <p className="text-dim">
        O <strong>{BRAND_NAME}</strong> é uma plataforma de gestão comercial fornecida pela{" "}
        {MAKER}. Empresas contratam o sistema para organizar o atendimento aos próprios
        clientes — registrar conversas, saber com quem falar hoje e responder pelo WhatsApp.
        Esta página explica quais dados o sistema trata, por quê, com quem eles são
        compartilhados e como pedir exclusão.
      </p>

      <div className="card mt-24">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>1. Quem é responsável pelo quê</h2>
        <p className="text-dim" style={{ marginBottom: 8 }}>
          A plataforma atende várias empresas, e o papel muda conforme o dado:
        </p>
        <ul className="text-dim" style={{ marginBottom: 0 }}>
          <li>
            <strong>Dados dos clientes de uma empresa contratante</strong> (por exemplo, os
            alunos de uma academia): a <strong>empresa contratante é a controladora</strong> —
            é ela que decide quem entra na base, para que fim e por quanto tempo. O{" "}
            {BRAND_NAME} atua como <strong>operador</strong>, tratando esses dados apenas para
            executar o serviço contratado e seguindo as instruções dela.
          </li>
          <li style={{ marginTop: 8 }}>
            <strong>Dados de quem usa o painel</strong> (donos, gestores e vendedores com
            login): aqui o {BRAND_NAME} é o <strong>controlador</strong>.
          </li>
        </ul>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>2. Quais dados são tratados</h2>
        <p className="text-dim" style={{ marginBottom: 8 }}>
          <strong>Dos clientes das empresas contratantes:</strong> nome, telefone, e-mail
          (quando informado), origem do contato, etapa do atendimento, anotações escritas pela
          equipe, campos próprios do ramo (por exemplo, plano e vigência) e o{" "}
          <strong>conteúdo das mensagens trocadas</strong> com a empresa, com data e hora.
        </p>
        <p className="text-dim" style={{ marginBottom: 8 }}>
          <strong>De quem usa o painel:</strong> nome, e-mail, empresa e papel de acesso, além
          de registros de uso do sistema.
        </p>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          O sistema <strong>não coleta</strong> dados de cartão, documento de identidade,
          localização ou dado sensível (saúde, biometria, origem racial, opinião política,
          religião). Se alguém digitar essa informação numa anotação livre, ela fica sob
          responsabilidade da empresa que escreveu.
        </p>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>3. Para que servem</h2>
        <ul className="text-dim" style={{ marginBottom: 0 }}>
          <li>Executar o atendimento comercial contratado pela empresa (base legal: execução de contrato e legítimo interesse na relação comercial já existente).</li>
          <li>Enviar e receber mensagens no WhatsApp pelo número oficial da empresa.</li>
          <li>Sugerir ao vendedor a próxima mensagem, com apoio de inteligência artificial.</li>
          <li>Medir o próprio funcionamento (quantas conversas, quanto tempo de resposta) para a empresa acompanhar a operação e para cobrança do serviço.</li>
        </ul>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>4. Inteligência artificial</h2>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          Para sugerir uma resposta, o sistema envia ao provedor de IA a mensagem do cliente, o
          histórico recente daquela conversa e os fatos cadastrados pela empresa. O provedor
          usado é a <strong>Anthropic</strong> (API Claude); conforme os termos comerciais
          dele, esse conteúdo <strong>não é usado para treinar modelos</strong>.{" "}
          <strong>A sugestão nunca é enviada sozinha ao cliente:</strong> uma pessoa da equipe
          lê e decide antes de enviar.
        </p>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>5. Com quem os dados são compartilhados</h2>
        <p className="text-dim" style={{ marginBottom: 8 }}>
          Não vendemos dados e não os cedemos para publicidade. Eles passam apenas pelos
          fornecedores necessários para o serviço funcionar:
        </p>
        <ul className="text-dim" style={{ marginBottom: 8 }}>
          <li><strong>Supabase</strong> — banco de dados e autenticação.</li>
          <li><strong>Vercel</strong> — hospedagem da aplicação.</li>
          <li><strong>Meta Platforms</strong> — envio e recebimento das mensagens pela API oficial do WhatsApp.</li>
          <li><strong>Anthropic</strong> — geração das sugestões de resposta.</li>
        </ul>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          Esses fornecedores podem processar dados <strong>fora do Brasil</strong>, o que a
          LGPD permite mediante cláusulas contratuais de proteção. Cada empresa contratante vê
          somente os próprios dados — o isolamento é garantido no banco, não apenas na tela.
        </p>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>6. Mensagens no WhatsApp e descadastro</h2>
        <p className="text-dim" style={{ marginBottom: 8 }}>
          As mensagens partem do número oficial da empresa contratante, sobre uma relação
          comercial que já existe. <strong>Para parar de receber, basta responder pedindo</strong>{" "}
          — frases como <em>&ldquo;não quero mais receber&rdquo;</em>,{" "}
          <em>&ldquo;me tire da lista&rdquo;</em> ou <em>&ldquo;me descadastre&rdquo;</em> são
          reconhecidas automaticamente e o contato sai de todas as listas de envio na hora, sem
          depender de alguém marcar depois.
        </p>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          O pedido também pode ser feito pelo e-mail abaixo.
        </p>
      </div>

      <div className="card mt-16" id="exclusao">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>7. Seus direitos e como pedir exclusão</h2>
        <p className="text-dim" style={{ marginBottom: 8 }}>
          A LGPD garante confirmação de tratamento, acesso, correção, portabilidade, informação
          sobre compartilhamento e <strong>exclusão</strong> dos seus dados.
        </p>
        <p className="text-dim" style={{ marginBottom: 8 }}>
          <strong>Para pedir a exclusão</strong>, escreva para{" "}
          <a href={`mailto:${CONTATO}`}>{CONTATO}</a> com o assunto{" "}
          <strong>&ldquo;Exclusão de dados&rdquo;</strong>, informando o nome e o telefone
          usados no atendimento, e o nome da empresa com quem você se relacionou. O pedido é
          respondido em <strong>até 15 dias</strong>. Quando o dado pertence à base de uma
          empresa contratante, encaminhamos o pedido a ela como controladora e executamos a
          exclusão em seguida — apagar o cadastro apaga também o histórico de conversas
          vinculado a ele.
        </p>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          Podemos reter o mínimo necessário quando houver obrigação legal (por exemplo, registros
          fiscais e contábeis). Fora isso, os dados de uma empresa são apagados quando ela
          encerra o contrato.
        </p>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>8. Segurança</h2>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          O acesso exige login com senha. Cada empresa só alcança os próprios registros, por
          regra aplicada no banco de dados. Credenciais de canal e chaves de integração ficam
          em área restrita, inacessível pela aplicação do usuário. Nenhum sistema é imune —
          havendo incidente com risco relevante, comunicamos os afetados e a ANPD, como manda
          a lei.
        </p>
      </div>

      <div className="card mt-16">
        <h2 style={{ fontSize: 18, marginTop: 0 }}>9. Contato</h2>
        <p className="text-dim" style={{ marginBottom: 0 }}>
          Dúvidas sobre esta política, sobre o tratamento dos seus dados ou pedidos da LGPD:{" "}
          <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
        </p>
      </div>

      <p className="text-faint" style={{ textAlign: "center", marginTop: 40, fontSize: 13 }}>
        {BRAND_NAME} · {MAKER}
      </p>
    </main>
  );
}
