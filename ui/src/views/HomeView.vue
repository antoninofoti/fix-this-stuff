<template>
  <div class="home-container">
    <!-- Header di Benvenuto -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 v-if="isAuthenticated">Welcome, {{ userName }}! 👋</h1>
        <h1 v-else>Welcome to Ticket System! 👋</h1>
        <p class="lead" v-if="isAuthenticated">Manage your tickets and monitor your activities</p>
        <p class="lead" v-else>Browse public tickets and join us to create your own</p>
      </div>
      <div class="user-badge" v-if="isAuthenticated">
        <span :class="['role-badge', getRoleBadgeClass(role)]">
          <i :class="getRoleIcon(role)"></i>
          {{ getRoleLabel(role) }}
        </span>
      </div>
      <div class="guest-actions" v-else>
        <button class="btn btn-primary" @click="goToLogin">
          <i class="bi bi-box-arrow-in-right"></i> Sign In
        </button>
        <button class="btn btn-outline-primary" @click="goToRegister">
          <i class="bi bi-person-plus"></i> Sign Up
        </button>
      </div>
    </div>

    <!-- Dashboard Cards - Only for authenticated users -->
    <div class="dashboard-grid" v-if="isAuthenticated">
      <!-- Card Statistiche -->
      <div class="dashboard-card stats-card">
        <h3><i class="bi bi-bar-chart-fill"></i> Your Statistics</h3>
        <div class="stats-content">
          <div class="stat-item">
            <div class="stat-icon primary">
              <i class="bi bi-ticket-perforated-fill"></i>
            </div>
            <div class="stat-info">
              <h4>{{ userTickets.length }}</h4>
              <p>Total Tickets</p>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon success">
              <i class="bi bi-clock-history"></i>
            </div>
            <div class="stat-info">
              <h4>{{ recentTickets }}</h4>
              <p>This Week</p>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon warning">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div class="stat-info">
              <h4>{{ highPriorityTickets }}</h4>
              <p>High Priority</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Azioni Rapide -->
      <div class="dashboard-card actions-card">
        <h3><i class="bi bi-lightning-fill"></i> Quick Actions</h3>
        <div class="quick-actions">
          <button class="action-btn primary" @click="goToCreateTicket">
            <i class="bi bi-plus-circle-fill"></i>
            <span>New Ticket</span>
          </button>
          <button class="action-btn secondary" @click="goToTickets">
            <i class="bi bi-list-ul"></i>
            <span>All Tickets</span>
          </button>
          <button class="action-btn tertiary" @click="goToProfile">
            <i class="bi bi-person-fill"></i>
            <span>My Profile</span>
          </button>
        </div>
      </div>
    </div>

    <!-- User's Recent Tickets - Only for authenticated users -->
    <div class="recent-tickets-section" v-if="isAuthenticated">
      <div class="section-header">
        <h3><i class="bi bi-person-badge"></i> Your Recent Tickets</h3>
        <button class="btn btn-outline-primary" @click="goToTickets">
          View All <i class="bi bi-arrow-right"></i>
        </button>
      </div>

      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="userTickets.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <h4>No tickets yet</h4>
        <p>Start by creating your first support ticket</p>
        <button class="btn btn-primary btn-lg" @click="goToCreateTicket">
          <i class="bi bi-plus-circle"></i> Create First Ticket
        </button>
      </div>

      <div v-else class="tickets-grid">
        <div 
          v-for="ticket in recentUserTickets" 
          :key="ticket.id"
          class="ticket-card"
          @click="goToTicket(ticket.id)"
        >
          <div class="ticket-header">
            <h4>#{{ ticket.id }} - {{ ticket.title }}</h4>
            <span :class="['priority-badge', getPriorityClass(ticket.priority)]">
              {{ ticket.priority }}
            </span>
          </div>
          <p class="ticket-description">{{ truncateText(ticket.description, 100) }}</p>
          <div class="ticket-footer">
            <span class="category-tag">
              <i class="bi bi-tag-fill"></i> {{ ticket.category }}
            </span>
            <span class="ticket-date">
              <i class="bi bi-calendar"></i> {{ formatDate(ticket.created_at) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- All Public Tickets - Visible to everyone -->
    <div class="all-tickets-section">
      <div class="section-header">
        <h3><i class="bi bi-globe"></i> All Platform Tickets</h3>
        <button v-if="!isAuthenticated" class="btn btn-primary" @click="goToLogin">
          <i class="bi bi-box-arrow-in-right"></i> Sign in to Interact
        </button>
      </div>

      <div v-if="loading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="allTickets.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <h4>No tickets available</h4>
        <p>Be the first to create a ticket!</p>
      </div>

      <div v-else class="tickets-grid">
        <div 
          v-for="ticket in latestAllTickets" 
          :key="ticket.id"
          class="ticket-card"
          :class="{ 'guest-mode': !isAuthenticated }"
          @click="goToTicket(ticket.id)"
        >
          <div class="ticket-header">
            <h4>#{{ ticket.id }} - {{ ticket.title }}</h4>
            <span :class="['priority-badge', getPriorityClass(ticket.priority)]">
              {{ ticket.priority }}
            </span>
          </div>
          <p class="ticket-description">{{ truncateText(ticket.description, 100) }}</p>
          <div class="ticket-footer">
            <span class="category-tag">
              <i class="bi bi-tag-fill"></i> {{ ticket.category }}
            </span>
            <span class="ticket-author">
              <i class="bi bi-person"></i> {{ ticket.created_by }}
            </span>
            <span class="ticket-date">
              <i class="bi bi-calendar"></i> {{ formatDate(ticket.created_at) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
  import { onMounted, ref, computed, watch } from 'vue'
  import { useAuthStore } from '../store/auth'
  import { useTicketStore } from '../store/ticket'
  import { useRouter } from 'vue-router'

  const authStore = useAuthStore()
  const ticketStore = useTicketStore()
  const router = useRouter()

  const loading = ref(false)

  const fetchTickets = async () => {
    loading.value = true
    try {
      await ticketStore.fetchAllTickets()
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await fetchTickets()
  })

  // Watch for changes in tickets to refresh data
  watch(() => ticketStore.getTickets.length, () => {
    // Trigger re-computation of stats when tickets change
  })

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const email = computed(() => authStore.getEmail)
  const role = computed(() => authStore.getRole)
  
  const userName = computed(() => {
    const emailValue = email.value
    return emailValue ? emailValue.split('@')[0] : 'Guest'
  })

  const allTickets = computed(() => ticketStore.getTickets || [])
  
  const userTickets = computed(() => {
    if (!isAuthenticated.value) return []
    const currentUserId = authStore.user?.id
    if (!currentUserId) return []
    return allTickets.value.filter(ticket => 
      ticket.request_author_id === currentUserId || 
      ticket.created_by === email.value
    )
  })

  const recentUserTickets = computed(() => {
    return [...userTickets.value]
      .sort((a, b) => {
        const dateA = new Date(a.opening_date || a.created_at)
        const dateB = new Date(b.opening_date || b.created_at)
        return dateB - dateA
      })
      .slice(0, 6)
  })

  const latestAllTickets = computed(() => {
    return [...allTickets.value]
      .sort((a, b) => {
        const dateA = new Date(a.opening_date || a.created_at)
        const dateB = new Date(b.opening_date || b.created_at)
        return dateB - dateA
      })
      .slice(0, 12)
  })

  const recentTickets = computed(() => {
    if (!isAuthenticated.value) return 0
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    return userTickets.value.filter(ticket => {
      const ticketDate = new Date(ticket.created_at)
      return ticketDate >= sevenDaysAgo
    }).length
  })

  const highPriorityTickets = computed(() => {
    if (!isAuthenticated.value) return 0
    return userTickets.value.filter(ticket => ticket.priority === 'HIGH').length
  })

  const getRoleLabel = (roleValue) => {
    const labels = {
      'USER': 'User',
      'MODERATOR': 'Moderator',
      'ADMIN': 'Administrator'
    }
    return labels[roleValue] || roleValue
  }

  const getRoleBadgeClass = (roleValue) => {
    const classes = {
      'USER': 'user',
      'MODERATOR': 'moderator',
      'ADMIN': 'admin'
    }
    return classes[roleValue] || 'user'
  }

  const getRoleIcon = (roleValue) => {
    const icons = {
      'USER': 'bi bi-person',
      'MODERATOR': 'bi bi-shield',
      'ADMIN': 'bi bi-shield-fill-check'
    }
    return icons[roleValue] || 'bi bi-person'
  }

  const getPriorityClass = (priority) => {
    const classes = {
      'HIGH': 'high',
      'MEDIUM': 'medium',
      'LOW': 'low'
    }
    return classes[priority] || 'medium'
  }

  const truncateText = (text, maxLength) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
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

  const goToTicket = (id) => {
    if (!isAuthenticated.value) {
      // Per guest, mostriamo comunque il ticket ma in modalità read-only
      router.push(`/tickets/${id}`)
    } else {
      router.push(`/tickets/${id}`)
    }
  }

  const goToTickets = () => {
    router.push('/tickets')
  }

  const goToProfile = () => {
    router.push('/profile')
  }

  const goToCreateTicket = () => {
    router.push('/tickets')
  }

  const goToLogin = () => {
    router.push('/login')
  }

  const goToRegister = () => {
    router.push('/register')
  }
</script>

<style scoped>
.home-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.welcome-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.welcome-content .lead {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.role-badge {
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.role-badge.user {
  background: rgba(255, 255, 255, 0.2);
}

.role-badge.moderator {
  background: rgba(255, 193, 7, 0.3);
}

.role-badge.admin {
  background: rgba(220, 53, 69, 0.3);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.dashboard-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-icon.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #ffc107 0%, #ff6b6b 100%);
}

.stat-info h4 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.stat-info p {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
}

.quick-actions {
  display: grid;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.action-btn i {
  font-size: 1.5rem;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-btn.secondary {
  background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
}

.action-btn.tertiary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.action-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.recent-tickets-section,
.all-tickets-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 5rem;
  color: #6c757d;
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-state h4 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.tickets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.ticket-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #667eea;
}

.ticket-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.ticket-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.priority-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
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

.ticket-description {
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.ticket-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #6c757d;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-tag,
.ticket-date,
.ticket-author {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.category-tag {
  background: #e9ecef;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-weight: 600;
  color: #495057;
}

.guest-actions {
  display: flex;
  gap: 1rem;
}

.guest-actions .btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ticket-card.guest-mode {
  border-left-color: #6c757d;
  opacity: 0.95;
}

.ticket-card.guest-mode::after {
  content: '👁️ Read Only';
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.75rem;
  background: #6c757d;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ticket-card.guest-mode {
  position: relative;
}

.ticket-card.guest-mode:hover::after {
  opacity: 1;
}

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .welcome-content h1 {
    font-size: 1.8rem;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .tickets-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .guest-actions {
    flex-direction: column;
    width: 100%;
  }

  .guest-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>