const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const errorMessage = document.getElementById("errorMessage");
const taskCount = document.getElementById("taskCount");
const filterGroup = document.querySelector(".filters");
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

const STORAGE_KEY = "taskmaster.tasks";
let tasks = [];
let activeFilter = "all";

const loadTasks = () => {
  try {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    tasks = storedTasks ? JSON.parse(storedTasks) : [];
  } catch {
    tasks = [];
  }
};

const saveTasks = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatTaskCount = (count) => `${count} task${count === 1 ? "" : "s"} left`;

const getFilteredTasks = () => {
  return tasks.filter((task) => {
    if (activeFilter === "active") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    return true;
  });
};

const renderTasks = () => {
  const visibleTasks = getFilteredTasks();

  if (!visibleTasks.length) {
    taskList.innerHTML = `
      <li class="empty-state">No ${activeFilter} tasks yet. Add a task above.</li>
    `;
  } else {
    taskList.innerHTML = visibleTasks
      .map((task) => {
        return `
          <li class="task-item ${task.completed ? "completed" : ""}" data-id="${task.id}">
            <div class="view-panel">
              <label class="task-toggle">
                <input type="checkbox" ${task.completed ? "checked" : ""} />
                <span class="task-checkbox"></span>
                <span class="task-text">${escapeHtml(task.text)}</span>
              </label>

              <div class="task-actions">
                <button type="button" class="icon-btn edit-btn" data-action="edit" aria-label="Edit task">
                  Edit
                </button>
                <button type="button" class="icon-btn delete-btn" data-action="delete" aria-label="Delete task">
                  Delete
                </button>
              </div>
            </div>

            <div class="edit-panel" aria-hidden="true">
              <input class="edit-input" type="text" value="${escapeHtml(task.text)}" aria-label="Edit task text" />
              <div class="edit-actions">
                <button type="button" class="btn btn-secondary" data-action="save">Save</button>
                <button type="button" class="btn btn-link" data-action="cancel">Cancel</button>
              </div>
            </div>
          </li>
        `;
      })
      .join("");
  }

  const activeCount = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = formatTaskCount(activeCount);

  filterButtons.forEach((button) => {
    const selected = button.dataset.filter === activeFilter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
  });
};

const showError = (message) => {
  errorMessage.textContent = message;
  errorMessage.classList.toggle("visible", Boolean(message));
};

const addTask = (text) => {
  tasks.unshift({
    id: Date.now(),
    text,
    completed: false,
  });
  saveTasks();
  renderTasks();
};

const updateTask = (id, changes) => {
  tasks = tasks.map((task) => (task.id === id ? { ...task, ...changes } : task));
  saveTasks();
  renderTasks();
};

const removeTask = (id) => {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
};

const handleTaskAction = (event) => {
  const button = event.target.closest("button[data-action]");
  const taskItem = event.target.closest(".task-item");
  if (!taskItem) return;

  const taskId = Number(taskItem.dataset.id);
  if (!taskId) return;

  const editPanel = taskItem.querySelector(".edit-panel");
  const editInput = taskItem.querySelector(".edit-input");

  if (button) {
    const action = button.dataset.action;

    if (action === "edit") {
      taskItem.classList.add("editing");
      editPanel.setAttribute("aria-hidden", "false");
      editInput.focus();
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
      return;
    }

    if (action === "cancel") {
      taskItem.classList.remove("editing");
      editPanel.setAttribute("aria-hidden", "true");
      showError("");
      return;
    }

    if (action === "save") {
      const updatedText = editInput.value.trim();
      if (!updatedText) {
        showError("Task text cannot be blank.");
        editInput.focus();
        return;
      }
      if (updatedText.length > 120) {
        showError("Task should be 120 characters or less.");
        editInput.focus();
        return;
      }
      updateTask(taskId, { text: updatedText });
      showError("");
      return;
    }

    if (action === "delete") {
      removeTask(taskId);
      return;
    }
  }

  if (event.target.matches("input[type='checkbox']")) {
    updateTask(taskId, { completed: event.target.checked });
  }
};

const handleEditKeyDown = (event) => {
  if (!event.target.classList.contains("edit-input")) return;

  if (event.key === "Enter") {
    event.preventDefault();
    event.target.closest(".task-item").querySelector("button[data-action='save']").click();
  }

  if (event.key === "Escape") {
    event.preventDefault();
    event.target.closest(".task-item").querySelector("button[data-action='cancel']").click();
  }
};

const handleFilterClick = (event) => {
  const button = event.target.closest(".filter-btn");
  if (!button) return;
  activeFilter = button.dataset.filter;
  renderTasks();
};

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    showError("Task cannot be blank.");
    taskInput.focus();
    return;
  }
  if (text.length > 120) {
    showError("Task should be 120 characters or less.");
    taskInput.focus();
    return;
  }
  addTask(text);
  taskInput.value = "";
  showError("");
});

taskInput.addEventListener("input", () => {
  if (errorMessage.textContent) showError("");
});

taskList.addEventListener("click", handleTaskAction);
taskList.addEventListener("keydown", handleEditKeyDown);
filterGroup.addEventListener("click", handleFilterClick);

loadTasks();
renderTasks();
