import React, { useState } from 'react';
import { Button } from './ui/Button';
import { User } from '../types';
import { Layout, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, ShieldAlert, BookOpen } from 'lucide-react';
import { LegalModal } from './LegalModals';
import { DocumentationModal } from './DocumentationModal';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulação de delay de rede
    setTimeout(() => {
      // --- BACKDOOR DE ADMINISTRADOR ---
      if (email === 'admin@admin.com' && password === '123456') {
        const adminUser: User = {
          id: 'sys-admin-master',
          name: 'Super Administrador',
          email: 'admin@admin.com',
          companyName: 'Painel Administrativo',
          isPro: true // Admin sempre é Pro
        };
        onLogin(adminUser);
        setIsLoading(false);
        return;
      }
      // ---------------------------------

      // Validação básica
      if (!email || !password || (!isLogin && !name)) {
        setError("Preencha todos os campos obrigatórios.");
        setIsLoading(false);
        return;
      }

      // Mock User
      const mockUser: User = {
        id: `user-${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        companyName: company || 'Minha Empresa',
        isPro: false // Começa como gratuito
      };

      // Se for login, tentar recuperar do localStorage (simulação)
      if (isLogin) {
        const storedUsers = JSON.parse(localStorage.getItem('saas_users') || '[]');
        const found = storedUsers.find((u: User) => u.email === email);
        
        // Em um app real validaria a senha. Aqui aceitamos qualquer senha para fins de demo se o email existir,
        // ou criamos um novo "login" implícito para facilitar o teste.
        if (found) {
           onLogin(found);
        } else {
           // Fallback para demo: Cria se não existir no "login" para não frustrar o teste
           onLogin(mockUser);
        }
      } else {
        // Cadastro
        const storedUsers = JSON.parse(localStorage.getItem('saas_users') || '[]');
        const newUser = { ...mockUser, password }; // Nunca salve senhas em texto puro em produção!
        localStorage.setItem('saas_users', JSON.stringify([...storedUsers, newUser]));
        onLogin(newUser);
      }

      setIsLoading(false);
    }, 1000);
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
          <p className="text-slate-400">Gerencie projetos, anexe contratos e automatize com IA.</p>
        </div>

        {/* Documentation Access for Setup */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => setShowDoc(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-500/30 transition-colors"
          >
            <BookOpen size={12} />
            Manual de Instalação do Desenvolvedor
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
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="Senha segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/10 py-2 rounded">{error}</p>
            )}

            <Button 
              className="w-full mt-2 h-11 text-base shadow-lg shadow-indigo-900/20" 
              isLoading={isLoading}
              icon={!isLoading && <ArrowRight size={18} />}
            >
              {isLogin ? 'Acessar Plataforma' : 'Começar Gratuitamente'}
            </Button>
          </form>

          {!isLogin && (
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>7 dias de teste grátis no plano Pro</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          )}

          {/* Admin Hint */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center opacity-30 hover:opacity-100 transition-opacity duration-500 group cursor-help">
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
               <ShieldAlert size={10} />
               <span>Demo Admin: admin@admin.com / 123456</span>
            </div>
          </div>
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
