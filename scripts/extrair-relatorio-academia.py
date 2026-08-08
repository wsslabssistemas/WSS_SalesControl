#!/usr/bin/env python3
"""
Converte o relatório de mensalidades da academia (PDF) no CSV que o
`importar-planos.mjs` consome.

POR QUE ISTO EXISTE
O sistema da academia não tem API, e o botão "exportar CSV" dele devolve PDF —
os arquivos `.csv` baixados são byte a byte iguais aos `.pdf`. Enquanto o
fornecedor não liberar acesso, a atualização semanal passa por aqui.

POR QUE POSICIONAL E NÃO TEXTO CORRIDO
No texto extraído, nome e telefone quebram em várias linhas e as colunas se
misturam. O PDF guarda a COORDENADA X de cada palavra, e é ela que diz a qual
coluna a palavra pertence. Foi assim que se descobriu que a data de Fim mora em
x≈516 — lendo por texto, ela era engolida pela coluna de Início e o relatório
saía com ZERO vencimentos, que é exatamente o dado que interessa.

A VERIFICAÇÃO
O rodapé do relatório declara "N registros". Se a contagem extraída não bater,
o script FALHA em vez de entregar um CSV pela metade — dado incompleto com
aparência de completo é o defeito que este projeto mais evita.

USO
    pip install pdfplumber
    python scripts/extrair-relatorio-academia.py "mensalidades.pdf" saida.csv
"""

import sys, re, csv, collections
from datetime import datetime

try:
    import pdfplumber
except ImportError:
    sys.exit("Falta a biblioteca: pip install pdfplumber")

# Fronteiras de coluna, em pontos. Vieram da posição do CABEÇALHO no PDF real
# (Código 31, Nome 123, Plano 215, Periodicidade 308, Início 436, Fim 531,
# Telefone 586, Celular 665, Nascimento 750). Se o relatório mudar de layout,
# é aqui que se ajusta — e a verificação do rodapé avisa que mudou.
COLUNAS = [
    ("codigo", 0, 120),
    ("nome", 120, 213),
    ("plano", 213, 305),
    ("periodicidade", 305, 420),
    ("inicio", 420, 500),
    ("fim", 500, 583),
    ("telefone", 583, 643),
    ("celular", 643, 740),
    ("nascimento", 740, 900),
]

LIXO = ("registros", "Página", "Pagina", "sistemasca", "Personalizado",
        "Filtros", "Situação", "Situa")


def extrair(caminho):
    registros, declarado, atual = [], None, None

    with pdfplumber.open(caminho) as pdf:
        for pg in pdf.pages:
            texto_pg = pg.extract_text() or ""
            m = re.search(r"([\d\.]+)\s+registros", texto_pg)
            if m and declarado is None:
                declarado = int(m.group(1).replace(".", ""))

            linhas = collections.defaultdict(list)
            for w in pg.extract_words():
                linhas[round(w["top"] / 3)].append(w)

            for chave in sorted(linhas):
                grupo = sorted(linhas[chave], key=lambda w: w["x0"])
                txt = " ".join(w["text"] for w in grupo)
                if any(x in txt for x in LIXO):
                    continue
                if "Código" in txt and "Nome" in txt:
                    continue

                # Uma linha nova começa onde aparece o Código. O que vier
                # abaixo sem código é continuação da mesma pessoa — nome longo
                # quebrado em duas linhas, celular na linha de baixo.
                if any(w["x0"] < 60 and w["text"].isdigit() for w in grupo):
                    if atual:
                        registros.append(atual)
                    atual = {nome: [] for nome, _, _ in COLUNAS}

                if atual is None:
                    continue

                for w in grupo:
                    for nome, xi, xf in COLUNAS:
                        if xi <= w["x0"] < xf:
                            atual[nome].append(w["text"])
                            break

    if atual:
        registros.append(atual)
    return [{k: " ".join(v).strip() for k, v in r.items()} for r in registros], declarado


def data(s):
    s = (s or "").strip()
    return datetime.strptime(s, "%d/%m/%Y") if re.fullmatch(r"\d{2}/\d{2}/\d{4}", s) else None


def main():
    if len(sys.argv) < 3:
        sys.exit("uso: python scripts/extrair-relatorio-academia.py <entrada.pdf> <saida.csv>")
    entrada, saida = sys.argv[1], sys.argv[2]

    regs, declarado = extrair(entrada)
    print(f"extraídos: {len(regs)}   declarado no rodapé: {declarado}")
    if declarado is not None and len(regs) != declarado:
        sys.exit(
            f"ERRO: extraí {len(regs)} e o relatório declara {declarado}.\n"
            "O layout do PDF mudou. Ajuste COLUNAS antes de importar — um CSV\n"
            "pela metade importa gente pela metade, e ninguém percebe."
        )

    # UMA LINHA POR PESSOA. O relatório é um LOG de contratos: a mesma pessoa
    # aparece uma vez por contrato assinado. Para vigência vale o de MAIOR data
    # de fim — importar linha a linha criaria uma duplicata por renovação.
    por_pessoa = {}
    for r in regs:
        cod = r["codigo"].strip()
        if not cod:
            continue
        fim = data(r["fim"])
        atual = por_pessoa.get(cod)
        if atual is None:
            por_pessoa[cod] = r
        else:
            fim_atual = data(atual["fim"])
            if fim and (fim_atual is None or fim > fim_atual):
                por_pessoa[cod] = r

    hoje = datetime.now()
    linhas = []
    for cod, r in por_pessoa.items():
        fim, ini = data(r["fim"]), data(r["inicio"])
        linhas.append({
            "codigo": cod,
            "nome": r["nome"].strip(),
            # Celular tem preferência: é o número que tem WhatsApp.
            "telefone": (r["celular"] or r["telefone"] or "").strip(),
            "nascimento": r["nascimento"].strip(),
            "plano": r["plano"].strip(),
            "periodicidade": r["periodicidade"].strip(),
            "inicio": ini.strftime("%Y-%m-%d") if ini else "",
            "fim": fim.strftime("%Y-%m-%d") if fim else "",
            "situacao": "vigente" if (fim and fim >= hoje) else ("vencido" if fim else "sem_vigencia"),
        })

    with open(saida, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0].keys()))
        w.writeheader()
        w.writerows(linhas)

    c = collections.Counter(l["situacao"] for l in linhas)
    print(f"pessoas distintas: {len(linhas)}   {dict(c)}")
    print(f"gravado: {saida}")


if __name__ == "__main__":
    main()
