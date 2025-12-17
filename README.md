# @eledo/n8n-nodes-eledo
![n8n](https://img.shields.io/badge/n8n-%3E%3D2.0-blue)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Eledo](https://img.shields.io/badge/Eledo-green.svg)](https://eledo.online/)
![Eledo PDF automation overview](https://github.com/user-attachments/assets/4327fbc2-78df-4ec7-b0ff-494b6128d1e7)

This is an official n8n community node for integrating [**Eledo**](https://eledo.online/) into n8n workflows.

**Eledo** is a document automation platform focused on generating and processing PDFs through configurable workflows and API-driven execution.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

This node focuses on [**PDF generation via the Eledo REST API**](https://eledo.online/documentation/api_reference).
While Eledo exposes multiple API endpoints, the node intentionally surfaces only the operation that is relevant for most automation workflows.

### Supported operations

#### Generate PDF

Generate a PDF document from a selected template and input data.

* Uses Eledo’s synchronous [**Generate**](https://eledo.online/documentation/api_reference/generate) REST endpoint
* Accepts structured input data
* Returns the generated PDF as binary data
* Handles API timeouts and error responses gracefully

This operation covers **the vast majority of real-world use cases** and is the primary integration point between n8n and Eledo.

---

### Internally used (not exposed to users)

The following API endpoints may be used internally by the node to improve user experience but are **not exposed as standalone operations**:

* [**List templates**](https://eledo.online/documentation/api_reference/list)
  Used to dynamically fetch available templates and populate a template selector in the node UI.

* [**Schema**](https://eledo.online/documentation/api_reference/schema)
  Used internally to understand template structure and validate input data.

---

### Not implemented (by design)

The following legacy or auxiliary API endpoints are **not implemented** in this node:

* [**Create File**](https://eledo.online/documentation/api_reference/create_file)
* [**Download**](https://eledo.online/documentation/api_reference/download)
* [**Profile**](https://eledo.online/documentation/api_reference/profile)

These endpoints support older, multi-step workflows or account introspection and are not required for modern, synchronous PDF generation scenarios.

---

> **Note**
> The operation set may expand in the future if additional Eledo API capabilities become publicly available or if strong use cases emerge.

## Credentials

Eledo uses **API key authentication**.

### Prerequisites

To use this node, you need:

1. An active [**Eledo account**](https://eledo.online/register)
2. An **API key** generated in your Eledo user profile

### Getting your API key

1. Log in to your Eledo account
2. Navigate to **Profile → API**
3. Copy your existing API key or generate a new one

### Setting up credentials in n8n

1. Create new credentials for **Eledo API**
2. Paste your API key into the **API Key** field
3. Save the credentials

The API key is sent using [**HTTP header authentication**](https://eledo.online/documentation/api_reference/authentication) and is required for all requests.

## Compatibility

This node is developed and tested against the **current stable version of n8n**.

- **Tested with**: n8n **2.0.3**
- **Minimum required version**: n8n **2.x**

Earlier versions of n8n may work, but are **not officially supported or tested**.

The node will be kept compatible with future n8n releases, and compatibility will be verified as new stable versions are published.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Eledo documentation](https://eledo.online/documentation)

