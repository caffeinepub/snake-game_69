# pdf genaretor

## Current State
Workspace is empty -- rebuilding from conversation history.

## Requested Changes (Diff)

### Add
- Full pdf genaretor app (single HTML page served via React shell)
- #ACTIVITY, #QUESTION, #ANSWER, #TABLE, #ROW tag parsing
- A4 split-pane layout: textarea input + styled preview
- jsPDF + jsPDF-AutoTable PDF generation (no html2canvas)
- Page numbers at bottom center
- Footer: Developed by Appu | 2026

### Modify
- N/A (new build)

### Remove
- N/A

## Implementation Plan
1. Generate Motoko backend (minimal)
2. Build React frontend with full PDF generator logic embedded
