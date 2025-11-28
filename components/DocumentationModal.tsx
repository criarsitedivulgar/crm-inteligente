import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Printer, Database, CreditCard, Server, Shield, FileText } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual de Configuração do Sistema">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar print:max-h-none print:overflow-visible">
        
        {/* Header para Impressão */}
        <div className="hidden print:block mb-8 text-center">
          <h1 className="text-2xl font-bold text-black">Manual de Instalação: CRM Criar Site Divulgar</h1>
          <p className="text-gray-600">Guia completo para Supabase e Mercado Pago</p>
        </div>

        <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800/50 print:border-gray-300 print:bg-white">
          <p className="text-sm text-blue-200 print:text-black">
            Este manual contém todas as instruções técnicas para colocar o sistema em produção.
            <br className="print:hidden"/>
            Clique no botão <strong>Imprimir / Salvar PDF</strong> abaixo para guardar este guia.
          </p>
        </div>

        {/* SEÇÃO 1: SUPABASE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-2 print:border-gray-300">
            <Database className="text-emerald-400 print:text-black" />
            <h3 className="text-lg font-bold text-white print:text-black">1. Configurando o Supabase (Banco de Dados)</h3>
          </div>
          
          <div className="text-slate-300 text-sm space-y-3 print:text-black">
            <p>O Supabase será responsável pelo Login, Banco de Dados e Armazenamento de Arquivos.</p>
            
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Acesse <a href="https://supabase.com" target="_blank" className="text-indigo-400 underline print:text-blue-600">supabase.com</a> e crie uma conta.</li>
              <li>Crie um novo projeto (New Project). Defina uma senha forte para o banco.</li>
              <li>
                Após criar, vá em <strong>Settings (ícone de engrenagem) &gt; API</strong>.
                <ul className="list-disc list-inside ml-6 mt-1 text-slate-400 print:text-gray-700">
                  <li>Copie a <strong>Project URL</strong>.</li>
                  <li>Copie a <strong>anon public key</strong>.</li>
                </ul>
              </li>
              <li>
                No código do projeto, crie um arquivo <code>.env</code> na raiz e cole as chaves:
                <pre className="bg-slate-950 p-3 rounded mt-2 font-mono text-xs text-slate-200 border border-slate-800 print:bg-gray-100 print:text-black print:border-gray-300">
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
                </pre>
              </li>
            </ol>

            <h4 className="font-bold text-white mt-4 print:text-black">Criando as Tabelas (SQL)</h4>
            <p>Vá no menu lateral esquerdo do Supabase, clique em <strong>SQL Editor</strong>, cole o código abaixo e clique em <strong>RUN</strong>:</p>
            
            <div className="bg-slate-950 p-3 rounded font-mono text-xs text-emerald-300 border border-slate-800 overflow-x-auto print:bg-gray-100 print:text-black print:whitespace-pre-wrap">
{`-- 1. Tabela de Perfis de Usuário
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  company_name text,
  is_pro boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Tarefas
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  priority text default 'Média',
  column_id text default 'todo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  due_date timestamp with time zone,
  completed_at timestamp with time zone
);

-- 3. Storage (Buckets)
insert into storage.buckets (id, name, public) values ('task-attachments', 'task-attachments', true);

-- 4. Segurança (RLS) - Permissões Completas
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

-- Política para Perfis (Leitura e Edição do Próprio Perfil)
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Política para Tarefas (CRUD Completo para o Dono)
create policy "Users can do everything on own tasks" on public.tasks for all using (auth.uid() = user_id);

-- Política para Storage (Upload e Leitura)
create policy "Give users access to own folder" on storage.objects for all using ( bucket_id = 'task-attachments' and auth.uid()::text = (storage.foldername(name))[1] );
`}
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: MERCADO PAGO */}
        <section className="space-y-4 pt-6 page-break-before">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-2 print:border-gray-300">
            <CreditCard className="text-sky-400 print:text-black" />
            <h3 className="text-lg font-bold text-white print:text-black">2. Integração Mercado Pago</h3>
          </div>

          <div className="text-slate-300 text-sm space-y-3 print:text-black">
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Acesse o <a href="https://www.mercadopago.com.br/developers" target="_blank" className="text-indigo-400 underline print:text-blue-600">Devs Mercado Pago</a>.</li>
              <li>Crie uma nova aplicação.</li>
              <li>Vá em <strong>Credenciais de Produção</strong>.</li>
              <li>Copie a <code>Public Key</code> e o <code>Access Token</code>.</li>
              <li>No sistema CRM, vá em <strong>Configurações &gt; Pagamentos</strong> e cole essas chaves.</li>
            </ol>

            <h4 className="font-bold text-white mt-4 print:text-black">Automatizando o Plano Pro (Webhook)</h4>
            <p>Para que o usuário vire "PRO" automaticamente após pagar, você precisa criar uma Edge Function no Supabase ou um endpoint no seu backend.</p>
            <p className="mt-2 text-xs bg-slate-800 p-2 rounded print:bg-gray-100 print:text-black">
              <strong>URL do Webhook:</strong> Configure no Mercado Pago para apontar para: 
              <br/><code>https://seurepo.supabase.co/functions/v1/mercadopago-webhook</code>
            </p>
          </div>
        </section>

         {/* SEÇÃO 3: IA Gemini */}
         <section className="space-y-4 pt-6">
          <div className="flex items-center gap-2 border-b border-slate-700 pb-2 print:border-gray-300">
            <Server className="text-purple-400 print:text-black" />
            <h3 className="text-lg font-bold text-white print:text-black">3. Inteligência Artificial (Gemini)</h3>
          </div>
          <div className="text-slate-300 text-sm space-y-3 print:text-black">
             <p>O sistema usa a IA do Google para gerar tarefas e ler áudios.</p>
             <ol className="list-decimal list-inside space-y-2 ml-2">
               <li>Acesse <a href="https://aistudio.google.com/" target="_blank" className="text-indigo-400 underline print:text-blue-600">Google AI Studio</a>.</li>
               <li>Gere uma <strong>API KEY</strong>.</li>
               <li>Adicione no seu arquivo <code>.env</code>:
               <pre className="bg-slate-950 p-2 rounded mt-1 font-mono text-xs text-slate-200 border border-slate-800 print:bg-gray-100 print:text-black print:border-gray-300">
VITE_API_KEY=sua_chave_gemini_aqui
               </pre>
               </li>
             </ol>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-700 print:hidden">
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button 
            onClick={handlePrint} 
            icon={<Printer size={16} />}
          >
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
};