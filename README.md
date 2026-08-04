# @pipeworx/openreview

OpenReview MCP — venue submissions + peer reviews for ML conferences (ICLR, NeurIPS, ICML, COLM, EMNLP, etc.). API v2.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Openreview data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
