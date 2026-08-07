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
                  'demo-industria','demo-sob-medida','demo-energia-solar',
                  'demo-oficina','demo-salao-beleza','demo-casa-de-festa',
                  'demo-pet','demo-curso');

insert into public.commercial_dna (tenant_id, version, sections, source, is_current)
select t.id, 1, x.sections, 'demo_seed', true
from (values

-- ------------------------------------------------------------------ CURSO
-- Dado FICTÍCIO. Escola de idiomas e profissionalizante.
-- Três campos estão preenchidos com cuidado extra porque são os que a
-- biblioteca EXIGE para poder responder as perguntas que mais chegam e as
-- duas que mais viram processo: `certificacao.reconhecimento` (curso livre
-- NÃO tem MEC), `pricing.material_didatico` (o custo esquecido) e
-- `contrato.multa_rescisao` (o medo que decide a matrícula).
('demo-curso', $json$
{
  "cursos": {
    "lista": ["Inglês regular", "Inglês para viagem", "Espanhol regular", "Excel do básico ao avançado", "Informática essencial", "Rotinas administrativas"],
    "modalidades": ["Presencial", "Online ao vivo", "Híbrido (presencial com reposição online)"],
    "niveis": "Idiomas: básico 1 a 4, intermediário 1 a 4, avançado 1 a 2. Cada módulo dura 4 meses. Cursos técnicos livres: módulo único.",
    "carga_horaria": "Idiomas: 64h por módulo. Excel: 40h. Informática essencial: 60h. Rotinas administrativas: 80h.",
    "duracao": "Idiomas: 4 meses por módulo, 2 aulas de 1h30 por semana. Excel: 2 meses, 2x por semana. Rotinas administrativas: 4 meses, 2x por semana.",
    "grade_horarios": "Idiomas: seg/qua 8h, 14h, 19h e 20h30; ter/qui 8h, 14h, 19h e 20h30; sáb 9h e 11h. Excel e informática: ter/qui 19h e sáb 9h.",
    "proximas_turmas": "Idiomas: turmas novas em 03/09 e 03/03. Excel: turma nova todo mês, na primeira segunda. Rotinas administrativas: 03/09.",
    "vagas_por_turma": "Idiomas: 12 alunos. Informática: 10 alunos (um por computador)."
  },
  "pricing": {
    "range": "de R$ 240 a R$ 420 por mês, conforme curso e modalidade",
    "matricula": "R$ 120, cobrada uma vez por ano letivo. Isenta para quem vem por indicação de aluno matriculado.",
    "material_didatico": "NÃO está incluso na mensalidade. Livro do módulo de idiomas: R$ 290, serve para os 4 meses e fica com o aluno. Excel e informática: apostila digital inclusa, sem custo. Sempre informar na primeira conversa.",
    "formas_pagamento": ["Pix", "boleto mensal", "cartão de crédito recorrente", "cartão em até 12x para o curso inteiro"],
    "desconto_a_vista": "10% para o módulo inteiro pago à vista; 15% para dois módulos.",
    "politica_reajuste": "A mensalidade é travada durante o módulo contratado. O reajuste acontece na virada do módulo, sempre anunciado com 30 dias."
  },
  "contrato": {
    "fidelidade": "O contrato é por módulo: 4 meses em idiomas, 2 meses em Excel. Não há fidelidade além do módulo em curso.",
    "multa_rescisao": "Desistência no meio do módulo: 20% sobre as mensalidades que faltam, mais o material já entregue. Nos 7 primeiros dias, devolução integral e sem multa.",
    "politica_trancamento": "Pode trancar uma vez por módulo, por até 6 meses, sem multa. O que já foi cursado fica registrado e o aluno volta no ponto em que parou, na próxima turma do mesmo nível.",
    "transferencia_turma": "Troca de horário ou de turma a qualquer momento, conforme vaga, sem custo. É a saída para quem mudou de trabalho.",
    "aproveitamento": "Quem já estudou antes faz o teste de nível e entra no módulo correspondente — não precisa recomeçar. O aproveitamento é definido pelo teste, não por tempo de curso anterior."
  },
  "certificacao": {
    "emite_certificado": true,
    "tipo": "Certificado de curso livre, com o nome do curso, a carga horária e o conteúdo programático no verso.",
    "reconhecimento": "Curso livre, amparado pela LDB como formação inicial e continuada. NÃO tem reconhecimento do MEC e não precisa ter — o MEC reconhece graduação e pós. Serve para comprovar carga horária em processo seletivo, progressão interna e currículo. Nunca dizer que é reconhecido pelo MEC nem chamar de diploma.",
    "exigencias": "75% de presença e aprovação na avaliação final do módulo."
  },
  "teste_nivel": {
    "oferece": true,
    "como_funciona": "Conversa de 30 a 40 minutos com um professor, sem prova escrita e sem nota. No fim o interessado recebe por escrito em que nível está e quantos módulos faltam para o objetivo dele.",
    "gratuito": true,
    "online_ou_presencial": "Os dois. Online por videochamada, presencial na escola.",
    "aula_demonstrativa": true
  },
  "estrutura": {
    "professores": "6 professores. Em idiomas, todos com certificação internacional de proficiência; dois com experiência de morar fora. Em informática, dois instrutores com atuação em escritório.",
    "metodologia": "Aula de idiomas é conversação desde a primeira: o aluno fala na primeira aula. Informática é prática no computador, com exercício de rotina real de escritório.",
    "alunos_por_turma": "12 em idiomas, 10 em informática. Ninguém passa disso.",
    "plataforma": "Portal do aluno com o material, os exercícios e a gravação da aula da semana, disponível por 30 dias.",
    "reposicao": "Uma reposição por mês, na turma do mesmo nível em outro horário, agendada com 24h de antecedência."
  },
  "resultados": {
    "tempo_de_mercado": "12 anos na mesma esquina, mais de 3.000 alunos formados",
    "casos": "Aluna do intermediário 2 passou em processo seletivo com entrevista em inglês; turma de Excel avançado de 2025 teve 4 alunos promovidos internamente. Sempre citados com autorização e sem nome.",
    "aprovacoes": "Não somos preparatório. Não divulgamos aprovação em prova.",
    "parcerias_empresas": ["metalúrgica do distrito industrial", "rede de farmácias local", "escritório de contabilidade do centro"]
  },
  "regras": {
    "idade_minima": "A partir de 12 anos em idiomas; 14 em informática. Menor de 18 matricula com responsável.",
    "pre_requisito": "Nenhum para o básico 1. Para os demais módulos, o teste de nível define.",
    "frequencia_minima": "75% para receber o certificado.",
    "entrada_turma_iniciada": "Até a terceira aula do módulo, com reposição do conteúdo perdido agendada. Depois disso, só na próxima turma."
  },
  "corporativo": {
    "atende": true,
    "minimo_alunos": "8 alunos para abrir turma fechada",
    "local": "Na empresa, na escola ou online ao vivo — a empresa escolhe",
    "faturamento": "Nota fiscal para o CNPJ, contrato por módulo, pagamento em 30 dias"
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Escola de idiomas e cursos livres profissionalizantes de bairro, com turmas presenciais e online ao vivo."
}
$json$::jsonb),

-- -------------------------------------------------------------------- PET
-- Dado FICTÍCIO. A régua do banho por porte e as vacinas exigidas estão
-- preenchidas de propósito: são os fatos que a biblioteca EXIGE para poder
-- responder as duas perguntas que mais chegam.
('demo-pet', $json$
{
  "catalog": {
    "items": [
      { "servico": "Banho", "duracao": "1h30 a 3h", "observacao": "Secagem na mão. Tempo varia por porte e pelagem" },
      { "servico": "Banho e tosa higiênica", "duracao": "2h a 3h30", "observacao": "" },
      { "servico": "Tosa na máquina", "duracao": "2h30 a 4h", "observacao": "Raças de pelo duro têm tosa própria" },
      { "servico": "Creche (day care)", "duracao": "Meio período ou dia inteiro", "observacao": "Separação por porte e energia" },
      { "servico": "Hotel", "duracao": "Diária", "observacao": "Entrada até 10h, saída até 18h" },
      { "servico": "Leva e traz", "duracao": "—", "observacao": "Raio de 6 km" }
    ],
    "nao_faz": ["Atendimento a gatos", "Adestramento", "Tosa de raças de pelo duro (stripping)", "Hospedagem de fêmea no cio"],
    "estrutura": ["Área externa gramada de 200m²", "Piscina no verão", "Câmeras com acesso do tutor pelo app", "Separação por porte e por energia", "Ar-condicionado no alojamento"],
    "capacidade": "Creche: 24 cães por dia. Hotel: 12 vagas, que esgotam em feriado e fim de ano."
  },
  "pricing": {
    "banho_por_porte": "Mini R$ 55, pequeno R$ 65, médio R$ 85, grande R$ 110, gigante R$ 140. Pelo longo tem acréscimo de R$ 20 pelo tempo de secagem.",
    "plano_creche": "2x por semana R$ 380/mês (R$ 47 o dia); 3x R$ 520 (R$ 43 o dia); 5x R$ 750 (R$ 37 o dia). Diária avulsa R$ 75.",
    "diaria_hotel": "Pequeno R$ 90, médio R$ 110, grande R$ 135. A diária conta por período de 24h, com tolerância de 2h na saída.",
    "alta_temporada": "Feriados prolongados, julho e de 20/12 a 05/01 têm acréscimo de 20%. Avisamos no ato da reserva, nunca depois.",
    "parcelamento": "PIX e cartão. O plano de creche é cobrado até o dia 5, por recorrência no cartão ou PIX combinado."
  },
  "availability": {
    "weekly_hours": "Seg a Sex 7h30-19h; Sáb 8h-17h. Entrega e retirada do hotel até as 18h.",
    "antecedencia_hotel": "Fim de ano fecha em outubro. Carnaval e feriados prolongados, com 45 a 60 dias. Fora disso costuma ter vaga na semana.",
    "prazo_banho": "De 1h30 a 3h dependendo do porte e do pelo. Trabalhamos com hora marcada, o cão não fica esperando."
  },
  "risk_free_entry": {
    "avaliacao_obrigatoria": true,
    "como_funciona": "Dia de avaliação de 4 horas, sem custo. Observamos como ele se comporta no grupo, se respeita limite e como reage à separação. No fim do dia contamos com sinceridade se este é o lugar dele — inclusive quando a resposta é não.",
    "primeira_vez": "A avaliação de creche não tem custo. Não damos desconto de primeira vez em banho."
  },
  "expertise_proof": {
    "tempo_de_casa": "7 anos no mesmo endereço",
    "equipe": "5 pessoas, sendo 3 dedicadas à creche. No máximo 8 cães por cuidador, separados por porte e por energia.",
    "monitoramento": "Câmeras com acesso do tutor pelo aplicativo, e relatório com foto no meio do dia para quem está na creche ou no hotel.",
    "parceria_vet": "Clínica Vet Amigo, a 400 metros, com atendimento prioritário para nossos hóspedes."
  },
  "policies": {
    "vacinas_exigidas": "V8 ou V10, antirrábica e gripe canina (tosse dos canis), todas com no mínimo 15 dias da aplicação. Carteira conferida na primeira visita e a cada reforço.",
    "cancelamento": "Banho e creche: desmarcando com mais de 4 horas, sem custo. Hotel em alta temporada: sinal de 30% não devolvido se cancelar com menos de 15 dias.",
    "emergencia": "Levamos à Clínica Vet Amigo, avisamos o tutor na hora e não autorizamos procedimento sem a confirmação dele, salvo risco de vida. O custo é do tutor.",
    "nao_aceita": "Cão reativo com outros animais, fêmea no cio, animal com vacina vencida, animal doente ou com suspeita de doença de pele. Nesses casos oferecemos banho individual em horário separado."
  },
  "retention": {
    "intervalo_banho": "Pelo curto a cada 21 dias; pelo longo a cada 15; cão que frequenta a creche costuma precisar a cada 15.",
    "lembrete": "Mensagem 3 dias antes do ciclo, com o nome do animal e dois horários oferecidos"
  },
  "ecosystem": {
    "revenda": ["Ração premium", "Shampoo profissional", "Antipulgas", "Brinquedo de enriquecimento"],
    "parceiros": ["Clínica Vet Amigo", "Adestradora Camila (comportamento)", "Pet sitter Rê para quem prefere em casa"],
    "indicacao": "Quem indica um tutor que fecha plano ganha uma diária de creche"
  },
  "location_contact": {
    "address": "Rua Exemplo, 155 — Porto Alegre/RS",
    "whatsapp": "(51) 96666-0000",
    "instagram": "@petdemo"
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Pet de bairro com banho e tosa, creche com área externa e hotel de 12 vagas. Não atende gatos e não faz veterinária."
}
$json$::jsonb),

-- --------------------------------------------------------- CASA DE FESTAS
-- Dado FICTÍCIO. Os quatro extras que estouram orçamento (rolha, hora
-- extra, convidado a mais, sinal) estão preenchidos de propósito: são
-- exatamente os fatos que a biblioteca EXIGE para poder responder.
('demo-casa-de-festa', $json$
{
  "catalog": {
    "items": [
      { "pacote": "Infantil Completo", "o_que_inclui": "Espaço 5h, buffet salgado e doce, bebida não alcoólica, 4 monitores, brinquedoteca liberada, equipe de limpeza", "capacidade": "40 a 100 convidados" },
      { "pacote": "Infantil Espaço", "o_que_inclui": "Espaço 5h, mesas, cadeiras, louça, 2 monitores e limpeza. Buffet por conta do cliente", "capacidade": "40 a 100 convidados" },
      { "pacote": "Adulto / Confraternização", "o_que_inclui": "Espaço 6h, mesas postas, equipe de serviço e limpeza", "capacidade": "50 a 150 convidados" }
    ],
    "capacidade": "De 40 a 150 convidados. Abaixo de 40 o salão fica vazio e a festa perde graça — nesses casos a gente avisa.",
    "nao_faz": ["Casamento com cerimônia no local", "Eventos após as 23h", "Festa com música ao vivo amplificada (restrição do condomínio vizinho)"],
    "estrutura": ["Brinquedoteca com supervisão", "Área externa coberta", "Estacionamento para 25 carros", "Ar-condicionado no salão", "Sala dos pais com TV", "Acessibilidade e banheiro adaptado"]
  },
  "pricing": {
    "regime": "Trabalhamos nos dois modelos: pacote fechado por convidado (com buffet) e aluguel do espaço com buffet do cliente. O preço muda muito entre os dois, e a gente sempre separa isso antes de orçar.",
    "valor_por_convidado": "R$ 135 por convidado no pacote completo, mínimo cobrado de 40 pessoas",
    "valor_espaco": "R$ 2.900 pelo espaço em 5 horas, com mesas, cadeiras, louça e limpeza",
    "taxa_rolha": "Pode trazer bebida. Rolha de R$ 18 por garrafa de destilado e R$ 8 por garrafa de vinho ou espumante. Refrigerante e água sem taxa.",
    "hora_extra": "R$ 450 por hora adicional, cobrada em fração de 30 minutos, combinada no dia",
    "convidado_extra": "R$ 135 por pessoa acima do contratado, conferido na entrada e acertado ao final",
    "parcelamento": "Sinal de 30% para reservar a data. Restante em até 3x, com a última parcela até 7 dias antes do evento. PIX ou cartão."
  },
  "availability": {
    "sinal": "30% do valor fechado. A data fica disponível para outros interessados até o sinal entrar — não seguramos data na palavra.",
    "antecedencia": "Sábado à tarde costuma fechar com 3 a 4 meses. Sábado à noite e domingo fecham com 2 meses. Meio de semana quase sempre tem data no mesmo mês.",
    "horarios": "Sábado 12h-17h ou 18h-23h; domingo 12h-17h; meio de semana sob consulta",
    "espera": "Mantemos lista de espera por data. Se o sinal de quem reservou não entrar no prazo, chamamos na ordem."
  },
  "policies": {
    "cancelamento": "Cancelando com mais de 90 dias, devolvemos 70% do sinal. Entre 90 e 30 dias, 40%. Com menos de 30 dias o sinal não é devolvido, porque a data dificilmente é revendida.",
    "remarcacao": "Uma troca de data sem custo, com no mínimo 45 dias de antecedência e sujeita à disponibilidade. O sinal acompanha.",
    "chuva": "A área externa é coberta e o salão comporta todos os convidados. Chuva não cancela nem muda o valor.",
    "fornecedor_externo": "Decoradora, fotógrafo e animação de fora podem entrar sem taxa, com montagem a partir de 2h antes. Buffet externo só no pacote de espaço, e precisa apresentar alvará sanitário."
  },
  "expertise_proof": {
    "tempo_de_casa": "11 anos no mesmo endereço, mais de 900 festas realizadas",
    "eventos_por_mes": "Entre 14 e 20 eventos por mês, mais nos meses de setembro a dezembro",
    "depoimentos": ["Paula, festa de 6 anos em maio", "Comissão de formatura do Colégio Central 2025", "Renata, cliente há 4 anos seguidos"],
    "alvara": "Alvará de funcionamento e AVCB em dia, seguro de responsabilidade civil, e 1 monitor para cada 12 crianças"
  },
  "retention": {
    "antecedencia_contato": "Chamamos 4 meses antes do aniversário, oferecendo os dois primeiros fins de semana depois da data — que é quando a família costuma fazer.",
    "condicao_retorno": "Família que já fez festa aqui tem 10% de desconto e prioridade de data por 15 dias antes de abrirmos para o público."
  },
  "ecosystem": {
    "parceiros": ["Decoração Bilica", "Foto e vídeo Studio Luz", "Animação Turma do Riso", "Bolo da Dona Cida", "Cerimonial Encanto (formaturas)"],
    "indicacao": "Quem indica uma família que fecha ganha 2 horas extras sem custo na própria festa, ou R$ 300 de desconto"
  },
  "location_contact": {
    "address": "Rua Exemplo, 780 — Porto Alegre/RS",
    "whatsapp": "(51) 97777-0000",
    "instagram": "@casadefestasdemo"
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Casa de festas de bairro com foco em aniversário infantil, com operação também em formatura e confraternização de empresa."
}
$json$::jsonb),

-- ------------------------------------------------------------ SALÃO DE BELEZA
-- Dado FICTÍCIO. A régua da química está preenchida de propósito: é o fato
-- que a trava exige na pergunta que mais chega ("quanto custa a progressiva?").
('demo-salao-beleza', $json$
{
  "catalog": {
    "items": [
      { "servico": "Corte feminino", "duracao": "1h", "observacao": "Inclui lavagem e finalização" },
      { "servico": "Coloração (retoque de raiz)", "duracao": "2h", "observacao": "Cabelo longo pode levar 2h30" },
      { "servico": "Mechas / iluminado", "duracao": "4h a 5h", "observacao": "Depende da base e do histórico" },
      { "servico": "Progressiva sem formol", "duracao": "3h a 4h", "observacao": "Valor por comprimento e volume" },
      { "servico": "Tratamento e reconstrução", "duracao": "1h30", "observacao": "Indicado antes de química em fio castigado" },
      { "servico": "Manicure e pedicure", "duracao": "1h15", "observacao": "" },
      { "servico": "Design de sobrancelha", "duracao": "30min", "observacao": "Com henna leva 45min" }
    ],
    "nao_faz": ["Alongamento de cílios", "Micropigmentação", "Depilação a laser", "Penteado com aplique"],
    "marcas_produtos": ["Wella Professionals", "Kérastase", "Truss"]
  },
  "pricing": {
    "range": "R$ 60 a R$ 780",
    "como_cobra_quimica": "Progressiva: curto R$ 260, médio R$ 340, longo a partir de R$ 430. Mechas: a partir de R$ 480, fechado só após avaliação, porque depende do estado do fio e de quantas sessões.",
    "varia_por_profissional": "Sim. Coloração e mechas com a Carla (especialista em loiros) têm acréscimo de 20%. Corte e tratamento têm o mesmo valor com qualquer profissional.",
    "parcelamento": "PIX, débito e crédito em até 3x sem juros acima de R$ 300"
  },
  "availability": {
    "weekly_hours": "Ter a Sex 9h-19h; Sáb 9h-17h",
    "tempo_quimica": "Progressiva de 3h a 4h; mechas de 4h a 5h; coloração de raiz 2h",
    "antecedencia": "Sábado costuma fechar com 10 dias de antecedência; terça e quarta têm horário na mesma semana"
  },
  "risk_free_entry": {
    "avaliacao_gratuita": true,
    "o_que_inclui": "Olhamos o fio e o couro cabeludo, conferimos o histórico de química e fazemos teste de mecha quando o histórico é desconhecido. Leva 20 minutos e sai com o plano e o valor por escrito.",
    "primeira_vez": "Não damos desconto de primeira vez. Damos a avaliação sem custo e um diagnóstico por escrito."
  },
  "expertise_proof": {
    "tempo_de_casa": "9 anos no mesmo endereço",
    "especialidades": ["Loiros e correção de cor", "Cabelo cacheado", "Reconstrução de fio castigado"],
    "profissionais": [
      { "nome": "Carla", "especialidade": "Coloração e loiros", "nivel": "Especialista" },
      { "nome": "Juliana", "especialidade": "Corte e cachos", "nivel": "Sênior" },
      { "nome": "Bia", "especialidade": "Unhas e sobrancelha", "nivel": "Pleno" }
    ],
    "formacoes": ["Colorimetria Wella", "Curso de cachos Deva"]
  },
  "policies": {
    "sinal": "30% no PIX para química e serviços acima de 3 horas, abatido no valor do dia.",
    "cancelamento": "Remarcando com mais de 24h de antecedência, o sinal vale para o novo horário. Falta sem aviso, o sinal cobre a cadeira reservada.",
    "atraso": "Acima de 20 minutos podemos precisar remarcar, porque atrasa quem vem depois. Avisando, a gente tenta encaixar.",
    "garantia_servico": "Ajuste de cor ou de corte em até 7 dias, sem custo, se não ficou como combinado."
  },
  "retention": {
    "intervalo_retoque": "Raiz a cada 30 dias; mechas a cada 3 meses; progressiva a cada 4 meses; unha a cada 15 dias",
    "manutencao_casa": "Shampoo sem sulfato e máscara semanal. Cabelo com cor pede protetor térmico antes de secador e prancha.",
    "lembrete": "Mensagem 3 dias antes do ciclo, com dois horários oferecidos"
  },
  "ecosystem": {
    "revenda": ["Shampoo e condicionador sem sulfato", "Máscara de reconstrução", "Protetor térmico", "Leave-in para cachos"],
    "parceiros": ["Maquiadora para noivas", "Fotógrafo de ensaio", "Clínica de estética ao lado"],
    "indicacao": "Quem indica ganha 20% de desconto no próximo serviço, e quem chega indicada ganha a hidratação da primeira visita"
  },
  "location_contact": {
    "address": "Rua Exemplo, 340 — Porto Alegre/RS",
    "whatsapp": "(51) 98888-0000",
    "instagram": "@salaodemo"
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Salão de bairro com 3 profissionais no modelo salão-parceiro (Lei 13.352/2016), foco em coloração e cachos."
}
$json$::jsonb),

-- ---------------------------------------------------------------- OFICINA
-- Dado FICTÍCIO. Escrito para exercitar a trava anti-invenção de verdade:
-- todos os fatos EXIGIDOS pela biblioteca estão aqui, e alguns opcionais
-- ficaram de fora de propósito, para a tela de cobertura ter o que mostrar.
('demo-oficina', $json$
{
  "catalog": {
    "items": [
      { "servico": "Revisão completa", "tempo_medio": "3 horas", "observacao": "Inclui filtros, óleo, checagem de 30 itens" },
      { "servico": "Troca de embreagem", "tempo_medio": "6 a 8 horas", "observacao": "Depende do modelo; tração dianteira leva mais" },
      { "servico": "Freios (pastilha e disco)", "tempo_medio": "2 horas", "observacao": "Por eixo" },
      { "servico": "Diagnóstico eletrônico com scanner", "tempo_medio": "1 hora", "observacao": "Leitura, teste e laudo por escrito" },
      { "servico": "Suspensão completa", "tempo_medio": "5 horas", "observacao": "Amortecedor, batente, bandeja" },
      { "servico": "Ar-condicionado (higienização e carga)", "tempo_medio": "2 horas", "observacao": "Teste de vazamento incluso" }
    ],
    "nao_faz": ["Funilaria e pintura", "Retífica de motor", "Câmbio automático de linha premium", "Blindagem"],
    "marcas_atendidas": ["Volkswagen", "Fiat", "Chevrolet", "Renault", "Ford", "Toyota", "Hyundai"]
  },
  "pricing": {
    "hora_tecnica": "R$ 180 a hora",
    "diagnostico_valor": "R$ 150, abatidos se o serviço for aprovado em até 10 dias",
    "range": "R$ 300 a R$ 4.500",
    "parcelamento": "à vista no PIX com 5% de desconto; cartão em até 6x sem juros",
    "politica_peca": "Trabalhamos com original e com paralela de linha reconhecida. Em item de segurança (freio, embreagem, direção, correia) só usamos original. A escolha é sempre do cliente e fica registrada por escrito no orçamento."
  },
  "availability": {
    "prazo_diagnostico": "no mesmo dia para veículos que entram até as 10h",
    "prazo_servico": "revisão sai no dia; embreagem em 2 dias úteis; suspensão em 1 dia",
    "prazo_peca": "1 a 2 dias úteis para peça de linha; até 5 dias para importado",
    "weekly_hours": "Seg a Sex 8h-18h; Sáb 8h-12h"
  },
  "risk_free_entry": {
    "checagem_gratuita": true,
    "o_que_inclui": "Freio, pneu, nível de óleo, água, palheta e leitura de erro no painel. Leva 15 minutos e o resultado é dito por inteiro, inclusive o que está bom.",
    "leva_e_traz": true,
    "carro_reserva": "Não temos carro reserva. Para serviço acima de 1 dia, buscamos e devolvemos o veículo na região."
  },
  "expertise_proof": {
    "tempo_de_casa": "12 anos no mesmo endereço",
    "especialidades": ["Injeção eletrônica", "Suspensão", "Ar-condicionado automotivo"],
    "equipamentos": ["Scanner automotivo multimarcas", "Alinhamento 3D", "Máquina de ar-condicionado", "Elevador de 4 colunas"],
    "garantia": "90 dias de garantia legal em todo serviço; 6 meses em serviço de motor e câmbio, com nota",
    "certificacoes": ["Curso de injeção eletrônica (2 mecânicos)"]
  },
  "policies": {
    "autorizacao": "Nenhum serviço é executado sem aprovação por escrito. O orçamento vai discriminado por mensagem, e o cliente responde aprovando. Serviço novo que aparecer no meio do reparo é parado e consultado antes de seguir.",
    "pecas_substituidas": "Guardamos todas as peças trocadas e entregamos ao cliente na retirada do veículo, sem ele precisar pedir.",
    "veiculo_parado": "Após 15 dias da conclusão sem retirada, cobramos diária de pátio de R$ 30, avisando antes.",
    "orcamento_validade": "10 dias, conforme o CDC"
  },
  "retention": {
    "intervalo_revisao": "10 mil km ou 6 meses, o que vier primeiro",
    "lembrete": "Mensagem 15 dias antes da estimativa, com o km da última visita e dois horários oferecidos"
  },
  "ecosystem": {
    "parceiros": ["Autopeças do bairro (entrega em 2h)", "Guincho 24h parceiro", "Funilaria do Marcelo", "Retífica Central"],
    "indicacao": "Quem indica ganha a próxima troca de óleo com a mão de obra por nossa conta"
  },
  "location_contact": {
    "address": "Av. Exemplo, 1200 — Porto Alegre/RS",
    "whatsapp": "(51) 99999-0000",
    "instagram": "@oficinademo"
  },
  "free_notes": "Empresa FICTÍCIA de demonstração. Oficina de bairro com 4 mecânicos, foco em injeção e suspensão, atendendo carro particular e motorista de aplicativo."
}
$json$::jsonb),

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
    "prazo_analise_projeto": "De 10 a 30 dias da protocolação ao parecer de acesso",
    "prazo_vistoria": "Até 5 dias úteis depois de solicitada",
    "prazo_kit": "De 10 a 20 dias do pedido ao material na obra",
    "limite_fast_track": "Até 7,5 kW em consumo local sai praticamente certo; acima disso entra análise de fluxo e pode haver limitação de potência ou exigência de subestação",
    "homologa_antes": true,
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

-- Verificação. Esperado: 9 linhas, todas com 4 seções ou mais.
select t.slug,
       (select count(*) from jsonb_object_keys(d.sections)) as secoes,
       d.source
  from public.commercial_dna d
  join public.tenants t on t.id = d.tenant_id
 where d.is_current and t.slug like 'demo-%'
 order by t.slug;
