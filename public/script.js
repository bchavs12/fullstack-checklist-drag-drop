const pendingList = document.getElementById("pending-tasks");
const completedList = document.getElementById("completed-tasks");
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");

let tasks = [];

async function fetchTasks() {
  const res = await fetch("/api/tasks");
  tasks = await res.json();
  renderTasks();
}

function renderTasks() {
  pendingList.innerHTML = "";
  completedList.innerHTML = "";

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = task.id;
    if (task.completed) li.classList.add("completed");

    addDragEvents(li);

    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", (e) => toggleComplete(task.id, checkbox.checked));

    const span = document.createElement('span');
    span.textContent = task.text;
    span.className = "task-text";

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "🗑️";
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    li.append(checkbox, span, deleteBtn);

    if (task.completed) {
      completedList.appendChild(li);
    } else {
      pendingList.appendChild(li);
    }
  })

}

async function addTask(text) {
  const res = await fetch('/api/tasks', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  const newTask = await res.json();
  tasks.push(newTask);
  renderTasks();
}

async function toggleComplete(id, completed) {
  await fetch(`/api/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed })
  });

  tasks = tasks.map(t => t.id === id ? { ...t, completed } : t);
  renderTasks();
}

async function deleteTask(id) {
  await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

let draggedItem = null;
let dragSourceList = null;

function addDragEvents(li) {
  li.addEventListener("dragstart", () => {
    draggedItem = li;
    dragSourceList = li.parentNode;
    setTimeout(() => li.style.display = "none", 0);
  });

  li.addEventListener("dragend", () => {
    setTimeout(() => {
      draggedItem.style.display = "block";
      draggedItem = null;
      dragSourceList = null;
    }, 0);
  });

  li.addEventListener("dragover", (e) => {
    e.preventDefault();

    const targetList = li.parentNode;
    if (targetList !== dragSourceList) return; // 🔒 impede drop em outra lista

    const bounding = li.getBoundingClientRect();
    const offset = e.clientY - bounding.top;
    const midpoint = bounding.height / 2;

    li.classList.remove("drag-over-top", "drag-over-bottom");
    if (offset > midpoint) {
      li.classList.add("drag-over-bottom");
    } else {
      li.classList.add("drag-over-top");
    }
  });

  li.addEventListener("dragenter", (e) => {
    const targetList = li.parentNode;
    if (targetList !== dragSourceList) {
      targetList.classList.add("invalid-drop");
    }
  });

  li.addEventListener("dragleave", () => {
    const targetList = li.parentNode;
    targetList.classList.remove("invalid-drop");
  });

  li.addEventListener("drop", () => {
    const targetList = li.parentNode;
    targetList.classList.remove("invalid-drop");

    if (targetList !== dragSourceList) return;

    // drop válido → aplica reordenação
    const bounding = li.getBoundingClientRect();
    const offset = event.clientY - bounding.top;
    const midpoint = bounding.height / 2;

    if (offset > midpoint) {
      li.after(draggedItem);
    } else {
      li.before(draggedItem);
    }

    updatePositionsFromDOM(); // só atualiza se o drop for permitido
  });
}

async function updatePositionsFromDOM() {
  const newOrder = Array.from(pendingList.children).map((li, index) => ({
    id: parseInt(li.dataset.id),
    position: index + 1,
  }));

  // Atualiza localmente o array `tasks`
  tasks = tasks.map(task => {
    const found = newOrder.find(o => o.id === task.id);
    return found ? { ...task, position: found.position } : task;
  });

  // Envia para o backend
  await fetch("/api/tasks/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskOrder: newOrder }),
  });
}

taskForm.addEventListener('submit', e => {
  e.preventDefault();

  if (taskInput.value.trim()) {
    addTask(taskInput.value.trim());

    taskInput.value = "";
  }
});

document.addEventListener("DOMContentLoaded", fetchTasks)
