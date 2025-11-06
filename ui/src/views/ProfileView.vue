<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-avatar">
        <i class="bi bi-person-circle"></i>
      </div>
      <h2>My Profile</h2>
    </div>

    <div class="profile-content">
      <div class="profile-card">
        <h3><i class="bi bi-info-circle"></i> Personal Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Email</label>
            <p>{{ userEmail }}</p>
          </div>
          <div class="info-item">
            <label>Role</label>
            <p>
              <span :class="['badge', getRoleBadgeClass(userRole)]">
                {{ getRoleLabel(userRole) }}
              </span>
            </p>
          </div>
          <div class="info-item">
            <label>User ID</label>
            <p>{{ userId || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <div class="profile-card">
        <h3><i class="bi bi-bar-chart"></i> Statistics</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-ticket-perforated"></i>
            </div>
            <div class="stat-content">
              <h4>{{ userTickets.length }}</h4>
              <p>Tickets Created</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <i class="bi bi-clock-history"></i>
            </div>
            <div class="stat-content">
              <h4>{{ recentTickets }}</h4>
              <p>Last 7 days</p>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-card">
        <h3><i class="bi bi-ticket-detailed"></i> My Recent Tickets</h3>
        <div v-if="userTickets.length > 0" class="tickets-list">
          <div 
            v-for="ticket in userTickets.slice(0, 5)" 
            :key="ticket.id"
            class="ticket-item"
            @click="goToTicket(ticket.id)"
          >
            <div class="ticket-info">
              <h5>#{{ ticket.id }} - {{ ticket.title }}</h5>
              <p>{{ ticket.description }}</p>
            </div>
            <div class="ticket-meta">
              <span :class="['priority-badge', getPriorityClass(ticket.priority)]">
                {{ ticket.priority }}
              </span>
              <span class="category-badge">{{ ticket.category }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <i class="bi bi-inbox"></i>
          <p>You haven't created any tickets yet</p>
          <button class="btn btn-primary" @click="goToTickets">Create your first ticket</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useTicketStore } from '../store/ticket'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const ticketStore = useTicketStore()
const router = useRouter()

onMounted(async () => {
  try {
    await ticketStore.fetchAllTickets()
  } catch (error) {
    console.error('Error loading tickets:', error)
  }
})

const userEmail = computed(() => authStore.getEmail)
const userRole = computed(() => authStore.getRole)
const userId = computed(() => authStore.getUserId)

const userTickets = computed(() => {
  const allTickets = ticketStore.getTickets
  const email = authStore.getEmail
  return allTickets.filter(ticket => ticket.created_by === email)
})

const recentTickets = computed(() => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  return userTickets.value.filter(ticket => {
    const ticketDate = new Date(ticket.created_at)
    return ticketDate >= sevenDaysAgo
  }).length
})

const getRoleLabel = (role) => {
  const labels = {
    'USER': 'User',
    'MODERATOR': 'Moderator',
    'ADMIN': 'Administrator'
  }
  return labels[role] || role
}

const getRoleBadgeClass = (role) => {
  const classes = {
    'USER': 'bg-primary',
    'MODERATOR': 'bg-warning',
    'ADMIN': 'bg-danger'
  }
  return classes[role] || 'bg-secondary'
}

const getPriorityClass = (priority) => {
  const classes = {
    'HIGH': 'priority-high',
    'MEDIUM': 'priority-medium',
    'LOW': 'priority-low'
  }
  return classes[priority] || 'priority-medium'
}

const goToTicket = (id) => {
  router.push(`/tickets/${id}`)
}

const goToTickets = () => {
  router.push('/tickets')
}
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.profile-header {
  text-align: center;
  margin-bottom: 3rem;
}

.profile-avatar {
  font-size: 5rem;
  color: #0d6efd;
  margin-bottom: 1rem;
}

.profile-header h2 {
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.profile-content {
  display: grid;
  gap: 2rem;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.profile-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item label {
  display: block;
  font-weight: 600;
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.info-item p {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: scale(1.05);
}

.stat-icon {
  font-size: 2.5rem;
  opacity: 0.9;
}

.stat-content h4 {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}

.stat-content p {
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.9;
}

.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ticket-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0d6efd;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ticket-item:hover {
  background: #e7f1ff;
  transform: translateX(5px);
}

.ticket-info {
  flex: 1;
}

.ticket-info h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.ticket-info p {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 500px;
}

.ticket-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.priority-badge, .category-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.priority-high {
  background: #dc3545;
  color: white;
}

.priority-medium {
  background: #ffc107;
  color: #000;
}

.priority-low {
  background: #28a745;
  color: white;
}

.category-badge {
  background: #6c757d;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .ticket-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .ticket-info p {
    max-width: 100%;
  }
}
</style>
