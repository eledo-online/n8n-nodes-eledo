# Eledo Generate Endpoint – Successful Call Example

This document captures a **real, verified successful call** to the Eledo **`/Generate`** endpoint using `curl`.

It serves as a concrete reference example to complement the higher-level integration notes and is especially useful for:
- debugging
- regression testing
- validating client implementations (including the n8n node)

---

## Summary

- Endpoint: `POST /Generate`
- Result: **HTTP 200**
- Response type: `application/pdf`
- Payload: **binary PDF**

This example demonstrates the **minimal, valid payload** required to successfully generate a PDF.

---

## Valid Payload Variants (Observed)

The following request bodies are all accepted and result in a successful PDF generation:

```json
{"templateId":"6916fbcc97475512021a8399", "file": null}
```

```json
{"templateId":"6916fbcc97475512021a8399", "file": {}}
```

```json
{
  "templateId":"6916fbcc97475512021a8399",
  "templateVersion": 1,
  "file": null
}
```

Notes:
- `templateId` is always required
- `templateVersion` is optional
- `file` **must be present**, but may be `null` or an empty object

---

## curl Example

```bash
curl -i \
  -H "Content-Type: application/json" \
  -H "Api-Key: <redacted>" \
  -X POST https://eledo.online/api/RESTv1/Generate \
  --data '{"templateId":"6916fbcc97475512021a8399", "file": null}'
```

---

## Response Headers (Observed)

```
HTTP/2 200
vary: Accept-Encoding
content-type: application/pdf
content-disposition: attachment; filename="0_0.pdf"; filename*=UTF-8''0_0.pdf
content-length: 28015
strict-transport-security: max-age=31536000; includeSubDomains; preload;
```

Key observations:
- Response body is **binary PDF data**
- `Content-Disposition` contains **two filename variants**:
  - `filename="0_0.pdf"`
  - `filename*=UTF-8''0_0.pdf`

Clients should be tolerant when extracting the filename.

---

## Important curl Note

When calling this endpoint manually:

```
Warning: Binary output can mess up your terminal.
```

To avoid terminal corruption, redirect output to a file:

```bash
--output output.pdf
```

---

## Where to Find Template-Specific Payloads

For concrete field-level payload examples:

1. Log into your Eledo account
2. Select a template
3. Open the **API** menu
4. Copy the generated payload example

These payloads represent the exact structure expected for that template’s `file` object.

---

_Status: Verified – January 2026_

