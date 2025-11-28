import React, { useState, useRef, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { summarizeAudio } from '../services/geminiService';
import { Task } from '../types';
import { Mic, Upload, FileAudio, Check, Loader2, MessageSquareText, Plus, FileText, Search, ArrowLeft } from 'lucide-react';

interface AudioSummarizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreate: (title: string, description: string) => void;
  onTaskAppend: (taskId: string, summary: string) => void;
  tasks: Record<string, Task>;
}

export const AudioSummarizerModal: React.FC<AudioSummarizerModalProps> = ({ isOpen, onClose, onTaskCreate, onTaskAppend, tasks }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ title: string; summary: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for "Append to Existing" flow
  const [view, setView] = useState<'upload' | 'summary' | 'select-task'>('upload');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null); 
    setIsProcessing(true);
    setView('upload'); // Stay on upload view while processing

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        
        try {
          const data = await summarizeAudio(base64Data, file.type);
          setResult(data);
          setView('summary');
        } catch (error) {
          setResult({ title: "Erro", summary: "Falha ao processar o áudio. Tente novamente." });
          setView('summary');
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (error) {
      setIsProcessing(false);
      setView('summary');
    }
  };

  const handleCreateTask = () => {
    if (result) {
      onTaskCreate(result.title, result.summary);
      handleClose();
    }
  };

  const handleSelectTask = (taskId: string) => {
    if (result) {
      onTaskAppend(taskId, result.summary);
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    // Reset internal state after a delay to ensure transition is done
    setTimeout(() => {
      setResult(null);
      setFileName(null);
      setView('upload');
      setSearchQuery('');
    }, 300);
  };

  const filteredTasks = useMemo(() => {
    const taskList = Object.values(tasks) as Task[];
    if (!searchQuery) return taskList.sort((a, b) => b.createdAt - a.createdAt);
    return taskList.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => b.createdAt - a.createdAt);
  }, [tasks, searchQuery]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Resumo de Áudio (WhatsApp)">
      <div className="space-y-6">
        {view !== 'select-task' && (
          <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-800/50 flex gap-3">
            <MessageSquareText className="text-emerald-400 shrink-0 mt-1" size={20} />
            <div>
              <h4 className="text-sm font-semibold text-emerald-200">Transcrição Inteligente</h4>
              <p className="text-sm text-emerald-300/80 mt-1">
                Faça upload de um áudio (WhatsApp, Gravador) e a IA irá transcrever e resumir o pedido do cliente.
              </p>
            </div>
          </div>
        )}

        {/* UPLOAD VIEW */}
        {view === 'upload' && (
          <div 
            className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-slate-800/50 transition-all group min-h-[250px]"
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="audio/*, .ogg, .mp3, .wav, .m4a"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
            
            {isProcessing ? (
              <div className="flex flex-col items-center animate-pulse">
                <Loader2 size={40} className="text-emerald-500 animate-spin mb-3" />
                <p className="text-emerald-400 font-medium">Ouvindo e resumindo...</p>
                <p className="text-slate-500 text-xs mt-1">Isso pode levar alguns segundos</p>
              </div>
            ) : (
              <>
                <div className="bg-slate-800 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={32} className="text-emerald-400" />
                </div>
                <p className="text-white font-medium mb-1">Clique para enviar áudio</p>
                <p className="text-slate-500 text-sm">Suporta MP3, WAV, OGG (WhatsApp)</p>
              </>
            )}
          </div>
        )}

        {/* SUMMARY REVIEW VIEW */}
        {view === 'summary' && result && (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700">
                <FileAudio size={16} className="text-emerald-400" />
                <span className="text-xs text-slate-400 font-mono truncate">{fileName}</span>
                <span className="ml-auto text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded">Processado</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sugestão de Título</label>
                  <p className="text-white font-medium text-lg">{result.title}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumo / Ação</label>
                  <p className="text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-3 rounded-md mt-1 border border-slate-700/50 max-h-40 overflow-y-auto custom-scrollbar">
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setView('upload')} className="mr-auto">
                Cancelar
              </Button>
              <Button variant="secondary" onClick={() => setView('select-task')} icon={<FileText size={16} />}>
                Adicionar a Existente
              </Button>
              <Button onClick={handleCreateTask} icon={<Plus size={16} />}>
                Criar Nova Tarefa
              </Button>
            </div>
          </div>
        )}

        {/* SELECT TASK VIEW */}
        {view === 'select-task' && (
          <div className="animate-in fade-in slide-in-from-right-5 flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setView('summary')} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
              </button>
              <h3 className="text-white font-medium">Selecione a tarefa para anexar</h3>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder="Buscar tarefa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredTasks.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  Nenhuma tarefa encontrada.
                </div>
              ) : (
                filteredTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task.id)}
                    className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-lg group transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h5 className="text-slate-200 font-medium text-sm mb-1">{task.title}</h5>
                      <div className="flex gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border bg-slate-900 border-slate-600 text-slate-400`}>
                          {task.priority}
                        </span>
                        {task.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] text-slate-500">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 text-emerald-400">
                      <Plus size={18} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};