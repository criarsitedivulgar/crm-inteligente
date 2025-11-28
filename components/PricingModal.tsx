import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Check, Star, ShieldCheck, Zap, QrCode, CreditCard } from 'lucide-react';
import { AppSettings } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  settings?: AppSettings;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onUpgrade, settings }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPix, setShowPix] = useState(false);

  // Check if Mercado Pago is configured
  const isMPEnabled = settings?.mercadoPagoEnabled && settings?.mercadoPagoPublicKey;

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
        onUpgrade();
        setIsProcessing(false);
        onClose();
      }, 2000);
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
             <h3 className="text-xl font-bold text-white mb-2">Pagamento via Pix</h3>
             <p className="text-slate-400 text-sm">Escaneie o QR Code abaixo para liberar seu acesso instantaneamente.</p>
           </div>

           <div className="bg-white p-4 rounded-lg w-48 h-48 mx-auto mb-6 flex items-center justify-center border-4 border-sky-500">
              {/* Fake QR Code Visual */}
              <QrCode size={120} className="text-slate-900" />
           </div>

           <div className="bg-slate-800 p-3 rounded border border-slate-700 mb-6 font-mono text-xs text-slate-400 break-all">
             00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540548.905802BR5913MercadoPago6008SaoPaulo62070503***6304E2CA
           </div>

           <div className="flex flex-col gap-3">
             <Button 
               variant="primary" 
               className="w-full bg-emerald-600 hover:bg-emerald-700"
               onClick={handlePixPaymentSimulated}
               isLoading={isProcessing}
             >
               {isProcessing ? 'Verificando Pagamento...' : 'Já fiz o pagamento'}
             </Button>
             <button onClick={() => setShowPix(false)} className="text-sm text-slate-500 hover:text-white">
               Voltar
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
            <p className="text-slate-400">Gerencie seus projetos sem limites e com poder total da IA.</p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-indigo-500/30 p-6 relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              POPULAR
            </div>
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <span className="text-sm text-slate-400">R$</span>
              <span className="text-4xl font-black text-white">48,90</span>
              <span className="text-slate-400">/mês</span>
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
                5GB de Armazenamento para Contratos e Imagens
              </li>
            </ul>

            <Button 
              variant="primary" 
              className={`w-full border-0 ${isMPEnabled ? 'bg-[#009EE3] hover:bg-[#007eb5] text-white' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'}`}
              onClick={handleSubscribe}
              isLoading={isProcessing}
              icon={isMPEnabled ? <CreditCard size={18} /> : <Zap size={16} />}
            >
              {isProcessing ? 'Processando...' : isMPEnabled ? 'Pagar com Mercado Pago' : 'Assinar Agora'}
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
            Garantia de satisfação de 7 dias
          </div>
        </>
      )}
    </Modal>
  );
};