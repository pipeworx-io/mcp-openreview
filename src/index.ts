interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * OpenReview MCP — ML conference submissions and reviews (API v2)
 *
 * Most data is public. Some objects (private invitations, anonymized
 * comments at certain venues) require a token; we accept BYO.
 *
 * Docs: https://docs.openreview.net/reference/api-v2
 */


const BASE = 'https://api2.openreview.net';

const tools: McpToolExport['tools'] = [
  {
    name: 'list_venues',
    description: 'List venue groups (conferences, workshops). Use the returned group id to query submissions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text filter on group id / name' },
        limit: { type: 'number', description: '1-1000 (default 50)' },
        offset: { type: 'number', description: '0-based offset' },
      },
    },
  },
  {
    name: 'get_venue',
    description: 'Venue (group) metadata by group id.',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: { type: 'string', description: 'Group id (e.g. "ICLR.cc/2024/Conference")' },
      },
      required: ['group_id'],
    },
  },
  {
    name: 'list_submissions',
    description: 'Papers submitted to a venue. Pass the venue group id as venue_id.',
    inputSchema: {
      type: 'object',
      properties: {
        venue_id: { type: 'string', description: 'Venue group id (e.g. "ICLR.cc/2024/Conference")' },
        sort: { type: 'string', description: 'cdate (creation date, default desc) | tmdate (modify date) | number' },
        limit: { type: 'number', description: '1-1000 (default 25)' },
        offset: { type: 'number', description: '0-based offset' },
      },
      required: ['venue_id'],
    },
  },
  {
    name: 'get_note',
    description: 'Single note — paper, review, comment, decision, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'OpenReview note id (e.g. "abc123XYZ")' },
        details: { type: 'string', description: 'Comma-sep extras: replies, original, revisions, edges' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_paper',
    description: 'Paper + all child notes (reviews, rebuttal, decision, metareview). Pass the forum id (= paper note id).',
    inputSchema: {
      type: 'object',
      properties: { forum_id: { type: 'string', description: 'Forum (paper) note id' } },
      required: ['forum_id'],
    },
  },
  {
    name: 'search_notes',
    description: 'Full-text search across OpenReview notes (papers, reviews, decisions) by query string; optionally restrict to a content field (e.g. title, abstract) or filter by author signature; returns matching note ids, titles, and venues.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text query' },
        content_field: { type: 'string', description: 'Restrict to a content field (e.g. "title", "abstract")' },
        signature: { type: 'string', description: 'Filter by signature group (e.g. author profile id)' },
        limit: { type: 'number', description: '1-1000 (default 25)' },
        offset: { type: 'number', description: '0-based offset' },
      },
      required: ['query'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  switch (name) {
    case 'list_venues': {
      // The canonical anonymous-accessible venue list is the members array
      // of the "venues" group (~4000 conferences/workshops).
      const data = (await orGet(apiKey, `/groups?id=venues`)) as {
        groups?: { members?: string[] }[];
      };
      const all = data.groups?.[0]?.members ?? [];
      const query = (args.query as string | undefined)?.toLowerCase();
      const filtered = query ? all.filter((id) => id.toLowerCase().includes(query)) : all;
      const offset = Math.max(0, (args.offset as number) ?? 0);
      const limit = Math.min(1000, Math.max(1, (args.limit as number) ?? 50));
      return { total: filtered.length, venues: filtered.slice(offset, offset + limit) };
    }
    case 'get_venue':
      return orGet(apiKey, `/groups?id=${encodeURIComponent(reqStr(args, 'group_id', '"ICLR.cc/2024/Conference"'))}`);
    case 'list_submissions': {
      const venueId = reqStr(args, 'venue_id', '"ICLR.cc/2024/Conference"');
      const params = new URLSearchParams({
        'content.venueid': venueId,
        sort: String(args.sort ?? 'cdate:desc'),
        limit: String(Math.min(1000, Math.max(1, (args.limit as number) ?? 25))),
        offset: String(Math.max(0, (args.offset as number) ?? 0)),
        details: 'replyCount',
      });
      return orGet(apiKey, `/notes?${params}`);
    }
    case 'get_note': {
      const params = new URLSearchParams({ id: reqStr(args, 'id', '"abc123XYZ"') });
      if (args.details) params.set('details', String(args.details));
      return orGet(apiKey, `/notes?${params}`);
    }
    case 'get_paper': {
      const forumId = reqStr(args, 'forum_id', '"abc123XYZ"');
      const params = new URLSearchParams({
        forum: forumId,
        details: 'replyCount,original',
        limit: '1000',
      });
      return orGet(apiKey, `/notes?${params}`);
    }
    case 'search_notes': {
      const params = new URLSearchParams({
        term: reqStr(args, 'query', '"transformer"'),
        type: 'all',
        limit: String(Math.min(1000, Math.max(1, (args.limit as number) ?? 25))),
        offset: String(Math.max(0, (args.offset as number) ?? 0)),
      });
      if (args.content_field) params.set('content', String(args.content_field));
      if (args.signature) params.set('group', String(args.signature));
      return orGet(apiKey, `/notes/search?${params}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function orGet(apiKey: string | undefined, path: string) {
  const url = `${BASE}${path}`;
  // A descriptive User-Agent — OpenReview's edge (Cloudflare) 403s the default
  // Workers fetch UA, which surfaced as "unauthorized" from the gateway even
  // though the endpoint is anonymous (works fine with a UA).
  const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': 'pipeworx-mcp-openreview/1.0 (+https://pipeworx.io)' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const res = await fetch(url, { headers });
  if (res.status === 401 || res.status === 403) throw new Error('OpenReview: unauthorized');
  if (res.status === 404) throw new Error('OpenReview: not found');
  if (res.status === 429) throw new Error('OpenReview: rate-limit (HTTP 429)');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenReview error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
