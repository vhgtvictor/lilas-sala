import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import AnamneseModal from "../components/AnamneseModal.jsx";
import PresentialScheduleModal from "../components/PresentialScheduleModal.jsx";

const statusLabel = {
  agendado: "Agendado", triagem: "Triagem", tecnica: "Técnica",
  psicologia: "Psicologia", juridica: "Jurídico", finalizado: "Finalizado",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState({ waiting: 0, inProgress: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const [appts, sum] = await Promise.all([
      api.get(`/appointments?date=${selectedDate}`).then((r) => r.data),
      api.get("/appointments/summary/today").then((r) => r.data),
    ]);
    setAppointments(appts);
    setSummary(sum);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [selectedDate]);

  async function handleCheckin(id, action) {
    await api.post(`/appointments/${id}/checkin`, { action });
    fetchData();
  }

  const isAtendente = user?.role === "ATENDENTE";
  const canSchedule = ["ATENDENTE", "TECNICA"].includes(user?.role);

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="flex gap-2" style={{ alignItems: "center" }}>
          {canSchedule && (
            <button
              className="btn btn-primary"
              onClick={() => { setScheduleSuccess(false); setShowScheduleModal(true); }}
            >
              + Agendar Presencial
            </button>
          )}
          <input
            type="date" className="form-control" style={{ width: "auto" }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="page-body">
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="kpi-card">
            <div className="kpi-label">Aguardando triagem</div>
            <div className="kpi-value">{summary.waiting}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Em atendimento hoje</div>
            <div className="kpi-value">{summary.inProgress}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total do dia</div>
            <div className="kpi-value">{appointments.length}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Agendamentos do dia</div>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 30 }}><div className="spinner" /></div>
          ) : appointments.length === 0 ? (
            <p className="text-muted text-sm">Nenhum agendamento para esta data.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Paciente</th>
                    <th>Status</th>
                    {isAtendente && <th>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>{a.scheduledTime}</td>
                      <td>{a.patient?.name}</td>
                      <td><span className={`badge badge-${a.status}`}>{statusLabel[a.status]}</span></td>
                      {isAtendente && (
                        <td>
                          <div className="flex gap-2">
                            {a.status === "agendado" && (
                              <>
                                <button className="btn btn-success btn-sm"
                                  onClick={() => setSelectedAppt(a)}>
                                  Atender
                                </button>
                                <button className="btn btn-danger btn-sm"
                                  onClick={() => handleCheckin(a.id, "nao_veio")}>
                                  Não Veio
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedAppt && (
        <AnamneseModal
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onSaved={() => { setSelectedAppt(null); fetchData(); }}
        />
      )}

      {showScheduleModal && !scheduleSuccess && (
        <PresentialScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onSaved={() => {
            setScheduleSuccess(true);
            fetchData();
          }}
        />
      )}

      {showScheduleModal && scheduleSuccess && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, textAlign: "center" }}>
            <div className="modal-body" style={{ padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: "var(--green)", marginBottom: 8 }}>Agendamento Confirmado!</h2>
              <p className="text-muted" style={{ marginBottom: 24 }}>
                O atendimento foi registrado e já aparece na lista do dia.
              </p>
              <button className="btn btn-primary" onClick={() => setShowScheduleModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
