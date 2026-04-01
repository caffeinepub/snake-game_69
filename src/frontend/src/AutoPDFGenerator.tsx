import { Button } from "@/components/ui/button";
import { Eye, FileDown } from "lucide-react";
import { useState } from "react";

interface ParsedNode {
  id: string;
  type: "activity" | "question" | "answer" | "table" | "plain";
  content?: string;
  rows?: string[][];
}

let nodeSeq = 0;
function makeId(type: string) {
  return `${type}-${++nodeSeq}`;
}

function parseMarkup(input: string): ParsedNode[] {
  const lines = input.split("\n");
  const nodes: ParsedNode[] = [];
  let currentTable: string[][] | null = null;

  for (const line of lines) {
    if (line.startsWith("#ACTIVITY")) {
      if (currentTable) {
        nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
        currentTable = null;
      }
      nodes.push({
        id: makeId("activity"),
        type: "activity",
        content: line.replace("#ACTIVITY", "").trim(),
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
      if (currentTable)
        nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
      currentTable = [];
    } else if (line.startsWith("#ROW")) {
      const cols = line
        .replace("#ROW", "")
        .split("|")
        .map((c) => c.trim());
      if (currentTable) currentTable.push(cols);
      else currentTable = [cols];
    } else {
      if (currentTable) {
        nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
        currentTable = null;
      }
      if (line.trim())
        nodes.push({ id: makeId("plain"), type: "plain", content: line });
    }
  }
  if (currentTable)
    nodes.push({ id: makeId("table"), type: "table", rows: currentTable });
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

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const A4_MARGIN_PX = 56;

function buildPages(nodes: ParsedNode[]): ParsedNode[][] {
  const pages: ParsedNode[][] = [];
  let current: ParsedNode[] = [];
  for (const node of nodes) {
    if (node.type === "activity" && current.length > 0) {
      pages.push(current);
      current = [];
    }
    current.push(node);
  }
  if (current.length > 0) pages.push(current);
  return pages;
}

function renderNode(node: ParsedNode) {
  if (node.type === "activity") {
    return (
      <h1
        key={node.id}
        style={{
          fontSize: "20pt",
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: "12px",
          textTransform: "uppercase",
          borderBottom: "2px solid #333",
          paddingBottom: "8px",
        }}
      >
        ACTIVITY {node.content}
      </h1>
    );
  }
  if (node.type === "question") {
    return (
      <h2
        key={node.id}
        style={{
          fontSize: "13pt",
          fontWeight: "bold",
          marginTop: "16px",
          marginBottom: "6px",
        }}
      >
        {node.content}
      </h2>
    );
  }
  if (node.type === "answer" || node.type === "plain") {
    return (
      <p
        key={node.id}
        style={{
          fontSize: "11pt",
          lineHeight: 1.7,
          margin: "6px 0",
          paddingLeft: "12px",
          borderLeft: node.type === "answer" ? "3px solid #ddd" : "none",
        }}
      >
        {node.content}
      </p>
    );
  }
  if (node.type === "table" && node.rows) {
    return (
      <table
        key={node.id}
        style={{
          width: "100%",
          borderCollapse: "collapse",
          margin: "12px 0",
          fontSize: "11pt",
        }}
      >
        <tbody>
          {node.rows.map((row, ri) => (
            <tr key={`${node.id}-r${ri}`}>
              {row.map((cell, ci) => (
                <td
                  key={`${node.id}-r${ri}-c${ci}`}
                  style={{
                    border: "1px solid #999",
                    padding: "7px 10px",
                    textAlign: "center",
                    background:
                      ri === 0 ? "#f0f4ff" : ri % 2 === 0 ? "#fafafa" : "#fff",
                    fontWeight: ri === 0 ? "bold" : "normal",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return null;
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
      <div style={{ flex: 1 }}>{nodes.map((node) => renderNode(node))}</div>
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

function generatePDF(
  pages: ParsedNode[][],
  setIsDownloading: (v: boolean) => void,
) {
  if (pages.length === 0) return;
  setIsDownloading(true);
  try {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const MARGIN_L = 10;
    const MARGIN_T = 15;
    const PAGE_W = 190;
    const BOTTOM_LIMIT = 277;
    let y = MARGIN_T;
    let pageNum = 1;

    const stampPageNum = () => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Page ${pageNum}`, 105, 292, { align: "center" });
      doc.setTextColor(0);
    };

    const checkBreak = (need: number) => {
      if (y + need > BOTTOM_LIMIT) {
        stampPageNum();
        doc.addPage();
        pageNum++;
        y = MARGIN_T;
      }
    };

    const addWrapped = (
      text: string,
      size: number,
      style: "bold" | "normal",
      lh: number,
      indent = 0,
    ) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
      const lines: string[] = doc.splitTextToSize(text, PAGE_W - indent);
      for (const line of lines) {
        checkBreak(lh);
        doc.text(line, MARGIN_L + indent, y);
        y += lh;
      }
    };

    for (let pi = 0; pi < pages.length; pi++) {
      if (pi > 0) {
        stampPageNum();
        doc.addPage();
        pageNum++;
        y = MARGIN_T;
      }

      for (const node of pages[pi]) {
        if (node.type === "activity") {
          doc.setFontSize(18);
          doc.setFont("helvetica", "bold");
          const titleLines: string[] = doc.splitTextToSize(
            `ACTIVITY ${node.content ?? ""}`,
            PAGE_W,
          );
          for (const line of titleLines) {
            checkBreak(12);
            doc.text(line, 105, y, { align: "center" });
            y += 12;
          }
          doc.setLineWidth(0.5);
          doc.line(MARGIN_L, y, MARGIN_L + PAGE_W, y);
          y += 5;
        } else if (node.type === "question") {
          y += 3;
          addWrapped(node.content ?? "", 12, "bold", 9);
        } else if (node.type === "answer" || node.type === "plain") {
          addWrapped(node.content ?? "", 11, "normal", 7, 4);
        } else if (node.type === "table" && node.rows && node.rows.length > 0) {
          checkBreak(node.rows.length * 9 + 4);
          doc.autoTable({
            head: [node.rows[0]],
            body: node.rows.slice(1),
            startY: y,
            margin: { left: MARGIN_L, right: MARGIN_L },
            styles: {
              fontSize: 10,
              cellPadding: 3,
              halign: "center",
              lineColor: [153, 153, 153] as [number, number, number],
              lineWidth: 0.3,
            },
            headStyles: {
              fillColor: [220, 230, 255] as [number, number, number],
              textColor: 0,
              fontStyle: "bold",
            },
            alternateRowStyles: {
              fillColor: [250, 250, 250] as [number, number, number],
            },
            didDrawPage: (_data: unknown) => {
              const cur = doc.internal.getCurrentPageInfo().pageNumber;
              if (cur > pageNum) {
                for (let p = pageNum; p < cur; p++) {
                  doc.setPage(p);
                  doc.setFontSize(10);
                  doc.setFont("helvetica", "normal");
                  doc.setTextColor(120);
                  doc.text(`Page ${p}`, 105, 292, { align: "center" });
                  doc.setTextColor(0);
                }
                doc.setPage(cur);
                pageNum = cur;
              }
            },
          });
          y = (doc as any).lastAutoTable.finalY + 5;
        }
      }
    }

    stampPageNum();
    doc.save("Activity.pdf");
  } catch (err) {
    console.error(err);
    alert("PDF generation failed. Please try again.");
  } finally {
    setIsDownloading(false);
  }
}

export default function AutoPDFGenerator() {
  const [input, setInput] = useState("");
  const [pages, setPages] = useState<ParsedNode[][]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  function generate() {
    if (!input.trim()) return;
    nodeSeq = 0;
    const nodes = parseMarkup(input);
    setPages(buildPages(nodes));
  }

  const hasContent = pages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background">
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
            onClick={() => generatePDF(pages, setIsDownloading)}
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

      <div className="flex flex-1 min-h-0">
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
            onDoubleClick={() => generatePDF(pages, setIsDownloading)}
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
              <div id="preview-content" style={{ width: `${A4_WIDTH_PX}px` }}>
                {pages.map((pageNodes, idx) => (
                  <PageView
                    key={pageNodes[0]?.id ?? `page-${idx}`}
                    nodes={pageNodes}
                    pageNum={idx + 1}
                    totalPages={pages.length}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center py-2 text-xs text-muted-foreground bg-card border-t border-border shrink-0">
        Developed by Appu | 2026
      </footer>
    </div>
  );
}
