import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

function richTextToPlain(arr) {
  return (arr || []).map((t) => t.plain_text).join("");
}

function blockToText(block) {
  switch (block.type) {
    case "paragraph":            return richTextToPlain(block.paragraph?.rich_text);
    case "heading_1":            return "# " + richTextToPlain(block.heading_1?.rich_text);
    case "heading_2":            return "## " + richTextToPlain(block.heading_2?.rich_text);
    case "heading_3":            return "### " + richTextToPlain(block.heading_3?.rich_text);
    case "bulleted_list_item":   return "- " + richTextToPlain(block.bulleted_list_item?.rich_text);
    case "numbered_list_item":   return "1. " + richTextToPlain(block.numbered_list_item?.rich_text);
    case "quote":                return "> " + richTextToPlain(block.quote?.rich_text);
    case "code":                 return richTextToPlain(block.code?.rich_text);
    default:                     return "";
  }
}

// Busca todas as páginas que a integration tem acesso (sem depender do block ID pai)
export async function getSermonList() {
  const res = await notion.search({
    filter: { property: "object", value: "page" },
    sort: { direction: "descending", timestamp: "last_edited_time" },
    page_size: 50,
  });

  return res.results
    .filter((p) => {
      const title = p.properties?.title?.title?.[0]?.plain_text || "";
      return title.toLowerCase().includes("seara") || title.toLowerCase().includes("culto");
    })
    .map((p) => ({
      id: p.id,
      title: p.properties?.title?.title?.[0]?.plain_text || p.id,
    }));
}

// Busca o conteúdo completo de um sermão pelo ID da página
export async function getSermonContent(pageId) {
  const blocks = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: cursor,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return blocks.map(blockToText).filter(Boolean).join("\n");
}

// Busca lista + conteúdo de todos os sermões
export async function getAllSermonsContent() {
  const list = await getSermonList();
  const sermons = await Promise.all(
    list.map(async (s) => {
      const content = await getSermonContent(s.id).catch(() => "(conteúdo indisponível)");
      return { id: s.id, title: s.title, content };
    })
  );
  return sermons;
}
