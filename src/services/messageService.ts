/**
 * services/messageService.ts
 * Servico de mensagens / chat (dominio: comunicacao).
 * Endpoints reais do backend:
 *   GET  /message/:userId/:recipientId
 *   GET  /message/:userId/recent
 *   GET  /message/:userId/unread
 *   PUT  /message/:messageId/read
 *   PUT  /message/:userId/read-all/:senderId
 *   DELETE /message/:messageId
 *
 * O backend NAO expõe POST /message para envio. O envio de mensagens e
 * feito via Socket.IO (ChatContext). Aqui mantemos apenas as rotas HTTP existentes.
 */

import { apiClient, ApiResponse } from "../api/client";

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation extends Message {}

/**
 * Busca conversa entre dois usuarios.
 */
export async function getConversation(
  userId: string | number,
  recipientId: string | number,
  limit = 50
): Promise<ApiResponse<Conversation[]>> {
  return apiClient.get<Conversation[]>(
    `message/${userId}/${recipientId}?limit=${limit}`
  );
}

/**
 * Busca conversas recentes de um usuario.
 */
export async function getRecentConversations(
  userId: string | number,
  limit = 10
): Promise<ApiResponse<Conversation[]>> {
  return apiClient.get<Conversation[]>(
    `message/${userId}/recent?limit=${limit}`
  );
}

/**
 * Conta mensagens nao lidas de um usuario.
 */
export async function countUnread(
  userId: string | number
): Promise<ApiResponse<any[]>> {
  return apiClient.get(`message/${userId}/unread`);
}

/**
 * Marca uma mensagem como lida.
 */
export async function markMessageAsRead(
  messageId: string | number
): Promise<ApiResponse<Message>> {
  return apiClient.put<Message>(`message/${messageId}/read`);
}

/**
 * Marca todas as mensagens de um remetente como lidas para um destinatario.
 */
export async function markAllAsRead(
  senderId: string | number,
  recipientId: string | number
): Promise<ApiResponse<Message[]>> {
  return apiClient.put<Message[]>(
    `message/${recipientId}/read-all/${senderId}`
  );
}

/**
 * Exclui uma mensagem (apenas o remetente pode).
 */
export async function deleteMessage(
  messageId: string | number,
  userId: string | number
): Promise<ApiResponse<{ message: string }>> {
  return apiClient.delete(`message/${messageId}`);
}
