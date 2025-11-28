import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Task, Attachment } from '../types';
import { FileText, Image as ImageIcon, Download, Calendar, Search } from 'lucide-react';

interface MediaGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Record<string, Task>;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ isOpen, onClose, tasks }) => {
  const [filter, setFilter] = useState<'all' | 'image' | 'pdf'>('all');
  const [search, setSearch] = useState('');

  // Extract all attachments from all tasks
  const allAttachments = (Object.values(tasks) as Task[]).flatMap(task => 
    (task.attachments || []).map(att => ({ ...att, taskTitle: task.title }))
  ).sort((a, b) => b.createdAt - a.createdAt);

  const filtered = allAttachments.filter(att => {
    const matchesType = filter === 'all' || att.type === filter || (filter === 'pdf' && att.type !== 'image');
    const matchesSearch = att.name.toLowerCase().includes(search.toLowerCase()) || att.taskTitle.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const downloadFile = (data: string, name: string) => {
    const link = document.createElement('a');
    link.href = data;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Galeria de Arquivos & Contratos">
      <div className="flex flex-col h-[600px]">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 sticky top-0 bg-slate-900 z-10 pb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar arquivo ou tarefa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => setFilter('all')}
               className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
             >
               Todos
             </button>
             <button 
               onClick={() => setFilter('image')}
               className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === 'image' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
             >
               Imagens
             </button>
             <button 
               onClick={() => setFilter('pdf')}
               className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filter === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
             >
               Documentos
             </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <div className="bg-slate-800 p-4 rounded-full">
                <FileText size={32} opacity={0.5} />
              </div>
              <p>Nenhum arquivo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map((file) => (
                <div key={file.id} className="group bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-indigo-500/50 transition-all">
                  <div className="aspect-square bg-slate-900 relative flex items-center justify-center overflow-hidden">
                    {file.type === 'image' ? (
                      <img src={file.data} alt={file.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <FileText size={40} />
                        <span className="text-[10px] uppercase font-bold bg-slate-800 px-2 py-1 rounded">PDF / DOC</span>
                      </div>
                    )}
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                      <button 
                        onClick={() => downloadFile(file.data, file.name)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Baixar"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <h5 className="text-sm font-medium text-slate-200 truncate" title={file.name}>{file.name}</h5>
                    <p className="text-xs text-slate-500 truncate mt-0.5">Tarefa: {file.taskTitle}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-2">
                      <Calendar size={10} />
                      {new Date(file.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};