import { useMemo, useState } from "react";
import { createGame } from "../services/gamesApi";

const PRESETS = [
  { label: "Bullet (1+0)", preset: "bullet", initial: 1, increment: 0 },
  { label: "Bullet (2+1)", preset: "bullet", initial: 2, increment: 1 },

  { label: "Blitz (3+0)", preset: "blitz", initial: 3, increment: 0 },
  { label: "Blitz (5+0)", preset: "blitz", initial: 5, increment: 0 },
  { label: "Blitz (5+3)", preset: "blitz", initial: 5, increment: 3 },

  { label: "Rapid (10+0)", preset: "rapid", initial: 10, increment: 0 },
  { label: "Rapid (15+10)", preset: "rapid", initial: 15, increment: 10 },

  { label: "Classical (30+0)", preset: "classical", initial: 30, increment: 0 },
  { label: "Classical (30+20)", preset: "classical", initial: 30, increment: 20 },

  { label: "Custom", preset: "custom", initial: null, increment: null },
];

export default function StartTournamentCard() {
  const [name, setName] = useState("ArenaX Tournament");

  // Time control
  const [timeChoiceIndex, setTimeChoiceIndex] = useState(3); // default: Blitz (3+0)
  const selected = PRESETS[timeChoiceIndex];

  const [customInitial, setCustomInitial] = useState("10"); // minutes
  const [customIncrement, setCustomIncrement] = useState("0"); // seconds

  // UI status
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [lichessUrl, setLichessUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const canStart = useMemo(() => status !== "loading", [status]);

  // Validate and normalize time control
  const timeConfig = useMemo(() => {
    if (!selected) return null;

    if (selected.preset !== "custom") {
      return {
        timePreset: selected.preset,
        clockInitial: selected.initial, // minutes
        clockIncrement: selected.increment, // seconds
      };
    }

    const initial = Number(customInitial);
    const increment = Number(customIncrement);

    if (!Number.isFinite(initial) || initial <= 0) return { error: "Initial minutes must be a positive number." };
    if (!Number.isFinite(increment) || increment < 0) return { error: "Increment seconds must be 0 or greater." };

    return {
      timePreset: "custom",
      clockInitial: initial,
      clockIncrement: increment,
    };
  }, [selected, customInitial, customIncrement]);

  async function onStart() {
    setStatus("loading");
    setError("");
    setLichessUrl("");
    setCopied(false);

    // Handle validation error early
    if (timeConfig?.error) {
      setStatus("error");
      setError(timeConfig.error);
      return;
    }

    try {
      const payload = {
        // Keep naming flexible; backend may expect externalApi/provider/etc.
        externalApi: "lichess",
        name,

        // Time control params (backend will map them to Lichess settings later)
        timePreset: timeConfig.timePreset,
        clockInitial: timeConfig.clockInitial, // minutes
        clockIncrement: timeConfig.clockIncrement, // seconds
      };

      const data = await createGame(payload);

      const url =
        data?.game?.lichessUrl ||
        data?.game?.playUrl ||
        data?.lichessUrl ||
        data?.playUrl ||
        "";

      if (!url) {
        // Backend not ready yet (or returned a different field)
        setStatus("success");
        return;
      }

      setLichessUrl(url);
      setStatus("success");
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

        <div style={{ marginBottom: 12 }}>
          <label className="label">Tournament name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ArenaX Tournament"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="label">Time control</label>
          <select
            className="input"
            value={timeChoiceIndex}
            onChange={(e) => setTimeChoiceIndex(Number(e.target.value))}
          >
            {PRESETS.map((p, idx) => (
              <option key={p.label} value={idx}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {selected?.preset === "custom" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label className="label">Minutes</label>
              <input
                className="input"
                value={customInitial}
                onChange={(e) => setCustomInitial(e.target.value)}
                placeholder="10"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="label">Increment (sec)</label>
              <input
                className="input"
                value={customIncrement}
                onChange={(e) => setCustomIncrement(e.target.value)}
                placeholder="0"
                inputMode="numeric"
              />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 14, color: "rgba(255,255,255,0.68)" }}>
            Selected: <b>{selected.label}</b>
          </div>
        )}

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
