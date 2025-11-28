import React from 'react';
import { Modal } from './ui/Modal';
import { BoardData, ColumnId, Task, AppSettings } from '../types';
import { PieChart, Clock, CheckCircle, ListTodo, Trophy, TrendingUp, CalendarDays, DollarSign, User, Award } from 'lucide-react';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: BoardData;
  settings?: AppSettings;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose, board, settings }) => {
  const allTasks = Object.values(board.tasks) as Task[];
  const totalTasks = allTasks.length;
  
  const doneTasks = board.columns[ColumnId.DONE].taskIds.length;
  const inProgressTasks = board.columns[ColumnId.IN_PROGRESS].taskIds.length;
  const todoTasks = board.columns[ColumnId.TODO].taskIds.length;
  
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  
  const totalTimeMs = allTasks.reduce((acc, task) => acc + task.timeSpent, 0);
  const totalHours = Math.floor(totalTimeMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor((totalTimeMs / (1000 * 60)) % 60);

  // --- Lógica de Clientes Top 5 ---
  const hourlyRate = settings?.hourlyRate || 150;
  
  const clientStats: Record<string, { ms: number, count: number }> = {};
  
  allTasks.forEach(task => {
    // Usar 'Sem Cliente' se não houver nome definido
    const client = task.clientName && task.clientName.trim() !== '' ? task.clientName : 'Sem Cliente';
    
    if (!clientStats[client]) {
      clientStats[client] = { ms: 0, count: 0 };
    }
    clientStats[client].ms += task.timeSpent;
    clientStats[client].count += 1;
  });

  const topClients = Object.entries(clientStats)
    .sort(([, a], [, b]) => b.ms - a.ms) // Ordenar por tempo decrescente
    .slice(0, 5) // Pegar top 5
    .map(([name, data]) => {
      const hours = data.ms / (1000 * 60 * 60);
      const cost = hours * hourlyRate;
      return { name, ...data, cost, hours };
    });

  // --- Lógica de Desempenho Semanal ---
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Conta tarefas que têm completedAt e foram concluídas nos últimos 7 dias
  const completedThisWeek = allTasks.filter(t => 
    t.completedAt && t.completedAt > oneWeekAgo
  ).length;

  let weeklyRank = 'C';
  let rankColor = 'text-slate-400';
  let rankBorder = 'border-slate-500';
  let rankMessage = "Semana tranquila. Que tal acelerar?";

  if (completedThisWeek >= 10) {
    weeklyRank = 'S';
    rankColor = 'text-purple-400';
    rankBorder = 'border-purple-500';
    rankMessage = "Lendário! Produtividade máxima alcançada.";
  } else if (completedThisWeek >= 7) {
    weeklyRank = 'A';
    rankColor = 'text-emerald-400';
    rankBorder = 'border-emerald-500';
    rankMessage = "Excelente! Você destruiu suas tarefas essa semana.";
  } else if (completedThisWeek >= 4) {
    weeklyRank = 'B';
    rankColor = 'text-indigo-400';
    rankBorder = 'border-indigo-500';
    rankMessage = "Muito bom. Manteve um ritmo consistente.";
  }

  // Mensagem motivacional geral
  let feedbackMessage = "";
  if (completionRate === 0 && totalTasks > 0) feedbackMessage = "Vamos começar? O primeiro passo é o mais importante!";
  else if (completionRate < 30) feedbackMessage = "Bom começo! Continue focado para mover mais tarefas.";
  else if (completionRate < 70) feedbackMessage = "Você está indo muito bem! Mantenha o ritmo.";
  else feedbackMessage = "Excelente produtividade! Você está dominando suas tarefas.";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Estatísticas do Projeto">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
             <div className="flex items-center gap-2 text-slate-400 mb-2">
               <ListTodo size={16} />
               <span className="text-xs font-semibold uppercase">Total</span>
             </div>
             <p className="text-2xl font-bold text-white">{totalTasks}</p>
          </div>
          <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-900/50 shadow-sm">
             <div className="flex items-center gap-2 text-emerald-400 mb-2">
               <CheckCircle size={16} />
               <span className="text-xs font-semibold uppercase">Feito</span>
             </div>
             <p className="text-2xl font-bold text-emerald-200">{doneTasks}</p>
          </div>
          <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-900/50 col-span-2 shadow-sm">
             <div className="flex items-center gap-2 text-indigo-400 mb-2">
               <Clock size={16} />
               <span className="text-xs font-semibold uppercase">Tempo Total</span>
             </div>
             <p className="text-2xl font-bold text-indigo-200">
               {totalHours}h {totalMinutes}m
             </p>
          </div>
        </div>

        {/* --- Leaderboard Top Clientes --- */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
           <div className="flex items-center justify-between mb-4">
             <h4 className="text-white font-bold flex items-center gap-2">
               <Award className="text-yellow-400" size={18} />
               Top Clientes (Tempo & Custo)
             </h4>
             <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
               Base: R$ {hourlyRate.toFixed(2)}/hora
             </span>
           </div>

           {topClients.length === 0 || totalTimeMs === 0 ? (
             <div className="text-center py-6 text-slate-500 text-sm">
               Inicie o cronômetro nas tarefas para ver o ranking.
             </div>
           ) : (
             <div className="space-y-3">
               {topClients.map((client, index) => (
                 <div key={client.name} className="bg-slate-800 rounded-lg p-3 border border-slate-700/50 flex items-center justify-between group hover:border-indigo-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-yellow-900' : index === 1 ? 'bg-slate-400 text-slate-900' : index === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-700 text-slate-400'}`}>
                         {index + 1}
                       </div>
                       <div>
                         <p className="text-slate-200 text-sm font-medium">{client.name}</p>
                         <p className="text-slate-500 text-xs">{client.count} tarefas</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-emerald-400 font-bold text-sm">
                         R$ {client.cost.toFixed(2)}
                       </p>
                       <p className="text-slate-500 text-xs">
                         {Math.floor(client.hours)}h {Math.floor((client.ms / (1000 * 60)) % 60)}m
                       </p>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* Seção de Desempenho Semanal */}
        <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={100} />
          </div>
          <div className="p-5 flex items-center gap-6 relative z-10">
            <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 ${rankBorder} bg-slate-900 shadow-lg shrink-0`}>
               <span className="text-[10px] text-slate-500 font-bold uppercase">Rank</span>
               <span className={`text-3xl font-black ${rankColor}`}>{weeklyRank}</span>
            </div>
            <div className="flex-1">
               <h4 className="text-white font-bold text-lg flex items-center gap-2">
                 <CalendarDays size={18} className="text-indigo-400" />
                 Desempenho da Semana
               </h4>
               <p className="text-slate-400 text-sm mt-1 mb-2">
                 {rankMessage}
               </p>
               <div className="flex items-center gap-2 text-xs font-medium bg-slate-900/50 p-2 rounded w-fit border border-slate-700/50">
                 <TrendingUp size={14} className="text-emerald-400" />
                 <span className="text-white">{completedThisWeek}</span>
                 <span className="text-slate-500">tarefas nos últimos 7 dias</span>
               </div>
            </div>
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <h4 className="text-white font-medium">Taxa de Conclusão Total</h4>
            <span className="text-2xl font-bold text-indigo-400">{completionRate}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-4 rounded-full transition-all duration-1000 shadow-lg"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p className="text-slate-400 text-sm mt-3 italic text-center">
            "{feedbackMessage}"
          </p>
        </div>

      </div>
    </Modal>
  );
};