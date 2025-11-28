import { GoogleGenAI, Type } from "@google/genai";
import { Priority, ColumnId, GeneratedTask } from '../types';

// Initialize the client
// NOTE: Supports both Node/process.env and Vite/import.meta.env
const getClient = () => {
  // @ts-ignore - Ignora erro de tipo se import.meta não estiver definido no ambiente atual
  const apiKey = process.env.API_KEY || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_KEY : undefined);
  
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generatePlanFromGoal = async (goal: string): Promise<GeneratedTask[]> => {
  const client = getClient();
  if (!client) throw new Error("API Key não configurada");

  const systemInstruction = `
    Você é um gerente de projetos Agile especialista.
    Seu objetivo é quebrar um objetivo complexo do usuário em tarefas menores e acionáveis para um quadro Kanban.
    
    Regras:
    1. Crie entre 3 a 8 tarefas.
    2. Seja conciso nos títulos.
    3. Use a descrição para detalhar brevemente a ação.
    4. Atribua prioridades realistas (Baixa, Média, Alta, Crítica).
    5. Distribua o status inicial sugerido (maioria em 'todo', algumas em 'in-progress' se fizer sentido iniciar já).
    6. O idioma deve ser PORTUGUÊS (PT-BR).
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `O objetivo do projeto é: "${goal}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL] },
                  suggestedColumn: { type: Type.STRING, enum: [ColumnId.TODO, ColumnId.IN_PROGRESS, ColumnId.DONE] }
                },
                required: ["title", "description", "priority", "suggestedColumn"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.tasks || [];
    }
    return [];
  } catch (error) {
    console.error("Erro ao gerar tarefas com Gemini:", error);
    throw error;
  }
};

export const summarizeAudio = async (base64Data: string, mimeType: string): Promise<{ title: string; summary: string }> => {
  const client = getClient();
  if (!client) throw new Error("API Key não configurada");

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          {
            text: `
              Aja como um assistente pessoal eficiente.
              1. Transcreva o áudio enviado (que é uma mensagem de WhatsApp de um cliente).
              2. Identifique a solicitação principal.
              3. Retorne um JSON com:
                 - "title": Um título curto e acionável para a tarefa (Ex: "Corrigir erro no formulário").
                 - "summary": A transcrição resumida focada no que precisa ser feito, eliminando saudações longas ou pausas.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["title", "summary"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { title: "Áudio Processado", summary: "Não foi possível gerar o resumo." };
  } catch (error) {
    console.error("Erro ao processar áudio:", error);
    throw error;
  }
};