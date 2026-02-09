# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2026-02-09

### Added

* Added itemIndex to the output file object

### Notes

* This is a **non-breaking** release.
* It ensures full compliance with n8n requirements.

## [1.0.2] - 2026-02-09

### Added

* Explicit request identification via a custom `X-ELEDO-SOURCE` HTTP header (`n8n-community-node`) on authenticated API calls.
* Centralized constant for the Eledo source header to ensure consistent identification across all relevant requests.

### Changed

* Refactored request header handling to avoid duplication and ensure predictable behavior across n8n runtime and credential test requests.
* Minor internal cleanup related to request construction following backend coordination discussions.

### Notes

* This is a **non-breaking** release.
* The added header is intended for backend routing, monitoring, and statistical purposes only.
* If future backend changes require adjustments, the implementation can be updated without affecting node users.
* This release introduces no functional changes to node behavior or API payloads.

## [1.0.1] - 2026-01-31

### Added

* Comprehensive **unit test suite** covering core helpers, `/List`, `/Schema`, and `/Generate` execution paths.
* Automated **code coverage reporting** via Vitest and Codecov, including CI integration and public coverage badge.
* Test fixtures capturing real-world Eledo API payloads (success and error cases) to document undocumented behavior and prevent regressions.

### Changed

* Updated Generate operation binary output key from `binary.pdf` to `binary.document` to better align with n8n conventions and downstream node expectations.
* Refined internal test and fixture organization to keep published npm artifacts lean while preserving full internal coverage.

### Notes

* This is a **non-breaking** quality-focused release.
* No runtime behavior changes for end users beyond the binary output key rename.
* The node now ships with production-grade automated validation of all documented API contracts.

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

## [0.1.0] - 2025-12-18

### Added

* Initial n8n community node package scaffold for Eledo.
* Node + credentials metadata aligned with n8n conventions.
* Eledo node icons (light/dark) and shared icon assets.
* CI workflow (lint + build) via GitHub Actions.
* Project documentation (README) with installation, operations, credentials, compatibility, and resources.

### Notes

* This release is a baseline scaffold and has not yet been validated in a live n8n instance.

[1.0.3]: https://github.com/eledo-online/n8n-nodes-eledo/releases/tag/v1.0.3
[1.0.2]: https://github.com/eledo-online/n8n-nodes-eledo/releases/tag/v1.0.2
[1.0.1]: https://github.com/eledo-online/n8n-nodes-eledo/releases/tag/v1.0.1
[1.0.0]: https://github.com/eledo-online/n8n-nodes-eledo/releases/tag/v1.0.0
[0.1.0]: https://github.com/eledo-online/n8n-nodes-eledo/releases/tag/v0.1.0
