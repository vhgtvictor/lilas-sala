import prisma from "../lib/prisma.js";
import PDFDocument from "pdfkit";

export async function save(req, res) {
  const { appointmentId } = req.params;
  const { content } = req.body;

  const existing = await prisma.prontuario.findUnique({ where: { appointmentId } });

  const result = existing
    ? await prisma.prontuario.update({ where: { appointmentId }, data: { content, professionalId: req.user.id } })
    : await prisma.prontuario.create({ data: { appointmentId, content, professionalId: req.user.id } });

  res.json(result);
}

export async function saveObsJuridica(req, res) {
  const { appointmentId } = req.params;
  const { content } = req.body;

  const obs = await prisma.observacaoJuridica.create({
    data: { appointmentId, content, professionalId: req.user.id },
  });

  res.json(obs);
}

export async function listAll(req, res) {
  const patients = await prisma.patient.findMany({
    include: {
      appointments: {
        orderBy: { scheduledDate: "desc" },
        include: { anamneseInicial: true, statusHistory: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
    orderBy: { name: "asc" },
  });

  res.json(patients);
}

// ── Helpers de formatação ────────────────────────────────────────────────────

const statusLabels = {
  agendado: "Agendado", triagem: "Triagem (Atendente)",
  tecnica: "Equipe Tecnica", psicologia: "Psicologia (CIS)",
  juridica: "Juridico (NPJ)", finalizado: "Finalizado",
};

function createHelpers(doc) {
  const bool = (v) => v === true ? "Sim" : v === false ? "Nao" : "Nao informado";
  const val  = (v) => (v !== null && v !== undefined && String(v).trim() !== "") ? String(v) : "Nao informado";
  const dt   = (v) => v ? new Date(v).toLocaleString("pt-BR") : "Nao informado";
  const d    = (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "Nao informado";

  function section(title) {
    doc.moveDown();
    doc.fontSize(13).font("Helvetica-Bold").text(title);
    doc.moveDown(0.3);
  }

  function line(label, value) {
    doc.fontSize(11).font("Helvetica-Bold").text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(val(value));
  }

  function block(label, value) {
    doc.fontSize(11).font("Helvetica-Bold").text(`${label}:`);
    doc.font("Helvetica").text(val(value));
    doc.moveDown(0.3);
  }

  function lista(label, items) {
    doc.fontSize(11).font("Helvetica-Bold").text(`${label}:`);
    if (!items || items.length === 0) {
      doc.font("Helvetica").text("Nenhum");
    } else {
      items.forEach((item) => doc.font("Helvetica").text(`  - ${item}`));
    }
    doc.moveDown(0.3);
  }

  return { bool, val, dt, d, section, line, block, lista };
}

// Renderiza um único atendimento no doc já aberto
function renderAppointment(doc, appt, index, total) {
  const { bool, dt, d, section, line, block, lista } = createHelpers(doc);

  const prefix = total > 1 ? `Atendimento ${index + 1} de ${total} — ` : "";

  section(`${prefix}${d(appt.scheduledDate)} as ${appt.scheduledTime}`);
  line("Status", statusLabels[appt.status] || appt.status);

  // Anamnese Inicial
  section("Anamnese Inicial (Atendente)");
  if (!appt.anamneseInicial) {
    doc.fontSize(11).font("Helvetica").text("Nao registrada.");
  } else {
    const ai = appt.anamneseInicial;
    line("Tipo de atendimento", ai.attendanceType);
    line("Primeiro atendimento", bool(ai.firstAttendance));
    line("Territorio / Localidade", ai.territory);
    line("Cor / Raca", ai.raceColor);
    line("Sexo / Genero", ai.gender);
    lista("Tipos de violencia relatados", ai.violenceTypes);
    line("Registrado em", dt(ai.createdAt));
  }

  // Anamnese Tecnica
  section("Anamnese Tecnica (Equipe Tecnica)");
  if (!appt.anamnesisTecnica) {
    doc.fontSize(11).font("Helvetica").text("Nao registrada.");
  } else {
    const at = appt.anamnesisTecnica;
    line("Risco iminente", bool(at.imminentRisk));
    line("Agressor convive com a vitima", bool(at.aggressorLivesWithVictim));
    line("Historico de violencia anterior", bool(at.previousViolenceHistory));
    line("Possui rede de apoio", bool(at.supportNetwork));
    line("Filhos / dependentes envolvidos", bool(at.childrenInvolved));
    block("Observacoes relevantes", at.observations);
    lista("Orientacoes realizadas", Array.isArray(at.orientations) ? at.orientations : []);
    lista("Encaminhamentos realizados", Array.isArray(at.referrals) ? at.referrals : []);
    block("Detalhamento dos encaminhamentos", at.referralDetails);
    block("Sintese do caso", at.caseSummary);
    lista("Objetivo do encaminhamento", Array.isArray(at.referralObjective) ? at.referralObjective : []);
    lista("Plano de acompanhamento", Array.isArray(at.followupPlan) ? at.followupPlan : []);
    if (at.followupDate) line("Data de retorno agendada", d(at.followupDate));
    line("Registrado em", dt(at.createdAt));
  }

  // Prontuario
  section("Prontuario (Psicologia / CIS)");
  if (!appt.prontuario) {
    doc.fontSize(11).font("Helvetica").text("Nao registrado.");
  } else {
    block("Registro clinico", appt.prontuario.content);
    line("Registrado em", dt(appt.prontuario.createdAt));
  }

  // Observacoes Juridicas
  section("Observacoes Juridicas (NPJ)");
  if (!appt.obsJuridicas || appt.obsJuridicas.length === 0) {
    doc.fontSize(11).font("Helvetica").text("Nenhuma observacao registrada.");
  } else {
    appt.obsJuridicas.forEach((obs, i) => {
      doc.fontSize(11).font("Helvetica-Bold").text(`Registro ${i + 1} — ${dt(obs.createdAt)}`);
      doc.font("Helvetica").text(obs.content);
      doc.moveDown(0.4);
    });
  }

  // Historico de tramitacao
  section("Historico de Tramitacao");
  if (!appt.statusHistory || appt.statusHistory.length === 0) {
    doc.fontSize(11).font("Helvetica").text("Sem historico registrado.");
  } else {
    appt.statusHistory.forEach((h) => {
      const from = h.fromStatus ? (statusLabels[h.fromStatus] || h.fromStatus) : "Inicio";
      const to   = statusLabels[h.toStatus] || h.toStatus;
      const note = h.notes ? ` (${h.notes})` : "";
      doc.fontSize(11).font("Helvetica").text(`${dt(h.createdAt)}  |  ${from} -> ${to}${note}`);
    });
  }
}

const APPOINTMENT_INCLUDE = {
  anamneseInicial: true,
  anamnesisTecnica: true,
  prontuario: true,
  obsJuridicas: { orderBy: { createdAt: "asc" } },
  statusHistory: { orderBy: { createdAt: "asc" } },
};

// ── PDF de um único atendimento ──────────────────────────────────────────────
export async function generatePDF(req, res) {
  const { appointmentId } = req.params;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true, ...APPOINTMENT_INCLUDE },
  });

  if (!appt) return res.status(404).json({ error: "Atendimento não encontrado." });

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="atendimento-${appointmentId}.pdf"`);
  doc.pipe(res);

  const { dt } = createHelpers(doc);

  doc.fontSize(16).font("Helvetica-Bold").text("Sala Lilas - Relatorio de Atendimento", { align: "center" });
  doc.fontSize(10).font("Helvetica").text(`Gerado em: ${dt(new Date())}`, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(11).font("Helvetica-Bold").text("Paciente: ", { continued: true });
  doc.font("Helvetica").text(appt.patient.name);
  doc.font("Helvetica-Bold").text("CPF: ", { continued: true });
  doc.font("Helvetica").text(appt.patient.cpf);
  doc.font("Helvetica-Bold").text("E-mail: ", { continued: true });
  doc.font("Helvetica").text(appt.patient.email);

  renderAppointment(doc, appt, 0, 1);

  doc.moveDown();
  doc.fontSize(9).font("Helvetica")
    .text("Documento restrito - uso exclusivo para finalidade tecnica de atendimento. Lei 13.709/2018 (LGPD).", { align: "center" });

  doc.end();
}

// ── PDF com histórico completo do paciente ───────────────────────────────────
export async function generatePatientPDF(req, res) {
  const { patientId } = req.params;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      appointments: {
        include: APPOINTMENT_INCLUDE,
        orderBy: { scheduledDate: "asc" },
      },
    },
  });

  if (!patient) return res.status(404).json({ error: "Paciente não encontrado." });

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="historico-${patientId}.pdf"`);
  doc.pipe(res);

  const { dt } = createHelpers(doc);
  const total = patient.appointments.length;

  // Cabeçalho
  doc.fontSize(16).font("Helvetica-Bold")
    .text("Sala Lilas - Historico Completo de Atendimentos", { align: "center" });
  doc.fontSize(10).font("Helvetica")
    .text(`Gerado em: ${dt(new Date())}`, { align: "center" });

  doc.moveDown(0.5);

  // Dados do paciente
  doc.fontSize(13).font("Helvetica-Bold").text("Dados da Paciente");
  doc.moveDown(0.3);
  doc.fontSize(11).font("Helvetica-Bold").text("Nome: ", { continued: true });
  doc.font("Helvetica").text(patient.name);
  doc.font("Helvetica-Bold").text("CPF: ", { continued: true });
  doc.font("Helvetica").text(patient.cpf);
  doc.font("Helvetica-Bold").text("E-mail: ", { continued: true });
  doc.font("Helvetica").text(patient.email);
  doc.font("Helvetica-Bold").text("Cadastrado em: ", { continued: true });
  doc.font("Helvetica").text(dt(patient.createdAt));
  doc.font("Helvetica-Bold").text("Total de atendimentos: ", { continued: true });
  doc.font("Helvetica").text(String(total));

  if (total === 0) {
    doc.moveDown();
    doc.fontSize(11).font("Helvetica").text("Nenhum atendimento registrado para esta paciente.");
  } else {
    patient.appointments.forEach((appt, i) => {
      // Separador entre atendimentos
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).lineWidth(1).stroke();
      renderAppointment(doc, appt, i, total);
    });
  }

  doc.moveDown();
  doc.fontSize(9).font("Helvetica")
    .text("Documento restrito - uso exclusivo para finalidade tecnica de atendimento. Lei 13.709/2018 (LGPD).", { align: "center" });

  doc.end();
}
