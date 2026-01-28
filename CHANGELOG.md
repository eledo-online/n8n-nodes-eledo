# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-28

### Added

* Fully implemented **Generate PDF** operation using the Eledo `/Generate` API.
* Support for both **Guided Fields** input and **Raw JSON** input modes.
* Support for multiple output modes:
  * Binary file output (default, suitable for downstream file nodes)
  * Base64-encoded PDF output (for API, storage, or custom processing)
* Dynamic template loading via the Eledo `/List` endpoint.
* Dynamic schema loading via the Eledo `/Schema` endpoint to drive UI field selection.
* Robust runtime validation and defensive parsing of all Eledo API responses.
* Helper utilities for URL normalization, filename extraction, schema validation, and payload construction.
* Comprehensive in-code documentation describing API assumptions, design decisions, and edge cases.
* Internal API fixtures capturing real-world Eledo responses (errors and success cases) for future testing.

### Changed

* Refined request-building logic to reflect real Eledo API behavior discovered via live testing:
  * `templateVersion` is optional and sent only when explicitly enabled.
  * `file` is always sent over the wire; `null` is used for empty payloads.
* Improved handling of `Content-Disposition` headers based on observed production responses.
* Normalized input coercion rules to better align with Eledo’s partial-payload tolerance.

### Fixed

* Resolved issues related to conditional node parameters not being present at runtime.
* Fixed edge cases where requests were not sent due to missing or improperly resolved parameters.
* Eliminated dead or misleading helper logic discovered during real API validation.

### Notes

* This release represents the first **production-ready** version of the Eledo n8n node.
* Manual end-to-end testing against the live Eledo API has been completed.
* Unit tests are planned and will be introduced in a follow-up release (1.0.1) without breaking changes.

## [0.1.0] - 2025-12-18

### Added

* Initial n8n community node package scaffold for Eledo.
* Node + credentials metadata aligned with n8n conventions.
* Eledo node icons (light/dark) and shared icon assets.
* CI workflow (lint + build) via GitHub Actions.
* Project documentation (README) with installation, operations, credentials, compatibility, and resources.

### Notes

* This release is a baseline scaffold and has not yet been validated in a live n8n instance.

[1.0.0]: https://github.com/eledo-online/n8n-nodes-eledo/releases/tag/v1.0.0
[0.1.0]: https://github.com/eledo-online/n8n-nodes-eledo/releases/tag/v0.1.0
