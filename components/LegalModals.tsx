import React from 'react';
import { Modal } from './ui/Modal';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  const title = type === 'terms' ? 'Termos de Uso' : 'Política de Privacidade';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-slate-300 space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-sm leading-relaxed">
        {type === 'terms' ? (
          <>
            <p><strong>1. Aceitação dos Termos</strong><br/>Ao acessar e usar o Gerenciador de Tarefas SaaS, você concorda em cumprir estes termos.</p>
            <p><strong>2. Descrição do Serviço</strong><br/>Fornecemos uma plataforma de gestão de tarefas baseada em Kanban com recursos de IA e armazenamento de arquivos.</p>
            <p><strong>3. Assinatura e Pagamentos</strong><br/>O plano Pro custa R$ 48,90/mês. O cancelamento pode ser feito a qualquer momento, mantendo o acesso até o fim do ciclo vigente.</p>
            <p><strong>4. Uso de Dados</strong><br/>Você é responsável pelos dados e arquivos inseridos na plataforma.</p>
          </>
        ) : (
          <>
            <p><strong>1. Coleta de Dados</strong><br/>Coletamos nome, e-mail e dados de uso para fornecer o serviço.</p>
            <p><strong>2. Armazenamento</strong><br/>Seus dados são armazenados localmente no seu dispositivo (nesta versão de demonstração) e processados para fins de backup quando a sincronização estiver ativa.</p>
            <p><strong>3. Integrações de Terceiros</strong><br/>Utilizamos a API do Google Gemini para recursos de IA. Dados enviados para IA estão sujeitos à política de dados do Google.</p>
            <p><strong>4. Segurança</strong><br/>Adotamos medidas para proteger suas informações, mas nenhum serviço é 100% seguro.</p>
          </>
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={onClose} className="text-slate-400 hover:text-white text-sm underline">
          Fechar
        </button>
      </div>
    </Modal>
  );
};
