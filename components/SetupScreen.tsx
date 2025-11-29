import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Database, Link, Settings, Save, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { saveSupabaseConfig } from '../services/supabaseClient';

export const SetupScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    if (!url || !key) return;
    setIsLoading(true);
    // Simula um pequeno delay para feedback visual
    setTimeout(() => {
      saveSupabaseConfig(url, key);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        
        <div className="text-center mb-10">
          <div className="inline-flex bg-emerald-500/10 p-4 rounded-full mb-4 ring-1 ring-emerald-500/30">
            <Database className="text-emerald-400 w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Conexão com Banco de Dados</h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Você já criou as tabelas (o passo "DEU CERTO"). Agora, vamos conectar este site ao seu projeto Supabase para que tudo funcione.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Instruções */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings size={18} className="text-indigo-400" />
              Onde pegar os dados?
            </h3>
            
            <ol className="space-y-4 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">1</span>
                <div>
                  Volte para a aba do <strong>Supabase</strong>.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">2</span>
                <div>
                  No menu lateral esquerdo (lá embaixo), clique na <strong>Engrenagem</strong> (Project Settings).
                </div>
              </li>
              <li className="flex gap-3">
                <span className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">3</span>
                <div>
                  Clique na opção <strong>API</strong> no menu que abriu.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700">4</span>
                <div>
                  Você verá dois campos:
                  <ul className="mt-2 space-y-2">
                    <li className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="block text-xs text-slate-500 uppercase font-bold mb-1">Project URL</span>
                      <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                    </li>
                    <li className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="block text-xs text-slate-500 uppercase font-bold mb-1">Anon / Public Key</span>
                      <div className="h-2 w-full bg-slate-800 rounded"></div>
                    </li>
                  </ul>
                </div>
              </li>
            </ol>
          </div>

          {/* Formulário */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Link size={18} className="text-emerald-400" />
                Colar Credenciais
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Project URL</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">API Key (anon public)</label>
                <input 
                  type="password" 
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                />
              </div>

              <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-800/30 flex gap-2">
                 <ShieldCheck className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                 <p className="text-xs text-indigo-300">
                   Seus dados serão salvos no seu navegador para conectar ao banco. Seguro e prático.
                 </p>
              </div>
            </div>

            <Button 
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
              onClick={handleSave}
              isLoading={isLoading}
              disabled={!url || !key}
              icon={<ArrowRight />}
            >
              Conectar e Iniciar
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};
