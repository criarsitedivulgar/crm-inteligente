import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Printer, Database, MousePointerClick, CheckCircle2, AlertTriangle, Copy, Check, Wrench } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Script SQL revisado V8 - Correção de Admin e Campos
  const sqlCode = `-- SCRIPT DE CORREÇÃO V8 (Admin + Permissões Finais) --
-- Apague tudo no SQL Editor e cole este código --

-- 1. Limpeza de conflitos antigos
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Criação das Tabelas (se não existirem)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  company_name text,
  is_pro boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  priority text default 'Média',
  column_id text default 'todo',
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MIGRAÇÃO DE COLUNAS (CRÍTICO: Garante que colunas existam)
-- Colunas básicas
alter table public.tasks add column if not exists tags text[] default '{}';
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists priority text default 'Média';
alter table public.tasks add column if not exists column_id text default 'todo';

-- Colunas novas (Recursos Pro)
alter table public.tasks add column if not exists client_name text;
alter table public.tasks add column if not exists client_phone text;
alter table public.tasks add column if not exists notify_client boolean default false;
alter table public.tasks add column if not exists recurrence text default 'none';
alter table public.tasks add column if not exists recurrence_days integer[] default '{}';
alter table public.tasks add column if not exists due_date timestamp with time zone;
alter table public.tasks add column if not exists completed_at timestamp with time zone;
alter table public.tasks add column if not exists time_spent integer default 0;
alter table public.tasks add column if not exists is_timer_running boolean default false;
alter table public.tasks add column if not exists attachments_json jsonb default '[]';

-- COLUNAS FINANCEIRAS
alter table public.tasks add column if not exists billing_value numeric default 0;
alter table public.tasks add column if not exists billing_period text default 'unique';
alter table public.tasks add column if not exists billing_pix_key text;
alter table public.tasks add column if not exists is_paid boolean default false;
alter table public.tasks add column if not exists payment_date timestamp with time zone;

-- COLUNA ORÇAMENTO RECUSADO
alter table public.tasks add column if not exists is_rejected boolean default false;

-- 4. Configura Storage
insert into storage.buckets (id, name, public) 
values ('task-attachments', 'task-attachments', true)
on conflict (id) do nothing;

-- 5. Permissões de Segurança (RLS) - Reset Total
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

-- Limpa políticas antigas
drop policy if exists "Ver próprio perfil" on public.profiles;
drop policy if exists "Editar próprio perfil" on public.profiles;
drop policy if exists "Inserir próprio perfil" on public.profiles;
drop policy if exists "Gerenciar próprias tarefas" on public.tasks;
drop policy if exists "Acesso ao storage" on storage.objects;

-- Recria políticas
create policy "Ver próprio perfil" on public.profiles for select using (auth.uid() = id);
create policy "Editar próprio perfil" on public.profiles for update using (auth.uid() = id);
create policy "Inserir próprio perfil" on public.profiles for insert with check (auth.uid() = id);

create policy "Gerenciar próprias tarefas" on public.tasks for all using (auth.uid() = user_id);

create policy "Acesso ao storage" on storage.objects for all using ( bucket_id = 'task-attachments' and auth.uid()::text = (storage.foldername(name))[1] );

-- 6. Função de Automação de Perfil (COM AUTO-ADMIN)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_admin boolean := false;
begin
  -- Verifica se é um dos emails de admin
  if new.email in ('criasitedivulgar@gmail.com', 'criarsitedivulgar@gmail.com') then
     is_admin := true;
  end if;

  insert into public.profiles (id, email, full_name, company_name, is_pro)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'company_name', is_admin)
  on conflict (id) do update set is_pro = EXCLUDED.is_pro;
  return new;
end;
$$ language plpgsql security definer;

-- 7. Gatilho (Trigger)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. Correção Retroativa e Forçar Admin
insert into public.profiles (id, email, full_name, company_name)
select id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'company_name'
from auth.users
on conflict (id) do nothing;

-- GARANTIR ADMIN NOS EMAILS ESPECÍFICOS AGORA
update public.profiles
set is_pro = true
where email in ('criasitedivulgar@gmail.com', 'criarsitedivulgar@gmail.com');`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual de Correção e Instalação">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar print:max-h-none print:overflow-visible">
        
        <div className="hidden print:block mb-8 text-center">
          <h1 className="text-2xl font-bold text-black">Manual Técnico - CRM INTELIGENTE</h1>
        </div>

        <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-lg flex gap-3 animate-in pulse fade-in">
          <Wrench className="text-emerald-400 shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-white text-sm">ATUALIZAÇÃO GERAL (V8) - CORREÇÃO DE ADMIN</h3>
            <p className="text-slate-300 text-sm mt-1">
              Este script restaura seu acesso de <strong>Super Admin</strong> e garante as colunas de orçamento.
              <strong>Copie e rode este código no Supabase imediatamente.</strong>
            </p>
          </div>
        </div>

        {/* SEÇÃO 1: SUPABASE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-2 print:border-gray-300">
            <Database className="text-indigo-400 print:text-black" />
            <h3 className="text-lg font-bold text-white print:text-black">Script de Reparo SQL</h3>
          </div>
          
          <div className="text-slate-300 text-sm space-y-4 print:text-black">
            
            <div className="space-y-2">
              <h4 className="text-white font-bold flex items-center gap-2">
                <MousePointerClick size={16} /> Como rodar:
              </h4>
              <ol className="list-decimal list-inside space-y-2 ml-2 text-slate-300">
                <li>Copie o código abaixo.</li>
                <li>Vá no painel do <strong>Supabase</strong> -> <strong>SQL Editor</strong>.</li>
                <li><strong>Apague</strong> qualquer código que já esteja lá.</li>
                <li>Cole o novo código e clique em <strong>RUN</strong>.</li>
              </ol>
            </div>

            <div className="relative group">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={14} /> COPIADO!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> COPIAR SCRIPT
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-950 p-4 pt-10 rounded-lg font-mono text-[10px] sm:text-xs text-emerald-300 border border-slate-800 overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                {sqlCode}
              </pre>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded text-xs text-yellow-200 flex gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <p>
                Após ver "Success" no Supabase, recarregue esta página.
              </p>
            </div>

          </div>
        </section>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-700 print:hidden">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button onClick={handlePrint} icon={<Printer size={16} />}>Imprimir</Button>
        </div>
      </div>
    </Modal>
  );
};