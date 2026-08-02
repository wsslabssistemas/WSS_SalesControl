-- =====================================================================
-- COS — MIGRATION 0004 : BIBLIOTECA DA SKILL ACADEMIA
--
-- Conhecimento GLOBAL da Skill: tenant_id = NULL.
-- Toda academia que instalar esta Skill herda estas entradas.
--
-- O PONTO CENTRAL DESTE ARQUIVO:
--   Nenhuma entrada contem preco, horario, endereco ou nome de servico.
--   Ela guarda a ESTRATEGIA. Os FATOS vem do commercial_dna da empresa.
--   E por isso que a segunda academia nao precisa reescrever nada.
-- =====================================================================

delete from public.knowledge_entries
 where skill_key = 'academia' and tenant_id is null and source = 'skill_seed';


insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'pricing', 'reactive', '{"quanto custa","qual o valor","qual o preco","quanto e a mensalidade","valor do plano"}',
   null, 'Entregue a faixa de preco com transparencia total. Esconder valor gera desconfianca
e o lead procura o concorrente. Logo apos o numero, devolva UMA pergunta de descoberta
sobre {{skill.discovery_axis}}, para a conversa nao morrer no preco.
Se existir oferta de entrada sem risco, mencione ao final como redutor de risco.
Nunca liste todos os planos nesta primeira resposta: faixa + pergunta.', '{"pricing.range"}',
   '{"risk_free_entry.exists","commitment_offer.best_value"}', '{}', 'escalate',
   'Transparencia (Hormozi) + Intelligence Gathering (Belfort)', '{"Responder so o valor: a conversa morre","Esconder o preco: gera desconfianca e perde o lead","Despejar a tabela inteira logo de cara"}', 'discover_goal',
   'skill_seed', 'active', 'consultiva_spin');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'pricing', 'reactive', '{"so quero saber o preco","so o valor","nada mais","manda so os valores"}',
   null, 'O lead sinalizou explicitamente que NAO quer conversa. Respeite.
Entregue os valores de forma direta e organizada, sem pergunta de descoberta,
sem tentar prolongar. Encerre com uma porta aberta curta e sem pressao.
Insistir aqui soa artificial e queima a relacao.', '{"pricing.plans"}',
   '{"risk_free_entry.exists"}', '{}', 'escalate',
   'Resposta direta + reciprocidade sem pressao', '{"Fazer perguntas quando a pessoa pediu para nao fazer","Encerrar com fechamento agressivo"}', 'keep_door_open',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'pricing', 'reactive', '{"tem desconto","consegue fazer um desconto","da para baixar o valor"}',
   null, 'Nunca conceda desconto puro. Troque valor por compromisso: mantenha o preco e
empilhe o que ja existe no DNA (brinde, oferta de entrada, condicoes do plano longo).
Toda concessao pede contrapartida: fechamento agora ou agendamento concreto.', '{"pricing.plans"}',
   '{"reciprocity.gift","commitment_offer.best_value"}', '{}', 'escalate',
   'No Free Gifts (Jim Thomas) + Grand Slam Offer (Hormozi)', '{"Ceder desconto sem pedir nada em troca","Inventar promocao que nao existe no DNA"}', 'close_commitment',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'risk_free_entry', 'reactive', '{"tem aula experimental","posso experimentar","tem teste gratis","como funciona a experimental"}',
   null, 'Confirme a oferta de entrada sem risco com entusiasmo e descreva o que a pessoa
vai viver, nao o que ela vai receber. Cite o brinde se existir no DNA.
Encerre SEMPRE com fechamento por alternativa oferecendo dois momentos concretos.
Nunca termine com pergunta aberta.', '{"risk_free_entry.exists","availability.weekly_hours"}',
   '{"risk_free_entry.duration","risk_free_entry.gift"}', '{}', 'escalate',
   'Puppy Dog Close + Fechamento por Alternativa', '{"Dizer apenas ''sim, temos'' sem convidar para agendar","Terminar com ''o que acha?''"}', 'schedule_visit',
   'skill_seed', 'active', 'fechamento_classico');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'risk_free_entry', 'reactive', '{"tem custo escondido","preciso levar algo","precisa pagar alguma coisa"}',
   null, 'Elimine o risco percebido de forma explicita: diga o que NAO tem (taxa, cartao,
compromisso) antes de dizer o que tem. Liste o minimo necessario para participar.
Feche com alternativa de horario.', '{"risk_free_entry.exists"}',
   '{"risk_free_entry.gift"}', '{}', 'escalate',
   'Eliminacao de risco + Transparencia', '{"Deixar qualquer duvida sobre custo: o lead desiste por desconfianca"}', 'schedule_visit',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'availability', 'reactive', '{"qual o horario","que horas abre","funciona ate que horas","abre no sabado"}',
   null, 'Informe o horario exatamente como esta no DNA, sem arredondar nem supor.
Em seguida pergunte a preferencia de turno da pessoa, para personalizar a proxima
resposta e abrir espaco para o convite.', '{"availability.weekly_hours"}',
   '{}', '{"Nunca afirmar que esta aberto em dia ou horario ausente do DNA."}', 'escalate',
   'Resposta factual + pergunta de personalizacao', '{"Listar horario sem perguntar a preferencia","Afirmar funcionamento em dia que nao esta no DNA"}', 'discover_routine',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'expertise_proof', 'reactive', '{"tem profissional para orientar","tem acompanhamento","alguem me ensina"}',
   null, 'Transforme o diferencial em beneficio sentido, nao em caracteristica listada.
Explique o que muda na experiencia da pessoa por existir acompanhamento.
Se o DNA indicar que isso e incluso, deixe claro que nao ha custo extra.
Conduza para a experiencia presencial.', '{"differentials.items"}',
   '{"risk_free_entry.exists"}', '{}', 'escalate',
   'Demonstracao de valor + Challenger', '{"Dizer apenas ''sim, temos'' sem traduzir em beneficio"}', 'schedule_visit',
   'skill_seed', 'active', 'challenger');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'catalog', 'reactive', '{"o que voces tem","quais modalidades","quais servicos","tem quais aulas"}',
   null, 'Apresente o catalogo do DNA agrupado e legivel, nunca em bloco unico.
Destaque no maximo tres itens mais relevantes para o perfil ja conhecido do contato.
Termine perguntando qual deles chamou mais atencao, para qualificar.', '{"catalog.items"}',
   '{}', '{"Nunca citar item, dia ou horario que nao esteja no catalogo do DNA."}', 'escalate',
   'Apresentacao estruturada + pergunta de qualificacao', '{"Listar tudo sem hierarquia: o lead nao consegue processar","Citar item que nao esta no catalogo do DNA"}', 'discover_interest',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'goal_matching', 'reactive', '{"qual o melhor para mim","o que serve para meu objetivo","o que voce recomenda"}',
   null, 'Recomende com autoridade, cruzando o objetivo declarado com os itens do catalogo.
Justifique a escolha em uma frase. Se o objetivo ainda nao foi declarado,
pergunte antes de recomendar: recomendacao sem diagnostico e chute.
Conduza para experimentar na pratica.', '{"catalog.items"}',
   '{"risk_free_entry.exists"}', '{"Nunca prometer resultado, prazo de resultado ou beneficio de saude garantido."}', 'escalate',
   'Expert recommendation + Hot Button (Tracy)', '{"Recomendar sem saber o objetivo da pessoa","Prometer resultado especifico"}', 'schedule_visit',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'objections', 'reactive', '{"esta caro","achei caro","encontrei mais barato","nao tenho esse valor"}',
   null, 'Valide a preocupacao sem concordar que e caro. Reenquadre o valor para a menor
unidade de tempo possivel usando os numeros reais do DNA, e reponha o que esta
incluso. Conduza para a oferta de entrada sem risco em vez de negociar preco agora.', '{"pricing.plans"}',
   '{"differentials.items","risk_free_entry.exists"}', '{}', 'escalate',
   'Reduction to the Ridiculous (Tracy) + Reframing', '{"Concordar que e caro","Oferecer desconto na primeira objecao"}', 'schedule_visit',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'objections', 'reactive', '{"vou pensar","depois eu te falo","vou ver e retorno","preciso pensar"}',
   null, '"Vou pensar" quase nunca e sobre tempo: e uma objecao nao dita.
Antes de qualquer coisa, pergunte de forma leve o que especificamente ainda falta
para decidir. So depois de isolar a duvida real, ofereca o proximo passo concreto
com duas opcoes de horario.', '{}',
   '{"risk_free_entry.exists"}', '{}', 'escalate',
   'Krunch (Jim Thomas) + Fechamento por Alternativa', '{"Aceitar o ''vou pensar'' e encerrar: o lead nao volta","Pressionar sem descobrir a objecao real"}', 'isolate_objection',
   'skill_seed', 'active', 'fechamento_classico');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'objections', 'reactive', '{"nao tenho tempo","minha rotina e corrida","meu horario e complicado"}',
   null, 'Nao discuta se a pessoa tem tempo. Reduza o sacrificio percebido: mostre a menor
frequencia viavel e a amplitude de horario que existe no DNA. Depois projete o
beneficio futuro em uma frase curta. Feche com duas opcoes de horario.', '{"availability.weekly_hours"}',
   '{}', '{}', 'escalate',
   'Reducao de sacrificio (Hormozi) + Future Pacing (Tracy)', '{"Argumentar que a pessoa tem tempo sim"}', 'schedule_visit',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'objections', 'reactive', '{"tenho vergonha","nunca fiz","tenho medo de nao dar conta","sou iniciante"}',
   null, 'Valide a emocao explicitamente: dizer "nao tenha vergonha" invalida a pessoa.
Normalize com prova social generica e descreva o ambiente e o acompanhamento
que existem no DNA. Convide sem pressao, com uma unica pergunta ao final.', '{}',
   '{"differentials.items","risk_free_entry.exists"}', '{}', 'escalate',
   'Empatia + Prova social + Reassurance', '{"Minimizar o sentimento da pessoa","Fazer tres perguntas seguidas"}', 'schedule_visit_low_pressure',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'objections', 'reactive', '{"ja tenho outro","estou satisfeito onde estou","vou comparar"}',
   null, 'Nunca fale mal do concorrente. Elogie a iniciativa da pessoa, posicione a empresa
como categoria propria listando diferenciais reais do DNA, e ofereca a comparacao
na pratica atraves da oferta de entrada. Se a pessoa nao quiser, mantenha a porta
aberta sem insistir.', '{"differentials.items"}',
   '{"risk_free_entry.exists"}', '{}', 'escalate',
   'Category of One (Hormozi) + Soft Close', '{"Criticar a concorrencia","Competir por preco"}', 'schedule_visit_or_keep_warm',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'commitment_offer', 'reactive', '{"qual a diferenca entre os planos","vale a pena o mais longo","qual compensa mais"}',
   null, 'Compare no maximo tres opcoes em estrutura paralela, usando exatamente os valores
e condicoes do DNA. Deixe claro o que se ganha e o que se abre mao em cada uma
(flexibilidade x economia x bonus). Termine perguntando qual perfil combina com a pessoa.', '{"pricing.plans"}',
   '{"reciprocity.gift","policies.cancellation"}', '{}', 'escalate',
   'Comparacao estruturada + Benefit stacking', '{"Empurrar o plano mais caro sem entender o perfil","Omitir condicoes de cancelamento"}', 'recommend_plan',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'reciprocity', 'reactive', '{"tem brinde","o que eu ganho","tem algum bonus"}',
   null, 'Descreva o brinde como gesto de acolhimento, nao como isca. Se houver mais de um
momento de brinde no DNA, deixe claro qual vem quando. Use escassez apenas se for
verdadeira segundo o DNA. Conduza para o proximo passo concreto.', '{"reciprocity.gift"}',
   '{"risk_free_entry.gift"}', '{"Nunca prometer brinde, prazo ou condicao ausente do DNA."}', 'escalate',
   'Reciprocidade (Cialdini)', '{"Prometer brinde que nao consta no DNA","Criar escassez falsa"}', 'schedule_visit',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'limits_and_ethics', 'reactive', '{"tenho um problema de saude","tenho lesao","posso participar","estou gravida"}',
   null, 'Responsabilidade vem antes de venda. Nunca autorize, libere ou minimize condicao
de saude. Acolha, oriente a buscar avaliacao profissional adequada e explique como
o acompanhamento existente no DNA adapta a atividade. Convide sem pressao.', '{}',
   '{"differentials.items"}', '{"Nunca afirmar que a pessoa pode ou nao praticar por questao de saude.","Nunca prometer cura, melhora ou resultado terapeutico."}', 'escalate',
   'Responsabilidade + Reassurance', '{"Garantir que pode participar","Dar orientacao clinica","Prometer melhora"}', 'invite_low_pressure',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'retention', 'reactive', '{"estou desanimado","pensei em desistir","nao estou vendo resultado","quero cancelar"}',
   null, 'Sinal critico. Acolha antes de argumentar e faca UMA pergunta diagnostica para
entender a causa real. Nao ofereca desconto nem produto novo neste momento.
Proponha um ajuste concreto e um retorno com data. Se a pessoa mantiver a decisao,
respeite e mantenha o relacionamento.', '{}',
   '{"differentials.items","catalog.items"}', '{}', 'escalate',
   'Diagnostico antes de solucao + Relacionamento (Girard)', '{"Argumentar contra o sentimento","Empurrar oferta em momento de frustracao","Fazer varias perguntas de uma vez"}', 'diagnose_and_schedule_followup',
   'skill_seed', 'active', 'relacionamento_carnegie');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'ecosystem', 'reactive', '{"voces tem nutricionista","tem personal","tem estetica","tem outros servicos"}',
   null, 'Consulte as parcerias declaradas no DNA. Se o servico existir, explique com clareza
que e parceria no espaco e informe a condicao registrada. Se NAO existir no DNA,
nao afirme que nao existe: escale para um humano confirmar.
Conduza para conhecer o espaco.', '{"policies.partnerships"}',
   '{}', '{"Nunca afirmar que um servico nao existe sem que o DNA confirme a ausencia."}', 'escalate',
   'Transparencia + Ecosystem value', '{"Negar servico que existe","Inventar valor de parceiro","Dizer que esta incluso quando nao esta"}', 'schedule_visit',
   'skill_seed', 'active', null);

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'risk_free_entry', 'proactive', '{}',
   'trial_followup', 'Check-in de realizacao de valor. UMA pergunta apenas, concreta e sobre a experiencia
vivida ate aqui, nunca sobre compra. O objetivo e a pessoa verbalizar um ganho.
Nao mencione plano, preco ou fechamento nesta mensagem.
Se a resposta for negativa, isso e sinal de risco e deve gerar acompanhamento imediato.', '{"risk_free_entry.exists"}',
   '{}', '{"Uma mensagem, um objetivo. Nunca mais de uma pergunta."}', 'escalate',
   'Value Realization (Hormozi)', '{"Falar de preco no dia 2","Fazer tres perguntas seguidas","Mensagem generica que nao cita a experiencia"}', 'capture_value_statement',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'risk_free_entry', 'proactive', '{}',
   'trial_followup', 'Ultimo dia da experiencia. Recupere o que a pessoa disse ter gostado, projete a
continuidade e enquadre a interrupcao como perda do que ja foi construido.
Apresente a opcao mais adequada ao que foi observado e feche com alternativa concreta.', '{"pricing.plans","risk_free_entry.exists"}',
   '{"commitment_offer.best_value"}', '{}', 'escalate',
   'Loss Aversion (Kahneman) + Fechamento por Alternativa', '{"Comecar pelo preco","Encerrar com ''o que achou?''"}', 'close',
   'skill_seed', 'active', 'oferta_valor');

insert into public.knowledge_entries
  (tenant_id, skill_key, category, entry_type, trigger_questions,
   opportunity_type, strategy, required_facts, optional_facts, hard_rules,
   on_missing_facts, technique, common_errors, next_objective, source, status, school)
values
  (null, 'academia', 'retention', 'proactive', '{}',
   'reactivation', 'Nunca abra cobrando ausencia: gera culpa e silencio. Abra com um gancho concreto e
especifico que prove que a lembranca nao e disparo em massa. Ofereca retorno sem
risco. Encerre com fechamento por alternativa.
Verifique o historico: se a pessoa nunca foi cliente, e primeira oportunidade, nao retorno.', '{"risk_free_entry.exists"}',
   '{"reciprocity.gift"}', '{"Nunca usar ''voltar'', ''retornar'' ou ''novamente'' com quem nunca foi cliente.","Nunca mencionar vaga, reserva ou lotacao sem o fato no DNA."}', 'escalate',
   'Pattern Interrupt (Robbins) + Takeaway (Tracy)', '{"Cobrar o sumico","Tratar lead nao convertido como ex-cliente","Reenviar a mesma mensagem generica"}', 'schedule_visit',
   'skill_seed', 'active', null),

(null, 'academia', 'commitment_offer', 'reactive',
 '{"vou pensar","depois eu vejo","preciso ver com calma","vou dar uma pensada","estou em duvida entre os planos","me manda mais informacao","qual plano voce acha melhor"}',
 null,
 'ATENCAO: isto quase nunca e preco. A pessoa ja entendeu que precisa treinar —
ela travou com medo de errar de novo. Muita gente ja pagou academia que nao usou,
e o medo real e repetir isso.
Primeiro julgue: se ela ainda nao vê o problema, e falta de valor e voce volta
para a descoberta. Mas se ela concordou com tudo e mesmo assim adiou, e INDECISAO
— e ai o erro classico e reforcar o argumento de novo. Repetir por que treinar e
importante para quem ja concordou empurra a pessoa para longe.
Faca o contrario de mais opcoes: RECOMENDE UMA. "Pelo que voce me contou, eu
comecaria pelo plano X" vale mais que uma tabela com cinco. Quem esta travado nao
quer escolher, quer ser orientado por alguem que entende.
Depois tire o risco da mesa com o que existir de verdade: comecar pelo periodo
mais curto, experimentar antes, saber que da para cancelar. E combine UMA data
concreta ("terça as 19h eu te espero"), porque decisao sem data marcada volta a
adiar.',
 '{"pricing.plans"}',
 '{"policies.cancellation","risk_free_entry.exists","commitment_offer.best_value","availability.weekly_hours"}', '{}', 'escalate',
 'Recomendar UM caminho e tirar risco da mesa (nunca repetir o argumento)',
 '{"Repetir por que treinar e importante para quem ja concordou","Oferecer mais planos para quem esta em duvida","Dar desconto achando que o problema e preco","Deixar sem data marcada"}',
 'reduzir_risco', 'skill_seed', 'active', 'indecisao_jolt');


-- =====================================================================
-- VERIFICACAO 1 — quantas entradas por categoria
-- =====================================================================
select category      as "Categoria",
       count(*)      as "Entradas",
       count(*) filter (where entry_type = 'proactive') as "Proativas"
from public.knowledge_entries
where skill_key = 'academia' and tenant_id is null
group by category
order by 1;


-- =====================================================================
-- VERIFICACAO 2 — A PROVA DE REUTILIZACAO
-- Procura fatos da Be Fitness dentro da biblioteca.
-- O resultado esperado e ZERO: a estrategia nao pode conter fato nenhum.
-- =====================================================================
select count(*) as "Entradas contaminadas com fato (esperado 0)"
from public.knowledge_entries
where skill_key = 'academia'
  and tenant_id is null
  and (strategy ~* 'R\$|[0-9]{2,}:[0-9]{2}|Be Fitness|Protasio|Gympass|Totalpass|zumba|pilates|muay');
