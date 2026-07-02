import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeuralCanvas } from "@/components/pce/NeuralCanvas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acesso — PCE | Prestação de Contas Estaduais" },
      {
        name: "description",
        content:
          "Login institucional do PCE — Prestação de Contas Estaduais. Auditoria inteligente com suporte de IA para auditores do TCE.",
      },
      { property: "og:title", content: "Acesso — PCE | Prestação de Contas Estaduais" },
      {
        property: "og:description",
        content: "Acesso restrito a auditores do TCE.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-screen w-full" style={{ background: "#0D1B2A" }}>
      {/* LEFT — neural / futurista (60%) */}
      <section
        className="relative hidden overflow-hidden md:flex md:w-3/5 md:flex-col md:justify-between md:p-12"
        style={{
          background:
            "radial-gradient(1200px 600px at 20% 10%, rgba(26,86,219,0.25), transparent 60%), radial-gradient(900px 500px at 80% 90%, rgba(0,194,203,0.18), transparent 60%), #0D1B2A",
        }}
      >
        <NeuralCanvas />

        <div className="relative z-10 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-lg overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,194,203,0.35)" }}
          >
            <img src={pceLogo} alt="PCE" className="h-8 w-8 object-contain" width={32} height={32} />
          </div>
          <span className="text-sm font-medium tracking-wider text-white/80">
            TCE · INTELIGÊNCIA DE AUDITORIA
          </span>
        </div>

        <div className="relative z-10 max-w-2xl">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              color: "#00C2CB",
              background: "rgba(0,194,203,0.08)",
              border: "1px solid rgba(0,194,203,0.3)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#00C2CB" }} />
            Plataforma neural ativa
          </div>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white lg:text-6xl">
            PCE — Prestação de
            <br />
            <span style={{
              backgroundImage: "linear-gradient(90deg, #FFFFFF 0%, #00C2CB 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Contas Estaduais
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70">
            Auditoria inteligente com suporte de Inteligência Artificial.
            Análise preditiva, detecção de inconsistências e consolidação assistida.
          </p>
        </div>

        <div className="relative z-10 grid max-w-2xl grid-cols-3 gap-6 text-white/60">
          <Stat label="Processos analisados" value="12.4k" />
          <Stat label="Órgãos integrados" value="46" />
          <Stat label="Precisão de detecção" value="98,7%" />
        </div>
      </section>

      {/* RIGHT — form (40%) */}
      <section className="flex w-full items-center justify-center px-6 py-10 md:w-2/5"
        style={{ background: "#F4F5F7" }}
      >
        <div
          className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-xl animate-fade-in"
          style={{ borderColor: "rgba(13,27,42,0.08)" }}
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider"
            style={{ color: "#1A56DB" }}>
            <ShieldCheck className="h-4 w-4" />
            Sistema institucional
          </div>
          <h2 className="mt-3 text-2xl font-bold" style={{ color: "#0D1B2A" }}>
            Acesso ao Sistema
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Utilize sua conta corporativa para entrar
          </p>

          <Button
            onClick={() => navigate({ to: "/dashboard" })}
            className="group relative mt-7 h-12 w-full overflow-hidden text-base font-semibold text-white shadow-lg transition-all hover:shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #0D1B2A 0%, #1A56DB 100%)",
            }}
          >
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
            <ShieldCheck className="mr-2 h-5 w-5" />
            Entrar com Conta Corporativa
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>autenticação federada</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div
            className="rounded-lg p-3 text-xs leading-relaxed"
            style={{ background: "#F4F5F7", color: "#0D1B2A" }}
          >
            <strong style={{ color: "#1A56DB" }}>Acesso restrito.</strong>{" "}
            Apenas usuários autorizados do TCE. Todas as sessões são auditadas
            e registradas conforme a Política de Segurança da Informação.
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Tribunal de Contas do Estado · PCE v2.5
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider">{label}</div>
    </div>
  );
}
