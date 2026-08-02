-- =====================================================================
-- COS — DEMO SEED : DNA das empresas de demonstração
--
-- ⚠ DEMO SEED. Roda em desenvolvimento e demonstração. **NUNCA em
-- produção.** Só toca tenants com slug `demo-%` — a convenção existe para
-- que um erro humano jamais alcance empresa real.
--
-- POR QUE EXISTE: 5 dos 8 tenants demo estavam sem DNA nenhum (clínica,
-- distribuidora, escola esportiva, indústria, sob medida). Sem DNA a trava
-- anti-invenção escala em TUDO — o motor não redige. Resultado: as 145
-- entradas curadas nunca puderam ser vistas funcionando nesses segmentos.
--
-- O dado abaixo é FICTÍCIO e plausível: serve para exercitar o motor, não
-- para parecer real. Nomes de empresa carregam "Demo" de propósito.
--
-- Aplicar:  cole no SQL Editor, ou rode via MCP/psql.
-- =====================================================================

-- Um único DNA corrente por tenant (índice único do 0007). Apaga o anterior
-- da demo antes de gravar — recarga idempotente.
delete from public.commercial_dna d
 using public.tenants t
 where d.tenant_id = t.id
   and t.slug in ('demo-clinica','demo-distribuidora','demo-escola-esportiva',
                  'demo-industria','demo-sob-medida','demo-energia-solar');

insert into public.commercial_dna (tenant_id, version, sections, source, is_current)
select t.id, 1, x.sections, 'demo_seed', true
from (values

-- ---------------------------------------------------------------- CLÍNICA
('demo-clinica', $json$
{
  "pricing": {
    "range": "R$ 150 a R$ 4.500",
    "avaliacao_valor": "R$ 150, abatidos do tratamento se fechar em até 30 dias",
    "parcelamento": "até 10x sem juros no cartão; 12x com juros pelo financiamento da clínica",
    "formas_pagamento": ["pix", "débito", "crédito", "boleto"]
  },
  "availability": {
    "weekly_hours": "Segunda a sexta das 8h às 19h; sábado das 8h às 13h",
    "prazo_agendamento": "Avaliação em até 3 dias úteis. Urgência de dor: encaixe no mesmo dia."
  },
  "catalog": {
    "items": [
      {"procedimento": "Avaliação e plano de tratamento", "profissional": "Dra. Helena Prado", "duracao": "45 min", "observacao": "Inclui radiografia panorâmica"},
      {"procedimento": "Limpeza e profilaxia", "profissional": "Dra. Helena Prado", "duracao": "50 min", "observacao": ""},
      {"procedimento": "Clareamento a laser", "profissional": "Dra. Helena Prado", "duracao": "1h30", "observacao": "2 sessões"},
      {"procedimento": "Implante unitário", "profissional": "Dr. Marcos Ribeiro", "duracao": "2h", "observacao": "Inclui pilar e coroa"},
      {"procedimento": "Harmonização facial", "profissional": "Dra. Camila Nunes", "duracao": "1h", "observacao": "Retorno em 15 dias"}
    ]
  },
  "convenios": {
    "aceita_convenio": false,
    "lista": [],
    "reembolso": "Emitimos nota e relatório para reembolso; o valor depende do plano do paciente."
  },
  "expertise_proof": {
    "tempo_de_casa": "14 anos no mesmo endereço",
    "profissionais": [
      {"nome": "Dra. Helena Prado", "especialidade": "Dentística e estética", "registro": "CRO-RS 00000"},
      {"nome": "Dr. Marcos Ribeiro", "especialidade": "Implantodontia", "registro": "CRO-RS 00000"},
      {"nome": "Dra. Camila Nunes", "especialidade": "Harmonização orofacial", "registro": "CRO-RS 00000"}
    ],
    "tecnologia": ["scanner intraoral", "radiografia digital", "laser de diodo"]
  },
  "policies": {
    "cancelamento": "Até 24h antes, sem custo.",
    "no_show": "Segunda falta sem aviso passa a exigir confirmação com sinal.",
    "garantia": "Restaurações e próteses com 2 anos de garantia, com acompanhamento semestral em dia."
  },
  "differentials": {
    "items": ["atendimento sem espera", "plano de tratamento por escrito antes de começar", "mesmo profissional do início ao fim"]
  },
  "location_contact": {
    "address": "Av. das Palmeiras, 1200 — sala 302, Porto Alegre/RS",
    "whatsapp": "5151999990000",
    "estacionamento": "Convênio com estacionamento no subsolo, 2h gratuitas"
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Clínica odontológica de bairro, atendimento particular, foco em plano de tratamento explicado sem pressa."
}
$json$::jsonb),

-- ---------------------------------------------------------- DISTRIBUIDORA
('demo-distribuidora', $json$
{
  "linhas": {
    "produtos": ["bebidas não alcoólicas", "águas e isotônicos", "snacks e salgadinhos", "descartáveis", "higiene e limpeza"],
    "marcas": ["Vitalis", "SerraFina", "CrocSnack", "LimpaMais"],
    "exclusividades": ["Vitalis (exclusividade na região metropolitana)"]
  },
  "comercial": {
    "pedido_minimo": "R$ 600",
    "prazo_pagamento": "28 dias para cliente com cadastro aprovado; primeira compra à vista ou pix",
    "politica_desconto": "3% acima de R$ 2.500 no mesmo pedido; 6% acima de R$ 6.000",
    "tabela_por_volume": true
  },
  "logistica": {
    "regiao_atendida": "Porto Alegre e região metropolitana (até 60 km)",
    "prazo_entrega": "48h após confirmação do pedido, dentro do dia de rota",
    "frete": "Grátis acima de R$ 1.200; abaixo disso, R$ 60 por entrega",
    "dias_de_rota": "Zona Norte às segundas e quintas; Zona Sul às terças e sextas; Centro às quartas"
  },
  "diferencial": {
    "motivo_trocar": "Rota própria com dia fixo e reposição em 48h — o cliente não fica com prateleira vazia esperando o caminhão do atacado.",
    "suporte": "Um vendedor fixo por carteira, com WhatsApp direto e visita quinzenal."
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Distribuidora de bebidas e conveniência para mercados de bairro, padarias e bares."
}
$json$::jsonb),

-- ------------------------------------------------------- ESCOLA ESPORTIVA
('demo-escola-esportiva', $json$
{
  "modalidades": {
    "lista": ["natação infantil", "natação adulto", "hidroginástica", "judô", "futsal"],
    "faixas_etarias": "Natação a partir de 3 anos; judô a partir de 5; futsal de 6 a 17; adulto sem limite.",
    "grade_horarios": "Natação infantil: seg/qua 15h, 16h e 17h; ter/qui 15h e 16h. Judô: ter/qui 18h. Futsal: seg/qua 19h. Adulto: seg a sex 7h, 12h e 20h.",
    "vagas_por_turma": "8 alunos por turma na natação infantil; 16 no judô e futsal"
  },
  "pricing": {
    "range": "R$ 180 a R$ 320 por mês",
    "matricula": "Matrícula de R$ 90, isenta em campanha de início de semestre",
    "desconto_irmaos": true,
    "formas_pagamento": ["pix", "débito automático", "cartão de crédito", "boleto"]
  },
  "experimental": {
    "oferece": true,
    "precisa_agendar": true,
    "como_funciona": "Uma aula experimental gratuita, na turma da idade e do nível da criança, com o professor titular.",
    "o_que_levar": "Traje de banho, touca, chinelo e toalha. Para judô e futsal, roupa leve e tênis."
  },
  "estrutura": {
    "instalacoes": ["piscina aquecida 25m coberta", "vestiário com chuveiro quente", "área de espera com visão da piscina", "tatame oficial"],
    "professores": "Cinco professores formados em Educação Física, dois com especialização em natação infantil.",
    "estacionamento": true
  },
  "regras": {
    "idade_minima": "3 anos completos",
    "atestado_medico": true,
    "uniforme": "Touca da escola obrigatória na natação; judogui exigido a partir do segundo mês."
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Escola de natação e esportes de bairro, forte em turma infantil, com pais como decisores."
}
$json$::jsonb),

-- --------------------------------------------------------------- INDÚSTRIA
('demo-industria', $json$
{
  "produto": {
    "linhas": ["feltro agulhado", "manta acústica", "não tecido para estofamento", "feltro técnico industrial"],
    "especificacao": "Feltro agulhado 100% poliéster, gramatura de 150 a 800 g/m², largura padrão de 1,60 m e 2,00 m, espessura de 2 a 12 mm, tolerância de ±5% na gramatura. Manta acústica com absorção declarada por ensaio.",
    "aplicacoes": ["estofados e colchões", "isolamento acústico automotivo", "revestimento industrial", "calçados e palmilhas"],
    "certificacoes": ["ISO 9001", "laudo de inflamabilidade", "ficha técnica com ensaio de gramatura por lote"]
  },
  "producao": {
    "lote_minimo": "500 metros lineares por cor e gramatura",
    "prazo_producao": "20 dias úteis após confirmação do pedido e aprovação da cor",
    "capacidade": "Cerca de 120 mil metros por mês em dois turnos",
    "desenvolvimento": "Desenvolvemos gramatura e cor sob especificação a partir de 2.000 metros por pedido, com custo de acerto de máquina cobrado uma única vez."
  },
  "comercial": {
    "pedido_minimo": "R$ 8.000",
    "prazo_pagamento": "28/42/56 dias para cliente com cadastro aprovado; primeira compra 50% na confirmação",
    "politica_desconto": "Faixa melhor a partir de 2.000 metros no mesmo pedido",
    "frete": "CIF acima de R$ 20.000 para a região Sul; demais casos FOB"
  },
  "canal": {
    "forma_de_venda": "Venda por representantes exclusivos por região; venda direta apenas onde não há representante.",
    "regioes": "Rio Grande do Sul, Santa Catarina e Paraná; São Paulo em expansão",
    "exclusividade": "Exclusividade de território mediante meta anual acordada em contrato.",
    "apoio_ao_cliente": "Mostruário físico, ficha técnica por linha e apoio de aplicação na primeira produção do cliente."
  },
  "diferencial": {
    "motivo_trocar": "Reposição em 20 dias com lote rastreado — o cliente não para a linha esperando container importado.",
    "tempo_de_fabrica": "28 anos de fábrica própria",
    "assistencia": "Lote fora de especificação é recolhido e reposto sem custo, com laudo de análise em até 5 dias úteis."
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Indústria têxtil de feltro e não tecidos, vendendo B2B para estofados, calçado e automotivo, através de representantes."
}
$json$::jsonb),

-- -------------------------------------------------------------- SOB MEDIDA
('demo-sob-medida', $json$
{
  "catalog": {
    "items": [
      {"servico": "Cozinha planejada", "material": "MDF 18mm com fita de borda", "observacao": "Ferragens com amortecedor"},
      {"servico": "Dormitório planejado", "material": "MDF 18mm", "observacao": "Portas de correr sob medida"},
      {"servico": "Home office", "material": "MDF 15mm e 18mm", "observacao": "Passagem de fiação embutida"},
      {"servico": "Painel de TV", "material": "MDF ripado", "observacao": ""}
    ],
    "nao_faz": ["marcenaria em madeira maciça", "restauro de móvel antigo", "montagem de móvel de terceiros"]
  },
  "pricing": {
    "range": "R$ 4.500 a R$ 45.000 por ambiente",
    "como_cobra": "Por projeto fechado, com base no metro linear e no material escolhido, sempre após a medição no local.",
    "parcelamento": "Entrada de 40% na assinatura do projeto e o restante em até 6x sem juros",
    "financiamento": "Trabalhamos com financiamento de material via lojista parceiro para valores acima de R$ 20.000."
  },
  "availability": {
    "prazo_visita": "Visita técnica em até 3 dias úteis",
    "prazo_orcamento": "Orçamento com projeto em até 5 dias úteis após a medição",
    "prazo_entrega": "35 dias úteis entre a aprovação do projeto e a instalação",
    "weekly_hours": "Segunda a sexta das 8h às 18h; sábado das 9h às 12h"
  },
  "risk_free_entry": {
    "visita_gratuita": true,
    "raio_atendimento": "Porto Alegre e cidades até 40 km",
    "valor_visita": "Sem custo dentro do raio; fora dele, R$ 150 abatidos se fechar",
    "o_que_leva": "Trena a laser, catálogo de materiais e projetos semelhantes já executados"
  },
  "expertise_proof": {
    "tempo_de_casa": "11 anos de marcenaria própria",
    "garantia": "3 anos para estrutura e ferragens, com assistência agendada em até 5 dias úteis",
    "equipe": "Equipe própria de instalação, sem terceirizar montagem",
    "obras_referencia": ["apartamentos no bairro Petrópolis", "casas em condomínio na zona sul", "escritórios no centro"]
  },
  "differentials": {
    "items": ["projeto 3D antes de produzir", "equipe de instalação própria", "medição conferida duas vezes"],
    "marcas": ["Duratex", "Blum", "Hafele"],
    "projeto_3d": true
  },
  "policies": {
    "alteracao_escopo": "Alterações após a aprovação do projeto geram novo orçamento e novo prazo.",
    "cancelamento": "Cancelamento antes do corte devolve 70% da entrada; após o corte, o material já foi consumido.",
    "assistencia": "Chamado de assistência atendido em até 5 dias úteis dentro da garantia."
  },
  "location_contact": {
    "address": "Rua das Oficinas, 455 — Porto Alegre/RS",
    "whatsapp": "5151999990000",
    "instagram": "@demo.sobmedida"
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Marcenaria de planejados, com visita técnica, projeto 3D e instalação própria."
}
$json$::jsonb)

,

-- ----------------------------------------------------------- ENERGIA SOLAR
('demo-energia-solar', $json$
{
  "oferta": {
    "tipos_sistema": ["conectado à rede (on-grid)", "híbrido com bateria", "bombeamento rural"],
    "marcas_modulo": ["Canadian Solar", "Trina Solar", "JA Solar"],
    "marcas_inversor": ["Growatt", "Fronius", "microinversor Hoymiles"],
    "telhados_atendidos": ["cerâmico", "metálico", "fibrocimento", "laje", "solo"]
  },
  "precos": {
    "como_cobra": "Projeto fechado, definido por kWp instalado, sempre depois da análise da conta de luz e da visita técnica.",
    "faixa": "R$ 14.000 a R$ 95.000",
    "formas_pagamento": ["pix", "cartão em até 12x", "financiamento bancário", "boleto parcelado"],
    "financiamento": "Trabalhamos com linha verde de dois bancos parceiros, em até 72 meses. A aprovação sai em 2 a 5 dias úteis e depende de análise de crédito — nunca é garantida.",
    "o_que_inclui": "Módulos, inversor, estrutura conforme o telhado, string box e proteções (DPS CC e CA, disjuntores, aterramento), cabeamento, projeto elétrico com ART, mão de obra e todo o processo de homologação na concessionária."
  },
  "execucao": {
    "prazo_visita": "Visita técnica em até 3 dias úteis",
    "prazo_proposta": "Proposta com simulação em até 2 dias úteis após a visita",
    "prazo_instalacao": "2 a 5 dias no telhado, após aprovação do projeto",
    "prazo_homologacao": "Na RGE costuma levar de 30 a 60 dias após o envio do projeto. O prazo é da concessionária, não nosso — acompanhamos e damos posição.",
    "distribuidoras": ["RGE", "CEEE Equatorial"]
  },
  "garantias": {
    "modulo": "25 anos de garantia de desempenho (mínimo de 80% da capacidade ao final) e 12 anos de garantia de produto",
    "inversor": "10 anos de fábrica, com extensão opcional para 15",
    "instalacao": "5 anos de garantia de mão de obra, incluindo estanqueidade do telhado nos pontos de fixação",
    "seguro": "Oferecemos seguro anual opcional contra granizo, vendaval e furto"
  },
  "pos_venda": {
    "monitoramento": "Aplicativo do inversor com geração em tempo real. Acompanhamos remotamente e avisamos o cliente se a geração cair fora do esperado.",
    "manutencao": "Limpeza e revisão anual (semestral em área rural ou de muita poeira), com laudo de geração. Contrato opcional.",
    "ampliacao": "O sistema pode ser ampliado depois; por isso dimensionamos o inversor pensando em folga quando o cliente sinaliza consumo futuro."
  },
  "atuacao": {
    "regiao": "Porto Alegre, região metropolitana e serra gaúcha, até 120 km",
    "equipe_propria": true,
    "responsavel_tecnico": "Engenheiro eletricista com CREA ativo, responsável por projeto e ART"
  },
  "diferencial": {
    "motivo_escolher": "Equipe própria de instalação e acompanhamento da homologação até a troca do medidor — o cliente não fica sozinho na espera da concessionária.",
    "tempo_de_casa": "8 anos instalando, mais de 400 sistemas entregues",
    "obras_referencia": ["mercado de bairro na zona sul", "aviário em Montenegro", "residências em condomínio em Viamão"]
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Integradora de energia solar com equipe própria, atuando em residências, comércio e propriedades rurais."
}
$json$::jsonb)

) as x(slug, sections)
join public.tenants t on t.slug = x.slug
-- Cinto de segurança: mesmo se alguém trocar os slugs acima, nada fora de
-- `demo-` é tocado.
where t.slug like 'demo-%';

-- Verificação. Esperado: 5 linhas, todas com 4 seções ou mais.
select t.slug,
       (select count(*) from jsonb_object_keys(d.sections)) as secoes,
       d.source
  from public.commercial_dna d
  join public.tenants t on t.id = d.tenant_id
 where d.is_current and t.slug like 'demo-%'
 order by t.slug;
