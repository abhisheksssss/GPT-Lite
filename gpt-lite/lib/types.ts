export type Role = "user" | "assistant";

export type MessageStatus = "streaming" | "complete" | "error";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  status?: MessageStatus;
  latencyMs?: number;
  tokenCount?: number;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface ChatSettings {
  temperature: number;
  maxNewTokens: number;
  topK: number;
  repetitionPenalty: number;
  stream: boolean;
}

export type RequestState = "idle" | "streaming" | "error";

export interface RequestStatus {
  state: RequestState;
  error?: string;
  startedAt?: number;
  firstTokenAt?: number;
  completedAt?: number;
}
