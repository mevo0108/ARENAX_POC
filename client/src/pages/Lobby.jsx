import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getActiveGames } from "../services/gamesApi";

// Lobby screen with active tournaments list
export default function Lobby() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  async function load() {
    setStatus("loading");
    setError("");

    try {
      const data = await getActiveGames();

      // Try multiple possible shapes to be resilient
      const list =
        data?.games ||
        data?.tournaments ||
        data?.items ||
        data?.data ||
        [];

      setItems(Array.isArray(list) ? list : []);
      setStatus("ready");
    } catch (e) {
      // If backend endpoint doesn't exist yet, we still want Lobby to work
      setError(e?.message || "Failed to load active tournaments");
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getTitle(t) {
    return t?.name || t?.title || "Tournament";
  }

  function getStatus(t) {
    return t?.status || t?.state || "active";
  }

  function getUrl(t) {
    return t?.lichessUrl || t?.playUrl || t?.url || "";
  }

  function getId(t) {
    return t?.id || t?._id || t?.gameId || "";
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
            Lobby
          </div>
        </div>

        {/* Actions */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-inner">
            <div style={{ display: "grid", gap: 10 }}>
              <Link className="btn btn-primary" to="/tournaments/new" style={{ width: "100%" }}>
                Create tournament
              </Link>

              <button className="btn" type="button" onClick={() => navigate("/profile")} style={{ width: "100%" }}>
                Go to Profile
              </button>

              <button className="btn" type="button" onClick={() => navigate("/wallet")} style={{ width: "100%" }}>
                Wallet
              </button>
            </div>
          </div>
        </div>

        {/* Active tournaments */}
        <div className="card">
          <div className="card-inner">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>Active tournaments</h2>

              <button className="btn" type="button" onClick={load} disabled={status === "loading"}>
                {status === "loading" ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            <div className="hr" />

            {status === "loading" ? (
              <div style={{ color: "rgba(255,255,255,0.68)" }}>Loading active tournaments…</div>
            ) : null}

            {status === "error" ? (
              <div className="alert error" style={{ marginTop: 12 }}>
                ❌ {error}
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
                    If your backend endpoint is not implemented yet, this is expected.
                  </div>
                </div>
              </div>
            ) : null}

            {status === "ready" && items.length === 0 ? (
              <div className="alert" style={{ marginTop: 12 }}>
                No active tournaments right now.
              </div>
            ) : null}

            {status === "ready" && items.length > 0 ? (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {items.slice(0, 10).map((t) => {
                  const title = getTitle(t);
                  const st = getStatus(t);
                  const url = getUrl(t);
                  const id = getId(t);

                  return (
                    <div
                      key={id || title}
                      style={{
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 14,
                        padding: 12,
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontWeight: 900 }}>{title}</div>
                        <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
                          Status: <b>{st}</b>
                        </div>
                      </div>

                      {url ? (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <a className="btn btn-primary" href={url} target="_blank" rel="noreferrer">
                            Open
                          </a>
                          <button
                            className="btn"
                            type="button"
                            onClick={() => navigator.clipboard.writeText(url)}
                          >
                            Copy link
                          </button>
                        </div>
                      ) : (
                        <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
                          No URL available yet.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {status === "ready" && items.length > 10 ? (
              <div style={{ marginTop: 10, color: "rgba(255,255,255,0.68)", fontSize: 13 }}>
                Showing first 10 items.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
