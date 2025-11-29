import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Task, Priority, RecurrenceType, Attachment, BillingPeriod } from '../types';
import { Save, Calendar, RotateCw, Phone, Paperclip, X, FileText, User, Loader2, Bell, DollarSign, Wallet, CreditCard } from 'lucide-react';
import { uploadTaskAttachment } from '../services/supabaseClient';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (updatedTask: Task) => void;
}

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const BILLING_LABELS: Record<BillingPeriod, string> = {
  unique: 'Pagamento Único',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual'
};

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
  const [notifyClient, setNotifyClient] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Financeiro
  const [billingValue, setBillingValue] = useState<number>(0);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('unique');
  const [billingPixKey, setBillingPixKey] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'billing'>('info');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calcula data mínima (Hoje) para o input type="date"
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDate = getTodayString();

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
      setNotifyClient(task.notifyClient || false);
      setAttachments(task.attachments || []);
      
      // Financeiro
      setBillingValue(task.billingValue || 0);
      setBillingPeriod(task.billingPeriod || 'unique');
      setBillingPixKey(task.billingPixKey || '');
      setIsPaid(task.isPaid || false);
      
      setActiveTab('info');
    }
  }, [task]);

  const toggleDay = (dayIndex: number) => {
    setRecurrenceDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadTaskAttachment(file);
      const newAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
        data: publicUrl,
        createdAt: Date.now()
      };
      setAttachments(prev => [...prev, newAttachment]);
    } catch (error) {
      console.error(error);
      alert("Erro ao fazer upload do arquivo. Verifique sua conexão.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      notifyClient,
      attachments,
      // Financeiro
      billingValue,
      billingPeriod,
      billingPixKey: billingPixKey || undefined,
      isPaid,
      paymentDate: isPaid ? (task.paymentDate || Date.now()) : undefined
    };

    onSave(updatedTask);
    onClose();
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Tarefa">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 mb-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'info' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'billing' 
                ? 'border-yellow-500 text-yellow-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Faturamento & Cobrança
          </button>
        </div>

        {/* --- ABA INFO --- */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-2">
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

            {clientPhone && (
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifyClient}
                      onChange={(e) => setNotifyClient(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Bell size={14} className={notifyClient ? "text-emerald-400" : "text-slate-500"} />
                  Lembrar cliente via WhatsApp
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                  <Calendar size={14} /> Data de Entrega
                </label>
                <input 
                  type="date"
                  value={dueDate}
                  min={minDate}
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
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                  disabled={isUploading}
                >
                  <Paperclip size={12} /> {isUploading ? 'Enviando...' : 'Adicionar'}
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
                  {attachments.length === 0 && !isUploading && (
                    <span className="text-xs text-slate-500 w-full text-center py-2">Nenhum arquivo anexado</span>
                  )}
                  
                  {isUploading && (
                    <div className="flex items-center justify-center w-full py-2 gap-2 text-xs text-indigo-300">
                      <Loader2 size={16} className="animate-spin" /> Upload em progresso...
                    </div>
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
          </div>
        )}

        {/* --- ABA FINANCEIRO --- */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
             <div className="bg-yellow-900/20 border border-yellow-800/50 p-4 rounded-lg flex gap-3">
               <Wallet className="text-yellow-500 shrink-0" size={20} />
               <div>
                 <h4 className="text-sm font-semibold text-yellow-200">Gestão de Cobrança</h4>
                 <p className="text-xs text-yellow-300/80">Configure os dados para cobrar o cliente via WhatsApp.</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                   <DollarSign size={14} /> Valor (R$)
                 </label>
                 <input
                   type="number"
                   value={billingValue}
                   onChange={(e) => setBillingValue(Number(e.target.value))}
                   className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                   placeholder="0.00"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                   <RotateCw size={14} /> Periodicidade
                 </label>
                 <select
                   value={billingPeriod}
                   onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
                   className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none appearance-none"
                 >
                   {Object.entries(BILLING_LABELS).map(([key, label]) => (
                     <option key={key} value={key}>{label}</option>
                   ))}
                 </select>
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                 <CreditCard size={14} /> Chave PIX (Para Recebimento)
               </label>
               <input
                 type="text"
                 value={billingPixKey}
                 onChange={(e) => setBillingPixKey(e.target.value)}
                 className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none font-mono text-sm"
                 placeholder="CPF, E-mail ou Aleatória"
               />
               <p className="text-[10px] text-slate-500 mt-1">Essa chave será enviada ao cliente na mensagem de cobrança.</p>
             </div>

             <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
                <div>
                   <h4 className="text-white font-medium text-sm">Status do Pagamento</h4>
                   <p className="text-xs text-slate-400">Marque se o cliente já pagou.</p>
                </div>
                <button
                  onClick={() => setIsPaid(!isPaid)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    isPaid 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {isPaid ? 'PAGO / EFETIVADO' : 'PENDENTE'}
                </button>
             </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50 mt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            icon={<Save size={16} />}
            disabled={!title.trim() || isUploading}
          >
            {isUploading ? 'Aguarde...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}