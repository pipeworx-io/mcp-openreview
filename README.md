# mcp-openreview

OpenReview MCP — ML conference submissions and reviews (API v2)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1163+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `list_venues` | List venue groups (conferences, workshops). Use the returned group id to query submissions. |
| `get_venue` | Venue (group) metadata by group id. |
| `list_submissions` | Papers submitted to a venue. Pass the venue group id as venue_id. |
| `get_note` | Single note — paper, review, comment, decision, etc. |
| `get_paper` | Paper + all child notes (reviews, rebuttal, decision, metareview). Pass the forum id (= paper note id). |
| `search_notes` | Full-text search across OpenReview notes (papers, reviews, decisions) by query string; optionally restrict to a content field (e.g. title, abstract) or filter by author signature; returns matching note ids, titles, and venues. |

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

Or connect to the full Pipeworx gateway for access to all 1163+ data sources:

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

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
