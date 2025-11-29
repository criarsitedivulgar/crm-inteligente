import { createClient } from '@supabase/supabase-js';
import { Task, Priority, RecurrenceType, BillingPeriod } from '../types';

// --- CREDENCIAIS PADRÃO (FALLBACK) ---
const DEFAULT_URL = 'https://yreckbjugreugclsxpve.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyZWNrYmp1Z3JldWdjbHN4cHZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNTgyMzgsImV4cCI6MjA3OTkzNDIzOH0.5Y4P7JICwixil4CZzNkOXd1ATlELoM0tJWdwpxA_H7s';

const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore
    return process.env[key];
  }
  return undefined;
};

let supabaseUrl = getEnv('VITE_SUPABASE_URL');
let supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined') {
  const localSettings = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_settings') : null;
  if (localSettings) {
    try {
      const parsed = JSON.parse(localSettings);
      if (parsed.url && parsed.key) {
        supabaseUrl = parsed.url;
        supabaseAnonKey = parsed.key;
      }
    } catch (e) {
      console.error("Erro ao ler configurações locais", e);
    }
  }
  
  if ((!supabaseUrl || !supabaseAnonKey) && DEFAULT_URL && DEFAULT_KEY) {
     supabaseUrl = DEFAULT_URL;
     supabaseAnonKey = DEFAULT_KEY;
  }
}

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseUrl !== 'undefined'
  );
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('supabase_settings', JSON.stringify({ url, key }));
  window.location.reload(); 
};

export const resetSupabaseConfig = () => {
  localStorage.removeItem('supabase_settings');
  window.location.reload();
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

// --- AUTH ---

export const signUp = async (email: string, password: string, name: string, company: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        company_name: company
      }
    }
  });
  if (error) throw new Error(error.message || 'Erro desconhecido ao cadastrar');
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error("Login error:", error);
    if (error.message.includes('Invalid login credentials')) {
       throw new Error('E-mail ou senha incorretos.');
    }
    if (error.message.includes('Email not confirmed')) {
       throw new Error('Por favor, confirme seu e-mail antes de entrar.');
    }
    if (error.message.includes('Too many requests')) {
        throw new Error('Muitas tentativas. Aguarde um momento.');
    }
    throw new Error(error.message || 'Erro desconhecido ao entrar');
  }
  return data;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin, // Redireciona de volta para o site após clicar no email
  });
  if (error) {
    if (error.message.includes('Too many requests')) {
        throw new Error('Muitas tentativas. Aguarde alguns minutos.');
    }
    throw new Error(error.message);
  }
};

export const updateUserAccount = async (attributes: { email?: string; password?: string }) => {
  const { data, error } = await supabase.auth.updateUser(attributes);
  if (error) throw new Error(error.message);
  return data;
};

export const updateUserProfile = async (name: string, company: string) => {
  // 1. Atualiza metadados do Auth (sessão)
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: name,
      company_name: company
    }
  });
  
  if (error) throw new Error(error.message);

  // 2. Atualiza tabela pública de perfis
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        company_name: company
      })
      .eq('id', data.user.id);
      
    if (profileError) {
      console.error("Erro ao atualizar profile público:", profileError);
    }
  }

  return data;
};

export const upgradeUserToPro = async (userId: string) => {
  // Atualiza a tabela profiles para is_pro = true
  const { error } = await supabase
    .from('profiles')
    .update({ is_pro: true })
    .eq('id', userId);

  if (error) throw new Error("Erro ao atualizar status Pro: " + error.message);
  return true;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

// --- HELPER ---

const getAuthenticatedUser = async () => {
  // 1. Tenta pegar a sessão local (rápido)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;

  // 2. Se falhar, tenta validar com o servidor (robusto)
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Usuário não autenticado");
  }
  return user;
};

// --- STORAGE ---

export const uploadTaskAttachment = async (file: File) => {
  try {
    const user = await getAuthenticatedUser();
    
    // Bypass para Admin de Recuperação (não permite upload real)
    if (user.id.startsWith('admin-recovery')) {
      return "https://via.placeholder.com/150?text=Modo+Recuperacao";
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro upload:', uploadError);
      throw new Error(uploadError.message || 'Erro ao fazer upload');
    }

    const { data } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error: any) {
    console.warn("Upload falhou ou usuário offline:", error);
    return "https://via.placeholder.com/150?text=Erro+Upload";
  }
};

// --- DATA MAPPING ---

const mapTaskFromDB = (dbTask: any): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description || '',
  priority: (dbTask.priority as Priority) || Priority.MEDIUM,
  tags: dbTask.tags || [],
  createdAt: new Date(dbTask.created_at).getTime(),
  completedAt: dbTask.completed_at ? new Date(dbTask.completed_at).getTime() : undefined,
  timeSpent: dbTask.time_spent || 0,
  isTimerRunning: dbTask.is_timer_running || false,
  dueDate: dbTask.due_date ? dbTask.due_date.split('T')[0] : undefined,
  recurrence: (dbTask.recurrence as RecurrenceType) || 'none',
  recurrenceDays: dbTask.recurrence_days || [],
  clientName: dbTask.client_name || '',
  clientPhone: dbTask.client_phone || '',
  notifyClient: dbTask.notify_client || false, 
  attachments: dbTask.attachments_json || [],
  // Financeiro
  billingValue: dbTask.billing_value || 0,
  billingPeriod: (dbTask.billing_period as BillingPeriod) || 'unique',
  billingPixKey: dbTask.billing_pix_key || '',
  isPaid: dbTask.is_paid || false,
  paymentDate: dbTask.payment_date ? new Date(dbTask.payment_date).getTime() : undefined,
  // Orçamento
  isRejected: dbTask.is_rejected || false
});

const mapTaskToDB = (task: Partial<Task>, userId: string, columnId?: string) => {
  return {
    user_id: userId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    column_id: columnId,
    tags: task.tags,
    client_name: task.clientName,
    client_phone: task.clientPhone,
    notify_client: task.notifyClient ?? false, 
    recurrence: task.recurrence,
    recurrence_days: task.recurrenceDays,
    due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null, 
    completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    time_spent: task.timeSpent,
    is_timer_running: task.isTimerRunning,
    attachments_json: task.attachments,
    // Financeiro
    billing_value: task.billingValue || 0,
    billing_period: task.billingPeriod,
    billing_pix_key: task.billingPixKey,
    is_paid: task.isPaid,
    payment_date: task.paymentDate ? new Date(task.paymentDate).toISOString() : null,
    // Orçamento
    is_rejected: task.isRejected
  };
};

// --- TASKS ---

export const fetchUserTasks = async (userId?: string) => {
  let uid = userId;
  if (!uid) {
    try {
      const user = await getAuthenticatedUser();
      uid = user.id;
    } catch {
      return []; // Retorna vazio se não autenticado
    }
  }

  // MODO RECUPERAÇÃO / OFFLINE
  if (uid && uid.startsWith('admin-recovery')) {
    console.log("Modo recuperação: Retornando lista vazia de tarefas.");
    return [];
  }

  // Busca tarefas
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', uid);

  if (error) {
     console.error("Erro ao buscar tarefas:", error);
     throw new Error(error.message);
  }

  // Busca perfil para atualizar status PRO se necessário
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', uid)
    .single();

  return data.map((t: any) => ({
    task: mapTaskFromDB(t),
    columnId: t.column_id,
    isProProfile: profile?.is_pro // Passa info extra se disponível
  }));
};

export const createTaskInDB = async (task: Task, columnId: string, userId?: string) => {
  let uid = userId;
  
  if (!uid) {
    try {
      const user = await getAuthenticatedUser();
      uid = user.id;
    } catch {
      uid = 'unknown';
    }
  }

  // --- MODO RECUPERAÇÃO / BYPASS ---
  if (uid && uid.startsWith('admin-recovery')) {
    console.warn("Modo de recuperação: Tarefa criada apenas localmente (não salva no banco).");
    return { ...task, id: `local-${Date.now()}` };
  }

  try {
    const dbPayload = mapTaskToDB(task, uid, columnId);
    delete (dbPayload as any).id; 

    const { data, error } = await supabase
      .from('tasks')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      console.error("Erro SQL ao criar tarefa (Banco falhou):", JSON.stringify(error, null, 2));
      throw new Error(error.message || "Falha ao salvar. Verifique se as tabelas foram criadas.");
    }
    return mapTaskFromDB(data);
  } catch (err: any) {
    console.warn("Falha crítica no insert. Criando tarefa localmente para não travar a UI.", err);
    // Retorna tarefa local (simulada) para que o usuário não fique travado
    // Isso é útil quando o banco está desatualizado (faltando colunas novas)
    return { ...task, id: `local-error-${Date.now()}` };
  }
};

export const updateTaskInDB = async (task: Task, columnId?: string, userId?: string) => {
  try {
    let uid = userId;
    
    if (!uid) {
       const { data: { session } } = await supabase.auth.getSession();
       uid = session?.user?.id || 'unknown'; 
    }
    
    // --- MODO RECUPERAÇÃO / BYPASS ---
    if (uid && uid.startsWith('admin-recovery')) {
      console.warn("Modo de recuperação: Update ignorado no banco.");
      return;
    }

    if (task.id.startsWith('local-')) {
       console.warn("Ignorando update de tarefa local.");
       return;
    }
    
    const updates: any = mapTaskToDB(task, uid, columnId);
    delete updates.user_id;
    delete updates.created_at; 

    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', task.id);

    if (error) {
       console.error("Erro SQL no update:", error);
       throw new Error(error.message);
    }
  } catch (e: any) {
    console.error("Update failed:", e);
    // Não lançamos erro aqui para não travar a UI em caso de falha silenciosa de sync
  }
};

export const deleteTaskFromDB = async (taskId: string) => {
  // Ignora tarefas locais ou modo recuperação
  if (taskId.startsWith('local-')) return;
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id.startsWith('admin-recovery')) return;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  
  if (error) throw new Error(error.message);
};