import React, { useState } from 'react';
import { Task, Priority, AppSettings, ColumnId } from '../../types';
import { Trash2, GripVertical, Play, Pause, RotateCw, Calendar, Paperclip, Bell, CheckCircle2, ThumbsUp, ThumbsDown, XCircle } from 'lucide-react';
import { sendWhatsAppNotification } from '../../services/whatsappService';

interface CardProps {
  task: Task;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  // Novos props para reordenação
  onDrop?: (e: React.DragEvent, taskId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  
  onClick: (task: Task) => void;
  onToggleTimer: (id: string) => void;
  onApproveBudget?: (id: string) => void;
  onRejectBudget?: (id: string) => void;
  settings: AppSettings;
  columnId?: ColumnId;
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

// SVG Oficial do WhatsApp
const WhatsAppIcon = ({ size = 14, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export const KanbanCard: React.FC<CardProps> = ({ task, onDelete, onDragStart, onDrop, onDragOver, onClick, onToggleTimer, onApproveBudget, onRejectBudget, settings, columnId }) => {
  const [isSending, setIsSending] = useState(false);

  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!task.clientPhone) {
      alert("Por favor, adicione um telefone na tarefa primeiro!");
      onClick(task);
      return;
    }

    setIsSending(true);
    try {
      // Passa isBilling = true se estiver na coluna de cobrança
      const isBilling = columnId === ColumnId.BILLING;
      const success = await sendWhatsAppNotification(task, settings, isBilling);
      if (success) {
        alert("Mensagem enviada com sucesso via API!");
      }
    } catch (error) {
      alert("Erro ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  const hasAttachments = task.attachments && task.attachments.length > 0;
  
  // Verifica se está atrasada
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.recurrence === 'none';
  
  // Verifica se está recusada (apenas para Budget)
  const isRejected = columnId === ColumnId.BUDGET && task.isRejected;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop && onDrop(e, task.id)}
      onClick={() => onClick(task)}
      className={`group relative bg-slate-800 p-4 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-500/50 hover:shadow-md transition-all duration-200 mb-3 
        ${task.isTimerRunning ? 'ring-1 ring-emerald-500/50 border-emerald-500/30' : isRejected ? 'border-red-900/50 bg-red-900/5 opacity-80' : 'border-slate-700'} 
        ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2">
           <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${priorityColors[task.priority]}`}>
             {task.priority}
           </span>
           {isRejected && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-red-800 bg-red-900/50 text-red-200 flex items-center gap-1">
                 <XCircle size={10} /> Recusado
              </span>
           )}
        </div>
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

      <h4 className={`text-slate-100 font-medium mb-1 leading-snug ${isRejected ? 'line-through decoration-red-500/50 text-slate-500' : ''}`}>{task.title}</h4>
      
      {task.description && (
        <p className="text-slate-400 text-sm line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Metadata Row: Date & Recurrence & Finance */}
      <div className="flex gap-3 mb-3 text-xs text-slate-400 flex-wrap items-center">
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400 font-bold' : ''}`}>
              <Calendar size={12} className={isOverdue ? 'text-red-400' : 'text-indigo-400'} />
              {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              {isOverdue && '!'}
            </span>
          )}
          {task.notifyClient && (
            <span className="flex items-center gap-1 text-emerald-400" title="Notificação ativa para o cliente">
              <Bell size={12} />
              <span className="text-[10px]">Lembrete</span>
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
          {/* Indicador de Pagamento */}
          {task.isPaid && (
             <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-900/20 px-1.5 py-0.5 rounded" title="Pagamento Efetuado">
               <CheckCircle2 size={12} />
               PAGO
             </span>
          )}
          {!task.isPaid && task.billingValue !== undefined && task.billingValue > 0 && (
             <span className="flex items-center gap-1 text-yellow-400 font-medium bg-yellow-900/10 px-1.5 py-0.5 rounded whitespace-nowrap" title="Pagamento Pendente">
               R$ {Number(task.billingValue).toFixed(2)}
             </span>
          )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
        <div className="flex gap-2">
           {/* Action Control: Timer or Approve/Reject */}
           {columnId === ColumnId.BUDGET ? (
             <div className="flex gap-1">
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   onApproveBudget && onApproveBudget(task.id);
                 }}
                 className="flex items-center gap-1 text-xs font-bold rounded-full px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm shadow-emerald-500/20"
                 title="Aprovar Orçamento"
               >
                 <ThumbsUp size={12} />
               </button>
               {!isRejected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRejectBudget && onRejectBudget(task.id);
                    }}
                    className="flex items-center gap-1 text-xs font-bold rounded-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm shadow-red-500/20"
                    title="Recusar Orçamento"
                  >
                    <ThumbsDown size={12} />
                  </button>
               )}
             </div>
           ) : (
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onToggleTimer(task.id);
               }}
               className={`flex items-center gap-2 text-sm font-bold font-mono rounded-full px-3 py-1.5 transition-colors ${task.isTimerRunning ? 'bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-500/50' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
             >
               {task.isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
               {formatTime(task.timeSpent)}
             </button>
           )}

          {/* WhatsApp Button - ICON ONLY */}
          <button
            onClick={handleWhatsAppClick}
            disabled={isSending}
            className={`flex items-center justify-center rounded-full w-8 h-8 transition-colors shadow-sm ${
              columnId === ColumnId.BILLING 
                ? 'bg-yellow-600 text-white hover:bg-yellow-500 shadow-yellow-500/20'
                : task.clientPhone 
                  ? 'bg-[#25D366] text-white hover:bg-[#1faa51] shadow-green-500/20' 
                  : 'bg-slate-700/50 text-slate-500 hover:bg-slate-600 hover:text-white'
            }`}
            title={columnId === ColumnId.BILLING ? "Enviar Cobrança" : (task.clientPhone ? "Enviar para WhatsApp" : "Adicionar Telefone")}
          >
            {isSending ? (
              <RotateCw size={16} className="animate-spin" />
            ) : (
              <WhatsAppIcon size={18} />
            )}
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