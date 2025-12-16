export interface UserProfile {
  name: string;
  role: string;
  topic: string;
  email: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum AppRoute {
  SIGNUP = '/',
  HOME = '/home',
  CONVERSATION = '/conversation',
  FEEDBACK = '/feedback',
}

export type AudioConfig = {
  sampleRate: number;
};