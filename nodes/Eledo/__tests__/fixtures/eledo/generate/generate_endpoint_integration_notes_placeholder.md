# Generate Endpoint – Integration Notes (Placeholder)

Official documentation: https://eledo.online/documentation/api_reference/generate

---

## Purpose of This Document

This document serves as a **placeholder and integration anchor** for the Eledo **Generate** endpoint. It intentionally does not attempt to fully document request/response behavior yet.

The Generate endpoint is the **core execution path** of the n8n Eledo node. Unlike List or Schema, its behavior depends heavily on **payload correctness**, which is under the responsibility of the integration.

---

## Endpoint

`POST /Generate`

Referenced documentation:
- Eledo official API documentation (Generate section)

---

## Current Integration Scope

At this stage:

- The node will construct the payload internally
- Payload structure will be derived from:
  - Template selection
  - Default schema
  - Integration-defined transformation rules

The goal is to **shield users from raw API mechanics** while preserving full flexibility.

---

## Why This Is Deferred

Unlike other endpoints:

- Generate behavior is **payload-sensitive**
- Valid and invalid cases depend on:
  - Schema interpretation
  - Field types
  - Nested object/array correctness

Attempting to document Generate behavior before payload generation is finalized would be misleading.

---

## Planned Additions

This document will be extended with:

- Valid payload examples
- Common invalid payload cases
- Observed error responses
- Binary vs JSON response handling
- Timeout and failure behavior

Each addition will be backed by **real fixtures** gathered during integration work.

---

## Guiding Principle

> The Generate endpoint is treated as an execution engine.
> Correctness is enforced *before* the request is sent.

This keeps error handling predictable and user experience stable.

---

_Status: Placeholder — to be expanded during Generate integration._

