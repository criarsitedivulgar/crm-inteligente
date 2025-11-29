import React, { useState, useEffect } from 'react';
import { ColumnData, Task, ColumnId } from '../../types';
import { KanbanCard } from './Card';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppSettings } from '../../types';

interface ColumnProps {
  column: ColumnData;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onAddTask: (columnId: ColumnId) => void;
  // Atualizado para receber targetTaskId
  onDrop: (e: React.DragEvent, columnId: ColumnId, targetTaskId?: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onEditTask: (task: Task) => void;
  onToggleTimer: (taskId: string) => void;
  onApproveBudget?: (taskId: string) => void;
  onRejectBudget?: (taskId: string) => void;
  settings: AppSettings;
}

const columnColors = {
  [ColumnId.BUDGET]: 'border-t-pink-500', 
  [ColumnId.TODO]: 'border-t-slate-500',
  [ColumnId.IN_PROGRESS]: 'border-t-indigo-500',
  [ColumnId.DONE]: 'border-t-emerald-500',
  [ColumnId.BILLING]: 'border-t-yellow-500' 
};

const ITEMS_PER_PAGE = 5;

export const KanbanColumn: React.FC<ColumnProps> = ({ 
  column, 
  tasks, 
  onDeleteTask, 
  onAddTask,
  onDrop,
  onDragOver,
  onDragStart,
  onEditTask,
  onToggleTimer,
  onApproveBudget,
  onRejectBudget,
  settings
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);

  // Se a página atual ficar vazia (ex: moveu a última tarefa), volta uma página
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(Math.max(1, totalPages));
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [tasks.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTasks = tasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div 
      className="flex flex-col h-full w-full md:w-[280px] lg:w-[300px] xl:w-[340px] flex-shrink-0 bg-slate-900/50 md:rounded-xl border-x md:border border-slate-800/50 backdrop-blur-sm shadow-xl transition-all"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)} // Drop no container (fundo)
    >
      <div className={`px-3 py-3 border-t-4 md:rounded-t-xl bg-slate-800 ${columnColors[column.id]} flex justify-between items-center shadow-sm`}>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-100 tracking-wide text-xs uppercase mt-0.5 truncate max-w-[150px]" title={column.title}>{column.title}</h3>
          <span className="bg-slate-700/80 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono border border-slate-600">
            {tasks.length}
          </span>
        </div>
        <button 
          onClick={() => onAddTask(column.id)}
          className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Adicionar Tarefa"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 p-2 overflow-y-auto min-h-[100px] transition-colors scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent flex flex-col">
        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-600/50 bg-slate-800/30 rounded-lg flex flex-col items-center justify-center text-sm gap-2 mt-2 transition-colors hover:border-slate-500/50">
            <span className="text-white font-bold tracking-wide text-base">Vazio</span>
            <span className="text-xs text-slate-200 font-medium">Arraste tarefas aqui</span>
          </div>
        )}

        {paginatedTasks.map((task) => (
          <KanbanCard 
            key={task.id} 
            task={task} 
            onDelete={onDeleteTask} 
            onDragStart={onDragStart}
            // Passa a função onDrop e onDragOver para permitir reordenação
            onDrop={(e, targetId) => onDrop(e, column.id, targetId)}
            onDragOver={onDragOver}
            onClick={onEditTask}
            onToggleTimer={onToggleTimer}
            onApproveBudget={onApproveBudget}
            onRejectBudget={onRejectBudget}
            settings={settings}
            columnId={column.id} 
          />
        ))}
      </div>

      {/* Pagination Controls - Fixed at Bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-t border-slate-800 md:rounded-b-xl">
           <button 
             onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
             disabled={currentPage === 1}
             className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
           >
             <ChevronLeft size={16} />
           </button>
           
           <span className="text-[10px] font-mono text-slate-500">
             {currentPage} / {totalPages}
           </span>

           <button 
             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
             disabled={currentPage === totalPages}
             className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
           >
             <ChevronRight size={16} />
           </button>
        </div>
      )}
    </div>
  );
};