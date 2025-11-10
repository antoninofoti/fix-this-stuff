<template>
  <div class="modern-ticket-card" @click="goToTicket">
    <div class="ticket-card-header">
      <div class="ticket-title-section">
        <h5 class="ticket-title">
          <i class="bi bi-ticket-perforated"></i>
          #{{ ticketData.id }} - {{ ticketData.title }}
        </h5>
        <span :class="['priority-badge', getPriorityClass(ticketData.priority)]">
          <i :class="getPriorityIcon(ticketData.priority)"></i>
          {{ ticketData.priority }}
        </span>
      </div>
    </div>

    <div class="ticket-card-body">
      <p class="ticket-description">
        <i class="bi bi-text-paragraph"></i>
        {{ truncateText(ticketData.request || ticketData.description, 150) }}
      </p>
      
      <div class="ticket-meta">
        <span class="meta-item category">
          <i class="bi bi-tag-fill"></i>
          {{ getCategoryName(ticketData.system_id || ticketData.category) }}
        </span>
        <span class="meta-item author">
          <i class="bi bi-person"></i>
          {{ getAuthorName(ticketData) }}
        </span>
        <span class="meta-item date">
          <i class="bi bi-calendar"></i>
          {{ formatDate(ticketData.opening_date || ticketData.created_at) }}
        </span>
        <span class="meta-item status">
          <i :class="getStatusIcon(ticketData.flag_status)"></i>
          {{ ticketData.flag_status?.toUpperCase() || 'OPEN' }}
        </span>
        <span v-if="ticketData.solve_status" :class="['solve-status-badge', getSolveStatusClass(ticketData.solve_status)]">
          <i :class="getSolveStatusIcon(ticketData.solve_status)"></i>
          {{ formatSolveStatus(ticketData.solve_status) }}
        </span>
      </div>
    </div>

    <div class="ticket-card-footer">
      <button class="view-details-btn">
        View Details <i class="bi bi-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  ticketData: {
    type: Object,
    required: true
  }
})

const goToTicket = () => {
  router.push(`/tickets/${props.ticketData.id}`)
}

const getPriorityClass = (priority) => {
  const classes = {
    'HIGH': 'high',
    'MEDIUM': 'medium',
    'LOW': 'low'
  }
  return classes[priority] || 'medium'
}

const getPriorityIcon = (priority) => {
  const icons = {
    'HIGH': 'bi bi-exclamation-triangle-fill',
    'MEDIUM': 'bi bi-exclamation-circle-fill',
    'LOW': 'bi bi-info-circle-fill'
  }
  return icons[priority] || 'bi bi-info-circle-fill'
}

const truncateText = (text, maxLength) => {
  if (!text) return 'Nessuna descrizione'
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getAuthorName = (ticket) => {
  // Try to get author from populated author object
  if (ticket.author) {
    return `${ticket.author.name || ''} ${ticket.author.surname || ''}`.trim() || ticket.author.email
  }
  // Fallback to created_by email or request_author_id
  if (ticket.created_by) {
    return ticket.created_by.split('@')[0]
  }
  return `User #${ticket.request_author_id || 'Unknown'}`
}

const getCategoryName = (systemId) => {
  if (!systemId) return 'N/A'
  const categories = {
    1: 'System 1',
    2: 'System 2',
    3: 'System 3',
    4: 'System 4',
    5: 'System 5'
  }
  return categories[systemId] || `System ${systemId}`
}

const getStatusIcon = (status) => {
  return status === 'closed' ? 'bi bi-lock-fill' : 'bi bi-unlock-fill'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const getSolveStatusClass = (status) => {
  const classes = {
    'not_solved': 'not-solved',
    'pending_approval': 'pending',
    'solved': 'solved'
  }
  return classes[status] || 'not-solved'
}

const getSolveStatusIcon = (status) => {
  const icons = {
    'not_solved': 'bi bi-hourglass',
    'pending_approval': 'bi bi-clock-history',
    'solved': 'bi bi-check-circle-fill'
  }
  return icons[status] || 'bi bi-hourglass'
}

const formatSolveStatus = (status) => {
  const labels = {
    'not_solved': 'Not Solved',
    'pending_approval': 'Pending Approval',
    'solved': 'Solved'
  }
  return labels[status] || status
}
</script>

<style scoped>
.modern-ticket-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  border-left: 4px solid transparent;
  margin-bottom: 1.5rem;
}

.modern-ticket-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-left-color: #667eea;
}

.ticket-card-header {
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
}

.ticket-title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.ticket-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.ticket-title i {
  color: #667eea;
  flex-shrink: 0;
}

.priority-badge {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.priority-badge.high {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.priority-badge.medium {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  color: #000;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
}

.priority-badge.low {
  background: linear-gradient(135deg, #28a745 0%, #218838 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.ticket-card-body {
  padding: 1.5rem;
}

.ticket-description {
  color: #6c757d;
  line-height: 1.7;
  margin-bottom: 1.25rem;
  display: flex;
  gap: 0.5rem;
}

.ticket-description i {
  color: #667eea;
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.ticket-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.meta-item i {
  color: #667eea;
}

.meta-item.category {
  background: #e7f1ff;
  padding: 0.35rem 0.75rem;
  border-radius: 15px;
  color: #0d6efd;
}

.solve-status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.solve-status-badge.not-solved {
  background: #ffc107;
  color: #000;
}

.solve-status-badge.pending {
  background: #17a2b8;
  color: white;
}

.solve-status-badge.solved {
  background: #28a745;
  color: white;
}

.ticket-card-footer {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
}

.view-details-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
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

.view-details-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.view-details-btn i {
  transition: transform 0.3s ease;
}

.view-details-btn:hover i {
  transform: translateX(5px);
}

@media (max-width: 768px) {
  .ticket-title-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .priority-badge {
    align-self: flex-start;
  }

  .ticket-meta {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>