import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { AppSettings } from '../types';
import { Save, Mail, Shield, Server, BellRing, CreditCard, Key, Settings as SettingsIcon, DollarSign } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'payments'>('general');

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  const handleChange = (field: keyof AppSettings, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações do Sistema">
      <div className="space-y-6">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-700">
           <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'general' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Geral
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'notifications' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Notificações
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'payments' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Pagamentos
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

        {/* --- ABA NOTIFICAÇÕES --- */}
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
              </div>
            )}
          </div>
        )}

        {/* --- ABA PAGAMENTOS (MERCADO PAGO) --- */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-sky-900/50 p-2 rounded-lg text-sky-400">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 className="text-white font-medium">Integração Mercado Pago</h4>
                  <p className="text-xs text-slate-400">Ativar checkout via Pix/Cartão.</p>
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
                   <p className="text-sm text-sky-200 mb-2 font-semibold">Como obter suas credenciais:</p>
                   <ol className="list-decimal list-inside text-xs text-sky-300/80 space-y-1">
                     <li>Acesse o <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Painel de Desenvolvedores</a> do Mercado Pago.</li>
                     <li>Crie uma aplicação.</li>
                     <li>Copie a <strong>Public Key</strong> e o <strong>Access Token</strong> de Produção.</li>
                   </ol>
                </div>

                <div className="space-y-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                      <Key size={14} /> Public Key
                    </label>
                    <input
                      type="text"
                      value={formData.mercadoPagoPublicKey}
                      onChange={(e) => handleChange('mercadoPagoPublicKey', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none font-mono text-xs"
                      placeholder="APP_USR-..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                      <Key size={14} /> Access Token
                    </label>
                    <input
                      type="password"
                      value={formData.mercadoPagoAccessToken}
                      onChange={(e) => handleChange('mercadoPagoAccessToken', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-sky-500 outline-none font-mono text-xs"
                      placeholder="APP_USR-..."
                    />
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 text-center mt-2">
                  Nota: Estas chaves são salvas apenas no seu navegador localmente para demonstração.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
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
      </div>
    </Modal>
  );
};