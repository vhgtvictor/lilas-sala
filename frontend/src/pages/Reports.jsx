import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_COLORS = {
  agendado: "#3b82f6", triagem: "#f59e0b", tecnica: "#10b981",
  psicologia: "#8b5cf6", juridica: "#f97316", finalizado: "#6b7280",
};

const VIOLENCE_COLORS = ["#7c3aed","#f43f5e","#f59e0b","#10b981","#3b82f6","#ec4899","#6b7280"];

export default function Reports() {
  const [data, setData] = useState(null);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function fetchKPIs() {
    setLoading(true);
    const r = await api.get(`/reports/kpis?from=${from}&to=${to}`);
    setData(r.data);
    setLoading(false);
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      const r = await api.get(`/reports/export/excel?from=${from}&to=${to}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([r.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `sala-lilas-export-${from}_${to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => { fetchKPIs(); }, []);

  return (
    <>
      <div className="page-header">
        <h1>📊 Relatórios</h1>
        <div className="flex gap-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <input type="date" className="form-control" style={{ width: 150 }}
            value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-muted">até</span>
          <input type="date" className="form-control" style={{ width: 150 }}
            value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="btn btn-primary" onClick={fetchKPIs} disabled={loading}>
            {loading ? <span className="spinner" /> : "Filtrar"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleExportExcel}
            disabled={exporting}
            title="Exportar pacientes, atendimentos, anamnese e prontuários do período"
            style={{ borderColor: "var(--lilas)", color: "var(--lilas)" }}
          >
            {exporting ? <span className="spinner" /> : "⬇ Exportar Excel"}
          </button>
        </div>
      </div>

      <div className="page-body">
        {!data ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
        ) : (
          <>
            <div className="grid-3" style={{ marginBottom: 28 }}>
              <div className="kpi-card">
                <div className="kpi-label">Total de atendimentos</div>
                <div className="kpi-value">{data.total}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Finalizados</div>
                <div className="kpi-value">
                  {data.byStatus.find((s) => s.status === "finalizado")?.count || 0}
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Em andamento</div>
                <div className="kpi-value">
                  {data.total - (data.byStatus.find((s) => s.status === "finalizado")?.count || 0)}
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
              <div className="card">
                <div className="card-title">Atendimentos por Status</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.byStatus.map((s) => ({ name: s.status, value: s.count }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {data.byStatus.map((s, i) => (
                        <Cell key={i} fill={STATUS_COLORS[s.status] || "#ccc"} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-title">Tipos de Violência</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byViolenceType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="type" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Atendimentos por Dia</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.dailyCount.map((d) => ({
                  date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
                  count: d.count,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </>
  );
}
