// src/pages/Lobby.jsx
import { Link } from "react-router-dom";

// Main lobby page after login
export default function Lobby() {
  return (
    <div className="container" style={{ minHeight: "100vh", paddingTop: 24 }}>
      <div style={{ width: "min(520px, 92vw)", margin: "0 auto" }}>
        <div style={{ marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.3 }}>
            ArenaX Lobby
          </div>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.68)" }}>
            Choose where you want to go
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <div style={{ display: "grid", gap: 12 }}>
              <Link className="btn btn-primary" to="/profile">
                Go to Profile
              </Link>

              <Link className="btn" to="/tournaments/new">
                Start a Tournament
              </Link>
            </div>

            <div style={{ marginTop: 14, color: "rgba(255,255,255,0.68)" }}>
              Next: show active tournaments, recent games, and quick stats.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
