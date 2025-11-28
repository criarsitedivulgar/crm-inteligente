export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export enum ColumnId {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done'
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

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
  clientName?: string; // Novo campo
  clientPhone?: string;
  attachments?: Attachment[];
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
  hourlyRate: number; // Novo campo

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
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  isPro: boolean;
  avatar?: string;
  companyName?: string;
}