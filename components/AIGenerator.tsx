import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { generatePlanFromGoal } from '../services/geminiService';
import { GeneratedTask } from '../types';
import { Sparkles, Wand2 } from 'lucide-react';

interface AIGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksGenerated: (tasks: GeneratedTask[]) => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({ isOpen, onClose, onTasksGenerated }) => {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const tasks = await generatePlanFromGoal(goal);
      onTasksGenerated(tasks);
      onClose();
      setGoal('');
    } catch (e) {
      setError("Falha ao gerar tarefas. Verifique se a chave de API está configurada corretamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planejador IA">
      <div className="space-y-4">
        <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-800/50 flex gap-3">
          <Sparkles className="text-indigo-400 shrink-0 mt-1" size={20} />
          <div>
            <h4 className="text-sm font-semibold text-indigo-200">Como funciona?</h4>
            <p className="text-sm text-indigo-300/80 mt-1">
              Descreva seu projeto ou objetivo (ex: "Organizar uma viagem para o Japão") e a IA irá criar automaticamente um quadro Kanban com tarefas priorizadas.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Qual é o seu objetivo?
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Ex: Lançar um novo site de portfólio..."
            className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            autoFocus
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate} 
            isLoading={isLoading}
            disabled={!goal.trim()}
            icon={<Wand2 size={16} />}
          >
            Gerar Plano
          </Button>
        </div>
      </div>
    </Modal>
  );
};