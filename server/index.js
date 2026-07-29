require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// GET /api/tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks
app.post('/api/tasks', async (req, res) => {
  const { title, desc, date, time, priority, status, completedAt } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'title is required' });
  try {
    const task = await prisma.task.create({
      data: {
        title: title.trim().slice(0, 120),
        desc: desc?.trim() || null,
        date: date || null,
        time: time || null,
        priority: ['high','medium','low'].includes(priority) ? priority : 'medium',
        status: ['pending','in-progress','done'].includes(status) ? status : 'pending',
        completedAt: completedAt ? new Date(completedAt) : null,
      },
    });
    res.status(201).json(task);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, desc, date, time, priority, status, completedAt } = req.body;
  const data = {};
  if (title !== undefined) data.title = title.trim().slice(0, 120);
  if (desc !== undefined) data.desc = desc?.trim() || null;
  if (date !== undefined) data.date = date || null;
  if (time !== undefined) data.time = time || null;
  if (priority !== undefined && ['high','medium','low'].includes(priority)) data.priority = priority;
  if (status !== undefined && ['pending','in-progress','done'].includes(status)) data.status = status;
  if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null;
  try {
    const task = await prisma.task.update({ where: { id }, data });
    res.json(task);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Task not found' });
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Task not found' });
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
