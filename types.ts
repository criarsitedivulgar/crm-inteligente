
export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export enum ColumnId {
  BUDGET = 'budget',
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  BILLING = 'billing'
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export type BillingPeriod = 'unique' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'other';
  data: string; // Base64 string
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  tags: string[];
  createdAt: number;
  completedAt?: number;
  timeSpent: number;
  isTimerRunning: boolean;
  dueDate?: string;
  recurrence: RecurrenceType;
  recurrenceDays?: number[];
  clientName?: string;
  clientPhone?: string;
  notifyClient: boolean; 
  attachments?: Attachment[];
  
  // Financeiro
  billingValue?: number;
  billingPeriod?: BillingPeriod;
  billingPixKey?: string;
  isPaid?: boolean;
  paymentDate?: number;
  
  // Status de Orçamento
  isRejected?: boolean;
}

export interface ColumnData {
  id: ColumnId;
  title: string;
  taskIds: string[];
}

export interface BoardData {
  tasks: Record<string, Task>;
  columns: Record<ColumnId, ColumnData>;
  columnOrder: ColumnId[];
}

export interface GeneratedTask {
  title: string;
  description: string;
  priority: Priority;
  suggestedColumn: ColumnId;
}

export interface AppSettings {
  // General
  hourlyRate: number;

  // Email Settings
  emailEnabled: boolean;
  emailAddress: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  
  // Mercado Pago Settings
  mercadoPagoEnabled: boolean;
  mercadoPagoPublicKey: string;
  mercadoPagoAccessToken: string;

  // WhatsApp API Settings
  whatsappApiEnabled: boolean;
  whatsappApiUrl: string; 
  whatsappApiToken: string;
  whatsappInstanceName?: string;

  // Financeiro Padrão
  defaultPixKey?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  isPro: boolean;
  avatar?: string;
  companyName?: string;
  createdAt?: string; // Data de criação para cálculo do trial
}