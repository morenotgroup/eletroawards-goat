import { NextResponse } from "next/server";
import { clearAllVotes, storageMode } from "@/lib/store";

function authorized(request: Request) {
  const token = process.env.ADMIN_TOKEN;

  if (!token) return false;

  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const urlToken = new URL(request.url).searchParams.get("token");

  return auth === token || urlToken === token;
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

  const result = await clearAllVotes();

  return NextResponse.json({
    ok: true,
    ...result,
    storageMode: storageMode()
  });
}
