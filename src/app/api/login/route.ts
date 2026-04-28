import { NextResponse } from "next/server";
import { EMPLOYEES } from "@/lib/data";
import { AWARD_CATEGORIES } from "@/lib/awards";
import { createSession, hashCpf, onlyDigits, setSessionCookie } from "@/lib/security";
import { getVote, getVotingConfig, storageMode } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const cpf = onlyDigits(String(body.cpf || ""));

  const employee = EMPLOYEES.find((person) => onlyDigits(person.cpf) === cpf);

  if (!employee) {
    return NextResponse.json(
      {
        ok: false,
        message: "CPF não localizado na base de votação."
      },
      { status: 401 }
    );
  }

  const cpfHash = hashCpf(cpf);

  await setSessionCookie(createSession(cpf));

  const config = await getVotingConfig();
  const record = await getVote(cpfHash);

  const activeCategoryIds = AWARD_CATEGORIES
    .filter((category) => config.categories[category.id])
    .map((category) => category.id);

  const pendingCategoryIds = activeCategoryIds.filter(
    (categoryId) => !record?.votes?.[categoryId]
  );

  const votingOpen = activeCategoryIds.length > 0;
  const voted = votingOpen && pendingCategoryIds.length === 0;

  return NextResponse.json({
    ok: true,
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
