export default function StatCard({ title, value, hint }) {
  return (
    <div className="stat-card">
      <p className="stat-title">✨ {title}</p>
      <p className="stat-big">{value}</p>
      <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
        {hint}
      </p>
    </div>
  );
}
