import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Search,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

type Props = {
  texto: string;
  /** Processo nº (ex.: "1208495") */
  processo: string;
  /** Nome / sigla do órgão */
  orgao: string;
  /** Trecho exato que deve ser destacado no documento de origem.
   *  Default: usa o próprio resumo. */
  trechoDestacado?: string;
};

export function ResumoIA({ texto, processo, orgao, trechoDestacado }: Props) {
  const [open, setOpen] = useState(false);

  const trecho =
    trechoDestacado?.trim() ||
    texto.split(".").slice(0, 1).join(".").trim() + ".";

  return (
    <div className="mt-4 rounded-md border border-[#1A56DB] bg-[#EFF6FF] p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1A56DB] px-2.5 py-1 text-xs font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5" fill="currentColor" />
          Resumo IA
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            title="Visualizar documento de origem"
            aria-label="Visualizar documento de origem"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#1A56DB] transition-colors hover:bg-white/70"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => downloadProcessoPDF(processo, orgao, trecho)}
            title="Baixar documento completo"
            aria-label="Baixar documento completo"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] transition-colors hover:bg-white/70 hover:text-[#0D1B2A]"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-[#0D1B2A]">{texto}</p>

      {open && (
        <DocumentoModal
          processo={processo}
          orgao={orgao}
          trechoDestacado={trecho}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

/* =========================================================
 * Documento fictício — conteúdo paginado
 * ========================================================= */

type Pagina = { titulo: string; render: (highlight: string) => React.ReactNode };

function getPaginas(processo: string, orgao: string): Pagina[] {
  return [
    {
      titulo: "Capa",
      render: () => (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Tribunal de Contas do Estado
          </p>
          <h1 className="mt-12 text-2xl font-bold text-[#0D1B2A]">
            PRESTAÇÃO DE CONTAS ANUAL
          </h1>
          <p className="mt-4 text-lg text-[#0D1B2A]">Exercício 2024</p>
          <div className="my-10 h-px w-2/3 bg-gray-300" />
          <p className="text-lg font-semibold text-[#0D1B2A]">{orgao}</p>
          <p className="mt-2 text-sm text-gray-600">Processo nº {processo}</p>
          <p className="mt-auto pt-16 text-xs text-gray-500">
            Documento gerado eletronicamente — autuação 2025
          </p>
        </div>
      ),
    },
    {
      titulo: "Responsáveis",
      render: () => (
        <DocPage titulo="1. Responsáveis">
          <p className="mb-3">
            São responsáveis pela gestão do órgão {orgao} no exercício de 2024
            os seguintes agentes públicos:
          </p>
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100 text-[#0D1B2A]">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Gestor
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Cargo
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Período
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Gestor 01</td>
                <td className="border border-gray-300 px-3 py-2">
                  Diretor-Geral
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  01/01/2024 a 30/06/2024
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">Gestor 02</td>
                <td className="border border-gray-300 px-3 py-2">
                  Diretor-Geral
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  01/07/2024 a 31/12/2024
                </td>
              </tr>
            </tbody>
          </table>
        </DocPage>
      ),
    },
    {
      titulo: "Receitas",
      render: () => (
        <DocPage titulo="2. Receitas Arrecadadas">
          <p className="mb-3">
            O quadro abaixo demonstra a arrecadação consolidada do exercício:
          </p>
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Origem
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right">
                  Valor (R$)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">
                  Receitas Correntes
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  142.870.450,32
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">
                  Receitas de Capital
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  18.420.110,00
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">
                  Transferências Constitucionais
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  56.300.000,00
                </td>
              </tr>
              <tr className="font-semibold">
                <td className="border border-gray-300 px-3 py-2">Total</td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  217.590.560,32
                </td>
              </tr>
            </tbody>
          </table>
        </DocPage>
      ),
    },
    {
      titulo: "Despesas",
      render: () => (
        <DocPage titulo="3. Despesas Executadas">
          <p className="mb-3">
            A execução orçamentária da despesa apresentou os seguintes valores:
          </p>
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Grupo
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right">
                  Empenhado (R$)
                </th>
                <th className="border border-gray-300 px-3 py-2 text-right">
                  Liquidado (R$)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-3 py-2">
                  Pessoal e Encargos
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  98.120.300,00
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  97.880.110,40
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">
                  Outras Despesas Correntes
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  72.450.000,00
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  68.310.220,00
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-2">
                  Investimentos
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  31.200.000,00
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  24.870.500,00
                </td>
              </tr>
            </tbody>
          </table>
        </DocPage>
      ),
    },
    {
      titulo: "Inconformidades",
      render: (highlight) => (
        <DocPage titulo="4. Inconformidades Apuradas">
          <p className="mb-3">
            Durante a análise técnica foram identificadas incoformidades de
            naturezas distintas, conforme detalhado abaixo.
          </p>
          <p className="mb-3">
            <strong>4.1.</strong> Foram observadas inconsistências em dotações
            orçamentárias do exercício, com remanejamentos não devidamente
            justificados em portarias do órgão.
          </p>
          <p className="mb-3 rounded-sm bg-yellow-200 px-1 leading-relaxed text-[#0D1B2A] ring-1 ring-yellow-400">
            <strong>4.2.</strong> {highlight}
          </p>
          <p className="mb-3">
            <strong>4.3.</strong> Divergências menores foram constatadas no
            controle interno do órgão, com recomendação de saneamento no
            exercício subsequente.
          </p>
        </DocPage>
      ),
    },
    {
      titulo: "Conclusão",
      render: () => (
        <DocPage titulo="5. Conclusão">
          <p className="mb-3">
            Diante do exposto, considerando a documentação acostada aos autos e
            as incoformidades apuradas, manifesta-se a Coordenadoria pela
            aprovação com ressalvas das contas do órgão {orgao}, referentes ao
            exercício de 2024.
          </p>
          <p className="mb-3">
            Recomenda-se o monitoramento das pendências apontadas no item 4 do
            presente relatório, com avaliação obrigatória no próximo ciclo de
            consolidação.
          </p>
          <p className="mt-12 text-sm text-gray-600">
            Belo Horizonte, 15 de março de 2025.
          </p>
        </DocPage>
      ),
    },
  ];
}

function DocPage({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-4 border-b border-gray-300 pb-2 text-lg font-bold text-[#0D1B2A]">
        {titulo}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-[#0D1B2A]">
        {children}
      </div>
    </div>
  );
}

/* =========================================================
 * Modal visualizador
 * ========================================================= */

function DocumentoModal({
  processo,
  orgao,
  trechoDestacado,
  onClose,
}: {
  processo: string;
  orgao: string;
  trechoDestacado: string;
  onClose: () => void;
}) {
  const paginas = useMemo(() => getPaginas(processo, orgao), [processo, orgao]);
  const totalPages = paginas.length;
  const highlightPage =
    paginas.findIndex((p) => p.titulo === "Inconformidades") + 1 || 1;

  const [page, setPage] = useState(highlightPage);
  const [zoom, setZoom] = useState(1);
  const highlightRef = useRef<HTMLDivElement>(null);

  // ESC fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Scroll automático até o trecho destacado ao abrir
  useEffect(() => {
    const id = setTimeout(() => {
      highlightRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);
    return () => clearTimeout(id);
  }, [page]);

  const atual = paginas[page - 1];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-[90vw] flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-border bg-white px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#0D1B2A]">
              Documento de Origem
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              Processo: {processo} — {orgao}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#0D1B2A] hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-[#F8FAFC] px-4 py-2">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
              title="Reduzir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-14 text-center text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[110px] text-center text-xs text-[#0D1B2A]">
              Página {page} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              title="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="button"
            onClick={() => downloadProcessoPDF(processo, orgao, trechoDestacado)}
            className="h-8 gap-2 bg-[#0D1B2A] text-white hover:bg-[#0D1B2A]/90"
          >
            <Download className="h-4 w-4" /> Baixar
          </Button>
        </div>

        {/* Viewer */}
        <div className="flex-1 overflow-auto bg-gray-200 p-6">
          <div
            className="mx-auto bg-white shadow-lg"
            style={{
              width: `${794 * zoom}px`,
              minHeight: `${1123 * zoom}px`,
              padding: `${48 * zoom}px`,
              transformOrigin: "top center",
            }}
          >
            <div
              ref={
                atual.titulo === "Inconformidades" ? highlightRef : undefined
              }
              style={{ fontSize: `${14 * zoom}px` }}
            >
              {atual.render(trechoDestacado)}
            </div>
            <div className="mt-10 border-t border-gray-200 pt-2 text-center text-[10px] text-gray-400">
              Processo {processo} — {orgao} — Página {page} de {totalPages}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * Download PDF (jsPDF)
 * ========================================================= */

function sanitize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function downloadProcessoPDF(
  processo: string,
  orgao: string,
  trechoDestacado: string,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  const maxW = W - 2 * M;

  // -------- Capa
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text("Tribunal de Contas do Estado", W / 2, 120, { align: "center" });
  doc.setFontSize(20);
  doc.setTextColor(13, 27, 42);
  doc.setFont("helvetica", "bold");
  doc.text("PRESTAÇÃO DE CONTAS ANUAL", W / 2, 220, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Exercício 2024", W / 2, 252, { align: "center" });
  doc.setDrawColor(200);
  doc.line(M + 40, 300, W - M - 40, 300);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(orgao, W / 2, 340, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90);
  doc.text(`Processo nº ${processo}`, W / 2, 362, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text(
    "Documento gerado eletronicamente — autuação 2025",
    W / 2,
    H - 60,
    { align: "center" },
  );

  // -------- helpers
  const newSection = (titulo: string) => {
    doc.addPage();
    doc.setTextColor(13, 27, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(titulo, M, M);
    doc.setDrawColor(200);
    doc.line(M, M + 6, W - M, M + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    return M + 28;
  };

  const writeWrapped = (text: string, y: number, opts?: { highlight?: boolean }) => {
    const lines = doc.splitTextToSize(text, maxW) as string[];
    const lineH = 14;
    if (opts?.highlight) {
      const h = lines.length * lineH + 8;
      doc.setFillColor(254, 240, 138); // amarelo
      doc.rect(M - 4, y - 11, maxW + 8, h, "F");
      doc.setDrawColor(234, 179, 8);
      doc.rect(M - 4, y - 11, maxW + 8, h, "S");
    }
    doc.setTextColor(13, 27, 42);
    doc.text(lines, M, y);
    return y + lines.length * lineH + 8;
  };

  // -------- 1. Responsáveis
  let y = newSection("1. Responsáveis");
  y = writeWrapped(
    `São responsáveis pela gestão do órgão ${orgao} no exercício de 2024 os seguintes agentes públicos:`,
    y,
  );
  y += 6;
  const respRows = [
    ["Gestor", "Cargo", "Período"],
    ["Gestor 01", "Diretor-Geral", "01/01/2024 a 30/06/2024"],
    ["Gestor 02", "Diretor-Geral", "01/07/2024 a 31/12/2024"],
  ];
  const colW = [maxW * 0.28, maxW * 0.32, maxW * 0.4];
  respRows.forEach((row, i) => {
    if (i === 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(M, y - 12, maxW, 18, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    let x = M;
    row.forEach((cell, j) => {
      doc.setDrawColor(200);
      doc.rect(x, y - 12, colW[j], 18);
      doc.text(cell, x + 4, y + 1);
      x += colW[j];
    });
    y += 18;
  });

  // -------- 2. Receitas
  y = newSection("2. Receitas Arrecadadas");
  y = writeWrapped(
    "O quadro abaixo demonstra a arrecadação consolidada do exercício:",
    y,
  );
  y += 6;
  const recRows: [string, string][] = [
    ["Origem", "Valor (R$)"],
    ["Receitas Correntes", "142.870.450,32"],
    ["Receitas de Capital", "18.420.110,00"],
    ["Transferências Constitucionais", "56.300.000,00"],
    ["Total", "217.590.560,32"],
  ];
  const recCol = [maxW * 0.62, maxW * 0.38];
  recRows.forEach((row, i) => {
    if (i === 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(M, y - 12, maxW, 18, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont(
        "helvetica",
        i === recRows.length - 1 ? "bold" : "normal",
      );
    }
    doc.setDrawColor(200);
    doc.rect(M, y - 12, recCol[0], 18);
    doc.rect(M + recCol[0], y - 12, recCol[1], 18);
    doc.text(row[0], M + 4, y + 1);
    doc.text(row[1], M + maxW - 4, y + 1, { align: "right" });
    y += 18;
  });

  // -------- 3. Despesas
  y = newSection("3. Despesas Executadas");
  y = writeWrapped(
    "A execução orçamentária da despesa apresentou os seguintes valores:",
    y,
  );
  y += 6;
  const desRows = [
    ["Grupo", "Empenhado (R$)", "Liquidado (R$)"],
    ["Pessoal e Encargos", "98.120.300,00", "97.880.110,40"],
    ["Outras Despesas Correntes", "72.450.000,00", "68.310.220,00"],
    ["Investimentos", "31.200.000,00", "24.870.500,00"],
  ];
  const desCol = [maxW * 0.44, maxW * 0.28, maxW * 0.28];
  desRows.forEach((row, i) => {
    if (i === 0) {
      doc.setFillColor(241, 245, 249);
      doc.rect(M, y - 12, maxW, 18, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    let x = M;
    row.forEach((cell, j) => {
      doc.setDrawColor(200);
      doc.rect(x, y - 12, desCol[j], 18);
      const align = j === 0 ? "left" : "right";
      const tx = j === 0 ? x + 4 : x + desCol[j] - 4;
      doc.text(cell, tx, y + 1, { align });
      x += desCol[j];
    });
    y += 18;
  });

  // -------- 4. Inconformidades (com destaque)
  y = newSection("4. Inconformidades Apuradas");
  y = writeWrapped(
    "Durante a análise técnica foram identificadas incoformidades de naturezas distintas, conforme detalhado abaixo.",
    y,
  );
  y = writeWrapped(
    "4.1. Foram observadas inconsistências em dotações orçamentárias do exercício, com remanejamentos não devidamente justificados em portarias do órgão.",
    y,
  );
  y = writeWrapped(`4.2. ${trechoDestacado}`, y, { highlight: true });
  y = writeWrapped(
    "4.3. Divergências menores foram constatadas no controle interno do órgão, com recomendação de saneamento no exercício subsequente.",
    y,
  );

  // -------- 5. Conclusão
  y = newSection("5. Conclusão");
  y = writeWrapped(
    `Diante do exposto, considerando a documentação acostada aos autos e as incoformidades apuradas, manifesta-se a Coordenadoria pela aprovação com ressalvas das contas do órgão ${orgao}, referentes ao exercício de 2024.`,
    y,
  );
  y = writeWrapped(
    "Recomenda-se o monitoramento das pendências apontadas no item 4 do presente relatório, com avaliação obrigatória no próximo ciclo de consolidação.",
    y,
  );
  y += 30;
  doc.setTextColor(110);
  doc.text("Belo Horizonte, 15 de março de 2025.", M, y);

  // Rodapés
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(
      `Processo ${processo} — ${orgao} — Página ${i} de ${pageCount}`,
      W / 2,
      H - 24,
      { align: "center" },
    );
  }

  doc.save(`Processo_${sanitize(processo)}_${sanitize(orgao)}.pdf`);
}
