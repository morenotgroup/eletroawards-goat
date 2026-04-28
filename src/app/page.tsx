"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  LockKeyhole,
  Sparkles,
  Vote,
  ShieldCheck,
  Clock3
} from "lucide-react";
import {
  AWARD_CATEGORIES,
  LOGIN_LOGO,
  LEAGUE_LOGO,
  SUCCESS_MOTE
} from "@/lib/awards";

type Screen = "loading" | "login" | "vote" | "success" | "already" | "closed";

type SessionResponse = {
  authenticated: boolean;
  name?: string;
  voted?: boolean;
  votingOpen?: boolean;
  activeCategoryIds?: string[];
  pendingCategoryIds?: string[];
  votes?: Record<string, string | null>;
  storageMode?: string;
};

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";

  return "Boa noite";
}

function firstName(name?: string) {
  return (name || "").split(" ")[0] || "";
}

function cpfMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function initialVotes() {
  return Object.fromEntries(
    AWARD_CATEGORIES.map((category) => [category.id, ""])
  ) as Record<string, string | null>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [cpf, setCpf] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>([]);
  const [pendingCategoryIds, setPendingCategoryIds] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, string | null>>(initialVotes);

  const votableCategories = useMemo(() => {
    return AWARD_CATEGORIES.filter(
      (category) =>
        activeCategoryIds.includes(category.id) &&
        pendingCategoryIds.includes(category.id)
    );
  }, [activeCategoryIds, pendingCategoryIds]);

  const completed = useMemo(() => {
    const required = votableCategories.length;
    const done = votableCategories.filter((category) => votes[category.id]).length;

    return {
      required,
      done,
      percent: required ? Math.round((done / required) * 100) : 100
    };
  }, [votableCategories, votes]);

  function applySessionState(data: SessionResponse) {
    setName(data.name || "");
    setActiveCategoryIds(data.activeCategoryIds || []);
    setPendingCategoryIds(data.pendingCategoryIds || []);

    setVotes({
      ...initialVotes(),
      ...(data.votes || {})
    });

    if (!data.votingOpen) {
      setScreen("closed");
      return;
    }

    if (data.voted) {
      setScreen("already");
      return;
    }

    setScreen("vote");
  }

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: SessionResponse) => {
        if (!data.authenticated) {
          setScreen("login");
          return;
        }

        applySessionState(data);
      })
      .catch(() => setScreen("login"));
  }, []);

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cpf })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Não foi possível acessar a votação.");
      return;
    }

    applySessionState(data);
  }

  async function submitVotes() {
    setError("");

    const missing = votableCategories.find((category) => !votes[category.id]);

    if (missing) {
      setError(`Antes de finalizar, selecione uma opção em “${missing.title}”.`);

      document.getElementById(missing.id)?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      return;
    }

    setSaving(true);

    const response = await fetch("/api/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ votes })
    });

    const data = await response.json().catch(() => ({}));

    setSaving(false);

    if (response.status === 409 || data.alreadyVoted) {
      setScreen("already");
      return;
    }

    if (!response.ok) {
      setError(data.message || "Não foi possível computar os votos.");
      return;
    }

    setScreen("success");
  }

  return (
    <main className="shell">
      <section className="stage">
        <AnimatePresence mode="wait">
          {screen === "loading" && (
            <motion.div
              key="loading"
              className="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span />
            </motion.div>
          )}

          {screen === "login" && (
            <motion.div
              key="login"
              className="login-card"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <BrandStack />

              <form onSubmit={submitLogin} className="login-form">
                <label htmlFor="cpf">CPF</label>

                <div className="input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    id="cpf"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(event) => setCpf(cpfMask(event.target.value))}
                  />
                </div>

                {error && <p className="error">{error}</p>}

                <button className="primary-button" type="submit">
                  Acessar votação <ChevronRight size={18} />
                </button>
              </form>
            </motion.div>
          )}

          {screen === "vote" && (
            <motion.div
              key="vote"
              className="vote-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <header className="vote-header">
                <div className="vote-header-copy">
                  <img
                    className="corner-logo"
                    src={`/assets/eletro/${LOGIN_LOGO}`}
                    alt="EletroAwards 2026"
                  />

                  <p className="eyebrow">
                    <Sparkles size={15} /> EletroAwards 2026
                  </p>

                  <h1>
                    {greeting()}, {firstName(name)}.
                  </h1>

                  <p className="subtitle">
                    Vote na categoria complementar da temporada. Esta pergunta aceita apenas um voto.
                  </p>
                </div>

                <div className="progress-card">
                  <span>{completed.percent}%</span>
                  <p>
                    {completed.done}/{completed.required} pergunta aberta
                  </p>

                  <div className="progress-bar">
                    <i style={{ width: `${completed.percent}%` }} />
                  </div>
                </div>
              </header>

              <div className="award-grid single-award-grid">
                {votableCategories.map((category, index) => (
                  <motion.article
                    id={category.id}
                    className="category-card"
                    key={category.id}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.045 }}
                  >
                    <div className="category-head">
                      <div className="number">
                        {String(category.number).padStart(2, "0")}
                      </div>

                      <div>
                        <p>{category.area}</p>
                        <h2>{category.title}</h2>
                      </div>
                    </div>

                    <div className="nominees">
                      {category.nominees.map((nominee) => {
                        const selected = votes[category.id] === nominee;

                        return (
                          <button
                            key={nominee}
                            className={selected ? "nominee selected" : "nominee"}
                            onClick={() =>
                              setVotes((old) => ({
                                ...old,
                                [category.id]: nominee
                              }))
                            }
                            type="button"
                          >
                            <span>{nominee}</span>
                            <i>{selected ? <Check size={16} /> : <Vote size={15} />}</i>
                          </button>
                        );
                      })}
                    </div>
                  </motion.article>
                ))}
              </div>

              <div className="submit-dock">
                <div>
                  <strong>{completed.percent}% concluído</strong>
                  <span>Revise sua escolha antes de finalizar.</span>
                </div>

                <button
                  className="primary-button"
                  onClick={submitVotes}
                  disabled={saving}
                  type="button"
                >
                  {saving ? "Computando..." : "Finalizar votação"} <ShieldCheck size={18} />
                </button>
              </div>

              {error && <p className="error dock-error">{error}</p>}
            </motion.div>
          )}

          {screen === "success" && (
            <FinalCard
              title="Voto computado com sucesso."
              text="O(a) premiado(a) será conhecido(a) na Convenção EletroMidia 2026."
            />
          )}

          {screen === "already" && (
            <FinalCard
              title="Seu voto já foi registrado."
              text="Obrigado por participar do EletroAwards 2026. A votação deste CPF já consta como concluída."
            />
          )}

          {screen === "closed" && (
            <FinalCard
              icon="clock"
              title="Votação indisponível no momento."
              text="A pergunta ainda não foi liberada ou a votação está temporariamente fechada."
            />
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function BrandStack() {
  return (
    <div className="brand-stack">
      <img
        className="brand-logo"
        src={`/assets/eletro/${LOGIN_LOGO}`}
        alt="EletroAwards 2026"
      />

      <img
        className="theme-logo"
        src={`/assets/eletro/${LEAGUE_LOGO}`}
        alt="EletroLeague"
      />
    </div>
  );
}

function FinalCard({
  title,
  text,
  icon = "check"
}: {
  title: string;
  text: string;
  icon?: "check" | "clock";
}) {
  return (
    <motion.div
      className="final-card"
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      <BrandStack />

      <div className={icon === "check" ? "check-orb" : "check-orb clock-orb"}>
        {icon === "check" ? <Check size={36} /> : <Clock3 size={34} />}
      </div>

      <h1>{title}</h1>
      <p>{text}</p>

      <img
        className="mote"
        src={`/assets/eletro/${SUCCESS_MOTE}`}
        alt=""
      />
    </motion.div>
  );
}
