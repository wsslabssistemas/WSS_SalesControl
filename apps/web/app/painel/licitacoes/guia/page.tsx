import Link from "next/link";
import { getActiveTenant } from "@/lib/auth";
import { loadEntitlements } from "@/lib/entitlements";

export const metadata = { title: "Guia de vendas ao governo" };

const QA: { p: string; r: string }[] = [
  {
    p: "Como começo a vender para o governo?",
    r: "Três passos: (1) tenha o CNPJ ativo e regular; (2) faça o cadastro no SICAF (gratuito, gov.br) para ficar habilitado a participar; (3) monitore os editais do seu ramo (é o que esta ferramenta faz) e envie propostas nos que couberem. A maioria hoje é por pregão eletrônico, feito online.",
  },
  {
    p: "O que é o SICAF e é obrigatório?",
    r: "SICAF é o Sistema de Cadastramento Unificado de Fornecedores do governo federal. Estar cadastrado agiliza a habilitação (o órgão consulta seus documentos automaticamente) e é exigido em muitos pregões. É gratuito. Estados e municípios podem ter cadastros próprios além do SICAF.",
  },
  {
    p: "Quais documentos preciso manter em dia?",
    r: "As quatro frentes de habilitação: jurídica (contrato social), fiscal e trabalhista (certidões negativas: Receita/PGFN, FGTS, trabalhista/CNDT, estadual e municipal), técnica (atestados de capacidade quando exigido) e econômico-financeira (balanço, certidão de falência). Certidão vencida na hora do certame desclassifica — mantenha tudo válido.",
  },
  {
    p: "Como encontro os editais certos para mim?",
    r: "Use o monitor com as palavras-chave do que você vende (ex.: 'automação', 'CFTV', 'material elétrico') e seus estados. O produto costuma estar nos itens do edital, não no título — por isso a busca é por texto completo. Confira o objeto, os itens, o valor e a data de encerramento antes de investir tempo.",
  },
  {
    p: "Como precifico para ganhar sem ter prejuízo?",
    r: "Pesquise o preço praticado (o próprio PNCP mostra o que órgãos pagaram em compras parecidas), calcule seu custo real + impostos + margem mínima, e defina um piso abaixo do qual você não desce. No pregão a disputa é por lances — entre sabendo até onde pode ir. Preço bom não é o menor, é o menor que ainda te dá lucro.",
  },
  {
    p: "Que vantagens ME/EPP têm?",
    r: "Pela LC 123/2006: empate ficto (se um ME/EPP fica até 5% acima do 1º lugar que é empresa grande, pode cobrir e vencer); itens/lotes até R$ 80 mil podem ser exclusivos para ME/EPP; e regularidade fiscal pode ser comprovada só na hora de assinar. Se você é ME/EPP, marque isso — é uma vantagem competitiva real.",
  },
  {
    p: "Quais erros mais desclassificam?",
    r: "Certidão vencida, proposta enviada fora do prazo, não atender exatamente a especificação do item (marca/modelo/norma exigida), errar a planilha de custos, e não responder às diligências do pregoeiro no tempo pedido. Leia o edital inteiro — a maioria das derrotas é por detalhe formal, não por preço.",
  },
  {
    p: "Posso questionar ou impugnar um edital?",
    r: "Sim. Se o edital tem exigência ilegal, direcionada a um concorrente ou erro, você pode pedir esclarecimento ou impugnar dentro do prazo previsto (geralmente até 3 dias úteis antes da abertura). É um direito e às vezes muda a regra a seu favor — ou adia o certame.",
  },
  {
    p: "Como funciona a disputa no pregão eletrônico?",
    r: "Você envia a proposta inicial pelo sistema (Compras.gov.br ou o portal do órgão). Na sessão, abre a fase de lances: os fornecedores vão baixando o preço em tempo real. Vence o menor lance que cumpra o edital; depois o pregoeiro confere seus documentos (habilitação) e homologa. Tudo online, com data e hora marcadas no edital.",
  },
  {
    p: "O que são dispensa e inexigibilidade?",
    r: "São contratações sem licitação plena. Dispensa: permitida em casos previstos em lei (valores baixos, emergência). Inexigibilidade: quando a competição é inviável (fornecedor exclusivo). Aparecem no PNCP como modalidades e são oportunidades rápidas — fique de olho, principalmente nas dispensas de baixo valor do seu ramo.",
  },
];

export default async function GuiaPage() {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return (<main><h1>Guia</h1><p className="text-dim">Sem empresa vinculada.</p></main>);

  const ent = await loadEntitlements(tenant.id, tenant.skill_key);
  if (!ent.has("licitacoes")) {
    return (<main><h1>Guia de vendas ao governo</h1><p className="text-dim">Disponível com o módulo de Licitações.</p></main>);
  }

  return (
    <main style={{ maxWidth: 680 }}>
      <Link href="/painel/licitacoes" className="text-dim" style={{ fontSize: 13 }}>← Licitações</Link>
      <h1 className="mt-8">Guia de vendas ao governo</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        O essencial para participar de licitações e fechar com o setor público.
        Base para as suas respostas — em breve o Responder usa este conhecimento.
      </p>

      <div className="stack mt-24" style={{ gap: 10 }}>
        {QA.map((qa, i) => (
          <details key={i} className="card" style={{ padding: "14px 16px" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, listStyle: "none" }}>
              {qa.p}
            </summary>
            <p className="text-dim" style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.6 }}>{qa.r}</p>
          </details>
        ))}
      </div>

      <p className="text-faint mt-24" style={{ fontSize: 12 }}>
        Orientação geral com base na Lei 14.133/2021 e na LC 123/2006. Não
        substitui a leitura do edital nem assessoria jurídica.
      </p>
    </main>
  );
}
