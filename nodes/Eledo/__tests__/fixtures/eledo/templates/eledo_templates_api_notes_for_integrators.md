# Eledo Templates API – Notes for Integrators

This document summarizes **observed behavior** of the Eledo Templates API as encountered during real-world integration work. It is intended for **integrators and contributors**, not end users.

The notes below describe how the API behaves in practice, including edge cases that are not covered by official documentation.

Official documentation: https://eledo.online/documentation/api_reference/list

---

## Template Listing (`List` endpoint)

### Scope handling

- If no `scope` parameter is provided, the API returns **private templates only**.
- Using `scope=public` returns a much larger set of templates.
- This behavior is currently undocumented.

**Recommendation:** Always send `scope` explicitly.

---

### Limit parameter

Observed behavior:

- `limit=0` returns **all templates**.
- `limit < 0` is treated as `abs(limit)`.
- When `limit` is combined with `scope`, the `limit` parameter is ignored.
- `limit` works reliably only when used as the sole query parameter.

**Recommendation:**
- Avoid using `limit=0`.
- Apply client-side caps to prevent excessive results.

---

### Pagination

- Pagination parameters (`page` with `limit`) appear to have **no effect**.
- Requests with different page values return the same results.

**Recommendation:** Do not rely on server-side pagination.

---

## Query parameter validation

- Unknown query parameter names are **silently ignored**.
- Invalid values for known parameters trigger a server exception.

Notably:
- Error responses for invalid values may be returned as **HTML**, not JSON.

**Recommendation:** Validate parameters on the client side and treat non-JSON responses as errors.

---

## Response format

A typical successful response from the `List` endpoint:

```json
{
  "total": 2,
  "templates": [
    {
      "id": "...",
      "date": 1763113932000,
      "name": "Example Template",
      "thumbnailUrl": "https://...",
      "type": 0,
      "version": 1,
      "bulk": false
    }
  ]
}
```

Notes:
- The `total` field should not be used for pagination.
- The `templates` array shape has been stable in observed responses.

---

## Summary for integrators

When integrating with the Eledo Templates API:

- Always send explicit query parameters.
- Avoid relying on undocumented defaults.
- Do not assume pagination works.
- Be prepared to handle HTML error responses.

These notes reflect observed behavior and may change if the API is revised in the future.

