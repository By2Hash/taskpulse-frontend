import { useState, useEffect } from 'react';
import './App.css';

// 1. Obtener la URL de entorno o usar la de producción por defecto
const RAW_API_URL = import.meta.env.VITE_API_URL || 'https://taskpulse-backend.vercel.app/api';

// 2. Limpieza automática de la URL:
// Quita barras al final y asegura que siempre termine en /api
let cleanUrl = RAW_API_URL.replace(/\/+$\vert{}\/api\/*$/gi, ''); 
const API_URL = `${cleanUrl}/api`;

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar tareas al iniciar la aplicación
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error al cargar tareas desde la API:', err);
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
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const createdTask = await res.json();
      setTasks([createdTask, ...tasks]);
      setNewTitle('');
    } catch (err) {
      console.error('Error al agregar tarea:', err);
    }
  };

  const toggleTask = async (id, completed) => {
    try {
      const res = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
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