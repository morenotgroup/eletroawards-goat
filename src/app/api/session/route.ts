import { NextResponse } from "next/server";
import { EMPLOYEES } from "@/lib/data";
import { AWARD_CATEGORIES } from "@/lib/awards";
import { getSession, hashCpf } from "@/lib/security";
import { getVote, getVotingConfig, storageMode } from "@/lib/store";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      storageMode: storageMode()
    });
  }

  const employee = EMPLOYEES.find((person) => hashCpf(person.cpf) === session.cpfHash);

  if (!employee) {
    return NextResponse.json({
      authenticated: false,
      storageMode: storageMode()
    });
  }

  const config = await getVotingConfig();
  const record = await getVote(session.cpfHash);

  const activeCategoryIds = AWARD_CATEGORIES
    .filter((category) => config.categories[category.id])
    .map((category) => category.id);

  const pendingCategoryIds = activeCategoryIds.filter(
    (categoryId) => !record?.votes?.[categoryId]
  );

  const votingOpen = activeCategoryIds.length > 0;
  const voted = votingOpen && pendingCategoryIds.length === 0;

  return NextResponse.json({
    authenticated: true,
    name: employee.name,
    email: employee.email,
    voted,
    votingOpen,
    activeCategoryIds,
    pendingCategoryIds,
    votes: record?.votes || {},
    storageMode: storageMode()
  });
}
