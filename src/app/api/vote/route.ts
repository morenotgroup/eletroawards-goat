import { NextResponse } from "next/server";
import { EMPLOYEES } from "@/lib/data";
import { AWARD_CATEGORIES } from "@/lib/awards";
import { getSession, hashCpf } from "@/lib/security";
import { getVote, getVotingConfig, mergeVote } from "@/lib/store";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sessão expirada. Faça login novamente."
      },
      { status: 401 }
    );
  }

  const employee = EMPLOYEES.find((person) => hashCpf(person.cpf) === session.cpfHash);

  if (!employee) {
    return NextResponse.json(
      {
        ok: false,
        message: "Colaborador não localizado."
      },
      { status: 401 }
    );
  }

  const config = await getVotingConfig();
  const activeCategories = AWARD_CATEGORIES.filter(
    (category) => config.categories[category.id]
  );

  if (!activeCategories.length) {
    return NextResponse.json(
      {
        ok: false,
        message: "A votação não está aberta no momento."
      },
      { status: 403 }
    );
  }

  const existingRecord = await getVote(session.cpfHash);

  const pendingCategories = activeCategories.filter(
    (category) => !existingRecord?.votes?.[category.id]
  );

  if (!pendingCategories.length) {
    return NextResponse.json(
      {
        ok: false,
        alreadyVoted: true,
        message: "Os votos deste CPF já foram registrados para as categorias abertas."
      },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const votes = body.votes as Record<string, string | null>;

  if (!votes || typeof votes !== "object") {
    return NextResponse.json(
      {
        ok: false,
        message: "Votos inválidos."
      },
      { status: 400 }
    );
  }

  const votesToSave: Record<string, string | null> = {};
  const submittedCategoryIds: string[] = [];

  for (const category of pendingCategories) {
    const value = votes[category.id];

    if (!value || !category.nominees.includes(value)) {
      return NextResponse.json(
        {
          ok: false,
          message: `Selecione uma opção para ${category.title}.`
        },
        { status: 400 }
      );
    }

    votesToSave[category.id] = value;
    submittedCategoryIds.push(category.id);
  }

  const saved = await mergeVote({
    cpfHash: session.cpfHash,
    voterName: employee.name,
    voterEmail: employee.email,
    votes: votesToSave,
    submittedCategoryIds,
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json({
    ok: true,
    votes: saved.votes,
    submittedCategoryIds: saved.submittedCategoryIds
  });
}
