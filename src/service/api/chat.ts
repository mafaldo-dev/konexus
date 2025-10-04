import { apiRequest } from './api';

// Tipos compatíveis com seu ChatContext
export interface User {
  id: string;
  name: string;
  designation: string;
  sector: string;
  status: 'Ativo' | 'Ausente' | 'Inativo';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  sector: string;
  content: string;
  timestamp: string;
  recipientId: string;
  read: boolean;
}



export const fetchMessages = async (userId: string): Promise<Message[]> => {
  //const response = await apiRequest(`messages/user/${userId}`, 'GET');
  return [];
};

export const sendMessageAPI = async (message: Omit<Message, 'id'>): Promise<Message> => {
  const response = await apiRequest('messages', 'POST', message);
  return response
};

export const markMessagesReadAPI = async (senderId: string, recipientId: string): Promise<void> => {
  await apiRequest(`messages/read`, 'PUT', { senderId, recipientId });
};

export const updateUserStatus = async (userId: string, status: boolean, token?: string): Promise<void> => {
  await apiRequest(`employee/${userId}/status`, 'PUT', { status }, token);
};

export const getUserStatus = async (userId: string, token?: string) => {
  return apiRequest(`/employee/${userId}/status`, 'GET', undefined, token);
};