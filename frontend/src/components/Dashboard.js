import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const RISK_COLORS = {
  LOW: "#2ecc71",
  MEDIUM: "#f39c12",
  HIGH: "#e67e22",
  "VERY HIGH": "#e74c3c",
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [statsRes, modelRes] = await Promise.all([
        fetch(`${API_URL}/stats`),
        fetch(`${API_URL}/model-info`),
      ]);
      setStats(await statsRes.json());
      setModelInfo(await modelRes.json());
      setError(null);
    } catch (e) {
      setError("Cannot connect to backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">⏳ Loading dashboard...</div>;
  if (error)   return <div className="error-box">{error}</div>;

  const pieData = Object.entries(stats.risk_distribution).map(([name, value]) => ({
    name, value,
  }));

  const barData = [
    { name: "Approved", value: stats.total_approved, fill: "#2ecc71" },
    { name: "Rejected", value: stats.total_rejected, fill: "#e74c3c" },
  ];

  return (
    <div className="dashboard">
      {/* Model Info Banner */}
      {modelInfo && (
        <div className="model-banner">
          <div className="model-badge">🤖 {modelInfo.model_name}</div>
          <div className="model-metric">ROC-AUC: <strong>{modelInfo.roc_auc}</strong></div>
          <div className="model-metric">Threshold: <strong>{modelInfo.threshold}</strong></div>
          <div className="model-metric">Features: <strong>{modelInfo.num_features}</strong></div>
          <div className="model-dataset">{modelInfo.dataset}</div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">📋</div>
          <div className="kpi-value">{stats.total_predictions}</div>
          <div className="kpi-label">Total Predictions</div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon">✅</div>
          <div className="kpi-value">{stats.total_approved}</div>
          <div className="kpi-label">Approved</div>
        </div>
        <div className="kpi-card kpi-red">
          <div className="kpi-icon">❌</div>
          <div className="kpi-value">{stats.total_rejected}</div>
          <div className="kpi-label">Rejected</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📈</div>
          <div className="kpi-value">{(stats.approval_rate * 100).toFixed(1)}%</div>
          <div className="kpi-label">Approval Rate</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">⚠️</div>
          <div className="kpi-value">{(stats.avg_default_probability * 100).toFixed(1)}%</div>
          <div className="kpi-label">Avg Default Prob</div>
        </div>
      </div>

      {/* Charts */}
      {stats.total_predictions > 0 ? (
        <div className="charts-grid">
          {/* Pie — Risk Distribution */}
          <div className="chart-card">
            <h3>Risk Level Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name"
                     cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #30363d", color: "#fff" }} />
                <Legend formatter={(v) => <span style={{ color: "#ccc" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar — Approve vs Reject */}
          <div className="chart-card">
            <h3>Approve vs Reject</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="name" tick={{ fill: "#ccc" }} />
                <YAxis tick={{ fill: "#ccc" }} />
                <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #30363d", color: "#fff" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="empty-charts">
          <p>📊 Charts will appear after you make your first prediction.</p>
          <p>Go to the <strong>Predict</strong> tab and submit an applicant.</p>
        </div>
      )}

      {/* Recent Predictions Table */}
      {stats.recent_predictions.length > 0 && (
        <div className="recent-card">
          <h3>Recent Predictions</h3>
          <table className="recent-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Recommendation</th>
                <th>Risk Level</th>
                <th>Default Prob</th>
                <th>Age</th>
                <th>Income</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_predictions.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>
                    <span className={`badge ${p.recommendation === "APPROVE" ? "badge-green" : "badge-red"}`}>
                      {p.recommendation}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: RISK_COLORS[p.risk_level], fontWeight: 600 }}>
                      {p.risk_level}
                    </span>
                  </td>
                  <td>{(p.default_probability * 100).toFixed(1)}%</td>
                  <td>{p.input_data.age}</td>
                  <td>${p.input_data.monthly_income?.toLocaleString()}</td>
                  <td style={{ fontSize: 11, color: "#888" }}>
                    {new Date(p.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
