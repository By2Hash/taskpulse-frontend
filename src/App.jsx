import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://taskpulse-backend.vercel.app/api';

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('cached_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncPendingTasks();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchTasks();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Obtener tareas de la API y actualizar caché local
  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      // Preservar tareas pendientes que AÚN no se hayan sincronizado
      const localData = JSON.parse(localStorage.getItem('cached_tasks') || '[]');
      const pendingTasks = localData.filter(t => t.pending);

      const mergedTasks = [...pendingTasks, ...data];
      setTasks(mergedTasks);
      localStorage.setItem('cached_tasks', JSON.stringify(mergedTasks));
    } catch (err) {
      console.warn('Modo Offline: Usando copia local acumulada.', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Sincronizar tareas pendientes y LIMPIARLAS de localStorage
  const syncPendingTasks = async () => {
    let localData = JSON.parse(localStorage.getItem('cached_tasks') || '[]');
    const pending = localData.filter(t => t.pending);

    if (pending.length === 0) return;

    for (const task of pending) {
      try {
        const res = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: 1, title: task.title })
        });

        if (res.ok) {
          // Remover la tarea sincronizada del listado local
          localData = localData.filter(t => t.id !== task.id);
          localStorage.setItem('cached_tasks', JSON.stringify(localData));
        }
      } catch (err) {
        console.error('Error al sincronizar tarea:', err);
      }
    }

    // Una vez procesadas todas las pendientes, recargar desde Neon
    await fetchTasks();
  };

  // 3. Agregar tarea (Maneja Online y Offline)
  const addTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (navigator.onLine) {
      try {
        const res = await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: 1, title: newTitle })
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const createdTask = await res.json();
        
        const updatedTasks = [createdTask, ...tasks];
        setTasks(updatedTasks);
        localStorage.setItem('cached_tasks', JSON.stringify(updatedTasks));
        setNewTitle('');
      } catch (err) {
        saveTaskOffline(newTitle);
      }
    } else {
      saveTaskOffline(newTitle);
    }
  };

  // Guardar localmente con la marca pending: true
  const saveTaskOffline = (title) => {
    const tempTask = {
      id: `temp-${Date.now()}`,
      title: title,
      completed: false,
      pending: true
    };

    const updatedTasks = [tempTask, ...tasks];
    setTasks(updatedTasks);
    localStorage.setItem('cached_tasks', JSON.stringify(updatedTasks));
    setNewTitle('');
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>TaskPulse ⚡ (PWA)</h1>
      
      {isOffline && (
        <div style={{ background: '#ff9800', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
          📡 <b>Modo sin conexión:</b> Las tareas creadas ahora se guardan localmente y se subirán a Neon automáticamente cuando vuelva el Wi-Fi.
        </div>
      )}

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
        <p>Cargando tareas...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map(task => (
            <li 
              key={task.id} 
              style={{
                padding: '12px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                opacity: task.pending ? 0.7 : 1
              }}
            >
              <span>{task.completed ? '✅' : '⏳'} {task.title}</span>
              {task.pending && (
                <span style={{ fontSize: '12px', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>
                  🕒 Pendiente
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;