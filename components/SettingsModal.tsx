import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { AppSettings, User } from '../types';
import { Save, Mail, Shield, Server, BellRing, CreditCard, Key, Settings as SettingsIcon, DollarSign, Lock, UserCog, Briefcase, User as UserIcon, MessageCircle, Smartphone, Wallet, Send } from 'lucide-react';
import { updateUserAccount, updateUserProfile } from '../services/supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  isSuperAdmin?: boolean;
  user?: User | null;
  onProfileUpdate?: (name: string, company: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, isSuperAdmin = false, user, onProfileUpdate }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'payments' | 'security' | 'whatsapp'>('general');
  
  // Security & Profile State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');

  const [securityMessage, setSecurityMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  useEffect(() => {
    setFormData(settings);
    // Limpar e inicializar estados ao abrir
    if (isOpen) {
      setNewEmail('');
      setNewPassword('');
      setConfirmPassword('');
      setSecurityMessage(null);
      setIsTestingEmail(false);
      
      if (user) {
        setNewName(user.name);
        setNewCompany(user.companyName || '');
      }
    }
  }, [settings, isOpen, user]);

  const handleChange = (field: keyof AppSettings, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityUpdate = async () => {
    setSecurityMessage(null);
    setIsUpdatingSecurity(true);

    try {
      // 1. Atualizar Perfil (Nome / Empresa)
      if (user && (newName !== user.name || newCompany !== user.companyName)) {
        await updateUserProfile(newName, newCompany);
        if (onProfileUpdate) {
          onProfileUpdate(newName, newCompany);
        }
      }

      // 2. Atualizar Credenciais (Email / Senha) - Se preenchidos
      if (newEmail || newPassword) {
         if (newPassword && newPassword !== confirmPassword) {
            throw new Error('As senhas não coincidem.');
         }
         
         const attributes: { email?: string; password?: string } = {};
         if (newEmail) attributes.email = newEmail;
         if (newPassword) attributes.password = newPassword;

         await updateUserAccount(attributes);
      }

      let msg = "Perfil atualizado com sucesso!";
      if (newEmail) msg += " Verifique seu novo e-mail para confirmar a alteração.";
      
      setSecurityMessage({ type: 'success', text: msg });
      
      // Limpa campos sensíveis
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      console.error(error);
      setSecurityMessage({ type: 'error', text: error.message || "Erro ao atualizar conta." });
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  const handleTestEmail = () => {
    setIsTestingEmail(true);
    
    // Simulação de teste
    setTimeout(() => {
      setIsTestingEmail(false);
      if (formData.emailAddress && formData.smtpHost && formData.smtpUser) {
        alert(`Teste de envio para ${formData.emailAddress} realizado com sucesso! (Simulado)`);
      } else {
        alert("Por favor, preencha todos os campos de e-mail antes de testar.");
      }
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações do Sistema">
      <div className="space-y-6">
        
        {/* Tabs Scrollable for Mobile */}
        <div className="flex border-b border-slate-700 overflow-x-auto pb-1 custom-scrollbar">
           <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'general' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Geral
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'whatsapp' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            WhatsApp API
          </button>
          
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'payments' 
                ? 'border-yellow-500 text-yellow-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Financeiro
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'notifications' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            E-mail
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'security' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Perfil
          </button>
        </div>

        {/* --- ABA GERAL --- */}
        {activeTab === 'general' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-900/50 p-2 rounded-lg text-emerald-400">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Calculadora de Custos</h4>
                    <p className="text-xs text-slate-400">Defina o valor da sua hora para calcular o custo por cliente.</p>
                  </div>
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-slate-300 mb-1">
                     Valor da Hora (R$)
                   </label>
                   <input
                     type="number"
                     value={formData.hourlyRate}
                     onChange={(e) => handleChange('hourlyRate', Number(e.target.value))}
                     className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                     placeholder="150.00"
                   />
                </div>
              </div>
           </div>
        )}

        {/* --- ABA WHATSAPP API --- */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="bg-emerald-900/50 p-2 rounded-lg text-emerald-400">
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Automação WhatsApp</h4>
                      <p className="text-xs text-slate-400">Envie lembretes automáticos sem abrir o app.</p>
                    </div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.whatsappApiEnabled}
                      onChange={(e) => handleChange('whatsappApiEnabled', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
               </div>

               {formData.whatsappApiEnabled && (
                  <div className="space-y-4 animate-in fade-in">
                     <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-xs text-slate-400">
                        <p className="font-bold text-white mb-1">Recomendação:</p>
                        Use a <strong>Evolution API</strong> ou <strong>Z-API</strong>. 
                        A URL deve ser o endpoint de envio (ex: <code>/message/sendText</code>).
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                         <Server size={14} /> URL da API (Endpoint)
                       </label>
                       <input
                         type="text"
                         value={formData.whatsappApiUrl || ''}
                         onChange={(e) => handleChange('whatsappApiUrl', e.target.value)}
                         className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
                         placeholder="https://api.seuserver.com/message/sendText"
                       />
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                         <Key size={14} /> API Key / Token
                       </label>
                       <input
                         type="password"
                         value={formData.whatsappApiToken || ''}
                         onChange={(e) => handleChange('whatsappApiToken', e.target.value)}
                         className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
                         placeholder="Seu token de acesso"
                       />
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                         <Smartphone size={14} /> Instance Name (Opcional)
                       </label>
                       <input
                         type="text"
                         value={formData.whatsappInstanceName || ''}
                         onChange={(e) => handleChange('whatsappInstanceName', e.target.value)}
                         className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                         placeholder="Ex: MinhaInstancia (usado na Evolution API)"
                       />
                     </div>
                  </div>
               )}
            </div>
          </div>
        )}

        {/* --- ABA FINANCEIRO / PAGAMENTOS --- */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            
            {/* Chave Pix Padrão */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
               <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-900/50 p-2 rounded-lg text-yellow-400">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Dados de Recebimento</h4>
                    <p className="text-xs text-slate-400">Defina sua chave Pix padrão para agilizar as cobranças.</p>
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                   <Key size={14} /> Chave PIX Padrão
                 </label>
                 <input
                   type="text"
                   value={formData.defaultPixKey || ''}
                   onChange={(e) => handleChange('defaultPixKey', e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-yellow-500 outline-none font-mono text-sm"
                   placeholder="CPF, E-mail ou Chave Aleatória"
                 />
                 <p className="text-[10px] text-slate-500 mt-2">Esta chave será preenchida automaticamente ao criar novas tarefas com cobrança.</p>
               </div>
            </div>

            {/* Mercado Pago (Agora visível para todos configurarem seu recebimento) */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-sky-900/50 p-2 rounded-lg text-sky-400">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 className="text-white font-medium">Integração Mercado Pago</h4>
                  <p className="text-xs text-slate-400">Configure para receber pagamentos de clientes.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.mercadoPagoEnabled}
                  onChange={(e) => handleChange('mercadoPagoEnabled', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>

            {formData.mercadoPagoEnabled && (
              <div className="space-y-4">
                <div className="bg-sky-900/20 border border-sky-800/50 p-4 rounded-lg">
                   <p className="text-sm text-sky-200 mb-2 font-semibold">Credenciais MP:</p>
                   <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.mercadoPagoPublicKey}
                        onChange={(e) => handleChange('mercadoPagoPublicKey', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none font-mono text-xs"
                        placeholder="Public Key"
                      />
                      <input
                        type="password"
                        value={formData.mercadoPagoAccessToken}
                        onChange={(e) => handleChange('mercadoPagoAccessToken', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none font-mono text-xs"
                        placeholder="Access Token"
                      />
                   </div>
                   <p className="text-[10px] text-sky-300 mt-2">
                     Essas credenciais são usadas para gerar links de pagamento nas suas tarefas.
                   </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ABA NOTIFICAÇÕES (EMAIL) --- */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-900/50 p-2 rounded-lg text-indigo-400">
                  <BellRing size={20} />
                </div>
                <div>
                  <h4 className="text-white font-medium">Notificações por E-mail</h4>
                  <p className="text-xs text-slate-400">Receba avisos ao completar tarefas.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.emailEnabled}
                  onChange={(e) => handleChange('emailEnabled', e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {formData.emailEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                      <Mail size={14} /> E-mail Remetente
                    </label>
                    <input
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) => handleChange('emailAddress', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="seu-email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                      <Server size={14} /> Host SMTP
                    </label>
                    <input
                      type="text"
                      value={formData.smtpHost}
                      onChange={(e) => handleChange('smtpHost', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Porta
                    </label>
                    <input
                      type="text"
                      value={formData.smtpPort}
                      onChange={(e) => handleChange('smtpPort', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="587"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                      <Shield size={14} /> Usuário SMTP
                    </label>
                    <input
                      type="text"
                      value={formData.smtpUser}
                      onChange={(e) => handleChange('smtpUser', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Senha / App Key
                    </label>
                    <input
                      type="password"
                      value={formData.smtpPass}
                      onChange={(e) => handleChange('smtpPass', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleTestEmail}
                    isLoading={isTestingEmail}
                    variant="secondary"
                    className="w-full sm:w-auto"
                    icon={<Send size={14} />}
                  >
                    Testar Configuração
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ABA PERFIL E SEGURANÇA --- */}
        {activeTab === 'security' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-900/30 p-2 rounded-lg text-red-400">
                    <UserCog size={20} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Meu Perfil e Acesso</h4>
                    <p className="text-xs text-slate-400">Atualize seus dados pessoais e credenciais.</p>
                  </div>
                </div>

                <div className="space-y-4">
                   
                   {/* DADOS DE PERFIL */}
                   <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-700/50">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                          <UserIcon size={14} /> Nome Completo
                        </label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                          <Briefcase size={14} /> Nome da Empresa
                        </label>
                        <input
                          type="text"
                          value={newCompany}
                          onChange={(e) => setNewCompany(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                   </div>

                   {/* CREDENCIAIS */}
                   <div className="pt-2">
                     <p className="text-xs text-slate-500 mb-3 font-semibold uppercase">Alterar Senha / E-mail</p>
                     
                     <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                          <Mail size={14} /> Novo E-mail
                        </label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Preencha apenas se quiser alterar"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                            <Lock size={14} /> Nova Senha
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-sm font-medium text-slate-300 mb-1">
                            Confirmar Senha
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Repita a senha"
                          />
                        </div>
                     </div>
                   </div>

                   {securityMessage && (
                     <div className={`p-3 rounded-lg text-sm border ${securityMessage.type === 'success' ? 'bg-emerald-900/20 border-emerald-800 text-emerald-300' : 'bg-red-900/20 border-red-800 text-red-300'}`}>
                       {securityMessage.text}
                     </div>
                   )}

                   <div className="pt-2">
                     <Button 
                       onClick={handleSecurityUpdate} 
                       isLoading={isUpdatingSecurity}
                       variant="danger"
                       className="w-full sm:w-auto"
                     >
                       Salvar Alterações
                     </Button>
                   </div>
                </div>
              </div>
           </div>
        )}

        {/* Footer Actions */}
        {activeTab !== 'security' && (
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                onSave(formData);
                onClose();
              }}
              icon={<Save size={16} />}
            >
              Salvar Configurações
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};