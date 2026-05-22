import prisma from "../lib/prisma.js";

export async function saveInicial(req, res) {
  const { appointmentId } = req.params;
  const data = req.body;

  const existing = await prisma.anamneseInicial.findUnique({ where: { appointmentId } });

  const payload = {
    attendantId: req.user.id,
    attendanceType: data.attendanceType,
    firstAttendance: data.firstAttendance,
    territory: data.territory,
    raceColor: data.raceColor,
    gender: data.gender,
    violenceTypes: data.violenceTypes || [],
  };

  const result = existing
    ? await prisma.anamneseInicial.update({ where: { appointmentId }, data: payload })
    : await prisma.anamneseInicial.create({ data: { appointmentId, ...payload } });

  res.json(result);
}

export async function saveTecnica(req, res) {
  if (req.user.role === "ATENDENTE") {
    return res.status(403).json({ error: "Atendente não pode acessar anamnese técnica." });
  }

  const { appointmentId } = req.params;
  const data = req.body;

  const existing = await prisma.anamnesisTecnica.findUnique({ where: { appointmentId } });

  const payload = {
    technicianId: req.user.id,
    imminentRisk: data.imminentRisk,
    aggressorLivesWithVictim: data.aggressorLivesWithVictim,
    previousViolenceHistory: data.previousViolenceHistory,
    supportNetwork: data.supportNetwork,
    childrenInvolved: data.childrenInvolved,
    observations: data.observations,
    orientations: data.orientations,
    referrals: data.referrals,
    referralDetails: data.referralDetails,
    followupPlan: data.followupPlan,
    followupDate: data.followupDate ? new Date(data.followupDate) : null,
    caseSummary: data.caseSummary,
    referralObjective: data.referralObjective,
  };

  const result = existing
    ? await prisma.anamnesisTecnica.update({ where: { appointmentId }, data: payload })
    : await prisma.anamnesisTecnica.create({ data: { appointmentId, ...payload } });

  res.json(result);
}

export async function getAnamnese(req, res) {
  const { appointmentId } = req.params;
  const isAtendente = req.user.role === "ATENDENTE";

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      anamneseInicial: true,
      anamnesisTecnica: !isAtendente,
    },
  });

  if (!appointment) return res.status(404).json({ error: "Atendimento não encontrado." });
  res.json(appointment);
}
