import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Wallet screen (UI-only for now) with transaction history
export default function Wallet() {
  const navigate = useNavigate();

  // Demo balance (will be replaced by backend later)
  const [balance, setBalance] = useState(150);
  const [amount, setAmount] = useState("50");
  const [status, setStatus] = useState("idle"); // idle | loading
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Demo transaction history
  const [transactions, setTransactions] = useState([
    { id: "tx_001", type: "deposit", amount: 100, at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
    { id: "tx_002", type: "withdraw", amount: 25, at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) },
    { id: "tx_003", type: "deposit", amount: 75, at: new Date(Date.now() - 1000 * 60 * 30) },
  ]);

  const parsedAmount = useMemo(() => Number(amount), [amount]);

  const canSubmit = useMemo(() => {
    if (status === "loading") return false;
    if (!Number.isFinite(parsedAmount)) return false;
    if (parsedAmount <= 0) return false;
    return true;
  }, [status, parsedAmount]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => b.at.getTime() - a.at.getTime());
  }, [transactions]);

  function resetMessages() {
    setMessage("");
    setError("");
  }

  function formatDate(d) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return String(d);
    }
  }

  function addTransaction(type, amt) {
    // Create a simple unique id (good enough for UI demo)
    const id = `tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const tx = { id, type, amount: amt, at: new Date() };
    setTransactions((prev) => [tx, ...prev]);
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
      addTransaction("deposit", parsedAmount);

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
      addTransaction("withdraw", parsedAmount);

      setMessage(`✅ Withdrew ${parsedAmount} credits.`);
    } catch {
      setError("Something went wrong.");
    } finally {
      setStatus("idle");
    }
  }

  function onClearHistory() {
    resetMessages();
    setTransactions([]);
    setMessage("✅ Transaction history cleared.");
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
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)" }}>
                  Current balance
                </div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>
                  {balance}{" "}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.68)",
                    }}
                  >
                    credits
                  </span>
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
              <div
                style={{
                  marginTop: 6,
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 13,
                }}
              >
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

            <div className="hr" />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Transaction history</h3>

              <button className="btn" type="button" onClick={onClearHistory} disabled={transactions.length === 0}>
                Clear
              </button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {sortedTransactions.length === 0 ? (
                <div className="alert" style={{ marginTop: 2 }}>
                  No transactions yet.
                </div>
              ) : (
                sortedTransactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 14,
                      padding: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 800 }}>
                        {tx.type === "deposit" ? "Deposit" : "Withdraw"}
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
                        {formatDate(tx.at)}
                      </div>
                    </div>

                    <div style={{ fontWeight: 900 }}>
                      {tx.type === "deposit" ? "+" : "-"}
                      {tx.amount}{" "}
                      <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.68)" }}>
                        credits
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <button className="btn" type="button" onClick={() => navigate("/lobby")}>
                Go to Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
