# Smart PDF Generator

## Current State
Draft expired. Need to rebuild the Smart PDF Generator app from scratch based on conversation history.

## Requested Changes (Diff)

### Add
- Full Smart PDF Generator single-page app

### Modify
- N/A (rebuild)

### Remove
- N/A

## Implementation Plan

Build a single-page React app that:
1. Split-pane layout: textarea (left) + A4 preview (right)
2. Parses input tags: #ACTIVITY, #QUESTION, #ANSWER, #TABLE, #ROW
3. Preview: A4-styled white card with shadow, proper margins
4. PDF generation: jsPDF + jsPDF-AutoTable (fast, no html2canvas)
5. Each #ACTIVITY starts on new page in PDF
6. Page numbers at bottom center
7. Branding: title "Smart PDF Generator", footer "Developed by Appu | 2026"
8. Browser tab: "Smart PDF Generator - Developed by Appu"
9. Buttons: Preview + Download PDF
