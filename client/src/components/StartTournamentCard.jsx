import { useMemo, useState } from "react";
import { createGame } from "../services/gamesApi";

export default function StartTournamentCard() {
  const [name, setName] = useState("ArenaX Tournament");

  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [lichessUrl, setLichessUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const canStart = useMemo(() => status !== "loading", [status]);

  async function onStart() {
    setStatus("loading");
    setError("");
    setLichessUrl("");
    setCopied(false);

    try {
      const payload = {
        // keep naming flexible; backend may expect externalApi/provider/etc.
       externalApi: "leeches"
,
        name,
      };

      const data = await createGame(payload);

      const url =
        data?.game?.lichessUrl ||
        data?.game?.playUrl ||
        data?.lichessUrl ||
        data?.playUrl ||
        "";

      if (!url) {
        // backend not ready yet (or returned different field)
        setStatus("success");
        return;
      }

      setLichessUrl(url);
      setStatus("success");

      // Optional auto-open:
      // window.location.assign(url);
    } catch (e) {
      setError(e?.message || "Something went wrong");
      setStatus("error");
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(lichessUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="card">
      <div className="card-inner">
        <h2 style={{ margin: 0, fontSize: 18 }}>Start a tournament</h2>
        <p style={{ marginTop: 6, color: "rgba(255,255,255,0.6)" }}>
          Generate a Lichess game link and share it with your friend.
        </p>

        <div className="hr" />

        <div style={{ marginBottom: 14 }}>
          <label className="label">Tournament name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ArenaX Tournament"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={onStart}
          disabled={!canStart}
          style={{ width: "100%" }}
        >
          {status === "loading" ? "Starting…" : "Start a tournament"}
        </button>

        {status === "error" && (
          <div className="alert error" style={{ marginTop: 12 }}>
            ❌ {error}
          </div>
        )}

        {status === "success" && lichessUrl && (
          <div className="alert success" style={{ marginTop: 12 }}>
            ✅ Link ready
            <div style={{ marginTop: 8, display: "grid", gap: 10 }}>
              <input className="input" readOnly value={lichessUrl} />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn" type="button" onClick={onCopy}>
                  {copied ? "Copied" : "Copy link"}
                </button>

                <a className="btn btn-primary" href={lichessUrl} target="_blank" rel="noreferrer">
                  Open in Lichess
                </a>
              </div>
            </div>
          </div>
        )}

        {status === "success" && !lichessUrl && (
          <div className="alert" style={{ marginTop: 12 }}>
            Created successfully, but no Lichess URL was returned yet.
          </div>
        )}
      </div>
    </div>
  );
}
