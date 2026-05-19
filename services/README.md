# Services Folder Notes

This folder documents service-layer responsibilities for the portal.

## Service Boundaries
- Calculation service: deterministic financial formulas
- Validation service: required-field enforcement before report generation
- Report service: PDF generation and formatting

## Current Implementation Mapping
- Calculations: `src/utils/calculations.ts`
- Validation: `src/utils/validation.ts`
- PDF generation: `src/utils/pdf.ts`
