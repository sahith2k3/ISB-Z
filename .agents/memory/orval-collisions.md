---
name: Orval path+query param naming collision
description: Why an OpenAPI operation combining a path param and a query param breaks Orval codegen with a TS2308 collision, and how to avoid it.
---

Orval's react-query generator names the merged params TS interface `<Op>Params` whenever an operation has query params, regardless of whether it also has path params. The Zod generator names the **path**-params schema `<Op>Params` and the **query**-params schema `<Op>QueryParams` only when an operation has both path and query params simultaneously.

Any operation combining a path param with a query param therefore produces a guaranteed name collision between the two generators (react-query's `<Op>Params` vs zod's `<Op>Params`). This is a general Orval quirk, not fixable via `$ref` naming tricks.

**How to apply:** When designing an OpenAPI spec that will run through both Orval generators (zod + react-query), avoid endpoints that mix a path param with a query param. Split them into separate path-only operations instead (e.g. `GET /things/{id}/schedule` for "today" and `GET /things/{id}/schedule/{date}` for an explicit date, rather than `GET /things/{id}/schedule?date=`).
