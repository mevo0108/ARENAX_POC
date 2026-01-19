import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Wallet screen (UI-only for now)
export default function Wallet() {
  const navigate = useNavigate();

  // Demo state (will be replaced by backend later)
  const [balance, setBalance] = useState(150);
  const [amount, setAmount] = useState("50");
  const [status, setStatus] = useState("idle"); // idle | loading
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const parsedAmount = useMemo(() => Number(amount), [amount]);

  const canSubmit = useMemo(() => {
    if (status === "loading") return false;
    if (!Number.isFinite(parsedAmount)) return false;
    if (parsedAmount <= 0) return false;
    return true;
  }, [status, parsedAmount]);

  function resetMessages() {
    setMessage("");
    setError("");
  }

  async function onDeposit() {
    resetMessages();
    if (!canSubmit) {
      setError("Please enter a valid amount.");
      return;
    }

    setStatus("loading");

    try {
      // Simulate async call
      await new Promise((r) => setTimeout(r, 600));
      setBalance((b) => b + parsedAmount);
      setMessage(`✅ Deposited ${parsedAmount} credits.`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setStatus("idle");
    }
  }

  async function onWithdraw() {
    resetMessages();
    if (!canSubmit) {
      setError("Please enter a valid amount.");
      return;
    }

    if (parsedAmount > balance) {
      setError("Insufficient balance.");
      return;
    }

    setStatus("loading");

    try {
      // Simulate async call
      await new Promise((r) => setTimeout(r, 600));
      setBalance((b) => b - parsedAmount);
      setMessage(`✅ Withdrew ${parsedAmount} credits.`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div
      className="container"
      style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}
    >
      <div style={{ width: "min(520px, 92vw)" }}>
        <div style={{ marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.3 }}>
            ArenaX
          </div>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.68)" }}>
            Wallet
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)" }}>
                  Current balance
                </div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {balance} <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.68)" }}>credits</span>
                </div>
              </div>

              <button className="btn" type="button" onClick={() => navigate("/profile")}>
                Back to Profile
              </button>
            </div>

            <div className="hr" />

            <div style={{ marginBottom: 12 }}>
              <label className="label">Amount</label>
              <input
                className="input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
                inputMode="numeric"
              />
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                Demo UI only. Backend integration will be added later.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                className="btn btn-primary"
                type="button"
                onClick={onDeposit}
                disabled={!canSubmit}
              >
                {status === "loading" ? "Processing…" : "Deposit"}
              </button>

              <button
                className="btn"
                type="button"
                onClick={onWithdraw}
                disabled={!canSubmit}
              >
                {status === "loading" ? "Processing…" : "Withdraw"}
              </button>
            </div>

            {error ? (
              <div className="alert error" style={{ marginTop: 12 }}>
                ❌ {error}
              </div>
            ) : null}

            {message ? (
              <div className="alert success" style={{ marginTop: 12 }}>
                {message}
              </div>
            ) : null}

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <button className="btn" type="button" onClick={() => navigate("/lobby")}>
                Go to Lobby
              </button>

              <button className="btn" type="button" onClick={() => navigate("/auth")}>
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
