<template>
  <div class="tickets-page">
    <div class="page-header">
      <div class="header-content">
        <h1><i class="bi bi-ticket-perforated-fill"></i> Ticket Management</h1>
        <p>Create and manage your support tickets</p>
      </div>
    </div>

    <div class="tickets-container">
      <!-- Create Ticket Section -->
      <div class="create-ticket-section">
        <div class="section-title">
          <h3><i class="bi bi-plus-circle-fill"></i> Create New Ticket</h3>
        </div>
        <CreateTicketForm/>
      </div>

      <!-- Existing Tickets Section -->
      <div class="existing-tickets-section">
        <div class="section-header">
          <div class="section-title">
            <h3><i class="bi bi-list-task"></i> Existing Tickets</h3>
            <span class="ticket-count">
              {{ filteredTickets.length }} / {{ tickets.length }} tickets
              <span v-if="filterUser" class="filter-indicator">
                <i class="bi bi-funnel-fill"></i>
              </span>
            </span>
          </div>
          <div class="filter-controls">
            <div v-if="filterUser" class="user-filter-badge">
              <i class="bi bi-person-fill"></i>
              {{ filterUser }}
              <button @click="clearUserFilter" class="clear-filter-btn">
                <i class="bi bi-x"></i>
              </button>
            </div>
            <select v-model="filterPriority" class="form-select modern-select">
              <option value="">All priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select v-model="sortBy" class="form-select modern-select">
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest</option>
              <option value="priority">By priority</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-3">Loading tickets...</p>
        </div>

        <div v-else-if="filteredTickets.length === 0" class="empty-tickets">
          <i class="bi bi-inbox"></i>
          <h4>No tickets found</h4>
          <p>{{ filterPriority ? 'No tickets with this priority' : 'Start by creating your first ticket' }}</p>
        </div>

        <div v-else class="tickets-list">
          <TicketCard 
            v-for="ticket in filteredTickets" 
            :key="ticket.id"
            :ticketData="ticket"
          /> 
        </div>
      </div>
    </div>
  </div>
</template>
  
<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import CreateTicketForm from '../components/CreateTicketForm.vue'
  import TicketCard from '../components/TicketCard.vue'
  import { useTicketStore } from '../store/ticket'
  import { useAuthStore } from '../store/auth'
  import { useRouter, useRoute } from 'vue-router'
  
  const ticketStore = useTicketStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const loading = ref(false)
  const filterPriority = ref('')
  const filterUser = ref('')
  const sortBy = ref('recent')

  onMounted(async () => {
    loading.value = true
    try {
      await ticketStore.fetchAllTickets()
      
      // Check se c'è un filtro utente dalla query
      if (route.query.user) {
        filterUser.value = route.query.user
      }
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  })

  // Watch per query changes
  watch(() => route.query.user, (newUser) => {
    if (newUser) {
      filterUser.value = newUser
    }
  })
  
  const tickets = computed(() => ticketStore.getTickets)

  const filteredTickets = computed(() => {
    let result = [...tickets.value]

    // Filtra per priorità
    if (filterPriority.value) {
      result = result.filter(ticket => ticket.priority === filterPriority.value)
    }

    // Filtra per utente
    if (filterUser.value) {
      result = result.filter(ticket => {
        const authorEmail = ticket.created_by || ticket.author?.email || ''
        return authorEmail.toLowerCase().includes(filterUser.value.toLowerCase())
      })
    }

    // Ordina
    if (sortBy.value === 'recent') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    } else if (sortBy.value === 'oldest') {
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else if (sortBy.value === 'priority') {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      result.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    }

    return result
  })

  const clearUserFilter = () => {
    filterUser.value = ''
    router.push({ path: '/tickets' })
  }
</script>

<style scoped>
.tickets-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  margin-bottom: 3rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-content p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.tickets-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.create-ticket-section,
.existing-tickets-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-title h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ticket-count {
  padding: 0.35rem 0.75rem;
  background: linear-gradient(135deg, #e7f1ff 0%, #f0e7ff 100%);
  color: #667eea;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-indicator {
  color: #667eea;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.user-filter-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.clear-filter-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  padding: 0;
  margin-left: 0.25rem;
}

.clear-filter-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modern-select {
  min-width: 160px;
  border-radius: 25px;
  border: 2px solid #dee2e6;
  padding: 0.6rem 1.2rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: white;
  cursor: pointer;
}

.modern-select:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.modern-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
  outline: none;
}

.empty-tickets {
  text-align: center;
  padding: 4rem 2rem;
  color: #6c757d;
}

.empty-tickets i {
  font-size: 5rem;
  opacity: 0.5;
  margin-bottom: 1rem;
}

.empty-tickets h4 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.tickets-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem;
  }

  .header-content h1 {
    font-size: 1.8rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-controls {
    width: 100%;
    flex-direction: column;
  }

  .form-select {
    width: 100%;
  }

  .create-ticket-section,
  .existing-tickets-section {
    padding: 1.5rem;
  }
}
</style>