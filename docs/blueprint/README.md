# Blueprint

Estes documentos têm prioridade sobre qualquer decisão técnica.
Se uma solução técnica contraria um princípio, a solução está errada.

## Documentos canônicos

Os três que o `CLAUDE.md` manda ler antes de propor qualquer coisa:

- `ESTADO_DO_PROJETO.md` — onde o projeto está e o que vem a seguir.
- `COS_Journal_Migracao.md` — decisões tomadas e o porquê de cada uma.
- `COS_GRD_Core.md` — requisitos do núcleo.

Os três estão versionados com conteúdo real desde julho de 2026.

**Atenção ao estado das migrations.** `ESTADO_DO_PROJETO.md` e `COS_GRD_Core.md`
registram `0004_seed_knowledge_academia.sql` como pendente e citam um
`0005_seed_dna_demo.sql` que não existe no repositório. O `CLAUDE.md` registra o
0004 como executado e a cobertura de DNA como validada. **O `CLAUDE.md` é o mais
recente.** Ao retomar, confirmar no banco antes de confiar em qualquer um dos dois.

## Documentos fundadores — ainda não versionados

Anteriores aos canônicos e ainda fora do repositório:

- `parte1_fundacao_tecnica.md` (v1.1)
- `parte2_cie.md`
- `fundacao/` — os 8 documentos originais (Manifesto, Principles, Journal,
  GRD, Arquitetura, Roadmap, Bible)

Ao trazê-los, decidir se substituem os canônicos ou convivem como histórico.
Duas listas de nomes diferentes para a mesma pasta foi o que gerou a
divergência que este README resolve.
