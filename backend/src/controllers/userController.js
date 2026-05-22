import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";

export async function list(req, res) {
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, active: true,
      complianceAccepted: true, complianceAcceptedAt: true, createdAt: true,
    },
    orderBy: { name: "asc" },
  });
  res.json(users);
}

export async function create(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "E-mail já cadastrado." });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hash, role },
    select: { id: true, name: true, email: true, role: true },
  });

  res.status(201).json(user);
}

export async function update(req, res) {
  const { id } = req.params;
  const { name, role, active } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { name, role, active },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  res.json(user);
}

export async function resetPassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Senha deve ter ao menos 6 caracteres." });
  }
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { password: hash } });
  res.json({ ok: true });
}

export async function deleteUser(req, res) {
  const { id } = req.params;

  if (id === req.user.id) {
    return res.status(400).json({ error: "Você não pode excluir sua própria conta." });
  }

  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
}
