const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

beforeEach(async () => {
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.task.deleteMany();
  await prisma.$disconnect();
});

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('GET /api/tasks', () => {
  it('returns empty array when no tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns existing tasks', async () => {
    await prisma.task.create({ data: { title: 'Tarefa teste' } });
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Tarefa teste');
  });
});

describe('POST /api/tasks', () => {
  it('creates a task with valid data', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Nova tarefa', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Nova tarefa');
    expect(res.body.priority).toBe('high');
    expect(res.body.status).toBe('pending');
    expect(res.body.id).toBeDefined();
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ priority: 'high' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('title is required');
  });

  it('defaults priority to medium when invalid', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Tarefa', priority: 'invalid' });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('medium');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('updates task fields', async () => {
    const task = await prisma.task.create({ data: { title: 'Original' } });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 'Atualizada', status: 'in-progress' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Atualizada');
    expect(res.body.status).toBe('in-progress');
  });

  it('returns 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/id-inexistente')
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes an existing task', async () => {
    const task = await prisma.task.create({ data: { title: 'Para deletar' } });
    const res = await request(app).delete(`/api/tasks/${task.id}`);
    expect(res.status).toBe(204);
    const found = await prisma.task.findUnique({ where: { id: task.id } });
    expect(found).toBeNull();
  });

  it('returns 404 for non-existent task', async () => {
    const res = await request(app).delete('/api/tasks/id-inexistente');
    expect(res.status).toBe(404);
  });
});
