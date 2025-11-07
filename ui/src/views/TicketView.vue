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
      <!-- NEW: Request Resolution Approval (Developer) -->
      <div v-if="canRequestResolution" class="action-card mt-3">
        <div class="card-body">
          <h4><i class="bi bi-send-check"></i> Request Resolution Approval</h4>
          <p class="text-muted">Submit this ticket for moderator/admin approval. Points will be awarded upon approval.</p>
          
          <div class="resolve-info mb-3">
            <div class="alert alert-info">
              <i class="bi bi-trophy-fill"></i>
              <strong>Potential points: {{ calculateResolutionPoints() }}</strong>
              <br>
              <small class="text-muted">
                Base points ({{ ticketData.priority?.toUpperCase() }}: {{ getPriorityPoints(ticketData.priority) }})
                + Rating bonus (up to {{ ticketData.rating ? ticketData.rating * 2 : 10 }} pts)
              </small>
            </div>
          </div>

          <button 
            class="btn btn-primary"
            @click="requestResolutionApproval"
            :disabled="resolvingTicket"
          >
            <span v-if="resolvingTicket">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Requesting...
            </span>
            <span v-else>
              <i class="bi bi-send-check-fill"></i> Request Approval
            </span>
          </button>

          <div v-if="resolveError" class="alert alert-danger mt-3">
            <i class="bi bi-exclamation-circle"></i> {{ resolveError }}
          </div>
        </div>
      </div>

      <!-- NEW: Approve/Reject Resolution (Moderator/Admin) -->
      <div v-if="canApproveResolution" class="action-card mt-3">
        <div class="card-body">
          <h4><i class="bi bi-check2-square"></i> Review Resolution</h4>
          <p class="text-muted">This ticket is awaiting your approval.</p>
          
          <div class="resolution-info mb-3">
            <div class="alert alert-warning">
              <strong>Resolved by:</strong> {{ ticketData.resolved_by_name || `Developer #${ticketData.resolved_by}` }}
              <br>
              <strong>Points to award:</strong> {{ calculateResolutionPoints() }} pts
              <br>
              <small class="text-muted">Resolved at: {{ formatDate(ticketData.resolved_at) }}</small>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button 
              class="btn btn-success"
              @click="approveTicketResolution"
              :disabled="processingApproval"
            >
              <span v-if="processingApproval">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Processing...
              </span>
              <span v-else>
                <i class="bi bi-check-circle-fill"></i> Approve
              </span>
            </button>
            <button 
              class="btn btn-danger"
              @click="showRejectModal = true"
              :disabled="processingApproval"
            >
              <i class="bi bi-x-circle-fill"></i> Reject
            </button>
          </div>

          <div v-if="approvalError" class="alert alert-danger mt-3">
            <i class="bi bi-exclamation-circle"></i> {{ approvalError }}
          </div>
        </div>
      </div>

      <!-- OLD: Direct Resolution (keeping for backward compatibility) -->
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

    <!-- Rejection Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="bi bi-x-circle"></i> Reject Resolution</h3>
          <button @click="showRejectModal = false" class="close-btn">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Provide a reason for rejecting this resolution:</p>
          <textarea
            v-model="rejectionReason"
            placeholder="Explain why this resolution is not acceptable..."
            rows="5"
            class="form-control"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showRejectModal = false" class="btn btn-secondary">Cancel</button>
          <button
            @click="rejectTicketResolution"
            class="btn btn-danger"
            :disabled="!rejectionReason.trim() || processingApproval"
          >
            {{ processingApproval ? 'Rejecting...' : 'Confirm Rejection' }}
          </button>
        </div>
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
import { requestResolution, approveResolution, rejectResolution } from '../api/ticket.js'

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
const processingApproval = ref(false)
const approvalError = ref(null)
const showRejectModal = ref(false)
const rejectionReason = ref('')
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

const canRequestResolution = computed(() => {
  if (!isAuthenticated.value || !ticketData.value) return false
  const userRole = currentUser.value?.role?.toLowerCase()
  
  // Developers can request resolution approval for assigned open tickets
  return userRole === 'developer' &&
         ticketData.value.flag_status === 'open' &&
         ticketData.value.solve_status === 'not_solved' &&
         ticketData.value.assigned_developer_id === currentUser.value?.id
})

const canApproveResolution = computed(() => {
  if (!isAuthenticated.value || !ticketData.value) return false
  const userRole = currentUser.value?.role?.toLowerCase()
  
  // Moderators and admins can approve pending resolutions
  return (userRole === 'moderator' || userRole === 'admin') &&
         ticketData.value.solve_status === 'pending_approval'
})

const canResolveTicket = computed(() => {
  if (!isAuthenticated.value || !ticketData.value) return false
  const userRole = currentUser.value?.role
  
  // Only Admin and moderator can resolve tickets
  return (userRole === 'admin' || userRole === 'moderator') &&
         ticketData.value.flag_status === 'open'
})

const canCloseTicket = computed(() => {
  if (!isAuthenticated.value || !ticketData.value) return false
  const userRole = currentUser.value?.role
  
  // Only Admin and moderator can close tickets
  return (userRole === 'admin' || userRole === 'moderator') &&
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
    await ticketStore.submitTicketRating(props.ticketId, selectedRating.value, ratingComment.value)
    alert('Thank you for your rating!')
    ticketRating.value = {
      rating: selectedRating.value,
      comment: ratingComment.value,
      rated_at: new Date()
    }
  } catch (error) {
    console.error('Error submitting rating:', error)
    alert('Failed to submit rating. Please try again.')
  } finally {
    submittingRating.value = false
  }
}

// NEW: Request resolution approval (Developer)
const requestResolutionApproval = async () => {
  if (!confirm('Submit this ticket for moderator/admin approval?')) {
    return
  }
  
  resolvingTicket.value = true
  resolveError.value = null
  
  try {
    await requestResolution(props.ticketId)
    alert('Resolution submitted for approval! You will receive points once approved.')
    await fetchTicket(props.ticketId)
  } catch (error) {
    console.error('Error requesting resolution approval:', error)
    resolveError.value = error.response?.data?.error || 'Failed to request approval'
  } finally {
    resolvingTicket.value = false
  }
}

// NEW: Approve resolution (Moderator/Admin)
const approveTicketResolution = async () => {
  if (!confirm('Approve this resolution? Points will be awarded to the developer.')) {
    return
  }
  
  processingApproval.value = true
  approvalError.value = null
  
  try {
    await approveResolution(props.ticketId)
    alert('Resolution approved! Points have been awarded to the developer.')
    await fetchTicket(props.ticketId)
  } catch (error) {
    console.error('Error approving resolution:', error)
    approvalError.value = error.response?.data?.error || 'Failed to approve resolution'
  } finally {
    processingApproval.value = false
  }
}

// NEW: Reject resolution (Moderator/Admin)
const rejectTicketResolution = async () => {
  if (!rejectionReason.value.trim()) {
    return
  }
  
  processingApproval.value = true
  approvalError.value = null
  
  try {
    await rejectResolution(props.ticketId, rejectionReason.value)
    alert('Resolution rejected. Developer has been notified.')
    showRejectModal.value = false
    rejectionReason.value = ''
    await fetchTicket(props.ticketId)
  } catch (error) {
    console.error('Error rejecting resolution:', error)
    approvalError.value = error.response?.data?.error || 'Failed to reject resolution'
  } finally {
    processingApproval.value = false
  }
}

// Calculate resolution points
const calculateResolutionPoints = () => {
  if (!ticketData.value) return 0
  const priorityPoints = {
    'high': 10,
    'HIGH': 10,
    'medium': 5,
    'MEDIUM': 5,
    'low': 2,
    'LOW': 2
  }
  const basePoints = priorityPoints[ticketData.value.priority] || 5
  const ratingBonus = ticketData.value.rating ? ticketData.value.rating * 2 : 0
  return basePoints + ratingBonus
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