// src/pages/StartTournament.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StartTournamentCard from "../components/StartTournamentCard";

// Dedicated page for starting a tournament
export default function StartTournament() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  // This callback will be used if StartTournamentCard supports it
  function handleCreated(url) {
    setMessage("✅ Tournament created!");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="container" style={{ minHeight: "100vh", paddingTop: 24 }}>
      <div style={{ width: "min(520px, 92vw)", margin: "0 auto" }}>
        <div style={{ marginBottom: 14, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.3 }}>
            Start a Tournament
          </div>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.68)" }}>
            Create a new tournament and get the Lichess URL
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            {/* If your StartTournamentCard does not accept props, you can remove onCreated */}
            <StartTournamentCard onCreated={handleCreated} />

            {message ? (
              <div className="alert success" style={{ marginTop: 12 }}>
                {message}
              </div>
            ) : null}

            <div style={{ marginTop: 12 }}>
              <button className="btn" type="button" onClick={() => navigate("/lobby")}>
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
