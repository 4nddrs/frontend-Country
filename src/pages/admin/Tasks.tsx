import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import { AddButton, AdminSection, SaveButton, CancelButton } from '../../components/ui/admin-buttons';
import { confirmDialog } from '../../utils/confirmDialog';

const API_URL = 'https://api.countryclub.doc-ia.cloud/tasks/';

interface Task {
  idTask?: number;
  taskName: string;
  description?: string;
  assignmentDate: string;
  completionDate: string;
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
  const [editingData, setEditingData] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const isEditModalOpen = editingId !== null && editingData !== null;

  const STATUS_OPTIONS = ['Asignada', 'En progreso', 'Completada', 'Cancelada'];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'En progreso':
        return {
          card: 'from-amber-500/10 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]',
          dot: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
          title: 'text-amber-300',
          toggle: 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15',
        };
      case 'Completada':
        return {
          card: 'from-emerald-500/10 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]',
          dot: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
          title: 'text-emerald-300',
          toggle: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15',
        };
      case 'Cancelada':
        return {
          card: 'from-rose-500/10 hover:shadow-[0_0_12px_rgba(244,63,94,0.25)]',
          dot: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
          title: 'text-rose-300',
          toggle: 'border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15',
        };
      default: // Pendiente
        return {
          card: 'from-slate-500/10 hover:shadow-[0_0_12px_rgba(148,163,184,0.25)]',
          dot: 'bg-slate-400 shadow-[0_0_12px_rgba(148,163,184,0.6)]',
          title: 'text-slate-300',
          toggle: 'border-slate-500/40 bg-slate-500/10 text-slate-300 hover:bg-slate-500/15',
        };
    }
  };

  useEffect(() => {
    if (!isEditModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelEdit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditModalOpen]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al obtener tareas');
      const data = await res.json();
      setTasks([...data].sort((a: Task, b: Task) => (b.idTask ?? 0) - (a.idTask ?? 0)));
    } catch {
      toast.error('No se pudo cargar tareas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("https://api.countryclub.doc-ia.cloud/task-categories/");
      if (!res.ok) throw new Error("Error al obtener categorías");
      const data = await res.json();
      setCategories(data);
    } catch {
      // Silenciar error de carga
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("https://api.countryclub.doc-ia.cloud/employees/");
      if (!res.ok) throw new Error("Error al obtener empleados");
      const data = await res.json();
      setEmployees(data);
    } catch {
      // Silenciar error de carga
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

  const updateTask = async (id: number) => {
    if (!editingData) return;
    try {
      const res = await fetch(`${API_URL}${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!res.ok) throw new Error('Error al actualizar tarea');
      toast.success('Tarea actualizada!');
      setEditingId(null);
      setEditingData(null);
      fetchTasks();
    } catch {
      toast.error('No se pudo actualizar tarea.');
    }
  };

  const deleteTask = async (id: number) => {
    const confirmed = await confirmDialog({
      title: '¿Eliminar tarea?',
      description: 'Esta acción eliminará la tarea permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_URL}${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar tarea');
      toast.success('Tarea eliminada!');
      fetchTasks();
    } catch {
      toast.error('No se pudo eliminar tarea.');
    }
  };

  const handleEditClick = (task: Task) => {
    setEditingId(task.idTask!);
    setEditingData({
      ...task,
      assignmentDate: task.assignmentDate?.slice(0, 10) || '',
      completionDate: task.completionDate?.slice(0, 10) || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  return (
    <div className="bg-white/0 backdrop-blur-lg p-6 rounded-2xl mb-8 border border-[#167C79] shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-[#F8F4E3]">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#bdab62]">Gestión de Tareas</h1>

      <AdminSection>
        <h2 className="text-xl font-semibold mb-4 text-teal-400">Agregar Nueva Tarea</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 text-sm text-slate-300">Nombre de la tarea</label>
            <input type="text" name="taskName" value={newTask.taskName}
              placeholder="Ej: Alimentar caballos..."
              onChange={e => setNewTask({ ...newTask, taskName: e.target.value })}
              className="select-field w-full placeholder-gray-400" />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-300">Descripción</label>
            <input type="text" name="description" value={newTask.description}
              placeholder="Ej: Descripción de la tarea..."
              onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              className="select-field w-full placeholder-gray-400" />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-300">Fecha de asignación</label>
            <input type="date" name="assignmentDate" value={newTask.assignmentDate}
              onChange={e => setNewTask({ ...newTask, assignmentDate: e.target.value })}
              className="select-field w-full placeholder-gray-400" />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-300">Fecha de finalización</label>
            <input type="date" name="completionDate" value={newTask.completionDate}
              onChange={e => setNewTask({ ...newTask, completionDate: e.target.value })}
              className="select-field w-full placeholder-gray-400" />
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-300">Estado</label>
            <select value={newTask.taskStatus}
              onChange={e => setNewTask({ ...newTask, taskStatus: e.target.value })}
              className="select-field w-full">
              <option value="">-- Selecciona un estado --</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-300">Categoría</label>
            <select value={newTask.fk_idTaskCategory}
              onChange={e => setNewTask({ ...newTask, fk_idTaskCategory: Number(e.target.value) })}
              className="select-field w-full">
              <option value="">-- Selecciona una categoría --</option>
              {categories.map(cat => (
                <option key={cat.idTaskCategory} value={cat.idTaskCategory}>{cat.categoryName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-slate-300">Empleado</label>
            <select value={newTask.fk_idEmployee || ''}
              onChange={e => setNewTask({ ...newTask, fk_idEmployee: Number(e.target.value) || undefined })}
              className="select-field w-full">
              <option value="">-- Selecciona un empleado --</option>
              {employees.map(emp => (
                <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end justify-end lg:col-start-3">
            <AddButton onClick={createTask} />
          </div>
        </div>
      </AdminSection>

      <AdminSection>
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-xl text-gray-400">
            <Loader size={24} className="animate-spin" />Cargando tareas...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => {
              const isExpanded = expanded[task.idTask ?? 0] ?? false;
              const categoryName = categories.find(c => c.idTaskCategory === task.fk_idTaskCategory)?.categoryName || `Categoría #${task.fk_idTaskCategory}`;
              const employeeName = employees.find(e => e.idEmployee === task.fk_idEmployee)?.fullName || 'Sin asignar';
              const st = getStatusStyles(task.taskStatus);
              return (
                <div
                  key={task.idTask}
                  className={`rounded-2xl border border-slate-800/60 bg-gradient-to-br ${st.card} via-slate-900/60 to-slate-900/90 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="flex flex-col items-center gap-2 py-5">
                    <span className={`h-4 w-4 rounded-full ${st.dot}`} />
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {task.taskStatus || 'Tarea'}
                    </span>
                  </div>

                  <div className="px-6 pb-6 space-y-4 text-sm text-slate-200">
                    <div className="text-center space-y-1">
                      <h3 className={`text-lg font-semibold ${st.title}`}>{task.taskName}</h3>
                      <p className="text-slate-400">
                        Asignada: <span className="font-medium text-slate-200">{task.assignmentDate?.slice(0, 10)}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [task.idTask ?? 0]: !prev[task.idTask ?? 0] }))}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition ${st.toggle}`}
                    >
                      {isExpanded ? <><ChevronUp size={16} /> Ver menos</> : <><ChevronDown size={16} /> Ver más</>}
                    </button>

                    {isExpanded && (
                      <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 text-xs leading-relaxed">
                        <ul className="space-y-1">
                          <li><strong>Descripción:</strong> {task.description || 'Sin descripción'}</li>
                          <li><strong>Finaliza:</strong> {task.completionDate?.slice(0, 10)}</li>
                          <li><strong>Categoría:</strong> {categoryName}</li>
                          <li><strong>Empleado:</strong> {employeeName}</li>
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-6 border-t border-slate-800 pt-6 pb-2">
                      <button
                        onClick={() => handleEditClick(task)}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {editingId !== null && editingData && createPortal(
          <div
            className="fixed inset-0 lg:left-80 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={handleCancelEdit}
          >
            <div
              className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[#167C79]/60 bg-[#0f172a] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#F8F4E3]">Editar Tarea</h3>
                  <p className="text-sm text-slate-400">Actualiza los datos.</p>
                </div>
                <button onClick={handleCancelEdit} className="rounded-lg border border-slate-500 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block mb-1">Nombre de la tarea</label>
                  <input type="text" value={editingData.taskName}
                    onChange={e => setEditingData({ ...editingData, taskName: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1">Descripción</label>
                  <input type="text" value={editingData.description || ''}
                    onChange={e => setEditingData({ ...editingData, description: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Fecha de asignación</label>
                  <input type="date" value={editingData.assignmentDate}
                    onChange={e => setEditingData({ ...editingData, assignmentDate: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Fecha de finalización</label>
                  <input type="date" value={editingData.completionDate}
                    onChange={e => setEditingData({ ...editingData, completionDate: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700" />
                </div>
                <div>
                  <label className="block mb-1">Estado</label>
                  <select value={editingData.taskStatus}
                    onChange={e => setEditingData({ ...editingData, taskStatus: e.target.value })}
                    className="w-full p-2 rounded-md bg-gray-700">
                    <option value="">-- Selecciona un estado --</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Categoría</label>
                  <select value={editingData.fk_idTaskCategory}
                    onChange={e => setEditingData({ ...editingData, fk_idTaskCategory: Number(e.target.value) })}
                    className="w-full p-2 rounded-md bg-gray-700">
                    {categories.map(cat => (
                      <option key={cat.idTaskCategory} value={cat.idTaskCategory}>{cat.categoryName}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1">Empleado</label>
                  <select value={editingData.fk_idEmployee || ''}
                    onChange={e => setEditingData({ ...editingData, fk_idEmployee: Number(e.target.value) || undefined })}
                    className="w-full p-2 rounded-md bg-gray-700">
                    <option value="">-- Sin asignar --</option>
                    {employees.map(emp => (
                      <option key={emp.idEmployee} value={emp.idEmployee}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-4">
                <CancelButton onClick={handleCancelEdit} />
                <SaveButton onClick={() => updateTask(editingId)} children="Guardar cambios" />
              </div>
            </div>
          </div>,
          document.body
        )}
      </AdminSection>
    </div>
  );
};

export default TasksManagement;
