import React, { useState } from 'react';
import { Button } from './ui/Button';
import { User } from '../types';
import { Layout, Mail, Lock, User as UserIcon, ArrowRight, ShieldAlert, BookOpen } from 'lucide-react';
import { LegalModal } from './LegalModals';
import { DocumentationModal } from './DocumentationModal';
import { signIn, signUp } from '../services/supabaseClient';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Legal & Doc Modals State
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDoc, setShowDoc] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Preencha e-mail e senha.");
      }

      let authData;
      let userData: User;

      if (isLogin) {
        // Login via Supabase
        const { user, session } = await signIn(email, password);
        if (!user) throw new Error("Erro ao autenticar.");
        
        userData = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Usuário',
          companyName: user.user_metadata.company_name || 'Minha Empresa',
          isPro: false // Poderia vir do banco também
        };

      } else {
        // Cadastro via Supabase
        const { user, session } = await signUp(email, password, name, company);
        if (!user) throw new Error("Erro ao criar conta. Verifique os dados.");

        userData = {
          id: user.id,
          email: user.email || '',
          name: name,
          companyName: company,
          isPro: false
        };
      }

      onLogin(userData);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 rounded-xl shadow-xl shadow-indigo-500/20 mb-4">
            <Layout className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CRM CRIAR SITE DIVULGAR</h1>
          <p className="text-slate-400">Gerencie projetos e automatize com IA.</p>
        </div>

        {/* Documentation Access for Setup */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowDoc(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-500/30 transition-colors"
          >
            <BookOpen size={12} />
            Manual de Conexão DB
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          <div className="flex gap-4 mb-6 p-1 bg-slate-800/50 rounded-lg">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setIsLogin(true)}
            >
              Entrar
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              onClick={() => setIsLogin(false)}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Nome Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="relative">
                  <Layout className="absolute left-3 top-3 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Nome da Empresa (Opcional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/10 py-2 rounded border border-red-900/20">{error}</p>
            )}

            <Button 
              className="w-full mt-2 h-11 text-base shadow-lg shadow-indigo-900/20" 
              isLoading={isLoading}
              icon={!isLoading && <ArrowRight size={18} />}
            >
              {isLogin ? 'Acessar' : 'Cadastrar Grátis'}
            </Button>
          </form>

          {/* Admin Hint Removed for Production Look */}
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 flex justify-center gap-4">
          <button onClick={() => setShowTerms(true)} className="hover:text-indigo-400 transition-colors">Termos de Uso</button>
          <span>•</span>
          <button onClick={() => setShowPrivacy(true)} className="hover:text-indigo-400 transition-colors">Política de Privacidade</button>
        </div>
      </div>

      <LegalModal isOpen={showTerms} onClose={() => setShowTerms(false)} type="terms" />
      <LegalModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} type="privacy" />
      <DocumentationModal isOpen={showDoc} onClose={() => setShowDoc(false)} />
    </div>
  );
};
