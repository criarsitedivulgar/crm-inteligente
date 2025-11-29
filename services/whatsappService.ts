import { AppSettings, Task } from '../types';

export const sendWhatsAppNotification = async (task: Task, settings: AppSettings, isBilling: boolean = false): Promise<boolean> => {
  if (!task.clientPhone) {
    throw new Error("Telefone do cliente não informado.");
  }

  // Limpa o telefone (mantém apenas números)
  const phone = task.clientPhone.replace(/\D/g, '');
  const clientName = task.clientName || 'Cliente';
  
  let message = '';

  if (isBilling) {
    // MENSAGEM DE COBRANÇA
    const periodMap: Record<string, string> = {
       unique: 'Único',
       monthly: 'Mensal',
       quarterly: 'Trimestral',
       semiannual: 'Semestral',
       annual: 'Anual'
    };
    const period = task.billingPeriod ? periodMap[task.billingPeriod] : 'Único';
    const value = task.billingValue ? `R$ ${task.billingValue.toFixed(2)}` : 'A combinar';
    const pix = task.billingPixKey ? `\n🔑 *Chave PIX:* ${task.billingPixKey}` : '';

    message = `Olá ${clientName}, tudo bem? 👋\n\nSegue o faturamento referente a: *${task.title}*.\n\n📄 *Detalhes:*\nValor: *${value}*\nPeríodo: ${period}${pix}\n\nPor favor, envie o comprovante assim que possível. Obrigado!`;
  } else {
    // MENSAGEM DE NOTIFICAÇÃO PADRÃO
    message = `Olá ${clientName}, tudo bem? 👋\n\nLembrete da tarefa: *${task.title}*.\nStatus: ${task.description ? task.description.substring(0, 50) + '...' : 'Pendente'}.\n\nQualquer dúvida, estou à disposição!`;
  }

  // 1. Tenta via API Paga se estiver ativa
  if (settings.whatsappApiEnabled && settings.whatsappApiUrl && settings.whatsappApiToken) {
    try {
      // Estrutura genérica compatível com Evolution API / Z-API (Adapte conforme a documentação da API escolhida)
      
      const payload = {
        number: phone, // Evolution API usa 'number', Z-API usa 'phone'
        phone: phone,  // Enviando ambos para compatibilidade
        text: message,
        message: message,
        instanceName: settings.whatsappInstanceName
      };

      const response = await fetch(settings.whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': settings.whatsappApiToken, // Evolution
          'Authorization': `Bearer ${settings.whatsappApiToken}`, // Padrão
          'Client-Token': settings.whatsappApiToken // Z-API
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro API: ${response.statusText}`);
      }

      return true; // Sucesso API
    } catch (error) {
      console.error("Falha ao enviar via API, tentando fallback...", error);
      // Se falhar a API, cai para o método manual abaixo
    }
  }

  // 2. Fallback: Abre o Link do WhatsApp (Manual)
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
  return false; // Indica que foi manual (não API)
};