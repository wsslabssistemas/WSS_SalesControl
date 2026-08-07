-- =====================================================================
-- COS — MIGRATION 0004 : BIBLIOTECA DA SKILL ACADEMIA
--
-- Conhecimento GLOBAL da Skill: tenant_id = NULL.
-- Toda academia que instalar esta Skill herda estas entradas.
--
-- O PONTO CENTRAL DESTE ARQUIVO:
--   Nenhuma entrada contém preço, horário, endereço ou nome de serviço.
--   Ela guarda a ESTRATÉGIA. Os FATOS vêm do commercial_dna da empresa.
--   É por isso que a segunda academia não precisa reescrever nada.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'academia' and tenant_id is null and source = 'skill_seed';


insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'pricing', 'reactive', '{"quanto custa","qual o valor","qual o preço","quanto é a mensalidade","valor do plano"}',
   null, 'Entregue a faixa de preço com transparência total. Esconder valor gera desconfiança
e o lead procura o concorrente. Logo após o número, devolva UMA pergunta de descoberta
sobre {{skill.discovery_axis}}, para a conversa não morrer no preço.
Se existir oferta de entrada sem risco, mencione ao final como redutor de risco.
Nunca liste todos os planos nesta primeira resposta: faixa + pergunta.', '{"pricing.range"}',
   '{"risk_free_entry.exists","commitment_offer.best_value"}', '{}', 'escalate',
   'Transparência (Hormozi) + qualificar antes de cotar (Belfort)', '{"Responder só o valor: a conversa morre","Esconder o preço: gera desconfiança e perde o lead","Despejar a tabela inteira logo de cara"}', 'descobrir_objetivo',
   'skill_seed', 'active', 'consultiva_spin');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'pricing', 'reactive', '{"só quero saber o preço","só o valor","nada mais","manda só os valores"}',
   null, 'O lead sinalizou explicitamente que NÃO quer conversa. Respeite.
Entregue os valores de forma direta e organizada, sem pergunta de descoberta,
sem tentar prolongar. Encerre com uma porta aberta curta e sem pressão.
Insistir aqui soa artificial e queima a relação.', '{"pricing.plans"}',
   '{"risk_free_entry.exists"}', '{}', 'escalate',
   'Resposta direta + reciprocidade sem pressão', '{"Fazer perguntas quando a pessoa pediu para não fazer","Encerrar com fechamento agressivo"}', 'manter_porta_aberta',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'pricing', 'reactive', '{"tem desconto","consegue fazer um desconto","dá para baixar o valor"}',
   null, 'Nunca conceda desconto puro. Troque valor por compromisso: mantenha o preço e
empilhe o que já existe no DNA (brinde, oferta de entrada, condições do plano longo).
Toda concessão pede contrapartida: fechamento agora ou agendamento concreto.', '{"pricing.plans"}',
   '{"reciprocity.gift","commitment_offer.best_value"}', '{}', 'escalate',
   'Nada de graça sem contrapartida (Jim Thomas) + oferta irrecusável (Hormozi)', '{"Ceder desconto sem pedir nada em troca","Inventar promoção que não existe no DNA"}', 'fechar_contrapartida',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'risk_free_entry', 'reactive', '{"tem aula experimental","posso experimentar","tem teste grátis","como funciona a experimental"}',
   null, 'Confirme a oferta de entrada sem risco com entusiasmo e descreva o que a pessoa
vai viver, não o que ela vai receber. Cite o brinde se existir no DNA.
Encerre SEMPRE com fechamento por alternativa oferecendo dois momentos concretos.
Nunca termine com pergunta aberta.', '{"risk_free_entry.exists","availability.weekly_hours"}',
   '{"risk_free_entry.duration","risk_free_entry.gift"}', '{}', 'escalate',
   'Deixar experimentar antes de decidir + fechamento por alternativa', '{"Dizer apenas ''sim, temos'' sem convidar para agendar","Terminar com ''o que acha?''"}', 'agendar_visita',
   'skill_seed', 'active', 'fechamento_classico');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'risk_free_entry', 'reactive', '{"tem custo escondido","preciso levar algo","precisa pagar alguma coisa"}',
   null, 'Elimine o risco percebido de forma explícita: diga o que NÃO tem (taxa, cartão,
compromisso) antes de dizer o que tem. Liste o mínimo necessário para participar.
Feche com alternativa de horário.', '{"risk_free_entry.exists"}',
   '{"risk_free_entry.gift"}', '{}', 'escalate',
   'Eliminação de risco + Transparência', '{"Deixar qualquer dúvida sobre custo: o lead desiste por desconfiança"}', 'agendar_visita',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'availability', 'reactive', '{"qual o horário","que horas abre","funciona até que horas","abre no sábado"}',
   null, 'Informe o horário exatamente como está no DNA, sem arredondar nem supor.
Em seguida pergunte a preferência de turno da pessoa, para personalizar a próxima
resposta e abrir espaço para o convite.', '{"availability.weekly_hours"}',
   '{}', '{"Nunca afirmar que está aberto em dia ou horário ausente do DNA."}', 'escalate',
   'Resposta factual + pergunta de personalização', '{"Listar horário sem perguntar a preferência","Afirmar funcionamento em dia que não está no DNA"}', 'descobrir_rotina',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'expertise_proof', 'reactive', '{"tem profissional para orientar","tem acompanhamento","alguém me ensina"}',
   null, 'Transforme o diferencial em benefício sentido, não em característica listada.
Explique o que muda na experiência da pessoa por existir acompanhamento.
Se o DNA indicar que isso é incluso, deixe claro que não há custo extra.
Conduza para a experiência presencial.', '{"differentials.items"}',
   '{"risk_free_entry.exists"}', '{}', 'escalate',
   'Demonstração de valor + Challenger', '{"Dizer apenas ''sim, temos'' sem traduzir em benefício"}', 'agendar_visita',
   'skill_seed', 'active', 'challenger');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'catalog', 'reactive', '{"o que vocês têm","quais modalidades","quais serviços","tem quais aulas"}',
   null, 'Apresente o catálogo do DNA agrupado e legível, nunca em bloco único.
Destaque no máximo três itens mais relevantes para o perfil já conhecido do contato.
Termine perguntando qual deles chamou mais atenção, para qualificar.', '{"catalog.items"}',
   '{}', '{"Nunca citar item, dia ou horário que não esteja no catálogo do DNA."}', 'escalate',
   'Apresentação estruturada + pergunta de qualificação', '{"Listar tudo sem hierarquia: o lead não consegue processar","Citar item que não está no catálogo do DNA"}', 'descobrir_interesse',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'goal_matching', 'reactive', '{"qual o melhor para mim","o que serve para meu objetivo","o que você recomenda"}',
   null, 'Recomende com autoridade, cruzando o objetivo declarado com os itens do catálogo.
Justifique a escolha em uma frase. Se o objetivo ainda não foi declarado,
pergunte antes de recomendar: recomendação sem diagnóstico é chute.
Conduza para experimentar na prática.', '{"catalog.items"}',
   '{"risk_free_entry.exists"}', '{"Nunca prometer resultado, prazo de resultado ou benefício de saúde garantido."}', 'escalate',
   'Recomendação de especialista + achar o que move a pessoa (Tracy)', '{"Recomendar sem saber o objetivo da pessoa","Prometer resultado específico"}', 'agendar_visita',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'objections', 'reactive', '{"está caro","achei caro","encontrei mais barato","não tenho esse valor"}',
   null, 'Valide a preocupação sem concordar que é caro. Reenquadre o valor para a menor
unidade de tempo possível usando os números reais do DNA, e reponha o que está
incluso. Conduza para a oferta de entrada sem risco em vez de negociar preço agora.', '{"pricing.plans"}',
   '{"differentials.items","risk_free_entry.exists"}', '{}', 'escalate',
   'Diluir o valor no dia a dia (Tracy) + reenquadrar', '{"Concordar que é caro","Oferecer desconto na primeira objeção"}', 'agendar_visita',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  -- GATILHOS DE INDECISÃO SAÍRAM DAQUI (ago/2026, limpeza do M3).
  -- "vou pensar" e família pertencem a entrada de commitment_offer /
  -- indecisao_jolt, mais abaixo neste arquivo. Enquanto as duas disputavam a
  -- mesma frase, o casamento não tinha como acertar: dois donos do mesmo
  -- gatilho é empate por construção. O mesmo conserto já tinha sido feito em
  -- sob_medida, escola_esportiva e automação; academia e clínica ficaram para
  -- trás. Esta entrada continua sendo a do ISOLAMENTO DA DÚVIDA VAGA.
  --
  -- CONTRADIÇÃO DE DOUTRINA RESOLVIDA (decisão do fundador, ago/2026).
  -- O `technique` daqui dizia "Devolver a pressão de preço (Jim Thomas) +
  -- fechamento por alternativa", com escola `fechamento_classico`. Era resto
  -- do desenho anterior ao M3, de quando esta entrada era dona de "vou pensar"
  -- — e mentia em três frentes ao mesmo tempo:
  --   • nenhum gatilho daqui cita preço, e a entrada de preço já existe acima
  --     ("está caro", `oferta_valor`, "Diluir o valor no dia a dia (Tracy)");
  --   • o TEXTO desta entrada sempre ensinou descoberta ("pergunte o que
  --     especificamente falta"), o oposto do rótulo;
  --   • `technique` é USER-FACING. O vendedor lia "devolver a pressão de
  --     preço" e fazia exatamente o movimento que o JOLT mede como piora do
  --     desfecho em 84% dos casos de quem já concordou.
  -- A entrada NÃO foi aposentada, e o motivo é o próprio JOLT: o primeiro
  -- passo dele é JULGAR. Quem ainda não viu valor volta para a descoberta —
  -- que é o que esta entrada faz. Quem viu valor e travou vai para a entrada
  -- de indecisão (`commitment_offer` / `indecisao_jolt`), cuja estratégia e
  -- cujo `next_objective` (`reduzir_risco`) são o remédio da OUTRA doença.
  -- Fundir as duas daria remédio certo para doença errada.
  (null, 'academia', 'objections', 'reactive', '{"não sei se vale a pena","não era bem o que eu procurava","fiquei na dúvida","tenho uma ressalva","acho que não é pra mim"}',
   null, 'Dúvida vaga quase nunca é sobre tempo: é uma objeção não dita.
Antes de qualquer coisa, pergunte de forma leve o que especificamente ainda falta
para decidir. Só depois de isolar a dúvida real, ofereça o próximo passo concreto
com duas opções de horário.', '{}',
   '{"risk_free_entry.exists"}', '{}', 'escalate',
   'Isolar a objeção não dita — uma pergunta antes de qualquer oferta', '{"Aceitar a dúvida vaga e encerrar: o lead não volta","Pressionar sem descobrir a objeção real","Repetir o argumento de venda: quem já concordou não precisa de mais um motivo"}', 'isolar_objecao',
   'skill_seed', 'active', 'consultiva_spin');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'objections', 'reactive', '{"não tenho tempo","minha rotina é corrida","meu horário é complicado"}',
   null, 'Não discuta se a pessoa tem tempo. Reduza o sacrifício percebido: mostre a menor
frequência viável e a amplitude de horário que existe no DNA. Depois projete o
benefício futuro em uma frase curta. Feche com duas opções de horário.', '{"availability.weekly_hours"}',
   '{}', '{}', 'escalate',
   'Redução de sacrifício (Hormozi) + projetar o depois (Tracy)', '{"Argumentar que a pessoa tem tempo sim"}', 'agendar_visita',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'objections', 'reactive', '{"tenho vergonha","nunca fiz","tenho medo de não dar conta","sou iniciante"}',
   null, 'Valide a emoção explicitamente: dizer "não tenha vergonha" invalida a pessoa.
Normalize com prova social genérica e descreva o ambiente e o acompanhamento
que existem no DNA. Convide sem pressão, com uma única pergunta ao final.', '{}',
   '{"differentials.items","risk_free_entry.exists"}', '{}', 'escalate',
   'Empatia + prova social + tirar o medo de não dar conta', '{"Minimizar o sentimento da pessoa","Fazer três perguntas seguidas"}', 'agendar_sem_pressao',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'objections', 'reactive', '{"já tenho outro","estou satisfeito onde estou","vou comparar"}',
   null, 'Nunca fale mal do concorrente. Elogie a iniciativa da pessoa, posicione a empresa
como categoria própria listando diferenciais reais do DNA, e ofereça a comparação
na prática através da oferta de entrada. Se a pessoa não quiser, mantenha a porta
aberta sem insistir.', '{"differentials.items"}',
   '{"risk_free_entry.exists"}', '{}', 'escalate',
   'Sair da comparação (Hormozi) + fechamento leve', '{"Criticar a concorrência","Competir por preço"}', 'agendar_ou_manter_aquecido',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'commitment_offer', 'reactive', '{"qual a diferença entre os planos","vale a pena o mais longo","qual compensa mais"}',
   null, 'Compare no máximo três opções em estrutura paralela, usando exatamente os valores
e condições do DNA. Deixe claro o que se ganha e o que se abre mão em cada uma
(flexibilidade x economia x bônus). Termine perguntando qual perfil combina com a pessoa.', '{"pricing.plans"}',
   '{"reciprocity.gift","policies.cancellation"}', '{}', 'escalate',
   'Comparação estruturada + empilhar o que já está incluso (Hormozi)', '{"Empurrar o plano mais caro sem entender o perfil","Omitir condições de cancelamento"}', 'recomendar_plano',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'reciprocity', 'reactive', '{"tem brinde","o que eu ganho","tem algum bônus"}',
   null, 'Descreva o brinde como gesto de acolhimento, não como isca. Se houver mais de um
momento de brinde no DNA, deixe claro qual vem quando. Use escassez apenas se for
verdadeira segundo o DNA. Conduza para o próximo passo concreto.', '{"reciprocity.gift"}',
   '{"risk_free_entry.gift"}', '{"Nunca prometer brinde, prazo ou condição ausente do DNA."}', 'escalate',
   'Reciprocidade (Cialdini)', '{"Prometer brinde que não consta no DNA","Criar escassez falsa"}', 'agendar_visita',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'limits_and_ethics', 'reactive', '{"tenho um problema de saúde","tenho lesão","posso participar","estou grávida"}',
   null, 'Responsabilidade vem antes de venda. Nunca autorize, libere ou minimize condição
de saúde. Acolha, oriente a buscar avaliação profissional adequada e explique como
o acompanhamento existente no DNA adapta a atividade. Convide sem pressão.', '{}',
   '{"differentials.items"}', '{"Nunca afirmar que a pessoa pode ou não praticar por questão de saúde.","Nunca prometer cura, melhora ou resultado terapêutico."}', 'escalate',
   'Responsabilidade + acolher sem prometer resultado', '{"Garantir que pode participar","Dar orientação clínica","Prometer melhora"}', 'convidar_sem_pressao',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'retention', 'reactive', '{"estou desanimado","pensei em desistir","não estou vendo resultado","quero cancelar"}',
   null, 'Sinal crítico. Acolha antes de argumentar e faça UMA pergunta diagnostica para
entender a causa real. Não ofereça desconto nem produto novo neste momento.
Proponha um ajuste concreto e um retorno com data. Se a pessoa mantiver a decisão,
respeite e mantenha o relacionamento.', '{}',
   '{"differentials.items","catalog.items"}', '{}', 'escalate',
   'Diagnóstico antes de solução + Relacionamento (Girard)', '{"Argumentar contra o sentimento","Empurrar oferta em momento de frustração","Fazer várias perguntas de uma vez"}', 'diagnosticar_e_agendar_retorno',
   'skill_seed', 'active', 'relacionamento_carnegie');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'ecosystem', 'reactive', '{"vocês têm nutricionista","tem personal","tem estética","tem outros serviços"}',
   null, 'Consulte as parcerias declaradas no DNA. Se o serviço existir, explique com clareza
que é parceria no espaço e informe a condição registrada. Se NÃO existir no DNA,
não afirme que não existe: escale para um humano confirmar.
Conduza para conhecer o espaço.', '{"policies.partnerships"}',
   '{}', '{"Nunca afirmar que um serviço não existe sem que o DNA confirme a ausência."}', 'escalate',
   'Transparência + valor do que existe em volta', '{"Negar serviço que existe","Inventar valor de parceiro","Dizer que está incluso quando não está"}', 'agendar_visita',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'risk_free_entry', 'proactive', '{}',
   'trial_followup', 'Check-in de realização de valor. UMA pergunta apenas, concreta e sobre a experiência
vivida até aqui, nunca sobre compra. O objetivo é a pessoa verbalizar um ganho.
Não mencione plano, preço ou fechamento nesta mensagem.
Se a resposta for negativa, isso é sinal de risco e deve gerar acompanhamento imediato.', '{"risk_free_entry.exists"}',
   '{}', '{"Uma mensagem, um objetivo. Nunca mais de uma pergunta."}', 'escalate',
   'Fazer o valor aparecer antes da cobrança (Hormozi)', '{"Falar de preço no dia 2","Fazer três perguntas seguidas","Mensagem genérica que não cita a experiência"}', 'capturar_ganho',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'risk_free_entry', 'proactive', '{}',
   'trial_followup', 'Último dia da experiência. Recupere o que a pessoa disse ter gostado, projete a
continuidade e enquadre a interrupção como perda do que já foi construído.
Apresente a opção mais adequada ao que foi observado e feche com alternativa concreta.', '{"pricing.plans","risk_free_entry.exists"}',
   '{"commitment_offer.best_value"}', '{}', 'escalate',
   'Aversão a perda (Kahneman) + fechamento por alternativa', '{"Começar pelo preço","Encerrar com ''o que achou?''"}', 'fechar_plano',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'retention', 'proactive', '{}',
   'reactivation', 'Nunca abra cobrando ausência: gera culpa e silêncio. Abra com um gancho concreto e
específico que prove que a lembrança não é disparo em massa. Ofereça retorno sem
risco. Encerre com fechamento por alternativa.
Verifique o histórico: se a pessoa nunca foi cliente, é primeira oportunidade, não retorno.', '{"risk_free_entry.exists"}',
   '{"reciprocity.gift"}', '{"Nunca usar ''voltar'', ''retornar'' ou ''novamente'' com quem nunca foi cliente.","Nunca mencionar vaga, reserva ou lotação sem o fato no DNA."}', 'escalate',
   'Quebrar o padrão da mensagem (Robbins) + recuar para atrair (Tracy)', '{"Cobrar o sumiço","Tratar lead não convertido como ex-cliente","Reenviar a mesma mensagem genérica"}', 'agendar_visita',
   'skill_seed', 'active', null),

-- OS 90 DIAS DEPOIS DA MATRÍCULA (ago/2026).
--
-- Entrou junto com a cadência `pos_matricula` do manifesto, e por um motivo
-- que vale registrar: a cadência foi criada primeiro e ficou SEM entrada de
-- biblioteca para alimentar. Cadência sem curadoria é o motor com a boca
-- aberta e nada para dizer — ele improvisa, e improviso é onde a invenção
-- entra.
--
-- ESTA É TAMBÉM A RESPOSTA À IDEIA DE "FRASES MOTIVACIONAIS" (fundador,
-- ago/2026). A intuição estava certa — existe um momento em que a pessoa
-- desanima e o vendedor não sabe o que dizer —, mas frase pronta é o formato
-- errado, e a própria biblioteca já dizia isso em três lugares: a entrada de
-- desânimo lista "argumentar contra o sentimento" como erro, e `curso` e
-- `software_b2b` listam "responder com motivação" como erro. Motivação
-- genérica em cima de sentimento específico soa como cartão de autoajuda.
-- O que funciona é o oposto e é o que está escrito aqui: fazer a PESSOA
-- dizer o ganho. Quem verbaliza o próprio avanço se compromete com ele —
-- ninguém precisa ser convencido do que acabou de afirmar.
(null, 'academia', 'retention', 'proactive', '{}',
 'onboarding',
 'Os primeiros 90 dias decidem se o aluno fica, e quase toda academia fica
calada justamente aqui — some depois de matricular e só reaparece quando ele
para de vir. Este toque não vende nada: ele COLHE.
Faça UMA pergunta, sobre o que ele já consegue fazer e não conseguia. Não
pergunte se está gostando (a resposta é sempre "sim" e não serve para nada) e
não pergunte se está vindo (soa como controle de presença).
Se ele responder com um ganho concreto, REGISTRE a frase dele. É o ativo mais
valioso desta conversa: serve para a renovação, para a indicação e para o dia
em que ele pensar em desistir — e a frase dele vale mais que qualquer
argumento seu.
NÃO responda com motivação. "Você consegue", "não desista", "foco" — nada
disso funciona sobre um sentimento específico, e quem recebe isso de um
sistema percebe que é automático. Se ele disser que está difícil, trate como
diagnóstico: o que atrapalhou (horário, dor, vergonha, rotina) e o que a
academia tem que resolve AQUELE ponto.
E nunca prometa resultado — nem de saúde, nem de estética, nem de prazo.',
 '{}',
 '{"catalog.items","differentials.items","availability.weekly_hours"}',
 '{"Nunca prometer resultado de saúde, cura ou emagrecimento.","Uma mensagem, uma pergunta."}', 'omit',
 'Colher o ganho pela boca do aluno (Cialdini — compromisso e coerência), nunca motivar',
 '{"Responder com frase motivacional: soa automático e não trata o que ele disse","Perguntar se está gostando: a resposta é sempre sim","Perguntar se está vindo: soa como controle de presença","Aproveitar o contato para oferecer plano ou personal"}',
 'registrar_ganho', 'skill_seed', 'active', 'relacionamento_carnegie'),

(null, 'academia', 'commitment_offer', 'reactive',
 '{"vou pensar","depois eu vejo","preciso ver com calma","vou dar uma pensada","estou em dúvida entre os planos","me manda mais informação","qual plano você acha melhor"}',
 null,
 'ATENÇÃO: isto quase nunca é preço. A pessoa já entendeu que precisa treinar —
ela travou com medo de errar de novo. Muita gente já pagou academia que não usou,
e o medo real é repetir isso.
Primeiro julgue: se ela ainda não vê o problema, é falta de valor e você volta
para a descoberta. Mas se ela concordou com tudo e mesmo assim adiou, é INDECISÃO
— e aí o erro clássico é reforçar o argumento de novo. Repetir por que treinar é
importante para quem já concordou empurra a pessoa para longe.
Faça o contrário de mais opções: RECOMENDE UMA. "Pelo que você me contou, eu
começaria pelo plano X" vale mais que uma tabela com cinco. Quem está travado não
quer escolher, quer ser orientado por alguém que entende.
Depois tire o risco da mesa com o que existir de verdade: começar pelo período
mais curto, experimentar antes, saber que dá para cancelar. E combine UMA data
concreta ("terça às 19h eu te espero"), porque decisão sem data marcada volta a
adiar.',
 '{"pricing.plans"}',
 '{"policies.cancellation","risk_free_entry.exists","commitment_offer.best_value","availability.weekly_hours"}', '{}', 'escalate',
 'Recomendar UM caminho e tirar risco da mesa (nunca repetir o argumento)',
 '{"Repetir por que treinar é importante para quem já concordou","Oferecer mais planos para quem está em dúvida","Dar desconto achando que o problema é preço","Deixar sem data marcada"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt');


-- =====================================================================
-- VERIFICAÇÃO 1 — quantas entradas por categoria
-- =====================================================================
select category      as "Categoria",
       count(*)      as "Entradas",
       count(*) filter (where entry_type = 'proactive') as "Proativas"
from public.knowledge_entries
where skill_key = 'academia' and tenant_id is null
group by category
order by 1;


-- =====================================================================
-- VERIFICAÇÃO 2 — A PROVA DE REUTILIZAÇÃO
-- Procura fatos da Be Fitness dentro da biblioteca.
-- O resultado esperado é ZERO: a estratégia não pode conter fato nenhum.
-- =====================================================================
select count(*) as "Entradas contaminadas com fato (esperado 0)"
from public.knowledge_entries
where skill_key = 'academia'
  and tenant_id is null
  and (strategy ~* 'R\$|[0-9]{2,}:[0-9]{2}|Be Fitness|Protásio|Gympass|Totalpass|zumba|pilates|muay');
