import axios from 'axios'

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'

export const commentApi = {
  // Ottieni tutti i commenti per un ticket
  getCommentsByTicket(ticketId, token) {
    return axios.get(`${API_URL}/tickets/${ticketId}/comments`, {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {}
    })
  },

  // Crea un nuovo commento
  createComment(ticketId, commentText, token) {
    return axios.post(
      `${API_URL}/comments`,
      {
        ticket_id: ticketId,
        comment_text: commentText
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
  },

  // Aggiorna un commento
  updateComment(commentId, commentText, token) {
    return axios.put(
      `${API_URL}/comments/${commentId}`,
      {
        comment_text: commentText
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
  },

  // Elimina un commento
  deleteComment(commentId, token) {
    return axios.delete(
      `${API_URL}/comments/${commentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
  }
}
