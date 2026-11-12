
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import "./Auth.css";

const getStoredData = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  // User profile: name and date of birth
  const [profile, setProfile] = useState(() =>
    getStoredData("focusflow-profile", null)
  );

  const [nameInput, setNameInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [profileError, setProfileError] = useState("");

  // Tasks
  const [tasks, setTasks] = useState(() =>
    getStoredData("focusflow-tasks", [])
  );

  // Theme
  const [theme, setTheme] = useState(
    () => localStorage.getItem("focusflow-theme") || "light"
  );

  // Workspace
  const [activeView, setActiveView] = useState("Dashboard");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Work");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Daily goal
  const [goal, setGoal] = useState(
    () => Number(localStorage.getItem("focusflow-goal")) || 5
  );

  // Focus timer
  const [timerMode, setTimerMode] = useState("Focus");
  const [seconds, setSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // Assistant
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm your FocusFlow Smart Assistant. Try commands like 'add task Practice Java' or 'show pending tasks'.",
    },
  ]);

  const [reminderMessage, setReminderMessage] = useState("");

  // Save profile
  useEffect(() => {
    if (profile) {
      localStorage.setItem("focusflow-profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("focusflow-profile");
    }
  }, [profile]);

  // Save tasks
  useEffect(() => {
    localStorage.setItem("focusflow-tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Save theme
  useEffect(() => {
    localStorage.setItem("focusflow-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Save daily goal
  useEffect(() => {
    localStorage.setItem("focusflow-goal", String(goal));
  }, [goal]);

  // Timer
  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setTimerRunning(false);

          setReminderMessage(
            timerMode === "Focus"
              ? "Focus session completed! Take a short break."
              : "Break completed! Ready for another focus session?"
          );

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, timerMode]);

  // Local date
  const today = (() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  })();

  // Task calculations
  const completed = tasks.filter((task) => task.done).length;
  const total = tasks.length;
  const pending = total - completed;
  const progress = total
    ? Math.round((completed / total) * 100)
    : 0;

  const categories = ["Work", "Study", "Personal"];

  const todayTasks = tasks.filter(
    (task) => task.dueDate === today
  );

  const upcomingTasks = tasks
    .filter(
      (task) =>
        task.dueDate &&
        task.dueDate >= today &&
        !task.done
    )
    .sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    );

  const categoryStats = categories.map((name) => ({
    name,
    count: tasks.filter((task) => task.category === name).length,
  }));

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Active" && !task.done) ||
        (filter === "Completed" && task.done);

      const matchesSearch = task.title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesView =
        activeView === "Pending Tasks"
          ? !task.done
          : activeView === "Completed Tasks"
            ? task.done
            : true;

      return (
        matchesFilter &&
        matchesSearch &&
        matchesView
      );
    });
  }, [tasks, filter, search, activeView]);

  // Save name and date of birth
  function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileError("");

    if (!nameInput.trim()) {
      setProfileError("Please enter your name.");
      return;
    }

    if (!dobInput) {
      setProfileError("Please select your date of birth.");
      return;
    }

    if (dobInput > today) {
      setProfileError("Date of birth cannot be in the future.");
      return;
    }

    setProfile({
      name: nameInput.trim(),
      dob: dobInput,
    });
  }

  // Change profile
  function changeProfile() {
    const confirmed = window.confirm(
      "Do you want to change your profile details?"
    );

    if (!confirmed) return;

    setNameInput(profile?.name || "");
    setDobInput(profile?.dob || "");
    setProfile(null);
    setActiveView("Dashboard");
  }

  // Task form reset
  function resetForm() {
    setTitle("");
    setCategory("Work");
    setPriority("Medium");
    setDueDate("");
    setEditingId(null);
  }

  // Add or update task
  function saveTask(event) {
    event.preventDefault();

    if (!title.trim()) return;

    if (editingId !== null) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? {
              ...task,
              title: title.trim(),
              category,
              priority,
              dueDate,
            }
            : task
        )
      );
    } else {
      const newTask = {
        id: `${Date.now()}-${Math.random()}`,
        title: title.trim(),
        category,
        priority,
        dueDate,
        done: false,
      };

      setTasks((current) => [...current, newTask]);
    }

    resetForm();
  }

  // Edit task
  function editTask(task) {
    setTitle(task.title);
    setCategory(task.category);
    setPriority(task.priority);
    setDueDate(task.dueDate || "");
    setEditingId(task.id);
    setActiveView("All Tasks");
  }

  // Complete task
  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, done: !task.done }
          : task
      )
    );
  }

  // Delete task
  function deleteTask(id) {
    setTasks((current) =>
      current.filter((task) => task.id !== id)
    );
  }

  // Clear completed tasks
  function clearCompleted() {
    setTasks((current) =>
      current.filter((task) => !task.done)
    );
  }

  // Task date status
  function getDateStatus(date, done) {
    if (done) return "Completed";
    if (!date) return "No due date";
    if (date < today) return "Overdue";
    if (date === today) return "Due today";

    return "Upcoming";
  }

  // Timer controls
  function changeTimer(mode) {
    setTimerMode(mode);
    setTimerRunning(false);
    setReminderMessage("");
    setSeconds(mode === "Focus" ? 25 * 60 : 5 * 60);
  }

  function formatTime(value) {
    const minutes = Math.floor(value / 60);
    const remainingSeconds = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  // Browser notifications
  function handleReminderPermission() {
    if (!("Notification" in window)) {
      setReminderMessage(
        "Notifications are not supported in this browser."
      );
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("FocusFlow", {
          body: "Notifications enabled! You can now receive task reminders.",
        });

        setReminderMessage(
          "Task notifications enabled successfully."
        );
      } else {
        setReminderMessage(
          "Notification permission was not granted."
        );
      }
    });
  }

  // Smart Assistant commands
  function runAssistant() {
    const command = assistantInput.trim();

    if (!command) return;

    const lower = command.toLowerCase();

    let response =
      "I couldn't understand that command. Try 'add task Practice Java' or 'show pending tasks'.";

    if (lower.startsWith("add task ")) {
      const taskTitle = command.substring(9).trim();

      if (taskTitle) {
        const newTask = {
          id: `${Date.now()}-${Math.random()}`,
          title: taskTitle,
          category: "Personal",
          priority: "Medium",
          dueDate: "",
          done: false,
        };

        setTasks((current) => [...current, newTask]);

        response = `Task added successfully: "${taskTitle}"`;
      }
    } else if (
      lower.includes("show pending") ||
      lower.includes("pending tasks")
    ) {
      setActiveView("Pending Tasks");
      response = `You have ${pending} pending tasks. I've opened your Pending Tasks view.`;
    } else if (
      lower.includes("show completed") ||
      lower.includes("completed tasks")
    ) {
      setActiveView("Completed Tasks");
      response = `You have completed ${completed} tasks. I've opened your Completed Tasks view.`;
    } else if (lower.includes("show dashboard")) {
      setActiveView("Dashboard");
      response = "Your Dashboard is now open.";
    } else if (lower.includes("progress")) {
      response = `Your current task completion progress is ${progress}%.`;
    } else if (lower.includes("today")) {
      response = `You have ${todayTasks.length} tasks scheduled for today.`;
    } else if (lower.includes("clear completed")) {
      clearCompleted();
      response = "Your completed tasks have been cleared.";
    }

    setAssistantMessages((current) => [
      ...current,
      { role: "user", text: command },
      { role: "assistant", text: response },
    ]);

    setAssistantInput("");
  }

  // Task list
  function renderTaskList() {
    if (filteredTasks.length === 0) {
      return (
        <div className="empty-state">
          <span>✦</span>
          <h3>No tasks found</h3>
          <p>
            Add a new task or change your search and filters.
          </p>
        </div>
      );
    }

    return (
      <div className="task-list">
        {filteredTasks.map((task) => (
          <div
            className={`task-item ${task.done ? "completed" : ""}`}
            key={task.id}
          >
            <button
              className={`task-check ${task.done ? "checked" : ""}`}
              onClick={() => toggleTask(task.id)}
              aria-label="Toggle task completion"
            >
              {task.done ? "✓" : ""}
            </button>

            <div className="task-info">
              <h3>{task.title}</h3>

              <div className="task-tags">
                <span className="category-tag">
                  {task.category}
                </span>

                <span
                  className={`priority-tag ${task.priority.toLowerCase()}`}
                >
                  {task.priority}
                </span>

                {task.dueDate && (
                  <span className="due-tag">
                    {getDateStatus(task.dueDate, task.done)}
                    {" · "}
                    {task.dueDate}
                  </span>
                )}
              </div>
            </div>

            <div className="task-actions">
              <button
                onClick={() => editTask(task)}
                aria-label="Edit task"
              >
                ✎
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                aria-label="Delete task"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Dashboard
  function renderDashboard() {
    return (
      <>
        <section className="welcome-section">
          <div>
            <span className="eyebrow">
              YOUR PERSONAL PRODUCTIVITY HUB
            </span>

            <h1>Good work starts with focus.</h1>

            <p>
              Organize your day, track your progress, and make every task count.
            </p>
          </div>

          <div className="welcome-symbol">✦</div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">▦</span>
            <small>Total Tasks</small>
            <h2>{total}</h2>
          </div>

          <div className="stat-card">
            <span className="stat-icon">✓</span>
            <small>Completed</small>
            <h2>{completed}</h2>
          </div>

          <div className="stat-card">
            <span className="stat-icon">◷</span>
            <small>Pending</small>
            <h2>{pending}</h2>
          </div>

          <div className="stat-card">
            <span className="stat-icon">✧</span>
            <small>Progress</small>
            <h2>{progress}%</h2>
          </div>
        </section>

        <section className="content-grid">
          <div className="task-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">STAY ORGANIZED</span>
                <h2>My Tasks</h2>
              </div>

              <span className="task-count">
                {total} tasks
              </span>
            </div>

            <form className="task-form" onSubmit={saveTask}>
              <input
                type="text"
                placeholder="What do you need to do?"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                required
              />

              <div className="form-row">
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                />
              </div>

              <div className="form-buttons">
                <button className="add-button" type="submit">
                  {editingId !== null
                    ? "Update Task"
                    : "+ Add Task"}
                </button>

                {editingId !== null && (
                  <button
                    className="cancel-button"
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="task-toolbar">
              <div className="filter-buttons">
                {["All", "Active", "Completed"].map((item) => (
                  <button
                    key={item}
                    className={filter === item ? "active" : ""}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <input
                className="search-input"
                type="search"
                placeholder="Search tasks..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            {renderTaskList()}

            {completed > 0 && (
              <button
                className="clear-button"
                onClick={clearCompleted}
              >
                Clear completed tasks
              </button>
            )}
          </div>

          <aside className="right-column">
            <div className="side-card progress-card">
              <span className="eyebrow">
                YOUR ACHIEVEMENTS
              </span>

              <h2>Daily Progress</h2>

              <div
                className="progress-ring"
                style={{
                  background: `conic-gradient(var(--accent) ${progress}%, var(--border) ${progress}% 100%)`,
                }}
              >
                <div className="progress-inner">
                  <strong>{progress}%</strong>
                  <span>Completed</span>
                </div>
              </div>

              <p>
                {completed} of {total} tasks completed
              </p>
            </div>

            <div className="side-card">
              <span className="eyebrow">TASK BREAKDOWN</span>
              <h2>Categories</h2>

              {categoryStats.map((item) => (
                <div className="category-row" key={item.name}>
                  <span>{item.name}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>

            <div className="side-card quote-card">
              <span>✦</span>
              <h3>
                Small steps every day lead to big results.
              </h3>
              <p>Keep showing up. Your progress matters.</p>
            </div>
          </aside>
        </section>
      </>
    );
  }

  // Calendar
  function renderCalendar() {
    return (
      <section className="feature-page">
        <span className="eyebrow">PLAN YOUR SCHEDULE</span>

        <h1>Calendar & Reminders</h1>

        <p className="page-description">
          View your tasks by due date and keep track of upcoming work.
        </p>

        <div className="feature-card">
          <h2>Today's Schedule</h2>

          <p>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {todayTasks.length === 0 ? (
            <p>No tasks scheduled for today.</p>
          ) : (
            todayTasks.map((task) => (
              <div className="feature-list-item" key={task.id}>
                <span>{task.done ? "✓" : "◷"}</span>
                <strong>{task.title}</strong>
                <small>{task.category}</small>
              </div>
            ))
          )}
        </div>

        <div className="feature-card">
          <h2>Upcoming Tasks</h2>

          {upcomingTasks.length === 0 ? (
            <p>
              No upcoming tasks. Add due dates to your tasks to see them here.
            </p>
          ) : (
            upcomingTasks.map((task) => (
              <div className="feature-list-item" key={task.id}>
                <span>◷</span>
                <strong>{task.title}</strong>
                <small>{task.dueDate}</small>
              </div>
            ))
          )}
        </div>

        <div className="feature-card">
          <h2>Browser Notifications</h2>

          <p>
            Allow browser notifications to receive FocusFlow alerts.
          </p>

          <button
            className="add-button"
            onClick={handleReminderPermission}
          >
            Enable Notifications
          </button>

          {reminderMessage && <p>{reminderMessage}</p>}
        </div>
      </section>
    );
  }

  // Focus timer
  function renderFocusTimer() {
    return (
      <section className="feature-page">
        <span className="eyebrow">
          FOCUS ON WHAT MATTERS
        </span>

        <h1>Focus Timer</h1>

        <p className="page-description">
          Work in focused sessions and take short breaks to refresh your mind.
        </p>

        <div className="feature-card timer-card">
          <div className="timer-modes">
            <button
              className={timerMode === "Focus" ? "active" : ""}
              onClick={() => changeTimer("Focus")}
            >
              Focus · 25 min
            </button>

            <button
              className={timerMode === "Break" ? "active" : ""}
              onClick={() => changeTimer("Break")}
            >
              Break · 5 min
            </button>
          </div>

          <div className="timer-display">
            {formatTime(seconds)}
          </div>

          <div className="timer-controls">
            <button
              className="add-button"
              onClick={() => {
                setReminderMessage("");
                setTimerRunning((running) => !running);
              }}
            >
              {timerRunning ? "Pause" : "Start"}
            </button>

            <button
              className="cancel-button"
              onClick={() => {
                setTimerRunning(false);
                setSeconds(
                  timerMode === "Focus" ? 25 * 60 : 5 * 60
                );
                setReminderMessage("");
              }}
            >
              Reset
            </button>
          </div>

          {reminderMessage && <p>{reminderMessage}</p>}
        </div>
      </section>
    );
  }

  // Daily goals
  function renderGoals() {
    return (
      <section className="feature-page">
        <span className="eyebrow">BUILD CONSISTENCY</span>

        <h1>Daily Goals</h1>

        <p className="page-description">
          Set a daily task target and track your achievements.
        </p>

        <div className="feature-card">
          <h2>Daily Task Goal</h2>

          <label htmlFor="goal-input">
            Tasks to complete each day
          </label>

          <input
            id="goal-input"
            type="number"
            min="1"
            max="100"
            value={goal}
            onChange={(event) =>
              setGoal(
                Math.max(1, Number(event.target.value) || 1)
              )
            }
          />

          <h2>
            {completed} / {goal}
          </h2>

          <div className="goal-track">
            <div
              className="goal-fill"
              style={{
                width: `${Math.min(
                  (completed / goal) * 100,
                  100
                )}%`,
              }}
            />
          </div>

          <p>
            {completed >= goal
              ? "Great work! You have reached your task goal."
              : `${Math.max(
                goal - completed,
                0
              )} more completed tasks to reach your goal.`}
          </p>
        </div>
      </section>
    );
  }

  // Analytics
  function renderAnalytics() {
    return (
      <section className="feature-page">
        <span className="eyebrow">
          MEASURE YOUR PROGRESS
        </span>

        <h1>Productivity Analytics</h1>

        <p className="page-description">
          Understand your task completion and category distribution.
        </p>

        <section className="stats-grid">
          <div className="stat-card">
            <small>Total Tasks</small>
            <h2>{total}</h2>
          </div>

          <div className="stat-card">
            <small>Completed</small>
            <h2>{completed}</h2>
          </div>

          <div className="stat-card">
            <small>Pending</small>
            <h2>{pending}</h2>
          </div>

          <div className="stat-card">
            <small>Completion Rate</small>
            <h2>{progress}%</h2>
          </div>
        </section>

        <div className="feature-card">
          <h2>Category Analytics</h2>

          {categoryStats.map((item) => (
            <div className="analytics-row" key={item.name}>
              <div className="category-row">
                <span>{item.name}</span>
                <strong>{item.count} tasks</strong>
              </div>

              <div className="goal-track">
                <div
                  className="goal-fill"
                  style={{
                    width: `${total ? (item.count / total) * 100 : 0
                      }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Smart Assistant
  function renderAssistant() {
    return (
      <section className="feature-page">
        <span className="eyebrow">
          YOUR PRODUCTIVITY COMPANION
        </span>

        <h1>FocusFlow Smart Assistant</h1>

        <p className="page-description">
          Use simple commands to manage your workspace.
        </p>

        <div className="feature-card assistant-card">
          <div className="assistant-messages">
            {assistantMessages.map((message, index) => (
              <div
                key={index}
                className={`assistant-message ${message.role}`}
              >
                <strong>
                  {message.role === "user"
                    ? "You"
                    : "FocusFlow"}
                </strong>

                <p>{message.text}</p>
              </div>
            ))}
          </div>

          <form
            className="assistant-form"
            onSubmit={(event) => {
              event.preventDefault();
              runAssistant();
            }}
          >
            <input
              value={assistantInput}
              onChange={(event) =>
                setAssistantInput(event.target.value)
              }
              placeholder="Type a command..."
            />

            <button className="add-button" type="submit">
              Send
            </button>
          </form>

          <div className="assistant-examples">
            <strong>Try these commands:</strong>
            <p>• add task Practice Java</p>
            <p>• show pending tasks</p>
            <p>• show completed tasks</p>
            <p>• show dashboard</p>
            <p>• show my progress</p>
          </div>

          <p className="assistant-note">
            Note: This version uses built-in command recognition.
            It is not connected to a real AI service.
          </p>
        </div>
      </section>
    );
  }

  // Sidebar navigation
  const navigation = [
    { name: "Dashboard", icon: "▦" },
    { name: "All Tasks", icon: "☷" },
    { name: "Pending Tasks", icon: "◷" },
    { name: "Completed Tasks", icon: "✓" },
    { name: "Calendar", icon: "▣" },
    { name: "Focus Timer", icon: "◴" },
    { name: "Daily Goals", icon: "✧" },
    { name: "Analytics", icon: "▥" },
    { name: "AI Assistant", icon: "✦" },
  ];

  // Current page
  function renderCurrentView() {
    switch (activeView) {
      case "Calendar":
        return renderCalendar();

      case "Focus Timer":
        return renderFocusTimer();

      case "Daily Goals":
        return renderGoals();

      case "Analytics":
        return renderAnalytics();

      case "AI Assistant":
        return renderAssistant();

      case "All Tasks":
      case "Pending Tasks":
      case "Completed Tasks":
        return (
          <section className="task-panel standalone-task-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">YOUR WORKSPACE</span>
                <h2>{activeView}</h2>
              </div>

              <span className="task-count">
                {filteredTasks.length} tasks
              </span>
            </div>

            <div className="task-toolbar">
              <div className="filter-buttons">
                {["All", "Active", "Completed"].map((item) => (
                  <button
                    key={item}
                    className={filter === item ? "active" : ""}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <input
                className="search-input"
                type="search"
                placeholder="Search tasks..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            {renderTaskList()}
          </section>
        );

      default:
        return renderDashboard();
    }
  }

  // Name and DOB screen
  if (!profile) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-logo">F</div>

          <p className="auth-eyebrow">
            YOUR PERSONAL PRODUCTIVITY HUB
          </p>

          <h1>Welcome to FocusFlow.</h1>

          <p className="auth-subtitle">
            Let's set up your workspace.
            Enter your name and date of birth to continue.
          </p>

          <form onSubmit={handleProfileSubmit}>
            <label>
              Your Name

              <input
                type="text"
                value={nameInput}
                onChange={(event) =>
                  setNameInput(event.target.value)
                }
                placeholder="Enter your name"
                maxLength={60}
                required
              />
            </label>

            <label>
              Date of Birth

              <input
                type="date"
                value={dobInput}
                max={today}
                onChange={(event) =>
                  setDobInput(event.target.value)
                }
                required
              />
            </label>

            {profileError && (
              <p className="auth-message">
                {profileError}
              </p>
            )}

            <button type="submit">
              Continue to Dashboard
            </button>
          </form>

          <p className="auth-subtitle">
            Your details are saved locally in this browser.
          </p>
        </section>
      </main>
    );
  }

  // Main application
  return (
    <div className={`app-shell ${theme}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✦</span>

          <div>
            <h2>FocusFlow</h2>
            <small>WORKSPACE</small>
          </div>
        </div>

        <div className="sidebar-label">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={
                activeView === item.name ? "active" : ""
              }
              onClick={() => {
                setActiveView(item.name);
                setFilter("All");
                setSearch("");
              }}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-mini-card">
          <span>✧</span>
          <h3>Stay focused.</h3>
          <p>
            Small steps every day lead to big results.
          </p>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {profile.name.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{profile.name}</strong>
            <small>Personal workspace</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {activeView}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              className="theme-button"
              onClick={() =>
                setTheme((current) =>
                  current === "light" ? "dark" : "light"
                )
              }
            >
              {theme === "light"
                ? "☾ Dark Mode"
                : "☀ Light Mode"}
            </button>

            <button
              className="theme-button"
              onClick={changeProfile}
            >
              Change Profile
            </button>
          </div>
        </header>

        <div className="workspace-content">
          {renderCurrentView()}
        </div>

        <footer className="app-footer">
          © 2026 FocusFlow. Built for better productivity.
        </footer>
      </main>
    </div>
  );
}

export default App;
