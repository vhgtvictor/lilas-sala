import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import PatientTimeline from "../components/PatientTimeline.jsx";
import AnamneseModal from "../components/AnamneseModal.jsx";
import ProntuarioModal from "../components/ProntuarioModal.jsx";

const queueTitle = {
  TECNICA: "Fila da Equipe Técnica",
  CIS: "Fila de Psicologia (CIS)",
  NPJ: "Fila Jurídica (NPJ)",
};

const transferLabels = { CIS: "Psicologia (CIS)", NPJ: "Jurídico (NPJ)", TECNICA: "Equipe Técnica", OUTROS: "Outros / Finalizar" };
const transferIcons  = { CIS: "🧠", NPJ: "⚖️", TECNICA: "🔬", OUTROS: "📤" };
const transferColors = { CIS: "var(--lilas)", NPJ: "var(--yellow)", TECNICA: "var(--green)", OUTROS: "var(--gray-600)" };

function ConfirmTransferModal({ appt, dest, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 150 }}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2>Confirmar Encaminhamento</h2>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: 16 }}>
            Você está encaminhando a paciente:
          </p>
          <div style={{
            background: "var(--gray-50)", border: "1px solid var(--gray-200)",
            borderRadius: 8, padding: "14px 16px", marginBottom: 20,
          }}>
            <strong style={{ fontSize: 15 }}>{appt.patient?.name}</strong>
            <div className="text-sm text-muted mt-2">
              {new Date(appt.scheduledDate).toLocaleDateString("pt-BR")} às {appt.scheduledTime}
            </div>
          </div>
          <p>
            Para:{" "}
            <strong style={{ color: transferColors[dest] }}>
              {transferIcons[dest]} {transferLabels[dest]}
            </strong>
          </p>
          {dest === "OUTROS" && (
            <div className="alert" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", marginTop: 14 }}>
              ⚠️ Esta ação irá <strong>finalizar o atendimento</strong> e gerar um PDF consolidado.
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button
            className="btn btn-primary"
            style={{ background: transferColors[dest] }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : `Confirmar Encaminhamento`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Queues() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelinePatient, setTimelinePatient] = useState(null);
  const [anamneseAppt, setAnamneseAppt] = useState(null);
  const [prontuarioAppt, setProntuarioAppt] = useState(null);
  const [pendingTransfer, setPendingTransfer] = useState(null); // { appt, dest }
  const [transferLoading, setTransferLoading] = useState(false);

  async function fetchQueue() {
    setLoading(true);
    api.get("/queue").then((r) => setQueue(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { fetchQueue(); }, []);

  async function openTimeline(patientId) {
    const r = await api.get(`/queue/patient/${patientId}/timeline`);
    setTimelinePatient(r.data);
  }

  async function confirmTransfer() {
    if (!pendingTransfer) return;
    setTransferLoading(true);
    await api.post(`/appointments/${pendingTransfer.appt.id}/transfer`, { to: pendingTransfer.dest });
    setTransferLoading(false);
    setPendingTransfer(null);
    fetchQueue();
  }

  async function finalize(apptId) {
    await api.post(`/appointments/${apptId}/finalize`);
    fetchQueue();
  }

  const allowedTransfers = {
    TECNICA: ["CIS", "NPJ", "OUTROS"],
    CIS: ["NPJ", "TECNICA", "OUTROS"],
    NPJ: ["CIS", "TECNICA", "OUTROS"],
  };

  return (
    <>
      <div className="page-header">
        <h1>{queueTitle[user?.role] || "Filas"}</h1>
        <button className="btn btn-ghost btn-sm" onClick={fetchQueue}>↻ Atualizar</button>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><div className="spinner" /></div>
        ) : queue.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <p className="text-muted">Nenhum atendimento na fila no momento.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {queue.map((appt) => (
              <div key={appt.id} className="card">
                <div className="flex-between">
                  <div>
                    <strong style={{ fontSize: 15 }}>{appt.patient?.name}</strong>
                    <div className="text-sm text-muted mt-2">
                      {new Date(appt.scheduledDate).toLocaleDateString("pt-BR")} às {appt.scheduledTime}
                    </div>
                  </div>
                  <div className="flex gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => openTimeline(appt.patientId)}>
                      📋 Timeline
                    </button>
                    {user?.role === "TECNICA" && (
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => setAnamneseAppt(appt)}>
                        📝 Anamnese
                      </button>
                    )}
                    {(user?.role === "CIS") && (
                      <button className="btn btn-primary btn-sm"
                        onClick={() => setProntuarioAppt(appt)}>
                        📄 Prontuário
                      </button>
                    )}
                    {(user?.role === "NPJ") && (
                      <button className="btn btn-primary btn-sm"
                        onClick={() => setProntuarioAppt(appt)}>
                        ⚖️ Obs. Jurídica
                      </button>
                    )}
                    {allowedTransfers[user?.role]?.map((dest) => (
                      <button key={dest} className="btn btn-ghost btn-sm"
                        onClick={() => setPendingTransfer({ appt, dest })}>
                        {transferIcons[dest]} {transferLabels[dest]}
                      </button>
                    ))}
                    {user?.role === "TECNICA" && (
                      <button className="btn btn-danger btn-sm"
                        onClick={() => finalize(appt.id)}>
                        Finalizar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {timelinePatient && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2>Timeline do Paciente</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setTimelinePatient(null)}>✕</button>
            </div>
            <div className="modal-body">
              <PatientTimeline patient={timelinePatient} />
            </div>
          </div>
        </div>
      )}

      {anamneseAppt && (
        <AnamneseModal appointment={anamneseAppt}
          onClose={() => setAnamneseAppt(null)}
          onSaved={() => { setAnamneseAppt(null); fetchQueue(); }} />
      )}

      {prontuarioAppt && (
        <ProntuarioModal appointment={prontuarioAppt}
          onClose={() => setProntuarioAppt(null)}
          onSaved={() => { setProntuarioAppt(null); fetchQueue(); }} />
      )}

      {pendingTransfer && (
        <ConfirmTransferModal
          appt={pendingTransfer.appt}
          dest={pendingTransfer.dest}
          loading={transferLoading}
          onConfirm={confirmTransfer}
          onCancel={() => setPendingTransfer(null)}
        />
      )}
    </>
  );
}
