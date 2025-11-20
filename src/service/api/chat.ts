import { apiRequest } from './api';

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

export const fetchMessages = async (userId: string) => {
  const resp = await apiRequest(`message/${userId}/recent`, 'GET');
  return resp?.data ?? [];
};

export const fetchConversationAPI = async (userId: string, recipientId: string) => {
  const resp = await apiRequest(`message/${userId}/${recipientId}`, 'GET');
  return resp?.data ?? [];
};

export const sendMessageAPI = async (message: Omit<Message, 'id'>): Promise<Message> => {
  const response = await apiRequest('message', 'POST', message);
  return response
};

export async function markMessagesReadAPI(userId: string, senderId: string) {
  return apiRequest(`message/${userId}/read-all/${senderId}`, "PUT");
}

export const updateUserStatus = async (userId: string, status: boolean, token?: string): Promise<void> => {
  await apiRequest(`employee/${userId}/status`, 'PUT', { status }, token);
};

export const getUserStatus = async (userId: string, token?: string) => {
  return apiRequest(`employee/${userId}/status`, 'GET', undefined, token);
};