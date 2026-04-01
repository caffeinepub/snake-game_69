# pdf genaretor

## Current State
No frontend files exist -- workspace is empty. Need to rebuild the PDF Generator app from scratch.

## Requested Changes (Diff)

### Add
- Full single-page React app that replicates the pdf genaretor functionality
- Split-pane layout: textarea input on left, A4 preview on right
- Parse #ACTIVITY, #QUESTION, #ANSWER, #TABLE, #ROW tags from input
- A4-styled preview with shadows, proper margins
- PDF download using jsPDF + jsPDF-AutoTable (loaded via CDN script tags in index.html)
- Page numbers at bottom center of each PDF page
- Each #ACTIVITY starts on a new page in PDF
- Footer: "Developed by Appu | 2026"
- Browser tab title: "pdf genaretor"

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Update index.html to include jsPDF and jsPDF-AutoTable CDN scripts
2. Create App.tsx with split-pane layout, parsing logic, preview rendering, and PDF generation
3. Ensure jsPDF loaded via window.jspdf, guard with script load check
4. PDF generation: line-by-line jsPDF text rendering + autoTable for tables
5. Validate build passes
