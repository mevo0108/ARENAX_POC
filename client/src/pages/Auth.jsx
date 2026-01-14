import { useState } from "react";
import { loginUser, registerUser } from "../services/authApi";

export default function Auth() {
  const [activeTab, setActiveTab] = useState("Login");

  // Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // UI status
  const [status, setStatus] = useState("idle"); // idle | loading
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function resetMessages() {
    setMessage("");
    setError("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    resetMessages();
    setStatus("loading");

    try {
      let data;

      if (activeTab === "Login") {
        data = await loginUser({ email: loginEmail, password: loginPassword });
      } else {
        data = await registerUser({
          username: regUsername,
          email: regEmail,
          password: regPassword,
        });
      }

      // Save JWT token for authenticated routes (games/profile)
      localStorage.setItem("token", data.token);

      setMessage(activeTab === "Login" ? "✅ Logged in!" : "✅ Account created!");
      // App.jsx will show UserProfile once token exists
    } catch (e2) {
      setError(e2?.message || "Unknown error");
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
        {/* Simple header */}
        <div style={{ marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.3 }}>ArenaX</div>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.68)" }}>
            Login or create an account to continue
          </div>
        </div>

        {/* Single card */}
        <div className="card">
          <div className="card-inner">
            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 16 }}>
              {["Login", "Register"].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tab ${activeTab === t ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab(t);
                    resetMessages();
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit}>
              {activeTab === "Register" && (
                <div style={{ marginBottom: 12 }}>
                  <label className="label">Username</label>
                  <input
                    className="input"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="shakedcrissy"
                    autoComplete="username"
                  />
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label className="label">Email</label>
                <input
                  className="input"
                  value={activeTab === "Login" ? loginEmail : regEmail}
                  onChange={(e) =>
                    activeTab === "Login" ? setLoginEmail(e.target.value) : setRegEmail(e.target.value)
                  }
                  placeholder="shaked@example.com"
                  autoComplete="email"
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  value={activeTab === "Login" ? loginPassword : regPassword}
                  onChange={(e) =>
                    activeTab === "Login"
                      ? setLoginPassword(e.target.value)
                      : setRegPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  autoComplete={activeTab === "Login" ? "current-password" : "new-password"}
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                style={{ width: "100%" }}
                disabled={status === "loading"}
              >
                {status === "loading"
                  ? "Please wait..."
                  : activeTab === "Login"
                  ? "Login"
                  : "Create account"}
              </button>

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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
