import React, { useState, useEffect } from 'react';
import { BoardData, ColumnId, Priority, Task, GeneratedTask, RecurrenceType, AppSettings, User } from './types';
import { KanbanColumn } from './components/Kanban/Column';
import { Button } from './components/ui/Button';
import { AIGenerator } from './components/AIGenerator';
import { EditTaskModal } from './components/EditTaskModal';
import { StatisticsModal } from './components/StatisticsModal';
import { SettingsModal } from './components/SettingsModal';
import { AudioSummarizerModal } from './components/AudioSummarizerModal';
import { AuthScreen } from './components/AuthScreen';
import { PricingModal } from './components/PricingModal';
import { MediaGallery } from './components/MediaGallery';
import { DocumentationModal } from './components/DocumentationModal';
import { Toast } from './components/ui/Toast';
import { Layout, Github, Sparkles, BarChart2, Settings, Mic, LogOut, User as UserIcon, Crown, FolderOpen, BookOpen } from 'lucide-react';

const INITIAL_DATA: BoardData = {
  tasks: {
    'task-1': { 
      id: 'task-1', 
      title: 'Bem-vindo ao Gerenciador', 
      description: 'Clique neste card para editar os detalhes e definir datas.', 
      priority: Priority.LOW, 
      tags: ['onboarding'], 
      createdAt: Date.now(),
      timeSpent: 0,
      isTimerRunning: false,
      recurrence: 'none',
      clientName: 'Cliente Exemplo'
    },
    'task-2': { 
      id: 'task-2', 
      title: 'Teste o Cronômetro', 
      description: 'Clique no botão Play abaixo para iniciar a contagem do tempo.', 
      priority: Priority.HIGH, 
      tags: ['feature', 'time'], 
      createdAt: Date.now(),
      timeSpent: 0,
      isTimerRunning: false,
      recurrence: 'none',
      clientName: 'Projeto Interno'
    },
  },
  columns: {
    [ColumnId.TODO]: {
      id: ColumnId.TODO,
      title: 'A Fazer',
      taskIds: ['task-1', 'task-2']
    },
    [ColumnId.IN_PROGRESS]: {
      id: ColumnId.IN_PROGRESS,
      title: 'Em Progresso',
      taskIds: []
    },
    [ColumnId.DONE]: {
      id: ColumnId.DONE,
      title: 'Feito',
      taskIds: []
    }
  },
  columnOrder: [ColumnId.TODO, ColumnId.IN_PROGRESS, ColumnId.DONE]
};

const DEFAULT_SETTINGS: AppSettings = {
  hourlyRate: 150, // Padrão solicitado
  emailEnabled: false,
  emailAddress: '',
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  smtpPass: '',
  mercadoPagoEnabled: false,
  mercadoPagoPublicKey: '',
  mercadoPagoAccessToken: ''
};

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // App State
  const [board, setBoard] = useState<BoardData>(INITIAL_DATA);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Nova trava de segurança

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  
  // Settings State (Persisted)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Edit State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Check login on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('saas_active_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // --- PERSISTENCE LOGIC (Load & Save Board Data) ---
  
  // Carregar dados específicos do usuário ao logar
  useEffect(() => {
    if (user) {
      const storageKey = `saas_board_data_${user.id}`;
      const savedBoard = localStorage.getItem(storageKey);
      
      if (savedBoard) {
        try {
          setBoard(JSON.parse(savedBoard));
        } catch (e) {
          console.error("Erro ao carregar dados salvos, usando padrão.");
          setBoard(JSON.parse(JSON.stringify(INITIAL_DATA)));
        }
      } else {
        // Se for um novo usuário sem dados, carrega o template inicial limpo
        setBoard(JSON.parse(JSON.stringify(INITIAL_DATA)));
      }
      setIsDataLoaded(true); // Marca que o carregamento terminou
    } else {
      setIsDataLoaded(false);
    }
  }, [user]);

  // Salvar automaticamente sempre que o board mudar, MAS APENAS SE já carregou (isDataLoaded)
  useEffect(() => {
    if (user && isDataLoaded) {
      const storageKey = `saas_board_data_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(board));
    }
  }, [board, user, isDataLoaded]);

  // --- Auth Handlers ---
  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem('saas_active_user', JSON.stringify(loggedUser));
    showToast(`Bem-vindo, ${loggedUser.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setIsDataLoaded(false);
    localStorage.removeItem('saas_active_user');
    setBoard(INITIAL_DATA); // Limpa a memória visual ao sair
  };

  const handleUpgrade = () => {
    if (!user) return;
    const updatedUser = { ...user, isPro: true };
    setUser(updatedUser);
    localStorage.setItem('saas_active_user', JSON.stringify(updatedUser));
    showToast("Parabéns! Você agora é um usuário Pro.");
  };

  // --- Feature Gates ---
  const checkProFeature = (featureName: string) => {
    if (user?.isPro) return true;
    showToast(`O recurso "${featureName}" é exclusivo do Plano Pro.`);
    setIsPricingModalOpen(true);
    return false;
  };

  // --- Settings Persistence ---
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    showToast('Configurações salvas com sucesso!');
  };

  // --- Notification Simulation ---
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const simulateEmailNotification = (taskTitle: string) => {
    if (settings.emailEnabled && settings.emailAddress) {
      console.log(`[SIMULATION] Email sent to ${settings.emailAddress} via ${settings.smtpHost || 'default'}`);
      showToast(`E-mail de conclusão enviado para ${settings.emailAddress}`);
    }
  };

  // --- Timer Logic ---
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setBoard(prev => {
        // Fix: Explicitly cast Object.values to Task[] to avoid type inference issues
        const tasksList = Object.values(prev.tasks) as Task[];
        const hasRunning = tasksList.some((t) => t.isTimerRunning);
        if (!hasRunning) return prev;

        const newTasks = { ...prev.tasks };
        let changed = false;
        
        Object.keys(newTasks).forEach(key => {
          if (newTasks[key].isTimerRunning) {
            newTasks[key] = { 
              ...newTasks[key], 
              timeSpent: newTasks[key].timeSpent + 1000 
            };
            changed = true;
          }
        });

        return changed ? { ...prev, tasks: newTasks } : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleToggleTimer = (taskId: string) => {
    setBoard(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskId]: {
          ...prev.tasks[taskId],
          isTimerRunning: !prev.tasks[taskId].isTimerRunning
        }
      }
    }));
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: ColumnId) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const sourceColumnId = Object.keys(board.columns).find(key => 
      board.columns[key as ColumnId].taskIds.includes(draggedTaskId)
    ) as ColumnId;

    if (!sourceColumnId) return;

    const startColumn = board.columns[sourceColumnId];
    const finishColumn = board.columns[targetColumnId];

    let updatedTasks = { ...board.tasks };
    const task = updatedTasks[draggedTaskId];

    // Se moveu PARA Done
    if (targetColumnId === ColumnId.DONE && sourceColumnId !== ColumnId.DONE) {
      // Simulate Notification
      simulateEmailNotification(task.title);
      
      // Stop Timer
      task.isTimerRunning = false;
      
      // Set Completed Date para calcular performance
      task.completedAt = Date.now();

      if (task.recurrence !== 'none') {
        handleRecurrence(task);
      }
    }

    // Se moveu DE Done PARA outra coluna (Reabriu)
    if (sourceColumnId === ColumnId.DONE && targetColumnId !== ColumnId.DONE) {
      task.completedAt = undefined;
    }

    if (startColumn === finishColumn) {
      // Reordering logic could go here
      return; 
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(startTaskIds.indexOf(draggedTaskId), 1);

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.push(draggedTaskId);

    setBoard(prev => ({
      ...prev,
      tasks: updatedTasks,
      columns: {
        ...prev.columns,
        [sourceColumnId]: { ...startColumn, taskIds: startTaskIds },
        [targetColumnId]: { ...finishColumn, taskIds: finishTaskIds },
      }
    }));

    setDraggedTaskId(null);
  };

  // Lógica de Recorrência
  const handleRecurrence = (originalTask: Task) => {
    const newTaskId = `task-${Date.now()}-rec`;
    let nextDueDate: Date | undefined;
    
    // Calcular próxima data
    if (originalTask.dueDate) {
      const currentDue = new Date(originalTask.dueDate);
      
      if (originalTask.recurrence === 'daily') {
        currentDue.setDate(currentDue.getDate() + 1);
      } else if (originalTask.recurrence === 'weekly') {
        if (originalTask.recurrenceDays && originalTask.recurrenceDays.length > 0) {
           const todayDayIndex = currentDue.getDay();
           let nextDayIndex = originalTask.recurrenceDays.find(d => d > todayDayIndex);
           
           if (nextDayIndex === undefined) {
             nextDayIndex = originalTask.recurrenceDays[0];
             const daysUntilSunday = 7 - todayDayIndex;
             currentDue.setDate(currentDue.getDate() + daysUntilSunday + nextDayIndex);
           } else {
             currentDue.setDate(currentDue.getDate() + (nextDayIndex - todayDayIndex));
           }

        } else {
          currentDue.setDate(currentDue.getDate() + 7);
        }
      } else if (originalTask.recurrence === 'monthly') {
        currentDue.setMonth(currentDue.getMonth() + 1);
      }
      nextDueDate = currentDue;
    }

    const newTask: Task = {
      ...originalTask,
      id: newTaskId,
      title: `${originalTask.title}`, 
      timeSpent: 0,
      isTimerRunning: false,
      completedAt: undefined,
      createdAt: Date.now(),
      dueDate: nextDueDate ? nextDueDate.toISOString().split('T')[0] : undefined,
      attachments: [] // Recorrência geralmente não copia arquivos para não duplicar dados desnecessariamente
    };

    setTimeout(() => {
      setBoard(prev => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          [newTaskId]: newTask
        },
        columns: {
          ...prev.columns,
          [ColumnId.TODO]: {
            ...prev.columns[ColumnId.TODO],
            taskIds: [newTaskId, ...prev.columns[ColumnId.TODO].taskIds]
          }
        }
      }));
      showToast("Nova tarefa recorrente criada para a próxima data!");
    }, 500);
  };

  // --- Task Management ---
  const handleDeleteTask = (taskId: string) => {
    const newTasks = { ...board.tasks };
    delete newTasks[taskId];

    const newColumns = { ...board.columns };
    Object.keys(newColumns).forEach((colId) => {
      const col = newColumns[colId as ColumnId];
      col.taskIds = col.taskIds.filter(id => id !== taskId);
    });

    setBoard({
      ...board,
      tasks: newTasks,
      columns: newColumns
    });
  };

  const handleAddTask = (columnId: ColumnId) => {
    const newTaskId = `task-${Date.now()}`;
    const newTask: Task = {
      id: newTaskId,
      title: '', 
      description: '',
      priority: Priority.MEDIUM,
      tags: [],
      createdAt: Date.now(),
      timeSpent: 0,
      isTimerRunning: false,
      recurrence: 'none',
      recurrenceDays: [],
      attachments: [],
      clientName: ''
    };

    setBoard({
      ...board,
      tasks: { ...board.tasks, [newTaskId]: newTask },
      columns: {
        ...board.columns,
        [columnId]: {
          ...board.columns[columnId],
          taskIds: [...board.columns[columnId].taskIds, newTaskId]
        }
      }
    });

    setEditingTask(newTask);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleSaveTask = (updatedTask: Task) => {
    setBoard({
      ...board,
      tasks: {
        ...board.tasks,
        [updatedTask.id]: updatedTask
      }
    });
  };

  const handleAITasksGenerated = (generatedTasks: GeneratedTask[]) => {
    const newTasks = { ...board.tasks };
    const newColumns = { ...board.columns };

    generatedTasks.forEach((t, index) => {
      const id = `ai-task-${Date.now()}-${index}`;
      const task: Task = {
        id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        tags: ['IA'],
        createdAt: Date.now(),
        timeSpent: 0,
        isTimerRunning: false,
        recurrence: 'none',
        attachments: [],
        clientName: ''
      };
      
      newTasks[id] = task;
      const colId = t.suggestedColumn && newColumns[t.suggestedColumn] ? t.suggestedColumn : ColumnId.TODO;
      newColumns[colId] = {
        ...newColumns[colId],
        taskIds: [...newColumns[colId].taskIds, id]
      };
    });

    setBoard({
      ...board,
      tasks: newTasks,
      columns: newColumns
    });
    showToast("Tarefas geradas com IA adicionadas!");
  };

  const handleCreateTaskFromAudio = (title: string, description: string) => {
     const newTaskId = `audio-task-${Date.now()}`;
     const task: Task = {
        id: newTaskId,
        title,
        description,
        priority: Priority.MEDIUM,
        tags: ['audio-whatsapp'],
        createdAt: Date.now(),
        timeSpent: 0,
        isTimerRunning: false,
        recurrence: 'none',
        attachments: [],
        clientName: ''
     };

     setBoard(prev => ({
        ...prev,
        tasks: { ...prev.tasks, [newTaskId]: task },
        columns: {
          ...prev.columns,
          [ColumnId.TODO]: {
            ...prev.columns[ColumnId.TODO],
            taskIds: [newTaskId, ...prev.columns[ColumnId.TODO].taskIds]
          }
        }
     }));
     showToast("Tarefa criada a partir do áudio!");
  };

  const handleAppendTaskFromAudio = (taskId: string, summary: string) => {
    setBoard(prev => {
      const task = prev.tasks[taskId];
      if (!task) return prev;

      const now = new Date();
      const timestamp = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      
      const newDescription = (task.description ? task.description + '\n\n' : '') + 
        `--- 🎙️ Nota de Áudio (${timestamp}) ---\n${summary}`;

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: {
            ...task,
            description: newDescription
          }
        }
      };
    });
    showToast("Áudio anexado à tarefa com sucesso!");
  };

  // --- RENDER ---

  if (!user) {
    return (
      <>
        <AuthScreen onLogin={handleLogin} />
        <Toast message={toastMessage || ''} isVisible={!!toastMessage} onClose={() => setToastMessage(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 print:hidden">
        <div className="max-w-[1920px] mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Layout className="text-white" size={20} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate max-w-[200px] sm:max-w-none hidden md:block">
              {user.companyName}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="flex items-center gap-2 mr-4 bg-slate-800/50 py-1 px-3 rounded-full border border-slate-700">
               <UserIcon size={14} className="text-slate-400" />
               <span className="text-sm font-medium text-slate-200">{user.name}</span>
               {user.isPro ? (
                 <span className="flex items-center gap-1 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold ml-1">
                   <Crown size={10} /> PRO
                 </span>
               ) : (
                 <button 
                  onClick={() => setIsPricingModalOpen(true)}
                  className="text-[10px] bg-slate-700 hover:bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold ml-1 transition-colors"
                 >
                   Free
                 </button>
               )}
             </div>

             <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
             
             <Button 
               variant="ghost" 
               icon={<BookOpen size={18} />}
               onClick={() => setIsDocModalOpen(true)}
               className="hidden sm:flex text-slate-400 hover:text-white"
               title="Manual de Instalação"
             >
               Manual
             </Button>

             <Button 
               variant="ghost" 
               icon={<FolderOpen size={18} />}
               onClick={() => setIsGalleryOpen(true)}
               className="hidden sm:flex"
             >
               Arquivos
             </Button>
             
             <Button 
               variant="secondary" 
               icon={<Mic size={16} />}
               onClick={() => checkProFeature("Resumo de Áudio") && setIsAudioModalOpen(true)}
               className="hidden sm:flex bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50 hover:text-white border border-emerald-900/50"
             >
               WhatsApp
             </Button>

             <Button 
               variant="secondary" 
               icon={<BarChart2 size={16} />}
               onClick={() => setIsStatsModalOpen(true)}
               className="hidden sm:flex"
             >
               Stats
             </Button>
             <Button 
               variant="secondary" 
               onClick={() => setIsSettingsModalOpen(true)}
               className="hidden sm:flex p-2"
               title="Configurações"
             >
               <Settings size={18} />
             </Button>
             <Button 
               variant="primary" 
               icon={<Sparkles size={16} />}
               onClick={() => checkProFeature("Planejamento IA") && setIsAIModalOpen(true)}
               className="hidden sm:flex"
             >
               IA Plan
             </Button>
             <button onClick={handleLogout} className="p-2 hover:bg-red-900/20 rounded-full text-slate-400 hover:text-red-400 transition-colors" title="Sair">
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden print:overflow-visible print:h-auto">
        <div className="h-full min-w-max p-6 flex gap-8 justify-center items-start print:hidden">
          {board.columnOrder.map((columnId) => {
            const column = board.columns[columnId];
            const tasks = column.taskIds.map(taskId => board.tasks[taskId]);

            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasks}
                onDeleteTask={handleDeleteTask}
                onAddTask={handleAddTask}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragStart={handleDragStart}
                onEditTask={handleOpenEdit}
                onToggleTimer={handleToggleTimer}
              />
            );
          })}
        </div>
        <div className="hidden print:block p-8">
            <h1 className="text-3xl font-bold text-black mb-4">Relatório de Tarefas</h1>
            {/* Simple list for print view if user tries to print the board directly */}
             {(Object.values(board.tasks) as Task[]).map(task => (
               <div key={task.id} className="border-b border-gray-300 py-2">
                 <h3 className="font-bold">{task.title}</h3>
                 <p>{task.description}</p>
                 <span className="text-sm text-gray-500">Prioridade: {task.priority}</span>
               </div>
             ))}
        </div>
      </main>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 sm:hidden z-20 print:hidden">
         <Button 
          variant="secondary" 
          size="lg"
          className="rounded-full shadow-lg shadow-emerald-900/50 h-12 w-12 !p-0 bg-emerald-900/80 text-emerald-300 border border-emerald-700"
          onClick={() => checkProFeature("Resumo de Áudio") && setIsAudioModalOpen(true)}
        >
          <Mic size={20} />
        </Button>
        <Button 
          variant="secondary" 
          size="lg"
          className="rounded-full shadow-lg shadow-slate-900/50 h-12 w-12 !p-0"
          onClick={() => setIsGalleryOpen(true)}
        >
          <FolderOpen size={20} />
        </Button>
        <Button 
          variant="secondary" 
          size="lg"
          className="rounded-full shadow-lg shadow-slate-900/50 h-12 w-12 !p-0"
          onClick={() => setIsStatsModalOpen(true)}
        >
          <BarChart2 size={24} />
        </Button>
        <Button 
          variant="primary" 
          size="lg"
          className="rounded-full shadow-lg shadow-indigo-900/50 h-12 w-12 !p-0"
          onClick={() => checkProFeature("Planejamento IA") && setIsAIModalOpen(true)}
        >
          <Sparkles size={24} />
        </Button>
        <Button 
          variant="secondary" 
          size="lg"
          className="rounded-full shadow-lg shadow-slate-900/50 h-12 w-12 !p-0"
          onClick={() => setIsSettingsModalOpen(true)}
        >
          <Settings size={24} />
        </Button>
      </div>

      <AIGenerator 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onTasksGenerated={handleAITasksGenerated} 
      />

      <AudioSummarizerModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onTaskCreate={handleCreateTaskFromAudio}
        onTaskAppend={handleAppendTaskFromAudio}
        tasks={board.tasks}
      />

      <EditTaskModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={editingTask}
        onSave={handleSaveTask}
      />

      <StatisticsModal 
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        board={board}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onUpgrade={handleUpgrade}
        settings={settings}
      />

      <MediaGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        tasks={board.tasks}
      />

      <DocumentationModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />

      <Toast 
        message={toastMessage || ''} 
        isVisible={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />
    </div>
  );
};

export default App;