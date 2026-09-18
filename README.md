# @pipeworx/openreview

OpenReview MCP — venue submissions + peer reviews for ML conferences (ICLR, NeurIPS, ICML, COLM, EMNLP, etc.). API v2.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

- `list_venues(query?, limit?, offset?)` — list active and historical venues
- `get_venue(group_id)` — group / venue metadata
- `list_submissions(venue_id, sort?, status?, limit?, offset?)` — papers submitted to a venue
- `get_note(id, details?)` — individual note (paper, review, comment, decision)
- `get_paper(forum_id)` — paper + all its threads (reviews, rebuttal, decision)
- `search_notes(query, content_field?, signature?, limit?, offset?)` — full-text search

## Auth

Public reads are keyless. Some endpoints (private invitations, restricted venues) need a token — optional:

- **Platform key (optional):** gateway env `PLATFORM_OPENREVIEW_TOKEN`
- **BYO (optional):** `?_apiKey=<token>` after logging in at openreview.net and grabbing a token

## Data source

`https://api2.openreview.net/` — v2 (also `https://api.openreview.net/` v1 for legacy venues).

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "openreview": {
      "url": "https://gateway.pipeworx.io/openreview/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/openreview/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Openreview data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/list_venues \
  -H 'Content-Type: application/json' \
  -d '{"query":"ICLR"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/list_venues`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
