import { NextResponse } from "next/server";
import { getAllSermonsContent } from "@/lib/notion";

const MAX_CHARS_PER_SERMON = 3000; // ~750 tokens por sermão
const MAX_SERMONS = 5;             // máximo 5 sermões no contexto

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n\n[... conteúdo truncado ...]";
}

function buildSystem(sermons) {
  if (sermons.length === 0) {
    return `Você é o Assistente Teológico da Igreja Seara (Porto Alegre, RS).
Responda em português brasileiro com precisão teológica e tom pastoral.
Nenhum sermão foi encontrado. Informe o usuário para verificar a integração com o Notion.`;
  }

  // Pega apenas os N sermões mais recentes e trunca o conteúdo
  const recent = sermons.slice(0, MAX_SERMONS);
  const sermonsBlock = recent
    .map((s) => `### ${s.title}\n\n${truncate(s.content, MAX_CHARS_PER_SERMON)}`)
    .join("\n\n---\n\n");

  return `Você é o Assistente Teológico da Igreja Seara (Porto Alegre, RS).
Responda perguntas sobre os sermões, ensinamentos e teologia pregados na igreja.
Responda em português brasileiro com precisão teológica e tom pastoral.
Cite o sermão e os textos bíblicos sempre que relevante.

SERMÕES DISPONÍVEIS (${recent.length} de ${sermons.length}):

${sermonsBlock}`;
}

let cachedSermons = null;
let cacheTime = 0;

async function getSermons() {
  const now = Date.now();
  if (cachedSermons && now - cacheTime < 5 * 60 * 1000) return cachedSermons;
  cachedSermons = await getAllSermonsContent();
  cacheTime = now;
  return cachedSermons;
}

export async function POST(req) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages inválido" }, { status: 400 });
    }

    const sermons = await getSermons();
    const system  = buildSystem(sermons);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const reply = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
