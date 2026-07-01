export const store = {
  tasks: [],
  addTask: function(task) {
    this.tasks.push(task);
  },
  removeTask: function(id) {
    this.tasks = this.tasks.filter(function(t) { return t.id !== id; });
  },
  clearTasks: function() {
    this.tasks = [];
  },
  setTasks: function(arr) {
    this.tasks = arr;
  }
};

export const callbacks = {
  onTaskAdded: null
};

export function addTaskFromChat(taskData) {
  const task = {
    id: Date.now(),
    name: taskData.name,
    subject: taskData.subject,
    deadline: taskData.deadline,
    priority: taskData.priority || "Medium",
    type: taskData.type || "Reading",
    hours: parseFloat(taskData.hours) || 1,
    createdAt: new Date().toISOString()
  };
  store.addTask(task);
  if (callbacks.onTaskAdded) callbacks.onTaskAdded(task);
  return task;
}