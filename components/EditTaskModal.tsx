import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Task, Priority, RecurrenceType, Attachment } from '../types';
import { Save, Calendar, Clock, RotateCw, Phone, Paperclip, X, FileText, Image as ImageIcon, Trash2, User } from 'lucide-react';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (updatedTask: Task) => void;
}

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, task, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [tags, setTags] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [clientPhone, setClientPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setTags(task.tags.join(', '));
      setDueDate(task.dueDate || '');
      setRecurrence(task.recurrence || 'none');
      setRecurrenceDays(task.recurrenceDays || []);
      setClientPhone(task.clientPhone || '');
      setClientName(task.clientName || '');
      setAttachments(task.attachments || []);
    }
  }, [task]);

  const toggleDay = (dayIndex: number) => {
    setRecurrenceDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit size to 500KB for localStorage demo safety
    if (file.size > 500 * 1024) {
      alert("Para esta demonstração, o arquivo deve ter no máximo 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
        data: base64,
        createdAt: Date.now()
      };
      setAttachments(prev => [...prev, newAttachment]);
    };
    reader.readAsDataURL(file);
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = () => {
    if (!task) return;
    
    const updatedTask: Task = {
      ...task,
      title,
      description,
      priority,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      dueDate: dueDate || undefined,
      recurrence,
      recurrenceDays: recurrence === 'weekly' ? recurrenceDays : undefined,
      clientPhone: clientPhone || undefined,
      clientName: clientName || undefined,
      attachments
    };

    onSave(updatedTask);
    onClose();
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Tarefa">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="O que precisa ser feito?"
            autoFocus
          />
        </div>

        {/* Cliente e Telefone */}
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
               <User size={14} /> Nome do Cliente
             </label>
             <input
               type="text"
               value={clientName}
               onChange={(e) => setClientName(e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
               placeholder="Ex: Empresa X"
             />
          </div>
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
               <Phone size={14} /> Telefone Cliente
             </label>
             <input
               type="tel"
               value={clientPhone}
               onChange={(e) => setClientPhone(e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
               placeholder="5511999999999"
             />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
               <Calendar size={14} /> Data de Entrega
             </label>
             <input 
               type="date"
               value={dueDate}
               onChange={(e) => setDueDate(e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
             />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
               <RotateCw size={14} /> Recorrência
             </label>
             <select
               value={recurrence}
               onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
               className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none"
             >
               <option value="none">Sem recorrência</option>
               <option value="daily">Diária</option>
               <option value="weekly">Semanal</option>
               <option value="monthly">Mensal</option>
             </select>
          </div>
        </div>

        {recurrence === 'weekly' && (
          <div className="animate-in fade-in slide-in-from-top-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dias da Semana
            </label>
            <div className="flex gap-1 justify-between bg-slate-800 p-1.5 rounded-lg border border-slate-700">
              {WEEK_DAYS.map((day, index) => {
                const isSelected = recurrenceDays.includes(index);
                return (
                  <button
                    key={index}
                    onClick={() => toggleDay(index)}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-800' 
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            placeholder="Adicione detalhes..."
          />
        </div>

        {/* Anexos */}
        <div>
           <div className="flex items-center justify-between mb-2">
             <label className="block text-sm font-medium text-slate-300">
               Anexos (Contratos / Imagens)
             </label>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
             >
               <Paperclip size={12} /> Adicionar
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*,application/pdf"
               onChange={handleFileChange}
             />
           </div>
           
           <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-2 min-h-[60px] flex flex-wrap gap-2">
              {attachments.length === 0 && (
                <span className="text-xs text-slate-500 w-full text-center py-2">Nenhum arquivo anexado</span>
              )}
              {attachments.map(att => (
                <div key={att.id} className="relative group bg-slate-800 border border-slate-600 rounded p-2 flex items-center gap-2 pr-6 max-w-[200px]">
                  {att.type === 'image' ? (
                    <img src={att.data} className="w-8 h-8 rounded object-cover" alt="thumb" />
                  ) : (
                    <FileText size={20} className="text-slate-400 shrink-0" />
                  )}
                  <span className="text-xs text-slate-300 truncate">{att.name}</span>
                  <button 
                    onClick={() => removeAttachment(att.id)}
                    className="absolute right-1 top-1.5 text-slate-500 hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Prioridade
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none"
            >
              {Object.values(Priority).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Ex: design, bug (separar por vírgula)"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            icon={<Save size={16} />}
            disabled={!title.trim()}
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </Modal>
  );
};