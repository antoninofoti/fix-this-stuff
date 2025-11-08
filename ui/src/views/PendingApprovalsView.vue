<template>
  <div class="pending-approvals-view">
    <div class="page-header">
      <h1><i class="bi bi-clock-history"></i> Pending Approvals</h1>
      <p class="subtitle">Review and approve ticket resolutions submitted by developers</p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>Loading pending approvals...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <p>{{ error }}</p>
      <button @click="loadPendingTickets" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="pendingTickets.length === 0" class="empty-state">
      <i class="bi bi-check-circle"></i>
      <p>No pending approvals at the moment.</p>
      <small>All ticket resolutions have been reviewed!</small>
    </div>

    <div v-else class="tickets-grid">
      <div
        v-for="ticket in pendingTickets"
        :key="ticket.id"
        class="approval-card"
      >
        <div class="card-header">
          <div class="ticket-info">
            <h3>#{{ ticket.id }} - {{ ticket.title }}</h3>
            <span :class="['priority-badge', getPriorityClass(ticket.priority)]">
              {{ ticket.priority }}
            </span>
          </div>
        </div>

        <div class="card-body">
          <div class="info-section">
            <div class="info-item">
              <i class="bi bi-person"></i>
              <span><strong>Resolved by:</strong> {{ ticket.resolved_by_name || `User #${ticket.resolved_by}` }}</span>
            </div>
            <div class="info-item">
              <i class="bi bi-calendar"></i>
              <span><strong>Resolved at:</strong> {{ formatDate(ticket.resolved_at) }}</span>
            </div>
            <div class="info-item">
              <i class="bi bi-tag"></i>
              <span><strong>Category:</strong> System {{ ticket.system_id }}</span>
            </div>
            <div class="info-item">
              <i class="bi bi-star-fill"></i>
              <span><strong>Points to award:</strong> {{ calculatePoints(ticket) }} pts</span>
            </div>
          </div>

          <div class="description-section">
            <h4><i class="bi bi-text-paragraph"></i> Description</h4>
            <p>{{ ticket.request || ticket.description || 'No description' }}</p>
          </div>

          <div v-if="ticket.rating" class="rating-section">
            <i class="bi bi-heart-fill"></i>
            <span>Rating: {{ ticket.rating }}/5</span>
          </div>
        </div>

        <div class="card-footer">
          <button
            @click="handleApprove(ticket)"
            class="approve-btn"
            :disabled="processingTickets.has(ticket.id)"
          >
            <i class="bi bi-check-circle-fill"></i>
            {{ processingTickets.has(ticket.id) ? 'Processing...' : 'Approve' }}
          </button>
          <button
            @click="handleReject(ticket)"
            class="reject-btn"
            :disabled="processingTickets.has(ticket.id)"
          >
            <i class="bi bi-x-circle-fill"></i>
            Reject
          </button>
        </div>
      </div>
    </div>

    <!-- Rejection Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="bi bi-x-circle"></i> Reject Resolution</h3>
          <button @click="closeRejectModal" class="close-btn">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>You are about to reject the resolution for ticket <strong>#{{ selectedTicket?.id }}</strong></p>
          <label for="rejection-reason">Reason for rejection:</label>
          <textarea
            id="rejection-reason"
            v-model="rejectionReason"
            placeholder="Please provide a clear reason for rejecting this resolution..."
            rows="5"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="closeRejectModal" class="cancel-btn">Cancel</button>
          <button
            @click="confirmReject"
            class="confirm-reject-btn"
            :disabled="!rejectionReason.trim() || submitting"
          >
            {{ submitting ? 'Rejecting...' : 'Confirm Rejection' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPendingApprovalTickets, approveResolution, rejectResolution } from '../api/ticket.js'

const pendingTickets = ref([])
const loading = ref(true)
const error = ref(null)
const processingTickets = ref(new Set())
const showRejectModal = ref(false)
const selectedTicket = ref(null)
const rejectionReason = ref('')
const submitting = ref(false)

const loadPendingTickets = async () => {
  try {
    loading.value = true
    error.value = null
    const response = await getPendingApprovalTickets()
    pendingTickets.value = response.data.tickets || []
  } catch (err) {
    console.error('Error loading pending tickets:', err)
    error.value = err.response?.data?.error || 'Failed to load pending approvals'
  } finally {
    loading.value = false
  }
}

const handleApprove = async (ticket) => {
  if (!confirm(`Are you sure you want to approve the resolution for ticket #${ticket.id}?`)) {
    return
  }

  processingTickets.value.add(ticket.id)
  try {
    await approveResolution(ticket.id)
    alert(`Resolution approved! Points awarded to developer.`)
    // Remove from list
    pendingTickets.value = pendingTickets.value.filter(t => t.id !== ticket.id)
  } catch (err) {
    console.error('Error approving resolution:', err)
    alert(err.response?.data?.error || 'Failed to approve resolution')
  } finally {
    processingTickets.value.delete(ticket.id)
  }
}

const handleReject = (ticket) => {
  selectedTicket.value = ticket
  showRejectModal.value = true
  rejectionReason.value = ''
}

const closeRejectModal = () => {
  showRejectModal.value = false
  selectedTicket.value = null
  rejectionReason.value = ''
}

const confirmReject = async () => {
  if (!rejectionReason.value.trim()) {
    alert('Please provide a reason for rejection')
    return
  }

  submitting.value = true
  processingTickets.value.add(selectedTicket.value.id)

  try {
    await rejectResolution(selectedTicket.value.id, rejectionReason.value)
    alert(`Resolution rejected. Developer has been notified.`)
    // Remove from list
    pendingTickets.value = pendingTickets.value.filter(t => t.id !== selectedTicket.value.id)
    closeRejectModal()
  } catch (err) {
    console.error('Error rejecting resolution:', err)
    alert(err.response?.data?.error || 'Failed to reject resolution')
  } finally {
    submitting.value = false
    processingTickets.value.delete(selectedTicket.value.id)
  }
}

const getPriorityClass = (priority) => {
  return priority?.toLowerCase() || 'medium'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const calculatePoints = (ticket) => {
  const priorityPoints = {
    'high': 10,
    'medium': 5,
    'low': 2
  }
  const basePoints = priorityPoints[ticket.priority?.toLowerCase()] || 5
  const ratingBonus = ticket.rating ? ticket.rating * 2 : 0
  return basePoints + ratingBonus
}

onMounted(() => {
  loadPendingTickets()
})
</script>

<style scoped>
.pending-approvals-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.page-header h1 i {
  color: #667eea;
}

.subtitle {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
}

.loading-state,
.error-state,
.empty-state {
  padding: 4rem;
  text-align: center;
  color: #6c757d;
}

.loading-state .spinner-border {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
}

.error-state i,
.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.error-state i {
  color: #dc3545;
}

.empty-state i {
  color: #28a745;
}

.empty-state small {
  display: block;
  margin-top: 0.5rem;
  color: #adb5bd;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #764ba2;
  transform: translateY(-2px);
}

.tickets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 2rem;
}

.approval-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.approval-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.5rem;
  border-bottom: 2px solid #dee2e6;
}

.ticket-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.ticket-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.priority-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
}

.priority-badge.high {
  background: #dc3545;
  color: white;
}

.priority-badge.medium {
  background: #ffc107;
  color: #000;
}

.priority-badge.low {
  background: #28a745;
  color: white;
}

.card-body {
  padding: 1.5rem;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
}

.info-item i {
  color: #667eea;
  font-size: 1.1rem;
}

.description-section {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.description-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin: 0 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.description-section h4 i {
  color: #667eea;
}

.description-section p {
  margin: 0;
  color: #6c757d;
  line-height: 1.6;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #ffe7e7;
  color: #dc3545;
  border-radius: 8px;
  font-weight: 600;
}

.rating-section i {
  font-size: 1.2rem;
}

.card-footer {
  padding: 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 1rem;
}

.approve-btn,
.reject-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.approve-btn {
  background: linear-gradient(135deg, #28a745 0%, #218838 100%);
  color: white;
}

.approve-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.reject-btn {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

.reject-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.approve-btn:disabled,
.reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Styles */
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-header h3 i {
  color: #dc3545;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #dc3545;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body label {
  display: block;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.modal-body textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.modal-body textarea:focus {
  outline: none;
  border-color: #667eea;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-reject-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background: #5a6268;
}

.confirm-reject-btn {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

.confirm-reject-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.confirm-reject-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .pending-approvals-view {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
  }

  .tickets-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .info-section {
    grid-template-columns: 1fr;
  }

  .card-footer {
    flex-direction: column;
  }
}
</style>
