import { useState } from "react";
import StatCard from "../components/StatCard";
import StartTournamentCard from "../components/StartTournamentCard";

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("Overview");

  // Demo user (later can come from backend)
  const user = {
    name: "Dani Cohen",
    username: "@danicohen",
    email: "dani@example.com",
    lichess: "Connected",
    avatarLetters: "DC",
  };

  return (
    <div className="container">
      <div className="topbar">
        <div className="icon-dot">☰</div>
        <div className="icon-dot">🔔</div>
        <div className="icon-dot">⚙️</div>
      </div>

      {/* Profile Hero */}
      <div className="card profile-hero">
        <div className="card-inner">
          <div className="profile-row">
            <div className="avatar">{user.avatarLetters}</div>

            <div>
              <h1 className="h1">{user.name}</h1>
              <p className="sub">
                {user.username} • {user.email}
              </p>

              <div className="badges">
                <span className="badge">♟️ Lichess: {user.lichess}</span>
                <span className="badge">🏆 Organizer</span>
                <span className="badge">📍 ArenaX Demo</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn">Edit Profile</button>
              <button className="btn btn-primary">Share</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs" style={{ marginTop: 18 }}>
            {["Overview", "Tournaments", "Statistics", "Settings"].map((t) => (
              <button
                key={t}
                className={`tab ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid">
        {/* Left column: Stats */}
        <div style={{ display: "grid", gap: 14 }}>
          <StatCard title="Skill Level" value="Intermediate" hint="Based on recent performance" />
          <StatCard title="Tournaments" value="12" hint="Created & joined" />
          <StatCard title="Win Rate" value="58%" hint="Last 30 games" />
        </div>

        {/* Right column: Overview / Start */}
        <div style={{ display: "grid", gap: 14 }}>
          <div className="card">
            <div className="card-inner">
              <h2 style={{ margin: 0, fontSize: 18 }}>Overview</h2>
              <p style={{ marginTop: 8, color: "rgba(255,255,255,0.68)" }}>
                This is a demo user profile screen for ArenaX. From here you can start a tournament
                using the backend endpoint <code>/api/games</code>. The backend will later map this
                action to Lichess tournament creation.
              </p>

              <div className="hr" />

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="pill">✅ API secured (auth + rate limit)</span>
                <span className="pill">🔌 Lichess integration in progress</span>
                <span className="pill">🧩 Frontend ready for demo</span>
              </div>
            </div>
          </div>

          <StartTournamentCard />
        </div>
      </div>
    </div>
  );
}
