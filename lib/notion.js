import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Extrai texto de um bloco do Notion
function blockToText(block) {
  const richText = (arr) => (arr || []).map((t) => t.plain_text).join("");
  switch (block.type) {
    case "paragraph":       return richText(block.paragraph?.rich_text);
    case "heading_1":       return "# " + richText(block.heading_1?.rich_text);
    case "heading_2":       return "## " + richText(block.heading_2?.rich_text);
    case "heading_3":       return "### " + richText(block.heading_3?.rich_text);
    case "bulleted_list_item": return "- " + richText(block.bulleted_list_item?.rich_text);
    case "numbered_list_item": return "1. " + richText(block.numbered_list_item?.rich_text);
    case "quote":           return "> " + richText(block.quote?.rich_text);
    case "code":            return richText(block.code?.rich_text);
    default:                return "";
  }
}

// Lista as subpáginas (sermões) da pasta principal
export async function getSermonList(pageId) {
  const res = await notion.blocks.children.list({ block_id: pageId, page_size: 50 });
  return res.results
    .filter((b) => b.type === "child_page")
    .map((b) => ({ id: b.id, title: b.child_page.title }));
}

// Busca o conteúdo completo de um sermão
export async function getSermonContent(pageId) {
  const blocks = [];
  let cursor;

  // Paginação — sermões longos podem ter muitos blocos
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: cursor,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return blocks
    .map(blockToText)
    .filter(Boolean)
    .join("\n");
}

// Busca lista + conteúdo de todos os sermões (para incluir como contexto no LLM)
export async function getAllSermonsContent(pageId) {
  const list = await getSermonList(pageId);

  const sermons = await Promise.all(
    list.map(async (s) => {
      const content = await getSermonContent(s.id).catch(() => "(conteúdo indisponível)");
      return { id: s.id, title: s.title, content };
    })
  );

  return sermons;
}
