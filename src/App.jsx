import { useState, useEffect } from 'react';
import './App.css';

// Si existe la variable de entorno de producción usa esa, de lo contrario usa localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
//comentario de prueba para ver si funciona el deploy en Vercel
function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar tareas al iniciar
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error al cargar tareas:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1, title: newTitle })
      });
      const createdTask = await res.json();
      setTasks([createdTask, ...tasks]);
      setNewTitle('');
    } catch (err) {
      console.error('Error al agregar tarea:', err);
    }
  };

  const toggleTask = async (id, completed) => {
    try {
      await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !completed } : t));
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>TaskPulse ⚡ (PWA)</h1>
      
      <form onSubmit={addTask} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Escribe una nueva tarea..." 
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ flex: 1, padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px 16px' }}>Agregar</button>
      </form>

      {loading ? (
        <p>Cargando tareas desde Neon...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map(task => (
            <li 
              key={task.id} 
              onClick={() => toggleTask(task.id, task.completed)}
              style={{
                padding: '12px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                textDecoration: task.completed ? 'line-through' : 'none',
                opacity: task.completed ? 0.6 : 1
              }}
            >
              {task.completed ? '✅' : '⏳'} {task.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;