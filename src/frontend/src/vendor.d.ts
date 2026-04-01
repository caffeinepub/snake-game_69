interface JsPDFInstance {
  addImage(
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): JsPDFInstance;
  addPage(): JsPDFInstance;
  text(text: string, x: number, y: number, options?: object): JsPDFInstance;
  setFontSize(size: number): JsPDFInstance;
  save(filename: string): void;
}

interface JsPDFConstructor {
  new (orientation?: string, unit?: string, format?: string): JsPDFInstance;
}

declare interface Window {
  jspdf: { jsPDF: JsPDFConstructor };
  html2canvas: (
    element: HTMLElement,
    options?: { scale?: number; useCORS?: boolean },
  ) => Promise<HTMLCanvasElement>;
}
