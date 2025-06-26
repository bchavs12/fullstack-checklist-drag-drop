CREATE TABLE
  IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    position INT NOT NULL
  );

INSERT INTO
  tasks (text, completed, position)
VALUES
  ('Estudar JavaScript', false, 1),
  ('Fazer revisão de Node.js', false, 2),
  ('Organizar tarefas com drag-and-drop', false, 3),
  ('Testar checklist funcional', true, 4);