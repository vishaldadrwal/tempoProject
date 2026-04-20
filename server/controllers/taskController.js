import { getData, saveData } from '../config/jsonDb.js';

const calcDuration = (startTime, endTime) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  return Math.max(0, endMinutes - startMinutes);
};

export const createTask = async (req, res) => {
  try {
    const { taskName, category, startTime, endTime, date } = req.body;
    if (!taskName || !category || !startTime || !endTime || !date) {
      return res.status(400).json({ message: 'All task fields are required' });
    }

    const duration = calcDuration(startTime, endTime);
    if (duration <= 0) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const db = await getData();
    const newTask = {
      id: Date.now().toString(),
      userId: req.user.id,
      taskName,
      category,
      startTime,
      endTime,
      duration,
      date,
      completed: false,
      createdAt: new Date().toISOString()
    };

    db.tasks.push(newTask);
    await saveData(db);

    res.status(201).json({ message: 'Task created successfully', task: newTask });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

export const getTasks = async (req, res) => {
  try {
    const db = await getData();
    let tasks = db.tasks.filter(t => t.userId === req.user.id);
    
    if (req.query.date) tasks = tasks.filter(t => t.date === req.query.date);
    if (req.query.category) tasks = tasks.filter(t => t.category === req.query.category);

    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

export const getStats = async (req, res) => {
  try {
    const db = await getData();
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const todayTasks = db.tasks.filter(t => t.userId === userId && t.date === today);

    const totalTasks = todayTasks.length;
    const totalMinutes = todayTasks.reduce((sum, t) => sum + t.duration, 0);
    const productiveMinutes = todayTasks
      .filter(t => ['study', 'work', 'exercise'].includes(t.category))
      .reduce((sum, t) => sum + t.duration, 0);
    const breakMinutes = todayTasks
      .filter(t => t.category === 'break')
      .reduce((sum, t) => sum + t.duration, 0);

    const productivityPercent = totalMinutes > 0 ? Math.round((productiveMinutes / totalMinutes) * 100) : 0;

    const categoryBreakdown = {};
    todayTasks.forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.duration;
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = db.tasks.filter(t => t.userId === userId && t.date === dateStr);
      const dayTotal = dayTasks.reduce((s, t) => s + t.duration, 0);
      const dayProductive = dayTasks
        .filter(t => ['study', 'work', 'exercise'].includes(t.category))
        .reduce((s, t) => s + t.duration, 0);
      
      last7Days.push({
        date: dateStr,
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        totalMinutes: dayTotal,
        productiveMinutes: dayProductive,
        productivityPercent: dayTotal > 0 ? Math.round((dayProductive / dayTotal) * 100) : 0
      });
    }

    const completedCount = todayTasks.filter(t => t.completed).length;

    res.status(200).json({
      stats: {
        totalTasks,
        totalMinutes,
        productiveMinutes,
        breakMinutes,
        productivityPercent,
        completedCount,
        categoryBreakdown,
        last7Days,
        totalHours: (totalMinutes / 60).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const db = await getData();
    const taskIndex = db.tasks.findIndex(t => t.id === req.params.id);

    if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });
    if (db.tasks[taskIndex].userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { taskName, category, startTime, endTime, date } = req.body;
    const task = db.tasks[taskIndex];

    const newStart = startTime || task.startTime;
    const newEnd = endTime || task.endTime;
    const duration = calcDuration(newStart, newEnd);

    db.tasks[taskIndex] = {
      ...task,
      taskName: taskName || task.taskName,
      category: category || task.category,
      startTime: newStart,
      endTime: newEnd,
      duration,
      date: date || task.date
    };

    await saveData(db);
    res.status(200).json({ message: 'Task updated successfully', task: db.tasks[taskIndex] });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating task' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const db = await getData();
    const taskIndex = db.tasks.findIndex(t => t.id === req.params.id);

    if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });
    if (db.tasks[taskIndex].userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    db.tasks.splice(taskIndex, 1);
    await saveData(db);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting task' });
  }
};

export const toggleComplete = async (req, res) => {
  try {
    const db = await getData();
    const taskIndex = db.tasks.findIndex(t => t.id === req.params.id);

    if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });
    if (db.tasks[taskIndex].userId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const newStatus = !db.tasks[taskIndex].completed;
    db.tasks[taskIndex].completed = newStatus;
    db.tasks[taskIndex].completedAt = newStatus ? new Date().toISOString() : null;

    await saveData(db);
    res.status(200).json({ message: newStatus ? 'Task completed!' : 'Task incomplete.', task: db.tasks[taskIndex] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};