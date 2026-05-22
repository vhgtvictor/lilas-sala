import prisma from "../lib/prisma.js";
import { validateCPF } from "../lib/cpfValidator.js";

export async function createPublic(req, res) {
  const { name, email, cpf, scheduledDate, scheduledTime } = req.body;

  if (!name || !email || !cpf || !scheduledDate || !scheduledTime) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const cleanCPF = cpf.replace(/\D/g, "");
  if (!validateCPF(cleanCPF)) {
    return res.status(400).json({ error: "CPF inválido." });
  }

  const date = new Date(scheduledDate);
  const day = date.getUTCDay();
  if (day === 0 || day === 6) {
    return res.status(400).json({ error: "Agendamentos apenas em dias úteis." });
  }

  const [hour] = scheduledTime.split(":").map(Number);
  if (hour < 9 || hour >= 18) {
    return res.status(400).json({ error: "Horário fora da janela de atendimento (09:00–18:00)." });
  }

  const conflict = await prisma.appointment.findFirst({
    where: { scheduledDate: date, scheduledTime, status: { not: "finalizado" } },
  });
  if (conflict) {
    return res.status(409).json({ error: "Horário já ocupado." });
  }

  let patient = await prisma.patient.findUnique({ where: { cpf: cleanCPF } });
  if (!patient) {
    patient = await prisma.patient.create({ data: { name, email, cpf: cleanCPF } });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      scheduledDate: date,
      scheduledTime,
      status: "agendado",
    },
  });

  await prisma.statusHistory.create({
    data: {
      appointmentId: appointment.id,
      toStatus: "agendado",
      changedById: "system",
    },
  });

  res.status(201).json({ message: "Agendamento realizado com sucesso!", id: appointment.id });
}

export async function getAvailableSlots(req, res) {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "Data obrigatória." });

  const d = new Date(date);
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return res.json({ slots: [] });

  const allSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  ];

  const taken = await prisma.appointment.findMany({
    where: { scheduledDate: d, status: { not: "finalizado" } },
    select: { scheduledTime: true },
  });

  const takenTimes = new Set(taken.map((a) => a.scheduledTime));
  const slots = allSlots.filter((s) => !takenTimes.has(s));
  res.json({ slots });
}

export async function listByDate(req, res) {
  const { date } = req.query;
  const filter = date ? { scheduledDate: new Date(date) } : {};

  const appointments = await prisma.appointment.findMany({
    where: filter,
    include: { patient: true },
    orderBy: { scheduledTime: "asc" },
  });

  res.json(appointments);
}

export async function getTodaySummary(req, res) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [waiting, inProgress] = await Promise.all([
    prisma.appointment.count({ where: { scheduledDate: today, status: "agendado" } }),
    prisma.appointment.count({ where: { scheduledDate: today, status: "triagem" } }),
  ]);

  res.json({ waiting, inProgress });
}

export async function checkin(req, res) {
  const { id } = req.params;
  const { action } = req.body;

  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return res.status(404).json({ error: "Agendamento não encontrado." });

  if (action === "atender") {
    await changeStatus(id, "triagem", req.user.id);
    return res.json({ status: "triagem" });
  }

  if (action === "nao_veio") {
    await changeStatus(id, "finalizado", req.user.id, "Paciente não compareceu.");
    return res.json({ status: "finalizado" });
  }

  res.status(400).json({ error: "Ação inválida." });
}

export async function transfer(req, res) {
  const { id } = req.params;
  const { to, notes } = req.body;
  const role = req.user.role;

  const statusMap = {
    TECNICA: "tecnica",
    CIS: "psicologia",
    NPJ: "juridica",
    OUTROS: "finalizado",
  };

  const allowed = {
    ATENDENTE: ["TECNICA"],
    TECNICA: ["CIS", "NPJ", "OUTROS"],
    CIS: ["NPJ", "TECNICA", "OUTROS"],
    NPJ: ["CIS", "TECNICA", "OUTROS"],
  };

  if (!allowed[role]?.includes(to)) {
    return res.status(403).json({ error: "Encaminhamento não permitido para este perfil." });
  }

  const newStatus = statusMap[to];
  await changeStatus(id, newStatus, req.user.id, notes);

  res.json({ status: newStatus });
}

export async function finalize(req, res) {
  const { id } = req.params;
  await changeStatus(id, "finalizado", req.user.id, req.body.notes);
  res.json({ status: "finalizado" });
}

async function changeStatus(appointmentId, toStatus, changedById, notes) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  await prisma.$transaction([
    prisma.appointment.update({ where: { id: appointmentId }, data: { status: toStatus } }),
    prisma.statusHistory.create({
      data: { appointmentId, fromStatus: appt.status, toStatus, changedById, notes },
    }),
  ]);
}
