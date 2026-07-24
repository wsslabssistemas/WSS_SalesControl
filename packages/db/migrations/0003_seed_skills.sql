-- =====================================================================
-- COS — MIGRATION 0003 : CARGA DAS SKILLS
--
-- Uma Skill é DADO, nunca código.
-- Este arquivo apenas grava no banco o conteúdo dos manifestos que
-- estão em packages/skills/. Nenhuma linha do motor muda entre uma
-- Skill e outra.
--
-- Executar no SQL Editor do Supabase.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Skill: Academia
-- ---------------------------------------------------------------------
insert into public.skills (key, name, version, manifest, status, published_at)
values (
  'academia',
  'Academia',
  '1.0.0',
  '{
  "key": "academia",
  "name": "Academia",
  "version": "1.0.0",
  "vocabulary": {
    "lead": "aluno em potencial",
    "conversion": "matrícula",
    "churn": "cancelamento",
    "catalog_item": "modalidade"
  },
  "discovery_axis": "objetivo físico (emagrecer, ganhar massa, saúde)",
  "journey": {
    "allow_skip": true,
    "allow_regression": true,
    "stages": [
      {
        "key": "contato",
        "label": "Primeiro contato",
        "goal": "Quebrar o gelo e descobrir o objetivo. Nunca abrir com preço."
      },
      {
        "key": "descoberta",
        "label": "Descoberta",
        "goal": "Qualificar objetivo, experiência e rotina."
      },
      {
        "key": "proposta",
        "label": "Proposta",
        "goal": "Apresentar a opção adequada e conduzir à experiência."
      },
      {
        "key": "experimentacao",
        "label": "Semana experimental",
        "goal": "Conduzir a experiência e preparar o fechamento.",
        "phases": [
          {
            "key": "inicio",
            "label": "Início",
            "offset_days": 0
          },
          {
            "key": "acompanhamento",
            "label": "Acompanhamento",
            "offset_days": 2
          },
          {
            "key": "pre_fechamento",
            "label": "Pré-fechamento",
            "offset_days": 6
          },
          {
            "key": "conversao",
            "label": "Conversão",
            "offset_days": 8
          }
        ]
      },
      {
        "key": "negociacao",
        "label": "Negociação",
        "goal": "Isolar a objeção real e fechar."
      },
      {
        "key": "convertido",
        "label": "Matriculado",
        "terminal": true
      },
      {
        "key": "perdido",
        "label": "Perdido",
        "terminal": true
      }
    ]
  },
  "contact_fields": [
    {
      "key": "objetivo",
      "label": "Objetivo",
      "type": "enum",
      "options": [
        "emagrecer",
        "hipertrofia",
        "saude",
        "qualidade_de_vida",
        "socializacao",
        "reabilitacao"
      ]
    },
    {
      "key": "nivel",
      "label": "Experiência",
      "type": "enum",
      "options": [
        "nunca_treinou",
        "retomando",
        "experiente"
      ]
    },
    {
      "key": "turno_preferido",
      "label": "Turno preferido",
      "type": "enum",
      "options": [
        "manha",
        "tarde",
        "noite",
        "sabado"
      ]
    }
  ],
  "lead_sources": [
    "whatsapp",
    "instagram",
    "facebook",
    "presencial",
    "indicacao",
    "convenio",
    "campanha",
    "outro"
  ],
  "dna_sections": [
    {
      "key": "pricing",
      "label": "Planos e valores",
      "required": true,
      "fields": [
        {
          "key": "range",
          "type": "money_range",
          "required": true
        },
        {
          "key": "plans",
          "type": "table",
          "columns": [
            "nome",
            "valor",
            "condicao",
            "fidelidade"
          ]
        },
        {
          "key": "payment_methods",
          "type": "list"
        }
      ]
    },
    {
      "key": "availability",
      "label": "Horário de funcionamento",
      "required": true,
      "fields": [
        {
          "key": "weekly_hours",
          "type": "schedule",
          "required": true
        }
      ]
    },
    {
      "key": "catalog",
      "label": "Modalidades e grade de aulas",
      "required": true,
      "fields": [
        {
          "key": "items",
          "type": "table",
          "columns": [
            "nome",
            "dia",
            "hora",
            "publico",
            "observacao"
          ]
        }
      ]
    },
    {
      "key": "risk_free_entry",
      "label": "Oferta de entrada sem risco",
      "fields": [
        {
          "key": "exists",
          "type": "boolean",
          "required": true
        },
        {
          "key": "duration",
          "type": "text"
        },
        {
          "key": "gift",
          "type": "text"
        }
      ]
    },
    {
      "key": "location_contact",
      "label": "Endereço e contatos",
      "required": true,
      "fields": [
        {
          "key": "address",
          "type": "text",
          "required": true
        },
        {
          "key": "whatsapp",
          "type": "text"
        },
        {
          "key": "instagram",
          "type": "text"
        }
      ]
    },
    {
      "key": "differentials",
      "label": "Diferenciais",
      "fields": [
        {
          "key": "items",
          "type": "list"
        }
      ]
    },
    {
      "key": "policies",
      "label": "Políticas",
      "fields": [
        {
          "key": "cancellation",
          "type": "text"
        },
        {
          "key": "partnerships",
          "type": "table",
          "columns": [
            "servico",
            "profissional",
            "valor"
          ]
        }
      ]
    },
    {
      "key": "free_notes",
      "label": "Outras informações importantes",
      "type": "rich_text"
    }
  ],
  "categories": {
    "pricing": "Planos e mensalidades",
    "risk_free_entry": "Semana experimental",
    "availability": "Horários",
    "expertise_proof": "Professores em todos os turnos",
    "catalog": "Musculação, ginástica, pilates, lutas, dança",
    "goal_matching": "Objetivo → modalidade ideal",
    "objections": "Caro, sem tempo, vergonha, comparação",
    "commitment_offer": "Plano anual",
    "reciprocity": "Brindes de boas-vindas e de adesão",
    "limits_and_ethics": "Saúde, lesões e limites do que prometer",
    "retention": "Aluno desanimado, sem resultado, renovação",
    "ecosystem": "Parceiros no espaço"
  },
  "cadences": [
    {
      "key": "trial_followup",
      "applies_to": "trial_followup",
      "steps": [
        {
          "offset_days": 2,
          "intent": "Realização de valor — o que já conquistou"
        },
        {
          "offset_days": 6,
          "intent": "Projeção de futuro e pré-fechamento"
        },
        {
          "offset_days": 8,
          "intent": "Conversão com aversão à perda"
        }
      ],
      "stop_on": [
        "converted",
        "opted_out",
        "lost"
      ]
    },
    {
      "key": "rescue_inactive",
      "applies_to": "reactivation",
      "steps": [
        {
          "offset_days": 0,
          "intent": "Gancho pessoal e concreto, sem cobrar ausência"
        },
        {
          "offset_days": 4,
          "intent": "Prova social + retorno sem risco"
        },
        {
          "offset_days": 11,
          "intent": "Encerrar com porta aberta"
        }
      ],
      "stop_on": [
        "replied",
        "converted",
        "opted_out"
      ],
      "max_attempts": 3
    }
  ],
  "hard_rules": [
    "Nunca afirmar horário, valor, modalidade ou serviço que não esteja no DNA.",
    "Nunca prometer resultado de saúde, cura ou emagrecimento garantido.",
    "Nunca dizer ''voltar'', ''retornar'' ou ''novamente'' para quem nunca foi aluno.",
    "Nunca mencionar vaga, reserva ou lotação se o modelo for de acesso livre.",
    "Nunca encerrar com pergunta aberta do tipo ''o que acha?'' — usar fechamento por alternativa.",
    "Uma mensagem, um objetivo. Nunca fazer três perguntas seguidas."
  ],
  "kpis": [
    "conversion_rate",
    "trial_rate",
    "trial_conversion",
    "median_response_time"
  ]
}'::jsonb,
  'published',
  now()
)
on conflict (key, version) do update
  set manifest     = excluded.manifest,
      name         = excluded.name,
      status       = excluded.status,
      published_at = now();


-- ---------------------------------------------------------------------
-- Skill: Barbearia
-- ---------------------------------------------------------------------
insert into public.skills (key, name, version, manifest, status, published_at)
values (
  'barbearia',
  'Barbearia',
  '1.0.0',
  '{
  "key": "barbearia",
  "name": "Barbearia",
  "version": "1.0.0",
  "vocabulary": {
    "lead": "cliente em potencial",
    "conversion": "primeiro agendamento",
    "churn": "cliente que parou de voltar",
    "catalog_item": "serviço"
  },
  "discovery_axis": "ocasião e frequência (rotina, evento, manutenção)",
  "journey": {
    "allow_skip": true,
    "allow_regression": true,
    "stages": [
      {
        "key": "contato",
        "label": "Primeiro contato",
        "goal": "Descobrir o que a pessoa procura e para quando."
      },
      {
        "key": "descoberta",
        "label": "Descoberta",
        "goal": "Entender serviço desejado, urgência e preferência de profissional."
      },
      {
        "key": "proposta",
        "label": "Proposta",
        "goal": "Indicar serviço e horário disponível."
      },
      {
        "key": "agendado",
        "label": "Agendado",
        "goal": "Confirmar presença e reduzir falta.",
        "phases": [
          {
            "key": "confirmado",
            "label": "Confirmado",
            "offset_days": 0
          },
          {
            "key": "lembrete",
            "label": "Lembrete",
            "offset_days": 1
          },
          {
            "key": "pos_servico",
            "label": "Pós-serviço",
            "offset_days": 1
          }
        ]
      },
      {
        "key": "recorrente",
        "label": "Cliente recorrente",
        "terminal": true
      },
      {
        "key": "perdido",
        "label": "Perdido",
        "terminal": true
      }
    ]
  },
  "contact_fields": [
    {
      "key": "servico_preferido",
      "label": "Serviço preferido",
      "type": "enum",
      "options": [
        "corte",
        "barba",
        "corte_e_barba",
        "coloracao",
        "tratamento",
        "infantil"
      ]
    },
    {
      "key": "frequencia",
      "label": "Frequência",
      "type": "enum",
      "options": [
        "semanal",
        "quinzenal",
        "mensal",
        "esporadico"
      ]
    },
    {
      "key": "profissional_preferido",
      "label": "Profissional preferido",
      "type": "enum",
      "options": [
        "sem_preferencia",
        "definido"
      ]
    }
  ],
  "lead_sources": [
    "whatsapp",
    "instagram",
    "presencial",
    "indicacao",
    "google",
    "campanha",
    "outro"
  ],
  "dna_sections": [
    {
      "key": "pricing",
      "label": "Tabela de serviços",
      "required": true,
      "fields": [
        {
          "key": "range",
          "type": "money_range",
          "required": true
        },
        {
          "key": "plans",
          "type": "table",
          "columns": [
            "servico",
            "valor",
            "duracao"
          ]
        },
        {
          "key": "payment_methods",
          "type": "list"
        }
      ]
    },
    {
      "key": "availability",
      "label": "Horário e agenda",
      "required": true,
      "fields": [
        {
          "key": "weekly_hours",
          "type": "schedule",
          "required": true
        },
        {
          "key": "booking_rule",
          "type": "text"
        }
      ]
    },
    {
      "key": "catalog",
      "label": "Serviços oferecidos",
      "required": true,
      "fields": [
        {
          "key": "items",
          "type": "table",
          "columns": [
            "nome",
            "duracao",
            "profissional",
            "observacao"
          ]
        }
      ]
    },
    {
      "key": "risk_free_entry",
      "label": "Oferta de entrada",
      "fields": [
        {
          "key": "exists",
          "type": "boolean",
          "required": true
        },
        {
          "key": "offer",
          "type": "text"
        }
      ]
    },
    {
      "key": "location_contact",
      "label": "Endereço e contatos",
      "required": true,
      "fields": [
        {
          "key": "address",
          "type": "text",
          "required": true
        },
        {
          "key": "whatsapp",
          "type": "text"
        },
        {
          "key": "instagram",
          "type": "text"
        }
      ]
    },
    {
      "key": "differentials",
      "label": "Diferenciais",
      "fields": [
        {
          "key": "items",
          "type": "list"
        }
      ]
    },
    {
      "key": "policies",
      "label": "Políticas",
      "fields": [
        {
          "key": "no_show",
          "type": "text"
        },
        {
          "key": "cancellation",
          "type": "text"
        }
      ]
    },
    {
      "key": "free_notes",
      "label": "Outras informações importantes",
      "type": "rich_text"
    }
  ],
  "categories": {
    "pricing": "Tabela de serviços",
    "risk_free_entry": "Primeira visita promocional",
    "availability": "Agenda e horários",
    "expertise_proof": "Barbeiro especialista e portfólio",
    "catalog": "Corte, barba, coloração, tratamentos",
    "goal_matching": "Tipo de cabelo e ocasião → serviço ideal",
    "objections": "Caro, sem tempo, receio de mudar de barbeiro",
    "commitment_offer": "Pacote de sessões / plano de assinatura",
    "reciprocity": "Brinde, bebida cortesia, desconto na indicação",
    "limits_and_ethics": "Não prometer resultado de coloração ou tratamento",
    "retention": "Cliente que não volta há X semanas",
    "ecosystem": "Produtos revendidos e parceiros"
  },
  "cadences": [
    {
      "key": "appointment_confirm",
      "applies_to": "trial_followup",
      "steps": [
        {
          "offset_days": -1,
          "intent": "Confirmação com fechamento por alternativa"
        },
        {
          "offset_days": 1,
          "intent": "Pós-serviço: satisfação e reagendamento"
        }
      ],
      "stop_on": [
        "converted",
        "opted_out"
      ]
    },
    {
      "key": "rescue_lapsed",
      "applies_to": "reactivation",
      "steps": [
        {
          "offset_days": 0,
          "intent": "Lembrete de manutenção baseado na frequência habitual"
        },
        {
          "offset_days": 7,
          "intent": "Oferta de retorno com horário específico"
        }
      ],
      "stop_on": [
        "replied",
        "converted",
        "opted_out"
      ],
      "max_attempts": 2
    }
  ],
  "hard_rules": [
    "Nunca afirmar horário, valor ou serviço que não esteja no DNA.",
    "Nunca confirmar disponibilidade de agenda sem consultar o fato no DNA.",
    "Nunca prometer resultado exato de coloração ou tratamento capilar.",
    "Nunca encerrar com pergunta aberta — oferecer dois horários concretos.",
    "Uma mensagem, um objetivo."
  ],
  "kpis": [
    "conversion_rate",
    "no_show_rate",
    "return_rate_30d",
    "median_response_time"
  ]
}'::jsonb,
  'published',
  now()
)
on conflict (key, version) do update
  set manifest     = excluded.manifest,
      name         = excluded.name,
      status       = excluded.status,
      published_at = now();


-- =====================================================================
-- VERIFICAÇÃO
-- As duas Skills devem ter as MESMAS 12 categorias canônicas,
-- com conteúdo completamente diferente.
-- =====================================================================
select
  s.name                                        as "Skill",
  jsonb_object_keys(s.manifest->'categories')   as "Categoria canonica",
  s.manifest->'categories'->>jsonb_object_keys(s.manifest->'categories')
                                                as "Como esse segmento chama"
from public.skills s
where s.status = 'published'
order by 2, 1;
