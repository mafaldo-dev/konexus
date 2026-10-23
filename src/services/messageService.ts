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
import { asList, asObject } from "../api/payload";

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
  return asList<Conversation>(await apiClient.get(`message/${userId}/${recipientId}?limit=${limit}`), ["data"], "conversa");
}

/**
 * Busca conversas recentes de um usuario.
 */
export async function getRecentConversations(
  userId: string | number,
  limit = 10
): Promise<ApiResponse<Conversation[]>> {
  return asList<Conversation>(await apiClient.get(`message/${userId}/recent?limit=${limit}`), ["data"], "conversas recentes");
}

/**
 * Conta mensagens nao lidas de um usuario.
 */
export async function countUnread(
  userId: string | number
): Promise<ApiResponse<any[]>> {
  return asList(await apiClient.get(`message/${userId}/unread`), ["data"], "mensagens não lidas");
}

/**
 * Marca uma mensagem como lida.
 */
export async function markMessageAsRead(
  messageId: string | number
): Promise<ApiResponse<Message>> {
  return asObject<Message>(await apiClient.put(`message/${messageId}/read`), ["data"], "mensagem");
}

/**
 * Marca todas as mensagens de um remetente como lidas para um destinatario.
 */
export async function markAllAsRead(
  senderId: string | number,
  recipientId: string | number
): Promise<ApiResponse<Message[]>> {
  return asList<Message>(await apiClient.put(`message/${recipientId}/read-all/${senderId}`), ["data"], "mensagens lidas");
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
