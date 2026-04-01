import { Button } from "@/components/ui/button";
import { Eye, FileDown } from "lucide-react";
import { useRef, useState } from "react";

interface ParsedNode {
  id: string;
  type: "activity" | "question" | "answer" | "table" | "plain";
  content?: string;
  rows?: string[][];
  isFirstActivity?: boolean;
}

let nodeSeq = 0;
function makeId(type: string) {
  return `${type}-${++nodeSeq}`;
}

function parseMarkup(input: string): ParsedNode[] {
  const lines = input.split("\n");
  const nodes: ParsedNode[] = [];
  let currentTable: string[][] | null = null;
  let activityCount = 0;

  for (const line of lines) {
    if (line.startsWith("#ACTIVITY")) {
      if (currentTable) {
        nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
        currentTable = null;
      }
      activityCount++;
      nodes.push({
        id: makeId("activity"),
        type: "activity",
        content: line.replace("#ACTIVITY", "").trim(),
        isFirstActivity: activityCount === 1,
      });
    } else if (line.startsWith("#QUESTION")) {
      if (currentTable) {
        nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
        currentTable = null;
      }
      nodes.push({
        id: makeId("question"),
        type: "question",
        content: line.replace("#QUESTION", "").trim(),
      });
    } else if (line.startsWith("#ANSWER")) {
      if (currentTable) {
        nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
        currentTable = null;
      }
      nodes.push({
        id: makeId("answer"),
        type: "answer",
        content: line.replace("#ANSWER", "").trim(),
      });
    } else if (line.startsWith("#TABLE")) {
      if (currentTable) {
        nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
      }
      currentTable = [];
    } else if (line.startsWith("#ROW")) {
      const cols = line
        .replace("#ROW", "")
        .split("|")
        .map((c) => c.trim());
      if (currentTable) {
        currentTable.push(cols);
      } else {
        currentTable = [cols];
      }
    } else {
      if (currentTable) {
        nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
        currentTable = null;
      }
      if (line.trim()) {
        nodes.push({ id: makeId("plain"), type: "plain", content: line });
      }
    }
  }

  if (currentTable) {
    nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
  }

  return nodes;
}

const PLACEHOLDER = `#ACTIVITY 01
#QUESTION 1. What is the formula for area of a circle?
#ANSWER Area = π × r²  where r is the radius of the circle.
#QUESTION 2. Fill in the multiplication table:
#TABLE
#ROW × | 1 | 2 | 3
#ROW 1 | 1 | 2 | 3
#ROW 2 | 2 | 4 | 6
#ROW 3 | 3 | 6 | 9
#QUESTION 3. Solve for x: 2x + 5 = 13
#ANSWER Subtract 5 from both sides: 2x = 8
#ANSWER Divide by 2: x = 4
#ACTIVITY 02
#QUESTION 4. What is the Pythagorean theorem?
#ANSWER a² + b² = c² where c is the hypotenuse.`;

function TableNode({ rows }: { rows: string[][] }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        margin: "12px 0",
        fontSize: "13px",
      }}
    >
      <tbody>
        {rows.map((row, rIdx) => {
          const rowKey = `row-${rIdx}`;
          return (
            <tr
              key={rowKey}
              style={{
                background:
                  rIdx === 0 ? "#f0f4ff" : rIdx % 2 === 0 ? "#fafafa" : "#fff",
              }}
            >
              {row.map((cell) => (
                <td
                  key={`${rowKey}-${cell}`}
                  style={{
                    border: "1px solid #bbb",
                    padding: "6px 10px",
                    fontWeight: rIdx === 0 ? "bold" : "normal",
                    textAlign: "center",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// A4 dimensions in pixels at 96dpi: 210mm = ~794px, 297mm = ~1123px
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const A4_MARGIN_PX = 56; // ~15mm

function buildPages(nodes: ParsedNode[]): ParsedNode[][] {
  const pages: ParsedNode[][] = [];
  let current: ParsedNode[] = [];

  for (const node of nodes) {
    // Each #ACTIVITY starts a new page (except if it's first and page is empty)
    if (node.type === "activity" && current.length > 0) {
      pages.push(current);
      current = [];
    }
    current.push(node);
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
}

function PageView({
  nodes,
  pageNum,
  totalPages,
}: { nodes: ParsedNode[]; pageNum: number; totalPages: number }) {
  return (
    <div
      style={{
        width: `${A4_WIDTH_PX}px`,
        minHeight: `${A4_HEIGHT_PX}px`,
        background: "#fff",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
        borderRadius: "2px",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        position: "relative",
        padding: `${A4_MARGIN_PX}px`,
        paddingBottom: `${A4_MARGIN_PX + 28}px`,
        fontFamily: "Arial, sans-serif",
        marginBottom: "32px",
      }}
    >
      {/* Content */}
      <div style={{ flex: 1 }}>{nodes.map((node) => renderNode(node))}</div>

      {/* Page number */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: "12px",
          color: "#888",
        }}
      >
        Page {pageNum} of {totalPages}
      </div>
    </div>
  );
}

function renderNode(node: ParsedNode) {
  if (node.type === "activity") {
    return (
      <div
        key={node.id}
        style={{
          textAlign: "center",
          fontSize: "26px",
          fontWeight: "bold",
          margin: "0 0 24px 0",
          color: "#111",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          borderBottom: "2px solid #333",
          paddingBottom: "10px",
        }}
      >
        ACTIVITY {node.content}
      </div>
    );
  }
  if (node.type === "question") {
    return (
      <div
        key={node.id}
        style={{
          fontWeight: "bold",
          fontSize: "15px",
          marginTop: "18px",
          marginBottom: "6px",
          color: "#111",
        }}
      >
        {node.content}
      </div>
    );
  }
  if (node.type === "answer") {
    return (
      <div
        key={node.id}
        style={{
          margin: "6px 0",
          lineHeight: "1.7",
          color: "#333",
          fontSize: "14px",
          paddingLeft: "12px",
          borderLeft: "3px solid #ddd",
        }}
      >
        {node.content}
      </div>
    );
  }
  if (node.type === "table" && node.rows) {
    return <TableNode key={node.id} rows={node.rows} />;
  }
  if (node.type === "plain") {
    return (
      <div
        key={node.id}
        style={{
          margin: "8px 0",
          lineHeight: "1.6",
          color: "#555",
          fontSize: "14px",
        }}
      >
        {node.content}
      </div>
    );
  }
  return null;
}

const BOTTOM_LIMIT = 277; // mm — leave room for page number
const LEFT_MARGIN = 15;
const TOP_MARGIN = 20;

function addPageNumber(pdf: any, pageNum: number) {
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Page ${pageNum}`, 105, 287, { align: "center" });
}

function renderNodeToPDF(
  pdf: any,
  node: ParsedNode,
  yIn: number,
  pageNumRef: { val: number },
): number {
  let y = yIn;

  const maybeNewPage = (neededHeight: number) => {
    if (y + neededHeight > BOTTOM_LIMIT) {
      addPageNumber(pdf, pageNumRef.val);
      pdf.addPage();
      pageNumRef.val++;
      y = TOP_MARGIN;
    }
  };

  if (node.type === "activity") {
    const text = `ACTIVITY ${node.content ?? ""}`;
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    maybeNewPage(16);
    pdf.text(text, 105, y, { align: "center" });
    y += 6;
    pdf.setDrawColor(50, 50, 50);
    pdf.setLineWidth(0.5);
    pdf.line(LEFT_MARGIN, y, 195, y);
    y += 10;
  } else if (node.type === "question") {
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "bold");
    const lines: string[] = pdf.splitTextToSize(node.content ?? "", 180);
    maybeNewPage(lines.length * 6 + 8);
    for (const line of lines) {
      pdf.text(line, LEFT_MARGIN, y);
      y += 6;
    }
    y += 4;
  } else if (node.type === "answer") {
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    const lines: string[] = pdf.splitTextToSize(node.content ?? "", 177);
    maybeNewPage(lines.length * 6 + 6);
    for (const line of lines) {
      pdf.text(line, 18, y);
      y += 6;
    }
    y += 3;
  } else if (node.type === "plain") {
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    const lines: string[] = pdf.splitTextToSize(node.content ?? "", 180);
    maybeNewPage(lines.length * 6 + 5);
    for (const line of lines) {
      pdf.text(line, LEFT_MARGIN, y);
      y += 6;
    }
    y += 3;
  } else if (node.type === "table" && node.rows) {
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    for (let i = 0; i < node.rows.length; i++) {
      const rowText = node.rows[i].join(" | ");
      const lines: string[] = pdf.splitTextToSize(rowText, 180);
      maybeNewPage(lines.length * 6 + 4);
      for (const line of lines) {
        pdf.text(line, LEFT_MARGIN, y);
        y += 6;
      }
      // separator line between rows
      if (i < node.rows.length - 1) {
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.3);
        pdf.line(LEFT_MARGIN, y, 195, y);
      }
      y += 3;
    }
    y += 3;
  }

  return y;
}

export default function AutoPDFGenerator() {
  const [input, setInput] = useState("");
  const [pages, setPages] = useState<ParsedNode[][]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  function generate() {
    if (!input.trim()) return;
    nodeSeq = 0;
    const nodes = parseMarkup(input);
    setPages(buildPages(nodes));
  }

  function downloadPDF() {
    if (pages.length === 0) return;
    setIsDownloading(true);

    try {
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF("p", "mm", "a4");

      const pageNumRef = { val: 1 };
      let y = TOP_MARGIN;
      let firstPage = true;

      for (const pageNodes of pages) {
        // Each logical page (from buildPages) already starts a new PDF page
        if (!firstPage) {
          addPageNumber(pdf, pageNumRef.val);
          pdf.addPage();
          pageNumRef.val++;
          y = TOP_MARGIN;
        }
        firstPage = false;

        for (const node of pageNodes) {
          y = renderNodeToPDF(pdf, node, y, pageNumRef);
        }
      }

      // Add page number for the last page
      addPageNumber(pdf, pageNumRef.val);

      pdf.save("SmartPDF.pdf");
    } catch (error) {
      alert("Error generating PDF. Please try again.");
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  }

  const hasContent = pages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          <FileDown className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground tracking-tight">
            Smart PDF Generator
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-ocid="pdf.preview_button"
            onClick={generate}
            disabled={!input.trim()}
            className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity gap-2"
            size="sm"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button
            data-ocid="pdf.download_button"
            onClick={downloadPDF}
            disabled={!hasContent || isDownloading}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            {isDownloading ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </header>

      {/* Split layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: textarea */}
        <div className="w-1/2 flex flex-col border-r border-border">
          <div className="px-4 py-2 bg-muted border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Markup Input
          </div>
          <textarea
            data-ocid="pdf.textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            className="flex-1 w-full p-4 resize-none bg-background text-foreground leading-relaxed outline-none border-none"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "13px",
            }}
          />
        </div>

        {/* Right: A4 preview */}
        <div className="w-1/2 flex flex-col" style={{ background: "#e8e8e8" }}>
          <div className="px-4 py-2 bg-muted border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
            <span>A4 Preview</span>
            {hasContent && (
              <span className="text-xs text-muted-foreground normal-case">
                {pages.length} page{pages.length > 1 ? "s" : ""} · Double-click
                to download
              </span>
            )}
          </div>

          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
            onDoubleClick={downloadPDF}
          >
            {!hasContent ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <FileDown className="w-12 h-12 opacity-20" />
                <div className="text-center">
                  <p className="font-medium text-sm">No preview yet</p>
                  <p className="text-xs mt-1">
                    Type markup in the editor and click Preview
                  </p>
                </div>
              </div>
            ) : (
              <div ref={previewRef} style={{ width: `${A4_WIDTH_PX}px` }}>
                {pages.map((pageNodes, idx) => (
                  <div key={pageNodes[0]?.id ?? "page"} className="pdf-page">
                    <PageView
                      nodes={pageNodes}
                      pageNum={idx + 1}
                      totalPages={pages.length}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-2 text-xs text-muted-foreground bg-card border-t border-border shrink-0">
        Developed by Appu | 2026
      </footer>
    </div>
  );
}
