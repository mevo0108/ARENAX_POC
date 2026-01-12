import { useState } from "react";
import { createGame } from "../services/gamesApi";

export default function StartTournamentCard() {
  const [name, setName] = useState("ArenaX Demo Tournament");
  const [maxPlayers, setMaxPlayers] = useState(16);

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function onStart() {
    setStatus("loading");
    setError("");
    setResult(null);

  try {
  const payload = {
    externalApi: "leeches",
  };

  const data = await createGame(payload);
  setResult(data);
  setStatus("success");
} catch (e) {
  setError(e?.message || "Unknown error");
  setStatus("error");
}

  }

  return (
    <div className="card">
      <div className="card-inner">
        <h2 style={{ margin: 0, fontSize: 18 }}>Start Tournament</h2>
        <p style={{ marginTop: 8, color: "rgba(255,255,255,0.68)" }}>
          This button calls <code>POST /api/games</code>. Backend will map it to Lichess later.
        </p>

        <div className="hr" />

        <div className="form-row">
          <div>
            <label className="label">Tournament name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ArenaX Demo Tournament"
            />
          </div>

          <div>
            <label className="label">Max players</label>
            <input
              className="input"
              type="number"
              min={2}
              max={256}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            onClick={onStart}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Starting..." : "Start Tournament"}
          </button>

          <button
            className="btn"
            type="button"
            onClick={() => {
              setStatus("idle");
              setError("");
              setResult(null);
            }}
          >
            Reset
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          {status === "idle" && (
            <div className="alert">
              Tip: your backend requires authentication. If you haven’t logged in yet, this request
              may return 401.
            </div>
          )}

          {status === "success" && (
            <div className="alert success">
              ✅ Created successfully.
              <div style={{ marginTop: 10, opacity: 0.95 }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="alert error">
              ❌ Failed to start tournament: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
