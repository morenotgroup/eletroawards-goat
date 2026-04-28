import { NextResponse } from "next/server";
import { AWARD_CATEGORIES } from "@/lib/awards";
import { getAllVotes, getVotingConfig, storageMode } from "@/lib/store";

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

  const votes = await getAllVotes();
  const config = await getVotingConfig();

  const activeCategoryIds = AWARD_CATEGORIES
    .filter((category) => config.categories[category.id])
    .map((category) => category.id);

  const totals = AWARD_CATEGORIES.map((category) => {
    const counts: Record<string, number> = {};

    for (const nominee of category.nominees) {
      counts[nominee] = 0;
    }

    for (const vote of votes) {
      const selected = vote.votes[category.id];

      if (selected) {
        counts[selected] = (counts[selected] || 0) + 1;
      }
    }

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    return {
      id: category.id,
      number: category.number,
      stage: category.stage,
      category: category.title,
      area: category.area,
      active: Boolean(config.categories[category.id]),
      total,
      counts
    };
  });

  const totalSubmittedVotes = totals.reduce((sum, item) => sum + item.total, 0);

  const completeVoters = votes.filter((vote) =>
    AWARD_CATEGORIES.every((category) => Boolean(vote.votes[category.id]))
  ).length;

  return NextResponse.json({
    ok: true,
    storageMode: storageMode(),
    totalVoters: votes.length,
    completeVoters,
    totalSubmittedVotes,
    activeCategoryIds,
    config,
    totals,
    raw: votes
  });
}
