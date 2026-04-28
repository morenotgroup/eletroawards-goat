import { NextResponse } from "next/server";
import { AWARD_CATEGORIES } from "@/lib/awards";
import { getVotingConfig, saveVotingConfig, storageMode } from "@/lib/store";

function authorized(request: Request) {
  const token = process.env.ADMIN_TOKEN;

  if (!token) return false;

  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const urlToken = new URL(request.url).searchParams.get("token");

  return auth === token || urlToken === token;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Acesso negado."
      },
      { status: 401 }
    );
  }

  const config = await getVotingConfig();

  return NextResponse.json({
    ok: true,
    config,
    categories: AWARD_CATEGORIES,
    storageMode: storageMode()
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Acesso negado."
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const categories = body.categories as Record<string, boolean>;

  if (!categories || typeof categories !== "object") {
    return NextResponse.json(
      {
        ok: false,
        message: "Configuração inválida."
      },
      { status: 400 }
    );
  }

  const allowedIds = new Set(AWARD_CATEGORIES.map((category) => category.id));
  const normalized: Record<string, boolean> = {};

  for (const category of AWARD_CATEGORIES) {
    normalized[category.id] = Boolean(categories[category.id]);
  }

  for (const key of Object.keys(categories)) {
    if (!allowedIds.has(key)) {
      return NextResponse.json(
        {
          ok: false,
          message: `Categoria inválida: ${key}`
        },
        { status: 400 }
      );
    }
  }

  const config = await saveVotingConfig(normalized, "admin");

  return NextResponse.json({
    ok: true,
    config,
    storageMode: storageMode()
  });
}
