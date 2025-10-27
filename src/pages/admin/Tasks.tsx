import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Save, Trash2, Loader, X } from 'lucide-react';

const API_URL = 'https://backend-country-nnxe.onrender.com/tasks/';

interface Task {
  idTask?: number;
  taskName: string;
  description?: string;
  assignmentDate: string; // ISO date
  completionDate: string; // ISO date
  taskStatus: string;
  fk_idTaskCategory: number;
  fk_idEmployee?: number;
}

const TasksManagement = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Task>({
    taskName: '',
    description: '',
    assignmentDate: '',
    completionDate: '',
    taskStatus: '',
    fk_idTaskCategory: 1,
    fk_idEmployee: undefined,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener tareas');
      const data = await res.json();
      setTasks(data);
    } catch {
      toast.error('No se pudo cargar tareas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
  try {
    const res = await fetch("https://backend-country-nnxe.onrender.com/task-categories/");
    if (!res.ok) throw new Error("Error al obtener categorías");
    const data = await res.json();
    console.log("Categorías obtenidas:", data);
    setCategories(data);
  } catch {
    toast.error("No se pudieron cargar categorías");
  }
};

const fetchEmployees = async () => {
  try {
    const res = await fetch("https://backend-country-nnxe.onrender.com/employees/");
    if (!res.ok) throw new Error("Error al obtener empleados");
    const data = await res.json();
    console.log("Empleados obtenidos:", data);
    setEmployees(data);
  } catch {
    toast.error("No se pudieron cargar empleados");
  }
};

  useEffect(() => {
    fetchTasks();
    fetchCategories();
    fetchEmployees();
  }, []);

  const createTask = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (!res.ok) throw new Error('Error al crear tarea');
      toast.success('Tarea creada!');
      setNewTask({
        taskName: '',
        description: '',
        assignmentDate: '',
        completionDate: '',
        taskStatus: '',
        fk_idTaskCategory: 1,
        fk_idEmployee: undefined,
      });
      fetchTasks();
    } catch {
      toast.error('No se pudo crear tarea.');
    }
  };

  const updateTask = async (id: number, updatedTask: Task) => {
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });
      if (!res.ok) throw new Error('Error al actualizar tarea');
      toast.success('Tarea actualizada!');
      setEditingId(null);
      fetchTasks();
    } catch {
      toast.error('No se pudo actualizar tarea.');
    }
  };

  const deleteTask = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar tarea');
      toast.success('Tarea eliminada!');
      fetchTasks();
    } catch {
      toast.error('No se pudo eliminar tarea.');
    }
  };

  return (
    <div  className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Tareas</h1>
      
     <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Tarea</h2>
        <div className="flex gap-4 flex-wrap">
          
          <div className="flex-1">
            <label className="text-sm mb-1 block">Nombre de la tarea</label>
            <input
              type="text"
              name="taskName"
              value={newTask.taskName}
              onChange={e => setNewTask({ ...newTask, taskName: e.target.value })}
              className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex-1">
            <label className="text-sm mb-1 block">Descripción</label>
            <input
              type="text"
              name="description"
              value={newTask.description}
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex-1">
            <label className="text-sm mb-1 block">Fecha de asignación</label>
            <input
              type="date"
              name="assignmentDate"
              value={newTask.assignmentDate}
              onChange={e => setNewTask({ ...newTask, assignmentDate: e.target.value })}
              className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex-1">
            <label className="text-sm mb-1 block">Fecha de finalización</label>
            <input
              type="date"
              name="completionDate"
              value={newTask.completionDate}
              onChange={e => setNewTask({ ...newTask, completionDate: e.target.value })}
              className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <div className="flex-1">
            <label className="text-sm mb-1 block">Estado</label>
            <input
              type="text"
              name="taskStatus"
              value={newTask.taskStatus}
              onChange={e => setNewTask({ ...newTask, taskStatus: e.target.value })}
              className="flex-1 p-2 rounded-md bg-gray-700 text-white placeholder-gray-400"
            />
          </div>

          <select
            value={newTask.fk_idTaskCategory}
            onChange={e => setNewTask({ ...newTask, fk_idTaskCategory: Number(e.target.value) })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona una categoría --</option>
            {categories.map(cat => (
              <option key={cat.idTaskCategory} value={cat.idTaskCategory}>
                {cat.categoryName}
              </option>
            ))}
          </select>

          <select
            value={newTask.fk_idEmployee || ''}
            onChange={e => setNewTask({ ...newTask, fk_idEmployee: Number(e.target.value) || undefined })}
            className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          >
            <option value="">-- Selecciona un empleado --</option>
            {employees.map(emp => (
              <option key={emp.idEmployee} value={emp.idEmployee}>
                {emp.fullName}
              </option>
            ))}
          </select>

          <button
            onClick={createTask}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-md font-semibold flex items-center gap-2"
          >
            <Plus size={20} /> Agregar
          </button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.5)] text-[#F8F4E3]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando tareas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => (
              <div key={task.idTask} className="bg-gray-700 p-4 rounded-md shadow-lg flex flex-col justify-between">
                {editingId === task.idTask ? (
                  <>
                    <input
                      type="text"
                      defaultValue={task.taskName}
                      onChange={e => setNewTask({ ...newTask, taskName: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={task.description}
                      onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                      <div className="flex-1">
                      <label className="block text-sm mb-1">Fecha de asignación</label>
                      <input
                        type="date"
                        name="assignmentDate"
                        value={newTask.assignmentDate}
                        onChange={e => setNewTask({ ...newTask, assignmentDate: e.target.value })}
                        className="w-full p-2 rounded-md bg-gray-700 text-white"
                      />
                    </div>
                    <input
                      type="date"
                      defaultValue={task.completionDate?.slice(0,10)}
                      onChange={e => setNewTask({ ...newTask, completionDate: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <input
                      type="text"
                      defaultValue={task.taskStatus}
                      onChange={e => setNewTask({ ...newTask, taskStatus: e.target.value })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    />
                    <select
                      value={newTask.fk_idTaskCategory}
                      onChange={e => setNewTask({ ...newTask, fk_idTaskCategory: Number(e.target.value) })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      {categories.map(cat => (
                        <option key={cat.idTaskCategory} value={cat.idTaskCategory}>
                          {cat.categoryName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newTask.fk_idEmployee || ''}
                      onChange={e => setNewTask({ ...newTask, fk_idEmployee: Number(e.target.value) || undefined })}
                      className="p-2 rounded-md bg-gray-600 text-white mb-2"
                    >
                      <option value="">-- Selecciona un empleado --</option>
                      {employees.map(emp => (
                        <option key={emp.idEmployee} value={emp.idEmployee}>
                          {emp.fullName}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => updateTask(task.idTask!, {
                          ...task,
                          ...newTask,
                        })}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <Save size={16} /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md flex items-center gap-1"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold">{task.taskName}</h3>
                    <p>{task.description}</p>
                    <p>Asignada: {task.assignmentDate?.slice(0,10)}</p>
                    <p>Finaliza: {task.completionDate?.slice(0,10)}</p>
                    <p>Estado: {task.taskStatus}</p>
                    <p>Categoría: {categories.find(c => c.idTaskCategory === task.fk_idTaskCategory)?.name || task.fk_idTaskCategory}</p>
                    <p>Empleado: {employees.find(e => e.idEmployee === task.fk_idEmployee)?.fullName || '-'}</p>
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => { setEditingId(task.idTask!); setNewTask(task); }}
                        className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                    bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                    shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                    hover:scale-[1.1]
                                    active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                    transition-all duration-300 ease-in-out"
                      >
                        <Edit size={28} className="text-[#E8C967] drop-shadow-[0_0_10px_rgba(255,215,100,0.85)] transition-transform duration-300 hover:rotate-3" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.idTask!)}
                        className="relative flex items-center justify-center w-15 h-15 rounded-[20px]
                                  bg-gradient-to-b from-[#1A1C1E] to-[#0E0F10]
                                  shadow-[8px_8px_16px_rgba(0,0,0,0.85),-5px_-5px_12px_rgba(255,255,255,0.06)]
                                  hover:scale-[1.1]
                                  active:shadow-[inset_5px_5px_12px_rgba(0,0,0,0.9),inset_-4px_-4px_10px_rgba(255,255,255,0.05)]
                                  transition-all duration-300 ease-in-out"
                      >
                        <Trash2 size={28} className="text-[#E86B6B] drop-shadow-[0_0_12px_rgba(255,80,80,0.9)] transition-transform duration-300 hover:-rotate-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksManagement;