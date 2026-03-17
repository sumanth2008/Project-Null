import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../components/AuthContext';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CheckCircle2, Circle, Trash2, Plus, Calendar, Edit2, X, Loader2, ListTodo, Bell, ArrowUpDown, Filter } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isToday, isPast, parseISO } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Timestamp;
}

type FilterStatus = 'all' | 'active' | 'completed';
type SortOption = 'created_desc' | 'created_asc' | 'due_asc' | 'due_desc';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sort, setSort] = useState<SortOption>('created_desc');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = [];
      snapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Reminder Notification System
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const checkReminders = () => {
      tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
          const due = parseISO(task.dueDate);
          if (isToday(due)) {
            const notified = localStorage.getItem(`notified_${task.id}`);
            if (!notified && Notification.permission === 'granted') {
              new Notification('Task Due Today', {
                body: `${task.title} is due today!`,
                icon: '/favicon.ico'
              });
              localStorage.setItem(`notified_${task.id}`, 'true');
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [tasks]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(null);
    setPriority('medium');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    const formattedDate = dueDate ? dueDate.toISOString() : '';

    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', editingId), {
          title,
          description,
          dueDate: formattedDate,
          priority,
          updatedAt: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'users', user.uid, 'tasks'), {
          userId: user.uid,
          title,
          description,
          dueDate: formattedDate,
          priority,
          completed: false,
          createdAt: Timestamp.now()
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const toggleComplete = async (task: Task) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'tasks', task.id), {
        completed: !task.completed,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const startEdit = (task: Task) => {
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate ? parseISO(task.dueDate) : null);
    setPriority(task.priority || 'medium');
    setEditingId(task.id);
    setIsAdding(true);
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter
    if (filter === 'active') result = result.filter(t => !t.completed);
    if (filter === 'completed') result = result.filter(t => t.completed);

    // Sort
    result.sort((a, b) => {
      if (sort === 'created_desc') return b.createdAt.toMillis() - a.createdAt.toMillis();
      if (sort === 'created_asc') return a.createdAt.toMillis() - b.createdAt.toMillis();
      
      const dateA = a.dueDate ? parseISO(a.dueDate).getTime() : (sort === 'due_asc' ? Infinity : -Infinity);
      const dateB = b.dueDate ? parseISO(b.dueDate).getTime() : (sort === 'due_asc' ? Infinity : -Infinity);
      
      if (sort === 'due_asc') return dateA - dateB;
      if (sort === 'due_desc') return dateB - dateA;
      return 0;
    });

    return result;
  }, [tasks, filter, sort]);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full font-mono bg-black overflow-y-auto transition-colors duration-300">
      <header className="p-4 border-b border-zinc-800 bg-black flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-emerald-400" /> Mission Objectives
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <Filter className="w-4 h-4 text-zinc-400 ml-2" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as FilterStatus)}
              className="bg-transparent text-sm text-zinc-300 focus:outline-none border-none py-1 pr-2"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <ArrowUpDown className="w-4 h-4 text-zinc-400 ml-2" />
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-transparent text-sm text-zinc-300 focus:outline-none border-none py-1 pr-2"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
              <option value="due_asc">Due Date (Earliest)</option>
              <option value="due_desc">Due Date (Latest)</option>
            </select>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          )}
        </div>
      </header>

      <div className="p-8 max-w-4xl mx-auto w-full">
        {isAdding && (
          <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-zinc-100">
                {editingId ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button type="button" onClick={resetForm} className="text-zinc-400 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                  placeholder="Task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50 resize-none h-24"
                  placeholder="Task details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1">Due Date</label>
                  <div className="relative">
                    <DatePicker
                      selected={dueDate}
                      onChange={(date) => setDueDate(date)}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 pl-10 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                      placeholderText="Select a date"
                      dateFormat="MMMM d, yyyy"
                      isClearable
                    />
                    <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-bold text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                  {editingId ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="text-center text-zinc-500 mt-20">
            <ListTodo className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No tasks found. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedTasks.map((task) => (
              <div 
                key={task.id} 
                className={`bg-zinc-900 border ${task.completed ? 'border-emerald-500/30 bg-emerald-900/10' : 'border-zinc-800'} rounded-2xl p-5 flex items-start gap-4 transition-colors`}
              >
                <button 
                  onClick={() => toggleComplete(task)}
                  className={`mt-1 flex-shrink-0 ${task.completed ? 'text-emerald-500' : 'text-zinc-500 hover:text-emerald-500'}`}
                >
                  {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-lg font-bold ${task.completed ? 'text-zinc-600 line-through' : 'text-zinc-100'}`}>
                      {task.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(task.priority || 'medium')}`}>
                      {task.priority || 'medium'}
                    </span>
                  </div>
                  {task.description && (
                    <p className={`mt-1 text-sm ${task.completed ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {task.description}
                    </p>
                  )}
                  {task.dueDate && (
                    <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${task.completed ? 'text-zinc-600' : (isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) ? 'text-red-400' : 'text-zinc-400')}`}>
                      <Calendar className="w-3 h-3" />
                      Due: {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                      {!task.completed && isToday(parseISO(task.dueDate)) && (
                        <span className="ml-2 flex items-center gap-1 text-yellow-500">
                          <Bell className="w-3 h-3" /> Due Today
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={() => startEdit(task)}
                    className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
