# COS — Commercial Operating System

Plataforma de inteligência comercial multi-tenant.
Um núcleo único (CIE) + especializações por segmento (Skills).

**Fabricante:** WSS Labs

---

## O que tem aqui

```
cos-platform/
├─ docs/blueprint/          # Os documentos de fundação e o Blueprint
├─ packages/
│  ├─ db/
│  │  ├─ migrations/        # Estrutura do banco de dados (SQL)
│  │  └─ tests/             # Testes de segurança
│  └─ skills/               # Especializações por segmento (DADOS, não código)
│     ├─ academia/
│     └─ barbearia/
├─ .env.example             # Modelo de configuração (SEM senhas)
└─ .gitignore               # O que nunca sobe pro GitHub
```

---

## Como executar (primeira vez)

Nada precisa ser instalado no teu computador ainda. Tudo roda no painel do Supabase.

### Passo 1 — Criar as tabelas

1. Abre teu projeto no Supabase
2. Menu lateral → **SQL Editor** → **New query**
3. Abre o arquivo `packages/db/migrations/0001_foundation.sql`, copia **tudo**, cola e clica em **Run**
4. Repete com `packages/db/migrations/0002_rls.sql`

Se aparecer "Success. No rows returned", deu certo.

### Passo 2 — Criar dois usuários de teste

1. Menu lateral → **Authentication** → **Users** → **Add user**
2. Cria dois: `teste-a@exemplo.com` e `teste-b@exemplo.com` (senha qualquer)
3. Copia o **UUID** de cada um (a coluna `id` da lista)

### Passo 3 — Provar que o isolamento funciona

1. Abre `packages/db/tests/isolation_test.sql`
2. Cola os dois UUIDs no topo do arquivo, onde está indicado
3. Cola tudo no SQL Editor e roda

O teste cria duas empresas, coloca um usuário em cada, e tenta ler os dados da
outra. **O resultado esperado é 0 linhas** — se aparecer qualquer dado da outra
empresa, o isolamento falhou e nada mais deve ser construído até corrigir.

---

## Regras do projeto

Estas regras existem para o sistema não virar spaghetti. Valem para sempre.

**Lei 1 — O núcleo nunca conhece segmento.**
Nada em `packages/core/` pode saber o que é academia, aluno ou matrícula.

**Lei 2 — Uma Skill é dado, nunca código.**
`packages/skills/` só aceita `.yaml`, `.json` e `.md`. Nenhum arquivo executável.

**Lei 3 — Nenhum acesso a dados sem contexto de empresa.**
Toda consulta passa por repositório que exige o `tenant_id`. O RLS no banco é a
defesa real.

---

## ⚠️ Segurança

As chaves do Supabase **nunca** vão para o GitHub. Elas ficam num arquivo `.env`
local, que já está bloqueado pelo `.gitignore`.

Se uma chave vazar em algum lugar público, ela precisa ser trocada
imediatamente no painel do Supabase.

---

## Estado atual

- [x] Estrutura do banco
- [x] Isolamento entre empresas (RLS)
- [x] Duas Skills de exemplo
- [ ] Carregador e validador de Skills
- [ ] Motor de decisão (CIE)
- [ ] Interface
