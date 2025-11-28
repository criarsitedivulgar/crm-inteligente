import React from 'react';
import { ColumnData, Task, ColumnId } from '../../types';
import { KanbanCard } from './Card';
import { Plus } from 'lucide-react';

interface ColumnProps {
  column: ColumnData;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onAddTask: (columnId: ColumnId) => void;
  onDrop: (e: React.DragEvent, columnId: ColumnId) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onEditTask: (task: Task) => void;
  onToggleTimer: (taskId: string) => void;
}

const columnColors = {
  [ColumnId.TODO]: 'border-t-slate-500',
  [ColumnId.IN_PROGRESS]: 'border-t-indigo-500',
  [ColumnId.DONE]: 'border-t-emerald-500'
};

export const KanbanColumn: React.FC<ColumnProps> = ({ 
  column, 
  tasks, 
  onDeleteTask, 
  onAddTask,
  onDrop,
  onDragOver,
  onDragStart,
  onEditTask,
  onToggleTimer
}) => {
  return (
    <div 
      className="flex flex-col h-full min-w-[320px] w-[380px] bg-slate-900/50 rounded-xl border border-slate-800/50 backdrop-blur-sm shadow-xl transition-all"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* Header atualizado: Adicionado padding superior extra (pt-4) e espaçamento para evitar 'pegar na linha' */}
      <div className={`px-5 py-4 border-t-4 rounded-t-xl bg-slate-800 ${columnColors[column.id]} flex justify-between items-center shadow-sm`}>
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-slate-100 tracking-wide text-sm uppercase mt-0.5">{column.title}</h3>
          <span className="bg-slate-700/80 text-slate-300 text-xs px-2 py-0.5 rounded-full font-mono border border-slate-600 mt-0.5">
            {tasks.length}
          </span>
        </div>
        <button 
          onClick={() => onAddTask(column.id)}
          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Adicionar Tarefa"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto min-h-[100px] transition-colors scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {tasks.map((task) => (
          <KanbanCard 
            key={task.id} 
            task={task} 
            onDelete={onDeleteTask} 
            onDragStart={onDragStart}
            onClick={onEditTask}
            onToggleTimer={onToggleTimer}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-800/50 rounded-lg flex flex-col items-center justify-center text-slate-600 text-sm gap-2 mt-2">
            <span className="opacity-50 font-medium">Vazio</span>
            <span className="text-xs opacity-40">Arraste tarefas aqui</span>
          </div>
        )}
      </div>
    </div>
  );
};