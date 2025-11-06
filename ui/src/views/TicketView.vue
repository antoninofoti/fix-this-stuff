<template>
  <div class="container mt-4">
    <div v-if="ticketData">
      <div class="ticket-header">
        <button class="btn btn-outline-secondary mb-3" @click="goBack">
          <i class="bi bi-arrow-left"></i> Back
        </button>
        <div class="d-flex justify-content-between align-items-center">
          <h2 class="mb-4">Ticket #{{ ticketData.id }} - {{ ticketData.title }}</h2>
          <button 
            v-if="canEditTicket" 
            class="btn btn-primary"
            @click="showEditForm = true"
          >
            <i class="bi bi-pencil"></i> Edit Ticket
          </button>
        </div>
      </div>

      <!-- Edit Form Modal -->
      <div v-if="showEditForm" class="modal-overlay" @click.self="showEditForm = false">
        <div class="edit-modal">
          <EditTicketForm 
            :ticket="ticketData" 
            @updated="handleTicketUpdated"
            @cancel="showEditForm = false"
          />
        </div>
      </div>

      <div class="ticket-detail-card">
        <div class="card-body">
          <div class="detail-row">
            <strong><i class="bi bi-file-text"></i> Description:</strong>
            <p>{{ ticketData.request || ticketData.description || 'No description provided' }}</p>
          </div>
          <div class="detail-row">
            <strong><i class="bi bi-exclamation-triangle"></i> Priority:</strong>
            <span :class="['badge', getPriorityClass(ticketData.priority)]">
              {{ ticketData.priority?.toUpperCase() }}
            </span>
          </div>
          <div class="detail-row">
            <strong><i class="bi bi-coin"></i> Potential Score:</strong>
            <span class="potential-score">
              <i class="bi bi-trophy"></i>
              {{ calculatePotentialScore() }} points
              <span class="info-badge ms-2" title="Score calculated based on priority and time to resolve">
                <i class="bi bi-info-circle"></i>
              </span>
            </span>
          </div>
          <div class="detail-row">
            <strong><i class="bi bi-tag"></i> Category/System:</strong>
            <span class="badge bg-secondary">{{ getCategoryName(ticketData.system_id) }}</span>
          </div>
          <div class="detail-row">
            <strong><i class="bi bi-person"></i> Created by:</strong>
            <span v-if="ticketData.author">
              {{ ticketData.author.name }} {{ ticketData.author.surname }}
            </span>
            <span v-else>User #{{ ticketData.request_author_id }}</span>
          </div>
          <div class="detail-row">
            <strong><i class="bi bi-calendar-event"></i> Created:</strong>
            <span>{{ formatDate(ticketData.opening_date) }}</span>
          </div>
          <div class="detail-row">
            <strong><i class="bi bi-calendar-check"></i> Deadline:</strong>
            <span :class="{ 'text-danger': isOverdue }">
              {{ formatDate(ticketData.deadline_date) }}
              <span v-if="isOverdue" class="ms-2">
                <i class="bi bi-exclamation-circle"></i> Overdue
              </span>
            </span>
          </div>
          <div class="detail-row">
            <strong><i class="bi bi-flag"></i> Status:</strong>
            <span :class="['badge', getStatusClass(ticketData.flag_status)]">
              {{ ticketData.flag_status?.toUpperCase() }}
            </span>
            <span :class="['badge ms-2', getSolveStatusClass(ticketData.solve_status)]">
              {{ ticketData.solve_status?.replace('_', ' ').toUpperCase() }}
            </span>
          </div>
          <div v-if="ticketData.assigned_developer_id" class="detail-row">
            <strong><i class="bi bi-person-check"></i> Assigned to:</strong>
            <span v-if="ticketData.developer" class="developer-info">
              {{ ticketData.developer.name }} {{ ticketData.developer.surname }}
              <span class="developer-score" :title="`${ticketData.developer.name}'s score`">
                <i class="bi bi-trophy-fill"></i> {{ ticketData.developer.rank || 0 }}
              </span>
            </span>
            <span v-else>Developer #{{ ticketData.assigned_developer_id }}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons for Developers/Admins -->
      <div v-if="canResolveTicket" class="action-card mt-3">
        <div class="card-body">
          <h4><i class="bi bi-check-circle"></i> Resolve Ticket</h4>
          <p class="text-muted">Mark this ticket as resolved and closed.</p>
          
          <div class="resolve-info mb-3">
            <div class="alert alert-success">
              <i class="bi bi-trophy-fill"></i>
              <strong>You will earn {{ calculatePotentialScore() }} points</strong> for resolving this ticket!
              <br>
              <small class="text-muted">
                Based on {{ ticketData.priority?.toUpperCase() }} priority 
                ({{ getPriorityPoints(ticketData.priority) }} base points)
                × time multiplier
              </small>
            </div>
          </div>

          <textarea 
            v-model="resolutionAnswer"
            class="form-control mb-3"
            placeholder="Describe the resolution (optional)"
            rows="3"
          ></textarea>

          <div class="d-flex gap-2">
            <button 
              class="btn btn-success"
              @click="resolveTicket"
              :disabled="resolvingTicket"
            >
              <span v-if="resolvingTicket">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Resolving...
              </span>
              <span v-else>
                <i class="bi bi-check-circle-fill"></i> Mark as Resolved & Close
              </span>
            </button>
          </div>

          <div v-if="resolveError" class="alert alert-danger mt-3">
            <i class="bi bi-exclamation-circle"></i> {{ resolveError }}
          </div>
        </div>
      </div>

      <!-- Close Ticket Section - For ticket author -->
      <div v-if="canCloseTicket" class="action-card mt-3">
        <div class="card-body">
          <h4><i class="bi bi-x-circle"></i> Close Ticket</h4>
          <p class="text-muted">Close this ticket if you no longer need it or found another solution.</p>
          
          <button 
            class="btn btn-warning"
            @click="closeTicket"
            :disabled="closingTicket"
          >
            <span v-if="closingTicket">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Closing...
            </span>
            <span v-else>
              <i class="bi bi-x-circle-fill"></i> Close Ticket
            </span>
          </button>

          <div v-if="closeError" class="alert alert-danger mt-3">
            <i class="bi bi-exclamation-circle"></i> {{ closeError }}
          </div>
        </div>
      </div>

      <!-- Rating Section - Only show for closed & solved tickets -->
      <div v-if="canRateTicket" class="rating-card mt-3">
        <div class="card-body">
          <h4><i class="bi bi-star"></i> Rate this ticket resolution</h4>
          <p class="text-muted">
            How satisfied are you with the resolution? 
            <span class="info-badge" title="This is optional feedback. The developer already earned points for resolving the ticket.">
              <i class="bi bi-info-circle"></i>
            </span>
          </p>
          <div class="alert alert-info small mb-3">
            <i class="bi bi-trophy"></i> 
            <strong>Note:</strong> The assigned developer has already earned <strong>score points</strong> based on the ticket's priority and resolution time. 
            This rating is optional feedback about the quality of the resolution.
          </div>
          <div v-if="!ticketRating">
            <div class="star-rating mb-3">
              <span 
                v-for="star in 5" 
                :key="star"
                class="star"
                :class="{ active: star <= selectedRating, hovering: star <= hoverRating }"
                @click="selectedRating = star"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
              >
                ★
              </span>
            </div>
            <textarea 
              v-model="ratingComment"
              class="form-control mb-3"
              placeholder="Add a comment (optional)"
              rows="3"
            ></textarea>
            <button 
              class="btn btn-primary"
              @click="submitRating"
              :disabled="selectedRating === 0 || submittingRating"
            >
              <span v-if="submittingRating">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Submitting...
              </span>
              <span v-else>
                <i class="bi bi-send"></i> Submit Rating
              </span>
            </button>
          </div>
          <div v-else class="rating-display">
            <div class="star-rating">
              <span 
                v-for="star in 5" 
                :key="star"
                class="star"
                :class="{ active: star <= ticketRating.rating }"
              >
                ★
              </span>
            </div>
            <p v-if="ticketRating.comment" class="mt-2">
              <strong>Comment:</strong> {{ ticketRating.comment }}
            </p>
            <p class="text-muted small">
              Rated on {{ formatDate(ticketRating.rated_at) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Sezione Commenti -->
      <CommentSection :ticketId="ticketData.id" :isReadOnly="!isAuthenticated" />

      <!-- Avviso per utenti non autenticati -->
      <div v-if="!isAuthenticated" class="alert alert-info mt-3">
        <i class="bi bi-info-circle"></i> 
        <strong>Read-only mode:</strong> You need to <router-link to="/login">sign in</router-link> to add comments and interact with tickets.
      </div>
    </div>

    <div v-else class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3">Loading ticket details...</p>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, ref } from 'vue'
import { useTicketStore } from '../store/ticket'
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'
import CommentSection from '../components/CommentSection.vue'
import EditTicketForm from '../components/EditTicketForm.vue'

const ticketStore = useTicketStore()
const authStore = useAuthStore()
const router = useRouter()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.user)

const showEditForm = ref(false)
const selectedRating = ref(0)
const hoverRating = ref(0)
const ratingComment = ref('')
const submittingRating = ref(false)
const ticketRating = ref(null)
const resolutionAnswer = ref('')
const resolvingTicket = ref(false)
const resolveError = ref(null)
const closingTicket = ref(false)
const closeError = ref(null)

const props = defineProps({
  ticketId: {
    type: String,
    required: true
  },
})

const fetchTicket = async (id) => {
  try {
    await ticketStore.fetchTicketByID(id)
    // Fetch rating if ticket is closed and solved
    if (ticketData.value?.flag_status === 'closed' && ticketData.value?.solve_status === 'solved') {
      const rating = await ticketStore.fetchTicketRating(id)
      ticketRating.value = rating
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchTicket(props.ticketId)
})

watch(() => props.ticketId, (newId) => {
  fetchTicket(newId)
})

const ticketData = computed(() => ticketStore.getCurrentTicket)

const canEditTicket = computed(() => {
  if (!isAuthenticated.value || !ticketData.value) return false
  // User can edit if they are the author and ticket is still open
  return ticketData.value.request_author_id === currentUser.value?.id &&
         ticketData.value.flag_status === 'open'
})

const canRateTicket = computed(() => {
  if (!isAuthenticated.value || !ticketData.value) return false
  // User can rate if they are the author, ticket is closed and solved, and not yet rated
  return ticketData.value.request_author_id === currentUser.value?.id &&
         ticketData.value.flag_status === 'closed' &&
         ticketData.value.solve_status === 'solved'
})

const canResolveTicket = computed(() => {
  if (!isAuthenticated.value || !ticketData.value) return false
  const userRole = currentUser.value?.role
  
  // Admin and moderator can resolve any ticket
  if (userRole === 'admin' || userRole === 'moderator') {
    return ticketData.value.flag_status === 'open'
  }
  
  // Developer can resolve only if assigned to them
  return ticketData.value.assigned_developer_id === currentUser.value?.id &&
         ticketData.value.flag_status === 'open'
})

const canCloseTicket = computed(() => {
  if (!isAuthenticated.value || !ticketData.value) return false
  // Author can close their own ticket if it's still open
  return ticketData.value.request_author_id === currentUser.value?.id &&
         ticketData.value.flag_status === 'open'
})

const isOverdue = computed(() => {
  if (!ticketData.value?.deadline_date) return false
  return new Date(ticketData.value.deadline_date) < new Date() && 
         ticketData.value.flag_status === 'open'
})

const getPriorityClass = (priority) => {
  const classes = {
    'high': 'bg-danger',
    'HIGH': 'bg-danger',
    'medium': 'bg-warning',
    'MEDIUM': 'bg-warning',
    'low': 'bg-success',
    'LOW': 'bg-success'
  }
  return classes[priority] || 'bg-secondary'
}

const getStatusClass = (status) => {
  return status === 'open' ? 'bg-success' : 'bg-secondary'
}

const getSolveStatusClass = (status) => {
  return status === 'solved' ? 'bg-success' : 'bg-warning'
}

const getCategoryName = (systemId) => {
  const categories = {
    1: 'System 1 - Web Application',
    2: 'System 2 - Mobile App',
    3: 'System 3 - API Backend',
    4: 'System 4 - Database',
    5: 'System 5 - Infrastructure'
  }
  return categories[systemId] || `System ${systemId}`
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPriorityPoints = (priority) => {
  const points = {
    'high': 100,
    'HIGH': 100,
    'medium': 50,
    'MEDIUM': 50,
    'low': 25,
    'LOW': 25
  }
  return points[priority] || 25
}

const calculatePotentialScore = () => {
  if (!ticketData.value) return 0
  
  const basePoints = getPriorityPoints(ticketData.value.priority)
  
  // Calculate time multiplier based on current time
  const openDate = new Date(ticketData.value.opening_date)
  const deadlineDate = new Date(ticketData.value.deadline_date)
  const now = new Date()
  
  const totalDays = Math.ceil((deadlineDate - openDate) / (1000 * 60 * 60 * 24))
  const daysTaken = Math.ceil((now - openDate) / (1000 * 60 * 60 * 24))
  
  let timeMultiplier = 1.0
  
  if (daysTaken <= totalDays * 0.5) {
    timeMultiplier = 1.5 // 50% bonus
  } else if (daysTaken <= totalDays) {
    timeMultiplier = 1.0 // No bonus/penalty
  } else if (daysTaken <= totalDays * 1.5) {
    timeMultiplier = 0.75 // 25% penalty
  } else {
    timeMultiplier = 0.5 // 50% penalty
  }
  
  return Math.round(basePoints * timeMultiplier)
}

const handleTicketUpdated = async () => {
  showEditForm.value = false
  await fetchTicket(props.ticketId)
}

const resolveTicket = async () => {
  resolvingTicket.value = true
  resolveError.value = null
  
  try {
    // Call admin update endpoint to close and mark as solved
    const ticketApi = (await import('../api/ticket')).default
    
    await ticketApi.put(`/${props.ticketId}/admin`, {
      flag_status: 'closed',
      solve_status: 'solved',
      answer: resolutionAnswer.value || null
    })
    
    // Refetch ticket data
    await fetchTicket(props.ticketId)
    
    // Show success message
    alert('Ticket resolved successfully! Your score has been updated.')
    
    // Refresh user profile to get updated score
    await authStore.fetchUserProfile()
  } catch (error) {
    console.error('Error resolving ticket:', error)
    resolveError.value = error.response?.data?.message || 'Failed to resolve ticket'
  } finally {
    resolvingTicket.value = false
  }
}

const closeTicket = async () => {
  if (!confirm('Are you sure you want to close this ticket? This action cannot be undone.')) {
    return
  }
  
  closingTicket.value = true
  closeError.value = null
  
  try {
    const ticketApi = (await import('../api/ticket')).default
    
    // Close the ticket without marking as solved (author is closing it, not resolving)
    // Use regular update endpoint instead of admin endpoint
    await ticketApi.put(`/${props.ticketId}`, {
      flag_status: 'closed',
      solve_status: 'not_solved'
    })
    
    // Refetch ticket data
    await fetchTicket(props.ticketId)
    
    alert('Ticket closed successfully.')
  } catch (error) {
    console.error('Error closing ticket:', error)
    closeError.value = error.response?.data?.message || 'Failed to close ticket'
  } finally {
    closingTicket.value = false
  }
}

const submitRating = async () => {
  if (selectedRating.value === 0) return
  
  submittingRating.value = true
  try {
    await ticketStore.rateTicket(props.ticketId, {
      rating: selectedRating.value,
      comment: ratingComment.value || null
    })
    
    // Refetch to get the rating
    const rating = await ticketStore.fetchTicketRating(props.ticketId)
    ticketRating.value = rating
    
    // Reset form
    selectedRating.value = 0
    ratingComment.value = ''
  } catch (error) {
    console.error('Error submitting rating:', error)
    alert(error.response?.data?.message || 'Failed to submit rating')
  } finally {
    submittingRating.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.ticket-header {
  margin-bottom: 2rem;
}

.ticket-header h2 {
  font-weight: 600;
  color: #2c3e50;
}

.ticket-detail-card, .rating-card, .action-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.action-card {
  border: 2px solid #28a745;
}

.potential-score {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #855a00;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1rem;
  box-shadow: 0 2px 6px rgba(255, 215, 0, 0.3);
  border: 2px solid #ffc107;
}

.potential-score i {
  font-size: 1.1rem;
  color: #ff9800;
}

.card-body {
  padding: 2rem;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row strong {
  min-width: 180px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-row p {
  margin: 0;
  color: #2c3e50;
  line-height: 1.6;
}

.badge {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.edit-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.star-rating {
  font-size: 2.5rem;
  line-height: 1;
}

.star {
  color: #ddd;
  cursor: pointer;
  transition: color 0.2s;
}

.star.active,
.star.hovering {
  color: #ffc107;
}

.star:hover {
  color: #ffc107;
}

.rating-display .star {
  cursor: default;
}

.text-danger {
  color: #dc3545 !important;
}

.developer-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.developer-score {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #855a00;
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  box-shadow: 0 2px 6px rgba(255, 215, 0, 0.3);
  transition: all 0.3s ease;
  border: 2px solid #ffc107;
}

.developer-score i {
  font-size: 1rem;
  color: #ff9800;
}

.developer-score:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.5);
}

.info-badge {
  cursor: help;
  color: #17a2b8;
  margin-left: 0.5rem;
}

.alert.small {
  font-size: 0.9rem;
  padding: 0.75rem 1rem;
}

@media (max-width: 768px) {
  .detail-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-row strong {
    min-width: auto;
  }

  .edit-modal {
    padding: 1rem;
  }
  
  .developer-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>