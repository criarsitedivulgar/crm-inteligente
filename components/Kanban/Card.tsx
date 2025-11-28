import React from 'react';
import { Task, Priority } from '../../types';
import { Trash2, GripVertical, Play, Pause, RotateCw, Calendar, MessageCircle, Paperclip } from 'lucide-react';

interface CardProps {
  task: Task;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: (task: Task) => void;
  onToggleTimer: (id: string) => void;
}

const priorityColors = {
  [Priority.LOW]: 'bg-blue-900/50 text-blue-200 border-blue-800',
  [Priority.MEDIUM]: 'bg-yellow-900/50 text-yellow-200 border-yellow-800',
  [Priority.HIGH]: 'bg-orange-900/50 text-orange-200 border-orange-800',
  [Priority.CRITICAL]: 'bg-red-900/50 text-red-200 border-red-800',
};

const formatTime = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const KanbanCard: React.FC<CardProps> = ({ task, onDelete, onDragStart, onClick, onToggleTimer }) => {
  
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!task.clientPhone) {
      alert("Por favor, adicione um telefone na tarefa primeiro!");
      onClick(task); // Abre o modal de edição para facilitar
      return;
    }

    const phone = task.clientPhone.replace(/\D/g, ''); // Remove caracteres não numéricos
    const message = `*Tarefa:* ${task.title}\n\n*Detalhes:* ${task.description || 'Sem descrição'}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
  };

  const hasAttachments = task.attachments && task.attachments.length > 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onClick(task)}
      className={`group relative bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 mb-3 ${task.isTimerRunning ? 'ring-1 ring-emerald-500/50 border-emerald-500/30' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            onDelete(task.id);
          }}
          className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <h4 className="text-slate-100 font-medium mb-1 leading-snug">{task.title}</h4>
      
      {task.description && (
        <p className="text-slate-400 text-sm line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Metadata Row: Date & Recurrence */}
      {(task.dueDate || task.recurrence !== 'none' || hasAttachments) && (
        <div className="flex gap-3 mb-3 text-xs text-slate-400">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} className="text-indigo-400" />
              {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
          {task.recurrence !== 'none' && (
            <span className="flex items-center gap-1" title={`Recorrência: ${task.recurrence}`}>
              <RotateCw size={12} className="text-emerald-400" />
              <span className="capitalize">{task.recurrence === 'daily' ? 'Diário' : task.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}</span>
            </span>
          )}
          {hasAttachments && (
             <span className="flex items-center gap-1" title={`${task.attachments?.length} anexos`}>
               <Paperclip size={12} className="text-slate-300" />
               {task.attachments?.length}
             </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
        <div className="flex gap-2">
           {/* Timer Control */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleTimer(task.id);
            }}
            className={`flex items-center gap-2 text-xs font-mono rounded-full px-2 py-1 transition-colors ${task.isTimerRunning ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
          >
            {task.isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
            {formatTime(task.timeSpent)}
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsAppClick}
            className={`flex items-center gap-1 text-xs rounded-full px-2 py-1 transition-colors border border-transparent ${task.clientPhone ? 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40 hover:border-emerald-800' : 'bg-slate-700/30 text-slate-500 hover:bg-slate-700 hover:text-slate-300'}`}
            title={task.clientPhone ? "Enviar para WhatsApp" : "Adicionar Telefone"}
          >
            <MessageCircle size={12} />
          </button>
        </div>

        <div className="flex items-center gap-2">
           {task.tags.length > 0 && (
             <span className="flex items-center text-[10px] text-indigo-300 bg-indigo-900/30 px-1.5 py-0.5 rounded">
               #{task.tags[0]} {task.tags.length > 1 && `+`}
             </span>
           )}
           <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600">
             <GripVertical size={14} />
           </div>
        </div>
      </div>
    </div>
  );
};
