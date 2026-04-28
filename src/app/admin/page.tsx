"use client";

import { useMemo, useState } from "react";

type Category = {
  id: string;
  number: number;
  stage: 1 | 2;
  area: string;
  title: string;
  nominees: string[];
};

type Result = {
  id: string;
  number: number;
  stage: 1 | 2;
  category: string;
  area: string;
  active: boolean;
  total: number;
  counts: Record<string, number>;
};

type AdminData = {
  totalVoters: number;
  completeVoters: number;
  totalSubmittedVotes: number;
  totals: Result[];
  raw: unknown[];
  storageMode: string;
};

type ConfigData = {
  config: {
    categories: Record<string, boolean>;
    updatedAt: string;
    updatedBy?: string | null;
  };
  categories: Category[];
  storageMode: string;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [draftConfig, setDraftConfig] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const categoriesByStage = useMemo(() => {
    const categories = configData?.categories || [];

    return {
      stage1: categories.filter((category) => category.stage === 1),
      stage2: categories.filter((category) => category.stage === 2)
    };
  }, [configData]);

  async function load() {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const [resultsResponse, configResponse] = await Promise.all([
        fetch(`/api/admin/results?token=${encodeURIComponent(token)}`),
        fetch(`/api/admin/config?token=${encodeURIComponent(token)}`)
      ]);

      const resultsJson = await resultsResponse.json();
      const configJson = await configResponse.json();

      if (!resultsResponse.ok) {
        setError(resultsJson.message || "Acesso negado.");
        setLoading(false);
        return;
      }

      if (!configResponse.ok) {
        setError(configJson.message || "Não foi possível carregar as configurações.");
        setLoading(false);
        return;
      }

      setData(resultsJson);
      setConfigData(configJson);
      setDraftConfig(configJson.config.categories || {});
      setMessage("Painel carregado com sucesso.");
    } catch {
      setError("Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!configData) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/config?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          categories: draftConfig
        })
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message || "Não foi possível salvar as configurações.");
        setLoading(false);
        return;
      }

      setConfigData((old) =>
        old
          ? {
              ...old,
              config: json.config
            }
          : old
      );

      setMessage("Configurações da votação salvas com sucesso.");
      await load();
    } catch {
      setError("Não foi possível salvar as configurações.");
    } finally {
      setLoading(false);
    }
  }

  async function activateStage(stage: 1 | 2) {
    if (!configData) return;

    const next: Record<string, boolean> = {};

    for (const category of configData.categories) {
      next[category.id] = category.stage === stage;
    }

    setDraftConfig(next);
  }

  async function activateAll() {
    if (!configData) return;

    const next: Record<string, boolean> = {};

    for (const category of configData.categories) {
      next[category.id] = true;
    }

    setDraftConfig(next);
  }

  async function deactivateAll() {
    if (!configData) return;

    const next: Record<string, boolean> = {};

    for (const category of configData.categories) {
      next[category.id] = false;
    }

    setDraftConfig(next);
  }

  async function resetVotes() {
    const confirmation = window.prompt(
      "Essa ação apaga todos os votos salvos desta votação. Para confirmar, digite LIMPAR."
    );

    if (confirmation !== "LIMPAR") return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/reset?token=${encodeURIComponent(token)}`, {
        method: "POST"
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message || "Não foi possível limpar os votos.");
        setLoading(false);
        return;
      }

      setMessage(`Votos limpos com sucesso. Registros apagados: ${json.deleted}.`);
      await load();
    } catch {
      setError("Não foi possível limpar os votos.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "eletroawards-goat-2026-resultados.json";
    a.click();

    URL.revokeObjectURL(url);
  }

  function toggleCategory(categoryId: string) {
    setDraftConfig((old) => ({
      ...old,
      [categoryId]: !old[categoryId]
    }));
  }

  return (
    <main className="admin-shell">
      <section className="admin-card">
        <div className="admin-topline">
          <p className="eyebrow">EletroAwards 2026</p>
          <h1>Painel de apuração GOAT</h1>
          <p>
            Controle a abertura da pergunta complementar, acompanhe os resultados
            e exporte a apuração da categoria GOAT.
          </p>
        </div>

        <div className="admin-actions">
          <input
            placeholder="ADMIN_TOKEN"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />

          <button onClick={load} disabled={loading}>
            {loading ? "Carregando..." : "Carregar painel"}
          </button>

          {data && (
            <button onClick={download}>
              Exportar JSON
            </button>
          )}
        </div>

        {error && <p className="error admin-feedback">{error}</p>}
        {message && <p className="success-message admin-feedback">{message}</p>}

        {configData && (
          <section className="admin-section">
            <div className="admin-section-head">
              <div>
                <h2>Controle da votação</h2>
                <p>
                  Ative a pergunta GOAT para liberar a votação complementar aos colaboradores.
                </p>
              </div>

              <div className="config-actions">
                <button onClick={() => activateStage(1)}>Ativar GOAT</button>
                <button onClick={activateAll}>Ativar tudo</button>
                <button onClick={deactivateAll}>Fechar tudo</button>
              </div>
            </div>

            <div className="stage-config-grid single-config-grid">
              <CategoryToggleGroup
                title="Pergunta complementar"
                categories={categoriesByStage.stage1}
                draftConfig={draftConfig}
                onToggle={toggleCategory}
              />
            </div>

            <div className="admin-save-row">
              <div>
                <strong>Última atualização</strong>
                <span>
                  {configData.config.updatedAt
                    ? new Date(configData.config.updatedAt).toLocaleString("pt-BR")
                    : "Ainda não atualizada"}
                </span>
              </div>

              <button onClick={saveConfig} disabled={loading}>
                Salvar configuração
              </button>
            </div>
          </section>
        )}

        {data && (
          <section className="results">
            <div className="kpi-grid">
              <div className="kpi">
                <strong>{data.totalVoters}</strong>
                <span>votantes registrados</span>
                <small>Storage: {data.storageMode}</small>
              </div>

              <div className="kpi">
                <strong>{data.completeVoters}</strong>
                <span>votantes com a pergunta concluída</span>
                <small>Considera apenas a pergunta GOAT</small>
              </div>

              <div className="kpi">
                <strong>{data.totalSubmittedVotes}</strong>
                <span>votos computados no total</span>
                <small>Soma de votos da categoria</small>
              </div>
            </div>

            <div className="admin-danger-zone">
              <div>
                <h2>Limpeza de teste</h2>
                <p>
                  Use somente antes da abertura oficial ou para apagar testes.
                  Essa ação apaga votos, mas mantém as configurações da pergunta.
                </p>
              </div>

              <button onClick={resetVotes}>
                Limpar votos de teste
              </button>
            </div>

            {data.totals.map((result) => (
              <article key={result.id}>
                <div className="result-title-row">
                  <div>
                    <p>
                      Pergunta {String(result.number).padStart(2, "0")}
                    </p>
                    <h2>{result.category}</h2>
                    <span>{result.area} • {result.total} votos válidos</span>
                  </div>

                  <i className={result.active ? "status-pill active" : "status-pill"}>
                    {result.active ? "Aberta" : "Fechada"}
                  </i>
                </div>

                {Object.entries(result.counts).map(([name, count]) => (
                  <div className="bar" key={name}>
                    <span>{name}</span>
                    <i>
                      <b style={{ width: `${result.total ? (count / result.total) * 100 : 0}%` }} />
                    </i>
                    <em>{count}</em>
                  </div>
                ))}
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

function CategoryToggleGroup({
  title,
  categories,
  draftConfig,
  onToggle
}: {
  title: string;
  categories: Category[];
  draftConfig: Record<string, boolean>;
  onToggle: (categoryId: string) => void;
}) {
  return (
    <div className="config-panel">
      <h3>{title}</h3>

      <div className="config-list">
        {categories.map((category) => {
          const enabled = Boolean(draftConfig[category.id]);

          return (
            <button
              type="button"
              key={category.id}
              className={enabled ? "config-toggle active" : "config-toggle"}
              onClick={() => onToggle(category.id)}
            >
              <span>
                <strong>{String(category.number).padStart(2, "0")}</strong>
                <i>
                  {category.area}
                  <b>{category.title}</b>
                </i>
              </span>

              <em>{enabled ? "Ativa" : "Inativa"}</em>
            </button>
          );
        })}
      </div>
    </div>
  );
}
