-- =====================================================================
-- COS — SEED DE DEMONSTRACAO : duas academias fictícias
--
-- ATENCAO: ESTE ARQUIVO NAO E UMA MIGRATION.
-- Ele cria dados ficticios e pode ser reexecutado a vontade.
-- Uso permitido: ambiente local e staging.
-- Uso PROIBIDO: producao.
--
-- Todos os slugs usam o prefixo 'demo-'. O delete no topo so alcanca
-- tenants de demonstracao — nunca uma empresa real.
--
-- Cria:
--   demo-be-fitness      -> DNA completo
--   demo-academia-nova   -> DNA pela metade (empresa recem cadastrada)
--
-- Para conferir o resultado, rode em seguida:
--   packages/db/tests/dna_coverage_check.sql
-- =====================================================================

-- limpa execucoes anteriores desta demonstracao
delete from public.tenants where slug in ('demo-be-fitness','demo-academia-nova');


-- ---------------------------------------------------------------------
-- EMPRESA 1 — DNA COMPLETO
-- ---------------------------------------------------------------------
with t as (
  insert into public.tenants (name, slug, skill_key, plan, status)
  values ('Be Fitness (DEMO)', 'demo-be-fitness', 'academia', 'growth', 'active')
  returning id
)
insert into public.commercial_dna (tenant_id, version, sections, source, is_current)
select t.id, 1, '{
  "pricing": {
    "range": "R$ 99 a R$ 169 por mes",
    "plans": [
      {
        "nome": "Mensal",
        "valor": "R$ 169,00",
        "condicao": "sem fidelidade",
        "fidelidade": "nao"
      },
      {
        "nome": "Trimestral parcelado",
        "valor": "3x R$ 149,00",
        "condicao": "cartao de credito",
        "fidelidade": "3 meses"
      },
      {
        "nome": "Trimestral a vista",
        "valor": "R$ 410,00",
        "condicao": "a vista",
        "fidelidade": "3 meses"
      },
      {
        "nome": "Semestral parcelado",
        "valor": "6x R$ 108,00",
        "condicao": "cartao de credito",
        "fidelidade": "6 meses"
      },
      {
        "nome": "Semestral a vista",
        "valor": "R$ 580,00",
        "condicao": "a vista",
        "fidelidade": "6 meses"
      },
      {
        "nome": "Anual parcelado",
        "valor": "12x R$ 99,00",
        "condicao": "cartao de credito, usa limite",
        "fidelidade": "12 meses"
      },
      {
        "nome": "Anual a vista",
        "valor": "R$ 958,80",
        "condicao": "maior desconto",
        "fidelidade": "12 meses"
      },
      {
        "nome": "Anual recorrente",
        "valor": "1x R$ 168,00 + 11x R$ 109,00",
        "condicao": "adesao R$ 59, nao usa limite do cartao, cancela quando quiser, sem brinde",
        "fidelidade": "nao"
      }
    ],
    "payment_methods": [
      "cartao de credito",
      "a vista",
      "recorrente",
      "Totalpass TP+",
      "Gympass/Wellhub Basic+"
    ]
  },
  "availability": {
    "weekly_hours": {
      "segunda": "06:30 as 22:00",
      "terca": "06:30 as 22:00",
      "quarta": "06:30 as 22:00",
      "quinta": "06:30 as 22:00",
      "sexta": "06:30 as 22:00",
      "sabado": "09:00 as 13:00",
      "domingo": "fechado"
    }
  },
  "catalog": {
    "items": [
      {
        "nome": "Musculacao",
        "dia": "segunda a sabado",
        "hora": "livre",
        "publico": "todos",
        "observacao": "acesso livre, sem agendamento"
      },
      {
        "nome": "Zumba",
        "dia": "terca e quinta",
        "hora": "08:00",
        "publico": "todos",
        "observacao": ""
      },
      {
        "nome": "Muay Fit",
        "dia": "segunda",
        "hora": "18:00",
        "publico": "todos",
        "observacao": "luta com foco em condicionamento, sem contato"
      },
      {
        "nome": "Cross training",
        "dia": "terca e quinta",
        "hora": "18:30",
        "publico": "todos",
        "observacao": "circuito funcional"
      },
      {
        "nome": "Ritmos",
        "dia": "quarta",
        "hora": "18:15",
        "publico": "todos",
        "observacao": ""
      },
      {
        "nome": "Fitdance",
        "dia": "terca e quinta",
        "hora": "19:30",
        "publico": "todos",
        "observacao": ""
      },
      {
        "nome": "Pilates",
        "dia": "sexta",
        "hora": "18:15",
        "publico": "todos",
        "observacao": ""
      },
      {
        "nome": "Funcional Kids",
        "dia": "quarta e sexta",
        "hora": "19:15",
        "publico": "6 a 9 anos",
        "observacao": "SUSPENSO no momento"
      }
    ]
  },
  "risk_free_entry": {
    "exists": true,
    "duration": "7 dias",
    "gift": "aromatizador de carro personalizado"
  },
  "location_contact": {
    "address": "Avenida Protasio Alves, 4780 - Porto Alegre/RS",
    "whatsapp": "(51) 98251-2270",
    "instagram": "@befitnesspoa",
    "email": "befitnespoa@gmail.com"
  },
  "differentials": {
    "items": [
      "Professores presentes em todos os turnos",
      "Treino montado pelo professor e acompanhado pelo aluno no aplicativo",
      "Todas as aulas de ginastica inclusas no plano, sem custo extra",
      "Competicoes com premiacao pela plataforma GymRats",
      "Ambiente acolhedor de academia de bairro",
      "Vestiario com chuveiro, armario rotativo e estacionamento"
    ]
  },
  "policies": {
    "cancellation": "Mensal e anual recorrente cancelam a qualquer momento. Anual parcelado e compromisso de 12 meses.",
    "partnerships": [
      {
        "servico": "Terapia holistica",
        "profissional": "Gislaine Squeff",
        "valor": "R$ 200 externo / R$ 160 aluno"
      },
      {
        "servico": "Nutricao (Volino Nutrition)",
        "profissional": "Lucas Volino",
        "valor": "R$ 260 presencial / R$ 220 online"
      },
      {
        "servico": "Personal (Volino Training)",
        "profissional": "Lucas Volino",
        "valor": "R$ 220 presencial / R$ 180 online"
      },
      {
        "servico": "Treino + nutricao (Volino Performance)",
        "profissional": "Lucas Volino",
        "valor": "R$ 390 presencial / R$ 320 online"
      },
      {
        "servico": "Estetica, massoterapia, limpeza de pele",
        "profissional": "Cinara Lima",
        "valor": "sob consulta no local"
      },
      {
        "servico": "Loja de suplementos",
        "profissional": "interno",
        "valor": "variavel"
      }
    ]
  },
  "commitment_offer": {
    "best_value": "Anual a vista R$ 958,80, ou 12x R$ 99 no cartao"
  },
  "reciprocity": {
    "gift": "Plano anual: bolsa termica personalizada + chaveiro. Vale-presente de 15 dias para indicar um amigo que ainda nao e cliente."
  },
  "free_notes": "Modelo de acesso livre: nao existe vaga, reserva ou lotacao. Nunca mencionar disponibilidade de horario como escassez."
}'::jsonb, 'onboarding', true from t;


-- ---------------------------------------------------------------------
-- EMPRESA 2 — DNA INCOMPLETO
-- ---------------------------------------------------------------------
with t as (
  insert into public.tenants (name, slug, skill_key, plan, status)
  values ('Academia Nova (DEMO)', 'demo-academia-nova', 'academia', 'trial', 'trial')
  returning id
)
insert into public.commercial_dna (tenant_id, version, sections, source, is_current)
select t.id, 1, '{
  "pricing": {
    "range": "R$ 120 a R$ 190 por mes"
  },
  "availability": {
    "weekly_hours": {
      "segunda": "07:00 as 21:00",
      "sabado": "08:00 as 12:00",
      "domingo": "fechado"
    }
  },
  "location_contact": {
    "address": "Rua Exemplo, 100 - Canoas/RS"
  }
}'::jsonb, 'onboarding', true from t;


-- ---------------------------------------------------------------------
-- Instala a Skill Academia nas duas
-- ---------------------------------------------------------------------
insert into public.tenant_skills (tenant_id, skill_id, version)
select t.id, s.id, s.version
from public.tenants t
join public.skills s on s.key = t.skill_key and s.status = 'published'
where t.slug in ('demo-be-fitness','demo-academia-nova');


