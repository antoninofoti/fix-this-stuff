<template>
  <div class="comment-section">
    <div class="comment-header">
      <h3><i class="bi bi-chat-dots"></i> Comments ({{ comments.length }})</h3>
    </div>

    <!-- Form per nuovo commento - Solo per utenti autenticati -->
    <div v-if="isAuthenticated && !isReadOnly" class="new-comment-form">
      <div class="comment-input-wrapper">
        <textarea
          v-model="newCommentText"
          class="form-control"
          placeholder="Write a comment..."
          rows="3"
          @keydown.ctrl.enter="submitComment"
        ></textarea>
        <div class="comment-actions">
          <small class="text-muted">Press Ctrl+Enter to send</small>
          <button 
            class="btn btn-primary"
            @click="submitComment"
            :disabled="!newCommentText.trim() || isSubmitting"
          >
            <span v-if="isSubmitting">
              <span class="spinner-border spinner-border-sm me-1"></span>
              Sending...
            </span>
            <span v-else>
              <i class="bi bi-send"></i> Send Comment
            </span>
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!isAuthenticated" class="login-prompt">
      <i class="bi bi-lock"></i>
      <p>You need to sign in to comment</p>
      <button class="btn btn-primary" @click="goToLogin">Sign In</button>
    </div>

    <!-- Lista commenti -->
    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="comments.length === 0" class="empty-comments">
      <i class="bi bi-chat"></i>
      <p>No comments yet. Be the first to comment!</p>
    </div>

    <div v-else class="comments-list">
      <div 
        v-for="comment in sortedComments" 
        :key="comment.id"
        class="comment-item"
      >
        <div class="comment-avatar">
          <i class="bi bi-person-circle"></i>
        </div>
        <div class="comment-content">
          <div class="comment-header-info">
            <span class="comment-author">User #{{ comment.author_id }}</span>
            <span class="comment-date">
              <i class="bi bi-clock"></i> {{ formatDate(comment.creation_date) }}
            </span>
          </div>
          
          <div v-if="editingCommentId === comment.id" class="edit-comment-form">
            <textarea
              v-model="editCommentText"
              class="form-control"
              rows="3"
            ></textarea>
            <div class="edit-actions">
              <button 
                class="btn btn-sm btn-success"
                @click="saveEditComment(comment.id)"
                :disabled="!editCommentText.trim()"
              >
                <i class="bi bi-check-lg"></i> Save
              </button>
              <button 
                class="btn btn-sm btn-secondary"
                @click="cancelEdit"
              >
                <i class="bi bi-x-lg"></i> Cancel
              </button>
            </div>
          </div>
          
          <p v-else class="comment-text">{{ comment.comment_text }}</p>

          <div v-if="canModifyComment(comment.author_id)" class="comment-actions-buttons">
            <button 
              v-if="editingCommentId !== comment.id"
              class="btn btn-sm btn-outline-primary"
              @click="startEdit(comment)"
            >
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button 
              class="btn btn-sm btn-outline-danger"
              @click="deleteComment(comment.id)"
            >
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import { commentApi } from '../api/comment'

const props = defineProps({
  ticketId: {
    type: [Number, String],
    required: true
  },
  isReadOnly: {
    type: Boolean,
    default: false
  }
})

const authStore = useAuthStore()
const router = useRouter()

const comments = ref([])
const loading = ref(false)
const isSubmitting = ref(false)
const newCommentText = ref('')
const editingCommentId = ref(null)
const editCommentText = ref('')

const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUserId = computed(() => authStore.getUserId)

const sortedComments = computed(() => {
  return [...comments.value].sort((a, b) => {
    return new Date(b.creation_date) - new Date(a.creation_date)
  })
})

const fetchComments = async () => {
  loading.value = true
  try {
    const token = authStore.getToken
    const response = await commentApi.getCommentsByTicket(props.ticketId, token)
    comments.value = response.data
  } catch (error) {
    console.error('Error loading comments:', error)
  } finally {
    loading.value = false
  }
}

const submitComment = async () => {
  if (!newCommentText.value.trim()) return

  isSubmitting.value = true
  try {
    const token = authStore.getToken
    await commentApi.createComment(props.ticketId, newCommentText.value, token)
    newCommentText.value = ''
    
    // Wait a moment to allow the consumer to process the message
    setTimeout(() => {
      fetchComments()
    }, 1000)
  } catch (error) {
    console.error('Error submitting comment:', error)
    alert('Error submitting comment. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const startEdit = (comment) => {
  editingCommentId.value = comment.id
  editCommentText.value = comment.comment_text
}

const cancelEdit = () => {
  editingCommentId.value = null
  editCommentText.value = ''
}

const saveEditComment = async (commentId) => {
  if (!editCommentText.value.trim()) return

  try {
    const token = authStore.getToken
    await commentApi.updateComment(commentId, editCommentText.value, token)
    
    // Update comment locally
    const comment = comments.value.find(c => c.id === commentId)
    if (comment) {
      comment.comment_text = editCommentText.value
    }
    
    cancelEdit()
  } catch (error) {
    console.error('Error updating comment:', error)
    alert('Error updating comment. Please try again.')
  }
}

const deleteComment = async (commentId) => {
  if (!confirm('Are you sure you want to delete this comment?')) return

  try {
    const token = authStore.getToken
    await commentApi.deleteComment(commentId, token)
    
    // Remove comment locally
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (error) {
    console.error('Error deleting comment:', error)
    alert('Error deleting comment. Please try again.')
  }
}

const canModifyComment = (authorId) => {
  return currentUserId.value === authorId
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMinutes < 1) return 'Now'
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  fetchComments()
  
  // Polling ogni 10 secondi per nuovi commenti
  const interval = setInterval(() => {
    fetchComments()
  }, 10000)
  
  // Cleanup
  return () => clearInterval(interval)
})
</script>

<style scoped>
.comment-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}

.comment-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.comment-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.new-comment-form {
  margin-bottom: 2rem;
}

.comment-input-wrapper {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.comment-input-wrapper textarea {
  border: 2px solid #dee2e6;
  resize: vertical;
  min-height: 80px;
}

.comment-input-wrapper textarea:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

.login-prompt {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.login-prompt i {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.login-prompt p {
  color: #6c757d;
  margin-bottom: 1rem;
}

.empty-comments {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.empty-comments i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.comment-item:hover {
  background: #e9ecef;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-avatar i {
  font-size: 2.5rem;
  color: #6c757d;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.comment-author {
  font-weight: 600;
  color: #2c3e50;
}

.comment-date {
  font-size: 0.85rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.comment-text {
  color: #2c3e50;
  line-height: 1.6;
  margin: 0.5rem 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-actions-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.edit-comment-form {
  margin-top: 0.5rem;
}

.edit-comment-form textarea {
  margin-bottom: 0.5rem;
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .comment-section {
    padding: 1rem;
  }

  .comment-item {
    flex-direction: column;
  }

  .comment-avatar {
    align-self: flex-start;
  }

  .comment-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
