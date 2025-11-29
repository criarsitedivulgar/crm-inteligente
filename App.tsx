import React, { useState, useEffect } from 'react';
import { BoardData, ColumnId, Priority, Task, GeneratedTask, RecurrenceType, AppSettings, User, ColumnData } from './types';
import { KanbanColumn } from './components/Kanban/Column';
import { Button } from './components/ui/Button';
import { AIGenerator } from './components/AIGenerator';
import { EditTaskModal } from './components/EditTaskModal';
import { StatisticsModal } from './components/StatisticsModal';
import { SettingsModal } from './components/SettingsModal';
import { AudioSummarizerModal } from './components/AudioSummarizerModal';
import { AuthScreen } from './components/AuthScreen';
import { SetupScreen } from './components/SetupScreen'; 
import { PricingModal } from './components/PricingModal';
import { MediaGallery } from './components/MediaGallery';
import { DocumentationModal } from './components/DocumentationModal';
import { Toast } from './components/ui/Toast';
import { Layout, Github, Sparkles, BarChart2, Settings, Mic, LogOut, User as UserIcon, Crown, FolderOpen, BookOpen, ShieldCheck, List, CheckCircle, Clock, DollarSign, LifeBuoy, FileText } from 'lucide-react';
import { fetchUserTasks, createTaskInDB, updateTaskInDB, deleteTaskFromDB, signOut, supabase, isSupabaseConfigured, upgradeUserToPro } from './services/supabaseClient';

const EMPTY_BOARD: BoardData = {
  tasks: {},
  columns: {
    [ColumnId.BUDGET]: { id: ColumnId.BUDGET, title: 'Orçamento', taskIds: [] },
    [ColumnId.TODO]: { id: ColumnId.TODO, title: 'A Fazer', taskIds: [] },
    [ColumnId.IN_PROGRESS]: { id: ColumnId.IN_PROGRESS, title: 'Em Progresso', taskIds: [] },
    [ColumnId.DONE]: { id: ColumnId.DONE, title: 'Feito', taskIds: [] },
    [ColumnId.BILLING]: { id: ColumnId.BILLING, title: 'Cobrança', taskIds: [] }
  },
  columnOrder: [ColumnId.BUDGET, ColumnId.TODO, ColumnId.IN_PROGRESS, ColumnId.DONE, ColumnId.BILLING]
};

const DEFAULT_SETTINGS: AppSettings = {
  hourlyRate: 150,
  emailEnabled: false,
  emailAddress: '',
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  smtpPass: '',
  mercadoPagoEnabled: false,
  mercadoPagoPublicKey: '',
  mercadoPagoAccessToken: '',
  whatsappApiEnabled: false,
  whatsappApiUrl: '',
  whatsappApiToken: '',
  defaultPixKey: ''
};

// --- SUPER ADMIN CONFIG ---
// Lista de e-mails que têm acesso total
const SUPER_ADMIN_EMAILS = [
  'criasitedivulgar@gmail.com',
  'criarsitedivulgar@gmail.com'
];

const App: React.FC = () => {
  // Check Supabase Configuration First
  const [isConfigured, setIsConfigured] = useState(isSupabaseConfigured());

  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // App State
  const [board, setBoard] = useState<BoardData>(EMPTY_BOARD);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Mobile Tabs State
  const [mobileActiveColumn, setMobileActiveColumn] = useState<ColumnId>(ColumnId.BUDGET);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  
  // Settings State (Persisted locally for now, could be DB)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Helper function to check Trial Status
  const checkTrialStatus = (createdAtString?: string) => {
    if (!createdAtString) return false;
    const created = new Date(createdAtString).getTime();
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return (now - created) < oneDayMs;
  };

  // Helper para verificar Admin
  const checkIsAdmin = (email?: string) => {
    if (!email) return false;
    return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
  };

  // Check login on mount (Session Persistence)
  useEffect(() => {
    // 1. Check Local Recovery Session (Admin Fallback)
    const recoverySession = localStorage.getItem('recovery_session');
    if (recoverySession) {
      try {
        const parsedUser = JSON.parse(recoverySession);
        setUser(parsedUser);
        return; // Skip supabase check if recovery session is active
      } catch (e) {
        console.error("Erro ao ler sessão de recuperação", e);
        localStorage.removeItem('recovery_session');
      }
    }

    // 2. Check Supabase Session
    if (!isConfigured) return; 

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || '';
        const isSuperAdmin = checkIsAdmin(email);
        const isTrial = checkTrialStatus(session.user.created_at);
        
        setUser({
          id: session.user.id,
          email: email,
          name: session.user.user_metadata.full_name || 'Usuário',
          companyName: session.user.user_metadata.company_name || '',
          isPro: isSuperAdmin || isTrial || false, // Provisório, será atualizado pelo fetchUserTasks
          createdAt: session.user.created_at
        });

        if (isTrial && !isSuperAdmin) {
           showToast("🚀 Modo Teste Grátis Ativo (1 Dia)");
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       if (session?.user) {
         const email = session.user.email || '';
         const isSuperAdmin = checkIsAdmin(email);
         const isTrial = checkTrialStatus(session.user.created_at);

         setUser(prev => ({
            id: session.user.id,
            email: email,
            name: session.user.user_metadata.full_name || 'Usuário',
            companyName: session.user.user_metadata.company_name || '',
            isPro: isSuperAdmin || isTrial || (prev?.isPro || false),
            createdAt: session.user.created_at
         }));
       } else if (!localStorage.getItem('recovery_session')) {
         // Only clear user if not in recovery mode
         setUser(null);
       }
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  // --- Carregar dados do Supabase ---
  useEffect(() => {
    if (user && isConfigured) {
      loadData(user.id);
    }
  }, [user, isConfigured]);

  const loadData = async (userId: string) => {
    setIsLoadingData(true);
    try {
      const data = await fetchUserTasks(userId);
      
      const newBoard = JSON.parse(JSON.stringify(EMPTY_BOARD));
      
      // Verifica se veio flag de PRO do banco
      const isProFromDB = data.length > 0 && (data[0] as any).isProProfile;
      
      if (user && isProFromDB !== undefined && isProFromDB !== user.isPro) {
        // Atualiza estado local do usuário se o banco diz que ele é PRO
        setUser(prev => prev ? ({ ...prev, isPro: isProFromDB }) : null);
      }

      data.forEach((item: any) => {
        // --- PREVENÇÃO DE DUPLICIDADE (Safe Insert) ---
        // Só adiciona se a tarefa ainda não existe no mapa de tasks
        if (!newBoard.tasks[item.task.id]) {
           newBoard.tasks[item.task.id] = item.task;
           const colId = item.columnId || ColumnId.BUDGET;
           // Só adiciona à coluna se ainda não estiver lá
           if (newBoard.columns[colId] && !newBoard.columns[colId].taskIds.includes(item.task.id)) {
             newBoard.columns[colId].taskIds.push(item.task.id);
           }
        }
      });
      
      setBoard(newBoard);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      showToast("Erro ao conectar com o banco de dados.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // --- Auth Handlers ---
  const handleLogin = (loggedUser: User) => {
    // Verifica admin e trial no login direto
    const isSuperAdmin = checkIsAdmin(loggedUser.email);
    const isTrial = checkTrialStatus(loggedUser.createdAt);

    // Update local state immediately
    const updatedUser = {
      ...loggedUser,
      isPro: isSuperAdmin || isTrial || loggedUser.isPro
    };

    setUser(updatedUser); 
    
    if (isTrial) {
      showToast("🚀 Teste Grátis iniciado! Aproveite por 24 horas.");
    } else {
      showToast(`Bem-vindo, ${loggedUser.name}!`);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('recovery_session'); // Clear fallback session
    await signOut();
    setUser(null);
    setBoard(EMPTY_BOARD);
  };

  const handleUpgrade = async () => {
    if (!user) return;
    
    try {
      await upgradeUserToPro(user.id);
      const updatedUser = { ...user, isPro: true };
      setUser(updatedUser);
      showToast("Parabéns! Assinatura confirmada. Você agora é PRO.");
    } catch (error) {
      console.error(error);
      showToast("Erro ao processar assinatura.");
    }
  };

  const handleProfileUpdate = (updatedName: string, updatedCompany: string) => {
    if (!user) return;
    setUser({ ...user, name: updatedName, companyName: updatedCompany });
  };

  const checkProFeature = (featureName: string) => {
    // Se for o admin, libera tudo sempre
    if (checkIsAdmin(user?.email)) return true;
    
    // Se for usuário Pro (Assinante ou Trial)
    if (user?.isPro) return true;

    // Se não for Pro
    showToast(`Recurso "${featureName}" exclusivo para Pro.`);
    setIsPricingModalOpen(true);
    return false;
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    showToast('Configurações salvas!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // --- Timer Logic (Local State Only) ---
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setBoard(prev => {
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
    setBoard(prev => {
      const task = prev.tasks[taskId];
      const newState = !task.isTimerRunning;
      
      // Update DB Async without blocking UI
      updateTaskInDB({ ...task, isTimerRunning: newState, timeSpent: task.timeSpent }, undefined, user?.id)
        .catch(err => console.error("Erro ao salvar timer:", err));

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [taskId]: {
            ...task,
            isTimerRunning: newState
          }
        }
      };
    });
  };

  const handleApproveBudget = async (taskId: string) => {
    // Move from BUDGET to TODO
    const sourceColumn = board.columns[ColumnId.BUDGET];
    const targetColumn = board.columns[ColumnId.TODO];
    const task = board.tasks[taskId];

    if (!sourceColumn.taskIds.includes(taskId)) return;

    // Optimistic Update
    const startTaskIds = sourceColumn.taskIds.filter(id => id !== taskId);
    const finishTaskIds = [taskId, ...targetColumn.taskIds]; // Add to top of TODO

    setBoard(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [ColumnId.BUDGET]: { ...sourceColumn, taskIds: startTaskIds },
        [ColumnId.TODO]: { ...targetColumn, taskIds: finishTaskIds }
      }
    }));

    // Update DB
    try {
      await updateTaskInDB(task, ColumnId.TODO, user?.id);
      showToast("Orçamento aprovado! Tarefa movida para 'A Fazer'.");
    } catch (e) {
      console.error(e);
      showToast("Erro ao aprovar orçamento.");
    }
  };

  const handleRejectBudget = async (taskId: string) => {
    // Mantém na coluna BUDGET, mas marca como rejected
    setBoard(prev => {
       const task = prev.tasks[taskId];
       if(!task) return prev;
       
       return {
         ...prev,
         tasks: {
           ...prev.tasks,
           [taskId]: { ...task, isRejected: true }
         }
       }
    });

    try {
      const task = board.tasks[taskId];
      await updateTaskInDB({ ...task, isRejected: true }, ColumnId.BUDGET, user?.id);
      showToast("Orçamento marcado como RECUSADO.");
    } catch (e) {
      console.error(e);
      showToast("Erro ao recusar orçamento.");
    }
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

  // Modificado para aceitar o targetTaskId (task sobre a qual soltamos)
  const handleDrop = (e: React.DragEvent, targetColumnId: ColumnId, targetTaskId?: string) => {
    e.preventDefault();
    e.stopPropagation(); 

    if (!draggedTaskId) return;
    if (draggedTaskId === targetTaskId) return; // Soltou sobre si mesmo, ignora

    // --- LOGICA ROBUSTA PARA EVITAR DUPLICAÇÃO ---
    setBoard(prev => {
      // 1. Identifica coluna de origem antes da modificação (para efeitos colaterais como timer)
      const sourceColumnEntry = Object.entries(prev.columns).find(([_, col]) => 
        (col as ColumnData).taskIds.includes(draggedTaskId)
      );
      const sourceColumnId = sourceColumnEntry ? (sourceColumnEntry[0] as ColumnId) : null;

      if (!sourceColumnId) return prev; // Tarefa não encontrada

      // 2. Cria cópia das colunas e REMOVE a tarefa de TODAS as colunas
      // Isso garante que não haverá duplicação se o estado estiver inconsistente
      const newColumns = { ...prev.columns };
      Object.keys(newColumns).forEach(key => {
        const colId = key as ColumnId;
        newColumns[colId] = {
          ...newColumns[colId],
          taskIds: newColumns[colId].taskIds.filter(id => id !== draggedTaskId)
        };
      });

      // 3. Insere a tarefa na coluna de destino, na posição correta
      const targetColumn = newColumns[targetColumnId];
      const newTaskIds = [...targetColumn.taskIds];

      if (targetTaskId) {
        // Se soltou sobre um card específico, insere antes dele
        const index = newTaskIds.indexOf(targetTaskId);
        if (index >= 0) {
           newTaskIds.splice(index, 0, draggedTaskId);
        } else {
           // Fallback: se o card alvo não for encontrado (ex: filtro), joga pro final
           newTaskIds.push(draggedTaskId);
        }
      } else {
        // Se soltou no fundo da coluna, joga pro final
        newTaskIds.push(draggedTaskId);
      }

      newColumns[targetColumnId] = {
        ...targetColumn,
        taskIds: newTaskIds
      };

      // 4. Atualiza propriedades da tarefa (Timer, Data de Conclusão)
      const currentTask = prev.tasks[draggedTaskId];
      const updatedTask = { ...currentTask };

      if (targetColumnId === ColumnId.DONE && sourceColumnId !== ColumnId.DONE) {
         updatedTask.isTimerRunning = false;
         updatedTask.completedAt = Date.now();
      } else if (sourceColumnId === ColumnId.DONE && targetColumnId !== ColumnId.DONE) {
         updatedTask.completedAt = undefined;
      }

      return {
        ...prev,
        tasks: {
          ...prev.tasks,
          [draggedTaskId]: updatedTask
        },
        columns: newColumns
      };
    });

    // --- Side Effects (DB & Recurrence) ---
    // Precisamos capturar o estado ANTES do update visual para lógica de banco
    const sourceColumnIdSnapshot = Object.keys(board.columns).find(key =>
      board.columns[key as ColumnId].taskIds.includes(draggedTaskId)
    ) as ColumnId;
    
    const taskSnapshot = board.tasks[draggedTaskId];

    if (taskSnapshot) {
       const taskForDB = { ...taskSnapshot };

       // Aplica lógica de Done/Undone para o DB
       if (targetColumnId === ColumnId.DONE && sourceColumnIdSnapshot !== ColumnId.DONE) {
          taskForDB.isTimerRunning = false;
          taskForDB.completedAt = Date.now();
          // Recorrência
          if (taskForDB.recurrence !== 'none') {
            handleRecurrence(taskForDB);
          }
       } else if (sourceColumnIdSnapshot === ColumnId.DONE && targetColumnId !== ColumnId.DONE) {
          taskForDB.completedAt = undefined;
       }

       // Salva no banco
       updateTaskInDB(taskForDB, targetColumnId, user?.id).catch(err => {
          console.error("DB Move Error", err);
          showToast("Erro ao sincronizar movimento.");
       });
    }

    setDraggedTaskId(null);
  };

  const handleRecurrence = async (originalTask: Task) => {
    const newTaskId = `task-${Date.now()}-rec`; // Temp ID
    let nextDueDate: Date | undefined;
    
    if (originalTask.dueDate) {
      const currentDue = new Date(originalTask.dueDate);
      if (originalTask.recurrence === 'daily') {
        currentDue.setDate(currentDue.getDate() + 1);
      } else if (originalTask.recurrence === 'weekly') {
        currentDue.setDate(currentDue.getDate() + 7);
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
      attachments: [],
      // Reset Billing
      billingValue: originalTask.billingValue,
      billingPeriod: originalTask.billingPeriod,
      billingPixKey: originalTask.billingPixKey,
      isPaid: false,
      paymentDate: undefined,
      isRejected: false
    };

    try {
      const createdTask = await createTaskInDB(newTask, ColumnId.TODO, user?.id);
      setBoard(prev => ({
        ...prev,
        tasks: { ...prev.tasks, [createdTask.id]: createdTask },
        columns: {
          ...prev.columns,
          [ColumnId.TODO]: {
            ...prev.columns[ColumnId.TODO],
            taskIds: [createdTask.id, ...prev.columns[ColumnId.TODO].taskIds]
          }
        }
      }));
      showToast("Tarefa recorrente criada!");
    } catch (e) {
      console.error(e);
      showToast("Erro ao criar recorrência.");
    }
  };

  // --- Task Management ---
  const handleDeleteTask = async (taskId: string) => {
    // Optimistic
    const newTasks = { ...board.tasks };
    delete newTasks[taskId];

    const newColumns = { ...board.columns };
    Object.keys(newColumns).forEach((colId) => {
      const col = newColumns[colId as ColumnId];
      col.taskIds = col.taskIds.filter(id => id !== taskId);
    });

    setBoard({ ...board, tasks: newTasks, columns: newColumns });
    
    // DB
    await deleteTaskFromDB(taskId);
  };

  const handleAddTask = async (columnId: ColumnId) => {
    const newTask: Task = {
      id: `temp-${Date.now()}`,
      title: '', 
      description: '',
      priority: Priority.MEDIUM,
      tags: [],
      createdAt: Date.now(),
      timeSpent: 0,
      isTimerRunning: false,
      recurrence: 'none',
      attachments: [],
      notifyClient: false,
      // Financeiro Padrão
      billingValue: 0,
      billingPeriod: 'unique',
      billingPixKey: settings.defaultPixKey || '',
      isPaid: false
    };

    setEditingTask(newTask); 
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    // Ensure task has billing defaults if missing
    const taskWithDefaults = {
      ...task,
      billingPixKey: task.billingPixKey || settings.defaultPixKey || ''
    };
    setEditingTask(taskWithDefaults);
    setIsEditModalOpen(true);
  };

  const handleSaveTask = async (updatedTask: Task) => {
    const isNew = updatedTask.id.startsWith('temp-');
    
    // --- CHECK FOR DUPLICATE TITLE ---
    const titleExists = (Object.values(board.tasks) as Task[]).some(t => 
      t.title.trim().toLowerCase() === updatedTask.title.trim().toLowerCase() && 
      t.id !== updatedTask.id // Ignore self if editing
    );

    if (titleExists) {
      showToast("Já existe uma tarefa com este título!");
      return; 
    }

    // Optimistic Update for editing to feel fast
    if (!isNew) {
      setBoard(prev => ({
        ...prev,
        tasks: { ...prev.tasks, [updatedTask.id]: updatedTask }
      }));
    }

    try {
      if (isNew) {
        // Create - Se foi criado via botão "Adicionar", ele já cai na coluna certa.
        // Se a tarefa não tiver coluna definida, padrão para BUDGET.
        const colToInsert = (Object.values(board.columns) as ColumnData[]).find(c => c.taskIds.includes(updatedTask.id))?.id || ColumnId.BUDGET;

        const created = await createTaskInDB(updatedTask, colToInsert, user?.id);
        setBoard(prev => ({
          ...prev,
          tasks: { ...prev.tasks, [created.id]: created },
          columns: {
            ...prev.columns,
            [colToInsert]: {
              ...prev.columns[colToInsert],
              taskIds: [...prev.columns[colToInsert].taskIds, created.id]
            }
          }
        }));
      } else {
        // Update DB
        await updateTaskInDB(updatedTask, undefined, user?.id);
      }
    } catch (e: any) {
      console.error("Erro ao salvar tarefa (catch):", e);
      let errorMsg = "Erro ao salvar tarefa.";
      
      // Parse Error Object safely
      if (typeof e === 'string') {
        errorMsg = e;
      } else if (e instanceof Error) {
        errorMsg = e.message;
      } else if (typeof e === 'object' && e !== null) {
         // Supabase or other object errors
         errorMsg = (e as any).message || (e as any).error_description || JSON.stringify(e);
      }
      
      showToast(errorMsg);
    }
  };

  const handleAITasksGenerated = async (generatedTasks: GeneratedTask[]) => {
    for (const t of generatedTasks) {
       // Check duplication inside AI generation too
       const exists = (Object.values(board.tasks) as Task[]).some(existing => existing.title.toLowerCase() === t.title.toLowerCase());
       if (exists) continue; // Skip duplicates from AI

       const task: Task = {
        id: `temp-ai-${Math.random()}`, 
        title: t.title,
        description: t.description,
        priority: t.priority,
        tags: ['IA'],
        createdAt: Date.now(),
        timeSpent: 0,
        isTimerRunning: false,
        recurrence: 'none',
        attachments: [],
        notifyClient: false
      };
      
      const colId = t.suggestedColumn || ColumnId.BUDGET; // IA sugere ou vai pro orçamento
      
      try {
         const created = await createTaskInDB(task, colId, user?.id);
         setBoard(prev => ({
           ...prev,
           tasks: { ...prev.tasks, [created.id]: created },
           columns: {
             ...prev.columns,
             [colId]: {
               ...prev.columns[colId],
               taskIds: [...prev.columns[colId].taskIds, created.id]
             }
           }
         }));
      } catch (e) { console.error(e); }
    }
    showToast("Tarefas IA salvas no banco!");
  };

  const handleCreateTaskFromAudio = async (title: string, description: string) => {
     // Check duplicate for Audio Task
     const exists = (Object.values(board.tasks) as Task[]).some(t => t.title.toLowerCase() === title.toLowerCase());
     if (exists) {
       showToast("Já existe uma tarefa com este título!");
       return;
     }

     const task: Task = {
        id: 'temp-audio',
        title,
        description,
        priority: Priority.MEDIUM,
        tags: ['audio-whatsapp'],
        createdAt: Date.now(),
        timeSpent: 0,
        isTimerRunning: false,
        recurrence: 'none',
        attachments: [],
        notifyClient: false
     };
     
     const created = await createTaskInDB(task, ColumnId.BUDGET, user?.id); // Vai para orçamento primeiro
     setBoard(prev => ({
        ...prev,
        tasks: { ...prev.tasks, [created.id]: created },
        columns: {
          ...prev.columns,
          [ColumnId.BUDGET]: {
            ...prev.columns[ColumnId.BUDGET],
            taskIds: [created.id, ...prev.columns[ColumnId.BUDGET].taskIds]
          }
        }
     }));
     showToast("Tarefa de áudio criada em Orçamento!");
  };

  const handleAppendTaskFromAudio = (taskId: string, summary: string) => {
    setBoard(prev => {
      const task = prev.tasks[taskId];
      if (!task) return prev;
      const timestamp = new Date().toLocaleDateString('pt-BR');
      const newDesc = (task.description ? task.description + '\n\n' : '') + `--- 🎙️ Nota (${timestamp}) ---\n${summary}`;
      const updated = { ...task, description: newDesc };
      
      updateTaskInDB(updated, undefined, user?.id).catch(console.error);

      return {
        ...prev,
        tasks: { ...prev.tasks, [taskId]: updated }
      };
    });
    showToast("Áudio anexado!");
  };

  // --- RENDER ---

  if (!isConfigured) {
    return <SetupScreen />;
  }

  if (!user) {
    return (
      <>
        <AuthScreen onLogin={handleLogin} />
        <Toast message={toastMessage || ''} isVisible={!!toastMessage} onClose={() => setToastMessage(null)} />
      </>
    );
  }

  const isSuperAdmin = checkIsAdmin(user.email);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 print:hidden">
        <div className="max-w-[1920px] mx-auto px-2 sm:px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Layout className="text-white" size={20} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate max-w-[140px] md:max-w-none hidden sm:block">
              CRM INTELIGENTE
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             <div className="flex items-center gap-2 mr-2 sm:mr-4 bg-slate-800/50 py-1 px-2 sm:px-3 rounded-full border border-slate-700">
               <UserIcon size={14} className="text-slate-400" />
               <span className="text-sm font-medium text-slate-200 truncate max-w-[60px] sm:max-w-[100px]">{user.name}</span>
               {isSuperAdmin ? (
                  <span className="flex items-center gap-1 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold ml-1 shadow-lg shadow-red-900/50">
                   <ShieldCheck size={10} /> <span className="hidden sm:inline">ADMIN</span>
                 </span>
               ) : user.isPro ? (
                 <span className="flex items-center gap-1 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold ml-1">
                   <Crown size={10} /> <span className="hidden sm:inline">PRO</span>
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
               icon={<FolderOpen size={18} />}
               onClick={() => setIsGalleryOpen(true)}
               className="hidden md:flex"
             >
               Arquivos
             </Button>
             
             <Button 
               variant="secondary" 
               icon={<Mic size={16} />}
               onClick={() => checkProFeature("Resumo de Áudio") && setIsAudioModalOpen(true)}
               className="hidden md:flex bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50 hover:text-white border border-emerald-900/50"
             >
               <span className="hidden lg:inline">Ler Áudio WhatsApp</span>
             </Button>

             <Button 
               variant="secondary" 
               icon={<BarChart2 size={16} />}
               onClick={() => setIsStatsModalOpen(true)}
               className="hidden md:flex uppercase text-[10px] sm:text-xs font-bold"
             >
               <span className="hidden lg:inline">MEU RENDIMENTO</span>
             </Button>
             
             <Button 
               variant="primary" 
               icon={<Sparkles size={16} />}
               onClick={() => checkProFeature("Planejamento IA") && setIsAIModalOpen(true)}
               className="hidden sm:flex"
             >
               <span className="hidden lg:inline">Planejamento IA</span>
               <span className="lg:hidden">IA</span>
             </Button>

             <Button 
               variant="ghost" 
               icon={<LifeBuoy size={18} />}
               onClick={() => window.open('https://wa.me/5531992774963', '_blank')}
               className="hidden sm:flex text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
             >
               <span className="hidden lg:inline">Suporte</span>
             </Button>

             <Button 
               variant="ghost"
               icon={<BookOpen size={18} />}
               onClick={() => setIsDocModalOpen(true)}
               className="hidden sm:flex text-slate-400 hover:text-white"
               title="Manual & Scripts SQL"
             >
                <span className="hidden lg:inline">Manual SQL</span>
             </Button>

             <Button 
               variant="secondary" 
               onClick={() => setIsSettingsModalOpen(true)}
               className="hidden sm:flex p-2"
               title="Configurações"
             >
               <Settings size={18} />
             </Button>

             <button onClick={handleLogout} className="p-2 hover:bg-red-900/20 rounded-full text-slate-400 hover:text-red-400 transition-colors" title="Sair">
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        
        {/* MOBILE TABS (Visible only on mobile) */}
        <div className="md:hidden flex border-b border-slate-800 bg-slate-900 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setMobileActiveColumn(ColumnId.BUDGET)}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              mobileActiveColumn === ColumnId.BUDGET
                ? 'border-pink-500 text-pink-400 bg-slate-800' 
                : 'border-transparent text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <FileText size={14} /> Orçamento
          </button>
          <button
            onClick={() => setMobileActiveColumn(ColumnId.TODO)}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              mobileActiveColumn === ColumnId.TODO 
                ? 'border-slate-400 text-white bg-slate-800' 
                : 'border-transparent text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <List size={14} /> A Fazer
          </button>
          <button
            onClick={() => setMobileActiveColumn(ColumnId.IN_PROGRESS)}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              mobileActiveColumn === ColumnId.IN_PROGRESS 
                ? 'border-indigo-500 text-indigo-400 bg-slate-800' 
                : 'border-transparent text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <Clock size={14} /> Progresso
          </button>
          <button
            onClick={() => setMobileActiveColumn(ColumnId.DONE)}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              mobileActiveColumn === ColumnId.DONE 
                ? 'border-emerald-500 text-emerald-400 bg-slate-800' 
                : 'border-transparent text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle size={14} /> Feito
          </button>
          <button
            onClick={() => setMobileActiveColumn(ColumnId.BILLING)}
            className={`flex-1 py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap ${
              mobileActiveColumn === ColumnId.BILLING 
                ? 'border-yellow-500 text-yellow-400 bg-slate-800' 
                : 'border-transparent text-slate-500 hover:bg-slate-800/50'
            }`}
          >
            <DollarSign size={14} /> Cobrança
          </button>
        </div>

        <div className="h-full overflow-x-auto overflow-y-hidden print:overflow-visible print:h-auto p-4 flex flex-col md:flex-row gap-3 md:items-start md:justify-start">
          {isLoadingData ? (
             <div className="flex items-center justify-center w-full h-full text-slate-500">
               Carregando dados...
             </div>
          ) : (
            // Logic to handle responsiveness: 
            // On desktop (md+), map all columns. 
            // On mobile, only render the active column to fit width 100%.
            board.columnOrder.map((columnId) => {
              const column = board.columns[columnId];
              const tasks = column.taskIds.map(taskId => board.tasks[taskId]).filter(Boolean);

              // Conditional Rendering for Mobile Tabs
              const isHiddenOnMobile = mobileActiveColumn !== columnId;

              return (
                <div 
                  key={column.id} 
                  className={`h-full ${isHiddenOnMobile ? 'hidden md:flex' : 'flex'} w-full md:w-auto justify-center`}
                >
                  <KanbanColumn
                    column={column}
                    tasks={tasks}
                    onDeleteTask={handleDeleteTask}
                    onAddTask={handleAddTask}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragStart={handleDragStart}
                    onEditTask={handleOpenEdit}
                    onToggleTimer={handleToggleTimer}
                    onApproveBudget={handleApproveBudget}
                    onRejectBudget={handleRejectBudget}
                    settings={settings}
                  />
                </div>
              );
            })
          )}
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
          className="rounded-full shadow-lg shadow-emerald-500/50 h-12 w-12 !p-0 bg-emerald-900/50 text-emerald-400 border border-emerald-700"
          onClick={() => window.open('https://wa.me/5531992774963', '_blank')}
        >
          <LifeBuoy size={20} />
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
          onClick={() => setIsStatsModalOpen(true)}
        >
          <BarChart2 size={24} />
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
        isSuperAdmin={isSuperAdmin}
        user={user}
        onProfileUpdate={handleProfileUpdate}
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