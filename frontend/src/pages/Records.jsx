import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import PatientTimeline from "../components/PatientTimeline.jsx";

const statusLabel = {
  agendado: "Agendado", triagem: "Triagem", tecnica: "Técnica",
  psicologia: "Psicologia", juridica: "Jurídico", finalizado: "Finalizado",
};

const FINALIZABLE = ["agendado", "triagem", "tecnica", "psicologia", "juridica"];

export default function Records() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingFinalize, setPendingFinalize] = useState(null); // { patientName, apptId }
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  const canFinalize = ["TECNICA", "ADMIN"].includes(user?.role);

  function fetchPatients() {
    setLoading(true);
    api.get("/prontuarios").then((r) => setPatients(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { fetchPatients(); }, []);

  async function openTimeline(patientId) {
    const r = await api.get(`/queue/patient/${patientId}/timeline`);
    setSelected(r.data);
  }

  async function downloadPDF(patientId, patientName) {
    const r = await api.get(`/prontuarios/patient/${patientId}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(r.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-${patientName.replace(/\s+/g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function confirmFinalize() {
    setFinalizeLoading(true);
    await api.post(`/appointments/${pendingFinalize.apptId}/finalize`);
    setFinalizeLoading(false);
    setPendingFinalize(null);
    fetchPatients();
  }

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf.includes(search)
  );

  return (
    <>
      <div className="page-header">
        <h1>🗂️ Prontuários</h1>
        <input
          className="form-control" style={{ width: 260 }}
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>CPF</th>
                    <th>Atendimentos</th>
                    <th>Último status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const latest = p.appointments?.[0];
                    const canFinalizeLatest = canFinalize && latest && FINALIZABLE.includes(latest.status);
                    return (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td className="text-muted">{p.cpf}</td>
                        <td>{p.appointments?.length || 0}</td>
                        <td>
                          {latest && (
                            <span className={`badge badge-${latest.status}`}>
                              {statusLabel[latest.status]}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm"
                              onClick={() => openTimeline(p.id)}>
                              📋 Ver Timeline
                            </button>
                            <button className="btn btn-ghost btn-sm"
                              onClick={() => downloadPDF(p.id, p.name)}>
                              ⬇ PDF Histórico
                            </button>
                            {canFinalizeLatest && (
                              <button className="btn btn-danger btn-sm"
                                onClick={() => setPendingFinalize({ patientName: p.name, apptId: latest.id })}>
                                ✓ Finalizar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-muted text-sm" style={{ padding: "16px 14px" }}>Nenhum paciente encontrado.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h2>Timeline — {selected.name}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <PatientTimeline patient={selected} />
            </div>
          </div>
        </div>
      )}

      {pendingFinalize && (
        <div className="modal-overlay" style={{ zIndex: 150 }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>Confirmar Finalização</h2>
              <button className="btn btn-ghost btn-sm"
                onClick={() => setPendingFinalize(null)} disabled={finalizeLoading}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16 }}>Você está finalizando o atendimento de:</p>
              <div style={{
                background: "var(--gray-50)", border: "1px solid var(--gray-200)",
                borderRadius: 8, padding: "14px 16px", marginBottom: 16,
              }}>
                <strong style={{ fontSize: 15 }}>{pendingFinalize.patientName}</strong>
              </div>
              <div className="alert" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                ⚠️ Esta ação é <strong>irreversível</strong>. O status será alterado para <strong>Finalizado</strong>.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost"
                onClick={() => setPendingFinalize(null)} disabled={finalizeLoading}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={confirmFinalize} disabled={finalizeLoading}>
                {finalizeLoading ? <span className="spinner" /> : "Confirmar Finalização"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
