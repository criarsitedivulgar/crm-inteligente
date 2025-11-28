import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: Você precisa criar um arquivo .env na raiz do projeto com estas variáveis:
// VITE_SUPABASE_URL=sua_url_aqui
// VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

// Fallback para evitar erro em tempo de execução se as chaves não existirem ainda
// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * MÉTODOS AUXILIARES DE BANCO DE DADOS
 * Use estes métodos para substituir a lógica do LocalStorage no futuro.
 */

// --- TAREFAS ---
export const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, attachments(*)');
  if (error) throw error;
  return data;
};

export const createTask = async (task: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select();
  if (error) throw error;
  return data[0];
};

export const updateTask = async (id: string, updates: any) => {
  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
};

// --- STORAGE ---
export const uploadFile = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('task-attachments')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('task-attachments')
    .getPublicUrl(filePath);

  return data.publicUrl;
};