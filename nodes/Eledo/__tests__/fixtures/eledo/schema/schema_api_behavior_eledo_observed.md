# Eledo Schema API – Observed Behavior

**Location:** `fixtures/eledo/schema`

This document captures *observed, real-world behavior* of the Eledo **Schema** endpoint as encountered during development of the n8n Eledo node. The purpose is defensive integration design and reproducibility — not restating official documentation.

Official documentation: https://eledo.online/documentation/api_reference/schema

---

## Endpoint

`GET /Schema/{template_id}/{template_version}`

Optional query parameters:
- `schemaType`

---

## Observed Behavior

### Template Version Handling

- If **template version is not specified**, the **latest version** of the template is returned.
- **Version `0` is accepted** as a parameter, but results in a JSON error:
  - `{"message": "Template not found."}`
- **Negative version numbers** are accepted and treated as `abs(version)`.
- **Version numbers higher than the current template version** also return:
  - `{"message": "Template not found."}`

---

### Schema Type Handling

- **Default schema type** (when not specified) is `zapier`.
- **Invalid `schemaType` values** do **not** trigger an error.
  - Instead, Eledo silently falls back to the `zapier` schema.
- Any **other schema types**, if they exist, are **undocumented**.

**Integration decision:**
- The n8n node will **always explicitly request** `schemaType=zapier` to avoid future breaking changes if defaults are altered server-side.

---

## Error Handling Notes

- Errors are returned as JSON for invalid versions ("Template not found").
- No strict validation is performed for negative or invalid numeric values.
- Behavior is permissive rather than strict, requiring defensive handling in integrations.

---

## Rationale for Capturing This

These behaviors are:
- Not fully documented
- Non-standard (e.g. negative numbers, silent fallbacks)
- Critical for building a stable integration

Storing them as fixtures ensures:
- Predictable behavior
- Easier debugging
- Protection against undocumented API changes

---

_Last updated: 29 Dec 2025_

