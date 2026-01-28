# Eledo Generate Endpoint – Integration Notes

Official documentation: https://eledo.online/documentation/api_reference/generate

---

## Purpose of This Document

This document captures the **observed, real‑world behavior** of the Eledo **`/Generate`** endpoint as used by the n8n integration.

It supersedes the earlier placeholder and reflects **empirical validation via curl and node testing**, not just the public API description.

The Generate endpoint is the **core execution path** of the Eledo n8n node. Its behavior is highly sensitive to payload structure, so this document focuses on *what actually works*, not what is theoretically optional.

---

## Endpoint

`POST /Generate`

---

## Request Body – Observed Requirements

### Mandatory Fields

- **`templateId`** (string)
  - Always required
  - Requests without it fail

- **`file`** (object | null)
  - Despite documentation suggesting it may be optional, **real‑world testing shows that the field must be present**
  - `file: null` is accepted and successfully generates a PDF
  - Omitting the `file` property entirely can lead to API errors

**Conclusion:**

```json
{
  "templateId": "...",
  "file": null
}
```

is the minimal reliably working payload.

---

### Optional Fields

- **`templateVersion`** (number)
  - Truly optional
  - May be omitted
  - When present, must be a number

---

## File Object Semantics

When provided, `file` must be a **JSON object** whose keys correspond to template fields.

Observed properties:

- Partial payloads are valid
- Missing fields are accepted
- Validation is permissive
- Incorrect types may still render PDFs with missing values rather than failing

This permissiveness is intentionally leveraged by the n8n node.

---

## Input Modes in the n8n Node

The n8n integration supports two input strategies:

### 1. Guided Fields

- Values are collected via structured UI controls
- Only flat (top‑level) fields are supported
- Empty or invalid values are **omitted entirely**
- Results in a minimal `file` object

### 2. JSON Input

- User provides raw JSON
- JSON represents **the content of the `file` object only**
- The node wraps it into the full request body
- Empty JSON (`{}`) is normalized to `file: null`

---

## Response Behavior

### Success Response

- Content-Type: `application/pdf`
- Body: binary PDF data
- Headers include `Content-Disposition`

Example observed header:

```
content-disposition: attachment; filename="0_0.pdf"; filename*=UTF-8''0_0.pdf
```

### Filename Handling

- The API provides **two filename variants**:
  - `filename="..."`
  - `filename*=UTF-8''...`

- The integration extracts the filename using a tolerant regex
- Either variant may be matched depending on header order

---

### Error Response

- Content-Type: `application/json`
- Body: JSON error payload

The node detects this case explicitly and converts it into an `n8n` `NodeApiError` with preserved error details.

---

## Design Decisions in the Integration

- The node **always sends a `file` field** (object or null)
- Partial payloads are preferred over strict validation
- Validation is structural, not semantic
- Error handling is content‑type driven

This approach maximizes compatibility with real‑world template usage and avoids false negatives.

---

## Guiding Principle

> The Generate endpoint behaves more like a rendering engine than a strict API.
> The integration favors *successful PDF generation with partial data* over rigid correctness.

---

_Status: Validated – January 2026_

