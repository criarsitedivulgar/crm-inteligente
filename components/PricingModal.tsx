import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Check, Star, ShieldCheck, Zap, QrCode, CreditCard, CalendarDays } from 'lucide-react';
import { AppSettings } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  settings?: AppSettings;
}

type PlanType = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade, settings }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');

  // Check if Mercado Pago is configured
  const isMPEnabled = settings?.mercadoPagoEnabled && settings?.mercadoPagoPublicKey;

  const plans = {
    monthly: { label: 'Mensal', price: 48.90, desc: '/mês', savings: '' },
    quarterly: { label: 'Trimestral', price: 139.90, desc: '/trimestre', savings: 'Economize 5%' },
    semiannual: { label: 'Semestral', price: 269.90, desc: '/semestre', savings: 'Economize 8%' },
    annual: { label: 'Anual', price: 499.90, desc: '/ano', savings: 'Economize 15%' }
  };

  const handleSubscribe = () => {
    setIsProcessing(true);

    if (isMPEnabled) {
      // Simulate creating a payment preference
      setTimeout(() => {
        setIsProcessing(false);
        setShowPix(true);
      }, 1500);
    } else {
      // Default simulation
      setTimeout(() => {
        setShowPix(true); // Always show Pix first for manual confirmation flow
        setIsProcessing(false);
      }, 1500);
    }
  };

  const handlePixPaymentSimulated = () => {
    // This simulates the user paying the Pix and the webhook confirming it
    setIsProcessing(true);
    setTimeout(() => {
      onUpgrade();
      setShowPix(false);
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade para o Plano Pro">
      
      {showPix ? (
        <div className="text-center animate-in zoom-in duration-300">
           <div className="mb-6">
             <h3 className="text-xl font-bold text-white mb-2">Pagamento via Pix ({plans[selectedPlan].label})</h3>
             <p className="text-slate-400 text-sm">Escaneie o QR Code abaixo para liberar seu acesso instantaneamente.</p>
             <p className="text-emerald-400 font-bold text-lg mt-2">R$ {plans[selectedPlan].price.toFixed(2)}</p>
           </div>

           <div className="bg-white p-4 rounded-lg w-48 h-48 mx-auto mb-6 flex items-center justify-center border-4 border-sky-500 relative">
              <QrCode size={120} className="text-slate-900" />
              <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                 <p className="text-xs font-bold text-slate-800 rotate-[-12deg] border-2 border-slate-800 p-1">QR CODE SIMULADO</p>
              </div>
           </div>

           <div className="bg-slate-800 p-3 rounded border border-slate-700 mb-6 font-mono text-xs text-slate-400 break-all select-all">
             00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540548.905802BR5913MercadoPago6008SaoPaulo62070503***6304E2CA
           </div>

           <div className="flex flex-col gap-3">
             <Button 
               variant="primary" 
               className="w-full bg-emerald-600 hover:bg-emerald-700"
               onClick={handlePixPaymentSimulated}
               isLoading={isProcessing}
             >
               {isProcessing ? 'Validando Pagamento...' : 'Já fiz o pagamento'}
             </Button>
             <button onClick={() => setShowPix(false)} className="text-sm text-slate-500 hover:text-white">
               Voltar e trocar plano
             </button>
           </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-full mb-4">
              <Star className="text-indigo-400 w-8 h-8" fill="currentColor" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Desbloqueie todo o potencial</h3>
            <p className="text-slate-400 text-sm">Escolha o plano ideal para gerenciar seus projetos sem limites.</p>
          </div>

          {/* Plan Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {(Object.keys(plans) as PlanType[]).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  selectedPlan === key 
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-700'
                }`}
              >
                <span className="text-xs font-bold">{plans[key].label}</span>
                {plans[key].savings && (
                  <span className="text-[10px] text-emerald-400 font-bold">{plans[key].savings}</span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-slate-800 rounded-xl border border-indigo-500/30 p-6 relative overflow-hidden mb-6 transition-all">
            {selectedPlan === 'annual' && (
               <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                 MELHOR VALOR
               </div>
            )}
            
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <span className="text-sm text-slate-400">R$</span>
              <span className="text-4xl font-black text-white">{plans[selectedPlan].price.toFixed(2).replace('.', ',')}</span>
              <span className="text-slate-400 text-sm">{plans[selectedPlan].desc}</span>
            </div>

            <ul className="space-y-3 mb-6 text-left">
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="bg-emerald-500/20 p-1 rounded-full"><Check size={12} className="text-emerald-400" /></div>
                Tarefas e Projetos Ilimitados
              </li>
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="bg-emerald-500/20 p-1 rounded-full"><Check size={12} className="text-emerald-400" /></div>
                IA Avançada (Resumo de Áudio e Planejamento)
              </li>
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                <div className="bg-emerald-500/20 p-1 rounded-full"><Check size={12} className="text-emerald-400" /></div>
                5GB de Armazenamento
              </li>
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                 <div className="bg-emerald-500/20 p-1 rounded-full"><CalendarDays size={12} className="text-emerald-400" /></div>
                 Acesso {plans[selectedPlan].label}
              </li>
            </ul>

            <Button 
              variant="primary" 
              className={`w-full border-0 ${isMPEnabled ? 'bg-[#009EE3] hover:bg-[#007eb5] text-white' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'}`}
              onClick={handleSubscribe}
              isLoading={isProcessing}
              icon={isMPEnabled ? <CreditCard size={18} /> : <Zap size={16} />}
            >
              {isProcessing ? 'Processando...' : isMPEnabled ? `Pagar com Mercado Pago` : 'Assinar Agora'}
            </Button>
            
            {isMPEnabled && (
               <div className="flex justify-center mt-3">
                 <span className="text-[10px] text-slate-500 flex items-center gap-1">
                   Powered by <span className="font-bold text-[#009EE3]">mercadopago</span>
                 </span>
               </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} />
            Pagamento seguro e liberação imediata.
          </div>
        </>
      )}
    </Modal>
  );
};