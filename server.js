import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { DB } from './db.js';

const app = express();
const PORT = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middlewares
app.use(cors());
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Rotas da API
app.get('/api/tasks', async (req, res) => {
  const [rows] = await DB.query('SELECT * FROM tasks ORDER BY completed, position ASC');
  res.json(rows);
});

app.post('/api/tasks', async (req, res) => {
  const { text } = req.body;
  const [[{ maxOrder }]] = await DB.query('SELECT MAX(position) AS maxOrder FROM tasks');
  const newOrder = (maxOrder ?? 0) + 1;

  const [result] = await DB.query(
    'INSERT INTO tasks (text, position, completed) VALUES (?, ?, ?)',
    [text, newOrder, false]
  )

  res.status(201).json({ id: result.insertId, text, completed: false, position: newOrder });
});

app.put('/api/tasks/:id', async (req, res) => {
  const { completed, text, position } = req.body;
  const updates = [];
  const values = [];

  if (completed !== undefined) {
    updates.push('completed = ?');
    values.push(completed);
  }
  if (text !== undefined) {
    updates.push('text = ?');
    values.push(text);
  }
  if (position !== undefined) {
    updates.push('position = ?');
    values.push(position);
  }
  values.push(req.params.id);

  if (updates.length === 0) return res.sendStatus(400);

  await DB.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
  res.sendStatus(200);
});

app.post('/api/tasks/reorder', async (req, res) => {
  const { taskOrder } = req.body;

  if (!Array.isArray(taskOrder)) {
    return res.status(400).json({ error: "Formato inválido" });
  }

  try {
    const updatePromises = taskOrder.map(({ id, position }) => {
      DB.query("UPDATE tasks SET position = ? WHERE id = ?", [position, id]);
    })

    await Promise.all(updatePromises);

    res.status(200).json({ message: "Ordem atualizada com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar posições" });
  }

})

app.delete('/api/tasks/:id', async (req, res) => {
  await DB.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
})