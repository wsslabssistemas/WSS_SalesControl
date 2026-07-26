import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, MAKER } from "@/lib/brand";

const features = [
  {
    t: "Biblioteca curada",
    d: "As técnicas de venda que convertem, casadas com os fatos da sua empresa. O ativo, não o código.",
  },
  {
    t: "O momento certo",
    d: "A jornada de cada contato vira toques na hora certa — sem planilha, sem esquecer ninguém.",
  },
  {
    t: "Trava anti-invenção",
    d: "Falta um fato? O sistema escala para um humano em vez de inventar. Confiança por construção.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="container" style={{ paddingTop: 22 }}>
        <div className="between">
          <span className="brand-lockup">
            <Image src="/icons/icon-192.png" alt="" width={32} height={32} priority />
            <span>{BRAND_NAME}</span>
          </span>
          <Link href="/login" className="btn btn-sm btn-ghost">
            Entrar
          </Link>
        </div>
      </header>

      <section
        className="container"
        style={{ textAlign: "center", padding: "72px 1.25rem 40px", maxWidth: 780 }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src="/logo.png"
            alt={BRAND_NAME}
            width={360}
            height={220}
            priority
            style={{ height: "auto", maxWidth: "min(360px, 78vw)", filter: "drop-shadow(0 20px 60px rgba(46,141,242,0.25))" }}
          />
        </div>

        <p className="eyebrow mt-24">{MAKER}</p>
        <h1 style={{ fontSize: "clamp(2rem, 1.4rem + 3.4vw, 3.4rem)", marginTop: 12 }}>
          A venda no <span className="brand-text">momento certo</span>.
        </h1>
        <p className="text-dim" style={{ fontSize: 18, marginTop: 16, maxWidth: 560, marginInline: "auto" }}>
          Motor de inteligência comercial multi-tenant. Sua biblioteca de vendas
          e os fatos da sua empresa, trabalhando por você.
        </p>

        <div className="row" style={{ justifyContent: "center", marginTop: 28, gap: 12 }}>
          <Link href="/login" className="btn btn-primary">
            Acessar o painel
          </Link>
          <a href="/api/health" className="btn btn-ghost">
            Status da API
          </a>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 80, maxWidth: 900 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
          }}
        >
          {features.map((f) => (
            <div key={f.t} className="card card-hover">
              <h3 style={{ fontSize: 16 }}>{f.t}</h3>
              <p className="text-dim" style={{ marginTop: 8, marginBottom: 0, fontSize: 14 }}>
                {f.d}
              </p>
            </div>
          ))}
        </div>
        <p className="text-faint" style={{ textAlign: "center", marginTop: 48, fontSize: 13 }}>
          {BRAND_NAME} · {MAKER} — modelo manual em operação. Versão automática em construção.
        </p>
      </section>
    </main>
  );
}
