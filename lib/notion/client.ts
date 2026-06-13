import { Client } from "@notionhq/client";

/**
 * Create a Notion client authenticated with a user's OAuth access token.
 */
export function createNotionClient(accessToken: string): Client {
  return new Client({ auth: accessToken });
}

// ------------------------------------------------------------
// OAuth helpers
// ------------------------------------------------------------

/**
 * Build the Notion OAuth authorize URL.
 * `state` is a CSRF token that must be echoed back and verified in the callback.
 * `redirectUri` is derived from the incoming request origin so it always matches
 * the domain the user is actually on (localhost in dev, the Vercel URL in prod).
 */
export function getNotionAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.NOTION_CLIENT_ID!,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

export interface NotionTokenResponse {
  access_token: string;
  workspace_id: string;
  workspace_name: string | null;
  workspace_icon: string | null;
  bot_id: string;
}

/**
 * Exchange an OAuth code for an access token via Notion's token endpoint.
 * `redirectUri` MUST be the exact same value used in getNotionAuthUrl.
 */
export async function exchangeNotionCode(
  code: string,
  redirectUri: string
): Promise<NotionTokenResponse> {
  const credentials = Buffer.from(
    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Notion token exchange failed: ${errText}`);
  }

  return (await res.json()) as NotionTokenResponse;
}

// ------------------------------------------------------------
// Database / page helpers
// ------------------------------------------------------------

export interface NotionDatabaseOption {
  id: string;
  title: string;
}

/**
 * List databases the integration has access to in the user's workspace.
 */
export async function listNotionDatabases(
  accessToken: string
): Promise<NotionDatabaseOption[]> {
  const notion = createNotionClient(accessToken);
  const response = await notion.search({
    filter: { property: "object", value: "database" },
    page_size: 100,
  });

  const databases: NotionDatabaseOption[] = [];
  for (const result of response.results) {
    const r = result as {
      object?: string;
      id?: string;
      title?: { plain_text?: string }[];
    };
    if (r.object !== "database" || !r.id) continue;
    const title =
      (r.title || []).map((t) => t.plain_text || "").join("") || "Untitled";
    databases.push({ id: r.id, title });
  }
  return databases;
}

/**
 * Find the first page the integration can access, to use as a parent
 * when creating a standalone page (e.g. quick notes).
 */
export async function findFirstAccessiblePage(
  accessToken: string
): Promise<string | null> {
  const notion = createNotionClient(accessToken);
  const response = await notion.search({
    filter: { property: "object", value: "page" },
    page_size: 1,
  });
  const first = response.results[0];
  return first ? first.id : null;
}

// ------------------------------------------------------------
// Block builders (Notion block objects)
// ------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Notion limits a single rich_text content to 2000 chars.
 * Split long text into multiple paragraph blocks.
 */
export function paragraphBlocks(text: string): any[] {
  if (!text) return [];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, 1900));
    remaining = remaining.slice(1900);
  }
  return chunks.map((chunk) => ({
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: chunk } }],
    },
  }));
}

export function headingBlock(text: string): any {
  return {
    object: "block",
    type: "heading_2",
    heading_2: {
      rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }],
    },
  };
}

export function todoBlock(text: string): any {
  return {
    object: "block",
    type: "to_do",
    to_do: {
      rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }],
      checked: false,
    },
  };
}

/**
 * Build the full list of blocks for a transcription Notion page.
 */
export function buildTranscriptionBlocks(opts: {
  englishText?: string | null;
  burmeseText?: string | null;
  summary?: string | null;
  actionItems?: string[];
}): any[] {
  const blocks: any[] = [];

  if (opts.englishText) {
    blocks.push(headingBlock("English Transcript"));
    blocks.push(...paragraphBlocks(opts.englishText));
  }

  if (opts.burmeseText) {
    blocks.push(headingBlock("မြန်မာ (Burmese)"));
    blocks.push(...paragraphBlocks(opts.burmeseText));
  }

  if (opts.summary) {
    blocks.push(headingBlock("Meeting Minutes"));
    blocks.push(...paragraphBlocks(opts.summary));
  }

  if (opts.actionItems && opts.actionItems.length > 0) {
    blocks.push(headingBlock("Action Items"));
    opts.actionItems.forEach((item) => blocks.push(todoBlock(item)));
  }

  return blocks;
}

/**
 * Create a Notion page. If a database id is provided, the page is created
 * inside that database (title prop = "Name"); otherwise it is created as a
 * child of a parent page id.
 */
export async function createNotionPage(opts: {
  accessToken: string;
  title: string;
  databaseId?: string | null;
  parentPageId?: string | null;
  blocks: any[];
}): Promise<string | null> {
  const notion = createNotionClient(opts.accessToken);

  const titleProperty = {
    title: [{ type: "text", text: { content: opts.title.slice(0, 1900) } }],
  };

  let parent: any;
  let properties: any;

  if (opts.databaseId) {
    parent = { database_id: opts.databaseId };
    // Database pages need a title property. We try "Name"; most templates use it.
    properties = { Name: titleProperty };
  } else if (opts.parentPageId) {
    parent = { page_id: opts.parentPageId };
    properties = { title: titleProperty.title };
  } else {
    return null;
  }

  const page = await notion.pages.create({
    parent,
    properties,
    // Notion accepts up to 100 children per create call
    children: opts.blocks.slice(0, 100),
  });

  return page.id;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
