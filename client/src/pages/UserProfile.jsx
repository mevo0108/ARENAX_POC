import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StartTournamentCard from "../components/StartTournamentCard";
import { getProfile } from "../services/usersApi";

export default function UserProfile({ onLogout }) {
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Quick stats (UI-only placeholders for now)
  const [stats, setStats] = useState({
    walletBalance: 0,
    gamesCreated: 0,
    activeTournaments: 0,
    lastActivityAt: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setError("");

      try {
        const data = await getProfile();
        if (!cancelled) {
          setUser(data?.user || null);

          // Demo stats (replace with backend later)
          setStats({
            walletBalance: 150,
            gamesCreated: 3,
            activeTournaments: 1,
            lastActivityAt: new Date(),
          });

          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load profile");
          setStatus("error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const initials = useMemo(() => {
    const name = user?.username || user?.email || "U";
    return String(name).slice(0, 2).toUpperCase();
  }, [user]);

  function formatDate(d) {
    if (!d) return "—";
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

  if (status === "loading") {
    return (
      <div
        className="container"
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <div className="card" style={{ width: "min(680px, 92vw)" }}>
          <div className="card-inner">
            <h2 style={{ margin: 0, fontSize: 18 }}>Loading profile…</h2>
            <p style={{ marginTop: 8, color: "rgba(255,255,255,0.68)" }}>
              Fetching user data from <code>/api/users/profile</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        className="container"
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <div className="card" style={{ width: "min(680px, 92vw)" }}>
          <div className="card-inner">
            <h2 style={{ margin: 0, fontSize: 18 }}>Couldn’t load profile</h2>
            <div className="alert error" style={{ marginTop: 12 }}>
              ❌ {error}
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button className="btn" type="button" onClick={() => navigate("/lobby")}>
                Back to Lobby
              </button>

              <button className="btn" type="button" onClick={onLogout}>
                Logout
              </button>

              <button
                className="btn btn-primary"
                type="button"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // status === "ready"
  return (
    <div className="container" style={{ minHeight: "100vh", paddingTop: 26 }}>
      <div
        style={{
          width: "min(980px, 92vw)",
          margin: "0 auto",
          display: "grid",
          gap: 14,
        }}
      >
        {/* Header / Profile card */}
        <div className="card">
          <div
            className="card-inner"
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div
                className="avatar"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {initials}
              </div>

              <div>
                <h1 className="h1" style={{ margin: 0 }}>
                  {user?.username || "User"}
                </h1>
                <p className="sub" style={{ margin: "6px 0 0" }}>
                  {user?.email || ""}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" type="button" onClick={() => navigate("/lobby")}>
                Lobby
              </button>

              <button className="btn" type="button" onClick={() => navigate("/wallet")}>
                Wallet
              </button>

              <button className="btn btn-primary" type="button" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="card">
          <div className="card-inner">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>Quick stats</h2>

              <button className="btn" type="button" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>

            <div className="hr" />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)" }}>
                  Wallet balance
                </div>
                <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>
                  {stats.walletBalance}{" "}
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.68)" }}>
                    credits
                  </span>
                </div>
                <button
                  className="btn"
                  type="button"
                  onClick={() => navigate("/wallet")}
                  style={{ marginTop: 10, width: "100%" }}
                >
                  Open wallet
                </button>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)" }}>
                  Games created
                </div>
                <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>
                  {stats.gamesCreated}
                </div>
                <div style={{ marginTop: 10, color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
                  Total created via ArenaX
                </div>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)" }}>
                  Active tournaments
                </div>
                <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900 }}>
                  {stats.activeTournaments}
                </div>
                <div style={{ marginTop: 10, color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
                  Live right now
                </div>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.68)" }}>
                  Last activity
                </div>
                <div style={{ marginTop: 6, fontSize: 16, fontWeight: 900 }}>
                  {formatDate(stats.lastActivityAt)}
                </div>
                <div style={{ marginTop: 10, color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
                  Updated locally
                </div>
              </div>
            </div>

            {/* Responsive fallback for small screens */}
            <div style={{ marginTop: 10, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
              Note: These are demo values for now. We will connect them to the backend later.
            </div>
          </div>
        </div>

        {/* Main content: Start Tournament */}
        <StartTournamentCard />
      </div>
    </div>
  );
}
