<template>
  <nav class="navbar navbar-expand-lg modern-navbar">
    <div class="container-fluid">
      <a class="navbar-brand brand-logo" @click="router.push('/')" href="#">
        <i class="bi bi-tools"></i>
        <span class="brand-text">Fix This Stuff</span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li v-if="isAuthenticated" class="nav-item">
            <a class="nav-link" @click="router.push('/')" href="">Home</a>
          </li>
          <li v-if="isAuthenticated" class="nav-item">
            <a class="nav-link" @click="router.push('/tickets')" href="">Tickets</a>
          </li>
          <li class="nav-item">
            <a class="nav-link leaderboard-link" @click="router.push('/leaderboard')" href="">
              <i class="bi bi-trophy"></i> Leaderboard
            </a>
          </li>
          <li v-if="isAuthenticated && isAdminOrModerator" class="nav-item">
            <a class="nav-link admin-link" @click="router.push('/admin')" href="">
              <i class="bi bi-shield-lock"></i> Admin
            </a>
          </li>
          <li v-if="isAuthenticated" class="nav-item dropdown">
            <a class="nav-link dropdown-toggle user-menu" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle"></i>
              <span class="user-email">{{ userEmail }}</span>
              <span class="user-score" title="Your score">
                <i class="bi bi-trophy-fill"></i> {{ userScore }}
              </span>
            </a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" @click="router.push('/profile')" href="#"><i class="bi bi-person"></i> My Profile</a></li>
              <li v-if="isAdminOrModerator"><hr class="dropdown-divider"></li>
              <li v-if="isAdminOrModerator">
                <a class="dropdown-item admin-dropdown-item" @click="router.push('/admin')" href="#">
                  <i class="bi bi-shield-lock"></i> Admin Dashboard
                </a>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" @click="logout" href=""><i class="bi bi-box-arrow-right"></i> Logout</a></li>
            </ul>
          </li>
        </ul>
        <ul class="navbar-nav">
          <li v-if="!isAuthenticated" class="nav-item">
            <a class="nav-link" @click="router.push('/login')" href="#">Login</a>
          </li>
          <li v-if="!isAuthenticated" class="nav-item">
            <a class="nav-link" @click="router.push('/register')" href="#">Register</a>
          </li>
        </ul>
      </div>
      <div class="search-container" v-if="isAuthenticated">
        <form class="search-form" role="search" @submit.prevent="handleSearch">
          <div class="search-input-wrapper">
            <i class="bi bi-search search-icon"></i>
            <input
              class="search-input"
              type="search"
              v-model="searchQuery"
              placeholder="Search tickets, users, or keywords..."
              aria-label="Search"
              @focus="showSearchDropdown = true"
              @blur="hideSearchDropdownDelayed"
            />
            <button 
              v-if="searchQuery" 
              type="button" 
              class="clear-search"
              @click="clearSearch"
            >
              <i class="bi bi-x-circle"></i>
            </button>
          </div>
          
          <!-- Dropdown con suggerimenti -->
          <div v-if="showSearchDropdown && searchQuery.length >= 2" class="search-dropdown">
            <div v-if="searchLoading" class="search-loading">
              <span class="spinner-border spinner-border-sm"></span> Searching...
            </div>
            <div v-else>
              <div v-if="searchResults.tickets.length > 0" class="search-section">
                <div class="search-section-title">
                  <i class="bi bi-ticket-perforated"></i> Tickets
                </div>
                <a 
                  v-for="ticket in searchResults.tickets.slice(0, 3)" 
                  :key="ticket.id"
                  href="#"
                  class="search-result-item"
                  @mousedown.prevent="goToTicket(ticket.id)"
                >
                  <div class="search-result-content">
                    <div class="search-result-title">#{{ ticket.id }} - {{ ticket.title }}</div>
                    <div class="search-result-meta">
                      <span class="badge" :class="getPriorityBadgeClass(ticket.priority)">
                        {{ ticket.priority }}
                      </span>
                      <span class="search-result-category">{{ ticket.category }}</span>
                    </div>
                  </div>
                </a>
              </div>
              
              <div v-if="searchResults.users.length > 0" class="search-section">
                <div class="search-section-title">
                  <i class="bi bi-people"></i> Users
                </div>
                <a 
                  v-for="user in searchResults.users.slice(0, 3)" 
                  :key="user"
                  href="#"
                  class="search-result-item"
                  @mousedown.prevent="searchByUser(user)"
                >
                  <div class="search-result-content">
                    <div class="search-result-title">
                      <i class="bi bi-person-circle"></i> {{ user }}
                    </div>
                  </div>
                </a>
              </div>
              
              <div v-if="searchResults.tickets.length === 0 && searchResults.users.length === 0" class="search-no-results">
                <i class="bi bi-search"></i> No results found
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </nav>

</template>
  
<script setup>
  import { computed, ref, watch } from 'vue'
  import { useAuthStore } from '../store/auth'
  import { useTicketStore } from '../store/ticket'
  import { useRouter } from 'vue-router'
  
  const authStore = useAuthStore()
  const ticketStore = useTicketStore()
  const router = useRouter()
  
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const userEmail = computed(() => authStore.email)
  const userScore = computed(() => authStore.getUserScore)
  const isAdminOrModerator = computed(() => {
    const role = authStore.getRole?.toUpperCase()
    return role === 'ADMIN' || role === 'MODERATOR'
  })
  
  const searchQuery = ref('')
  const showSearchDropdown = ref(false)
  const searchLoading = ref(false)
  const searchResults = ref({
    tickets: [],
    users: []
  })
  
  const logout = () => {
    authStore.logout()
    router.push('/')
  }

  // Watch per ricerca in tempo reale
  watch(searchQuery, async (newValue) => {
    if (newValue.length < 2) {
      searchResults.value = { tickets: [], users: [] }
      return
    }
    
    // Solo gli utenti autenticati possono cercare
    if (!isAuthenticated.value) {
      searchResults.value = { tickets: [], users: [] }
      return
    }
    
    searchLoading.value = true
    await performSearch(newValue)
    searchLoading.value = false
  })

  const performSearch = async (query) => {
    try {
      await ticketStore.fetchAllTickets()
      const allTickets = ticketStore.getTickets || []
      const lowerQuery = query.toLowerCase()
      
      // Cerca nei ticket (ID, titolo, descrizione, categoria) - case insensitive con null check
      const matchingTickets = allTickets.filter(ticket => {
        const id = ticket.id ? ticket.id.toString().toLowerCase() : ''
        const title = ticket.title ? ticket.title.toLowerCase() : ''
        const description = ticket.description ? ticket.description.toLowerCase() : ''
        const category = ticket.category ? ticket.category.toLowerCase() : ''
        const createdBy = ticket.created_by ? ticket.created_by.toLowerCase() : ''
        
        return id.includes(lowerQuery) ||
               title.includes(lowerQuery) ||
               description.includes(lowerQuery) ||
               category.includes(lowerQuery) ||
               createdBy.includes(lowerQuery)
      })
      
      // Estrai utenti unici con null check
      const uniqueUsers = [...new Set(
        allTickets
          .map(t => t.created_by)
          .filter(user => user != null && user !== '')
      )]
      
      const matchingUsers = uniqueUsers.filter(user => 
        user.toLowerCase().includes(lowerQuery)
      )
      
      searchResults.value = {
        tickets: matchingTickets,
        users: matchingUsers
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleSearch = () => {
    const trimmed = searchQuery.value.trim()
    if (trimmed) {
      // Se è un numero, vai direttamente al ticket
      if (!isNaN(trimmed)) {
        router.push(`/tickets/${trimmed}`)
      } else if (searchResults.value.tickets.length > 0) {
        // Altrimenti vai al primo risultato
        router.push(`/tickets/${searchResults.value.tickets[0].id}`)
      }
      showSearchDropdown.value = false
    }
  }

  const goToTicket = (id) => {
    router.push(`/tickets/${id}`)
    clearSearch()
  }

  const searchByUser = (user) => {
    router.push({
      path: '/tickets',
      query: { user }
    })
    clearSearch()
  }

  const clearSearch = () => {
    searchQuery.value = ''
    showSearchDropdown.value = false
    searchResults.value = { tickets: [], users: [] }
  }

  const hideSearchDropdownDelayed = () => {
    setTimeout(() => {
      showSearchDropdown.value = false
    }, 200)
  }

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      'HIGH': 'badge-danger',
      'MEDIUM': 'badge-warning',
      'LOW': 'badge-success'
    }
    return classes[priority] || 'badge-secondary'
  }
</script>
  
<style scoped>
.modern-navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1rem 0;
  backdrop-filter: blur(10px);
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: white !important;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.brand-logo:hover {
  transform: scale(1.05);
}

.brand-logo i {
  font-size: 1.8rem;
}

.brand-text {
  background: linear-gradient(to right, #ffffff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-nav .nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500;
  padding: 0.5rem 1rem !important;
  border-radius: 8px;
  transition: all 0.3s ease;
  margin: 0 0.25rem;
}

.navbar-nav .nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white !important;
  transform: translateY(-2px);
}

.navbar-nav .nav-link i {
  margin-right: 0.25rem;
}

.navbar-nav .admin-link {
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid rgba(231, 76, 60, 0.5);
  color: #fff !important;
  font-weight: 600;
}

.navbar-nav .admin-link:hover {
  background: rgba(231, 76, 60, 0.3);
  border-color: #e74c3c;
  transform: translateY(-2px);
}

.navbar-nav .admin-link i {
  color: #ffcccb;
}

.navbar-nav .leaderboard-link {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2));
  border: 1px solid rgba(255, 215, 0, 0.5);
  color: #ffd700 !important;
  font-weight: 600;
}

.navbar-nav .leaderboard-link:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 140, 0, 0.3));
  border-color: #ffd700;
  transform: translateY(-2px);
}

.navbar-nav .leaderboard-link i {
  color: #ffd700;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-email {
  font-weight: 500;
}

.user-score {
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid rgba(255, 215, 0, 0.6);
  color: #ffd700;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.user-score i {
  font-size: 1rem;
}

.user-score:hover {
  background: rgba(255, 215, 0, 0.3);
  border-color: #ffd700;
  transform: scale(1.05);
}

.dropdown-menu {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 0.5rem;
  margin-top: 0.5rem;
}

.dropdown-item {
  border-radius: 8px;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateX(5px);
}

.dropdown-item.admin-dropdown-item {
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.2);
}

.dropdown-item.admin-dropdown-item:hover {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  border-color: #e74c3c;
}

.dropdown-item i {
  font-size: 1.1rem;
}

.dropdown-divider {
  margin: 0.5rem 0;
  border-color: rgba(0, 0, 0, 0.1);
}

.navbar-toggler {
  border: 2px solid rgba(255, 255, 255, 0.5);
  padding: 0.5rem 0.75rem;
}

.navbar-toggler:focus {
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
}

.navbar-toggler-icon {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba(255, 255, 255, 0.9)' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
}

/* Search Container */
.search-container {
  position: relative;
  min-width: 350px;
}

.search-form {
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  border-radius: 25px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  color: white;
  padding: 0.7rem 3rem 0.7rem 2.8rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-input:focus {
  background: white;
  border-color: white;
  color: #2c3e50;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  outline: none;
}

.search-input:focus::placeholder {
  color: #999;
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: color 0.3s ease;
}

.search-input:focus + .clear-search {
  color: #666;
}

.clear-search:hover {
  color: #dc3545;
}

/* Search Dropdown */
.search-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-loading {
  padding: 1.5rem;
  text-align: center;
  color: #666;
}

.search-section {
  border-bottom: 1px solid #f0f0f0;
  padding: 0.5rem 0;
}

.search-section:last-child {
  border-bottom: none;
}

.search-section-title {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-result-item {
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #2c3e50;
  transition: all 0.2s ease;
  cursor: pointer;
}

.search-result-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  padding-left: 1.5rem;
}

.search-result-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.search-result-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #2c3e50;
}

.search-result-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.search-result-category {
  color: #666;
  font-size: 0.85rem;
}

.search-no-results {
  padding: 2rem;
  text-align: center;
  color: #999;
}

.search-no-results i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.badge-danger {
  background: #dc3545;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.badge-warning {
  background: #ffc107;
  color: #000;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.badge-success {
  background: #28a745;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

@media (max-width: 991px) {
  .navbar-nav {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .modern-navbar form {
    margin-top: 1rem;
  }
}
</style>