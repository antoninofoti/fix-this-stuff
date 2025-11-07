<template>
  <div class="admin-container">
    <!-- Header -->
    <div class="admin-header">
      <h1>
        <i class="bi bi-shield-lock"></i>
        {{ isAdmin ? 'Administrator' : 'Moderator' }} Dashboard
      </h1>
      <p class="lead">Manage users, tickets, and system settings</p>
    </div>

    <!-- Access Denied for regular users -->
    <div v-if="!isAuthorized" class="access-denied">
      <i class="bi bi-exclamation-triangle"></i>
      <h2>Access Denied</h2>
      <p>You don't have permission to access this page.</p>
      <button class="btn btn-primary" @click="goHome">
        <i class="bi bi-house"></i> Go to Home
      </button>
    </div>

    <!-- Admin/Moderator Content -->
    <div v-else class="admin-content">
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon users">
            <i class="bi bi-people-fill"></i>
          </div>
          <div class="stat-details">
            <h3>{{ stats.totalUsers }}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon tickets">
            <i class="bi bi-ticket-perforated"></i>
          </div>
          <div class="stat-details">
            <h3>{{ stats.totalTickets }}</h3>
            <p>Total Tickets</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon pending">
            <i class="bi bi-hourglass-split"></i>
          </div>
          <div class="stat-details">
            <h3>{{ stats.pendingTickets }}</h3>
            <p>Pending Tickets</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon moderators">
            <i class="bi bi-shield-check"></i>
          </div>
          <div class="stat-details">
            <h3>{{ stats.totalModerators }}</h3>
            <p>Moderators</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="admin-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'users' }]"
          @click="activeTab = 'users'"
        >
          <i class="bi bi-people"></i> Users
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'tickets' }]"
          @click="activeTab = 'tickets'"
        >
          <i class="bi bi-ticket-perforated"></i> Tickets
        </button>
        <button 
          v-if="isAdmin"
          :class="['tab-btn', { active: activeTab === 'roles' }]"
          @click="activeTab = 'roles'"
        >
          <i class="bi bi-shield"></i> Roles
        </button>
        <button 
          v-if="isAdmin"
          :class="['tab-btn', { active: activeTab === 'moderators' }]"
          @click="activeTab = 'moderators'"
        >
          <i class="bi bi-shield-check"></i> Moderators
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Users Tab -->
        <div v-if="activeTab === 'users'" class="users-section">
          <div class="section-header">
            <h3><i class="bi bi-people"></i> All Users</h3>
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input 
                v-model="userSearch" 
                type="text" 
                placeholder="Search users..."
                class="form-control"
              />
            </div>
          </div>

          <div v-if="loadingUsers" class="text-center my-5">
            <div class="spinner-border text-primary"></div>
          </div>

          <div v-else class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Rank</th>
                  <th v-if="isAdmin">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.name }} {{ user.surname }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span :class="['badge', getRoleBadgeClass(user.role)]">
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </td>
                  <td>{{ user.rank || 0 }}</td>
                  <td v-if="isAdmin">
                    <button 
                      class="btn btn-sm btn-outline-primary"
                      @click="openEditRole(user)"
                    >
                      <i class="bi bi-pencil"></i> Edit Role
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tickets Tab -->
        <div v-if="activeTab === 'tickets'" class="tickets-section">
          <div class="section-header">
            <h3><i class="bi bi-ticket-perforated"></i> All Tickets</h3>
            <div class="filters">
              <select v-model="ticketFilter" class="form-select">
                <option value="all">All Tickets</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div v-if="loadingTickets" class="text-center my-5">
            <div class="spinner-border text-primary"></div>
          </div>

          <div v-else class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Creator</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ticket in filteredTickets" :key="ticket.id">
                  <td>{{ ticket.id }}</td>
                  <td>{{ ticket.title }}</td>
                  <td>{{ ticket.creator_id }}</td>
                  <td>
                    <span :class="['badge', getStatusBadgeClass(ticket.status)]">
                      {{ ticket.status }}
                    </span>
                  </td>
                  <td>
                    <span :class="['badge', getPriorityBadgeClass(ticket.priority)]">
                      {{ ticket.priority }}
                    </span>
                  </td>
                  <td>{{ formatDate(ticket.created_at) }}</td>
                  <td>
                    <button 
                      class="btn btn-sm btn-outline-primary"
                      @click="viewTicket(ticket.id)"
                    >
                      <i class="bi bi-eye"></i> View
                    </button>
                    <button 
                      v-if="ticket.status !== 'closed'"
                      class="btn btn-sm btn-outline-danger ms-1"
                      @click="closeTicket(ticket.id)"
                    >
                      <i class="bi bi-x-circle"></i> Close
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Roles Tab (Admin only) -->
        <div v-if="activeTab === 'roles' && isAdmin" class="roles-section">
          <div class="section-header">
            <h3><i class="bi bi-shield"></i> User Roles Management</h3>
          </div>

          <div class="info-box">
            <i class="bi bi-info-circle"></i>
            <p>Here you can view all users and change their roles. Use the Users tab to manage individual user roles.</p>
          </div>

          <div class="role-stats">
            <div class="role-stat-card">
              <h4>Developers</h4>
              <p class="count">{{ getUsersByRole('developer').length }}</p>
            </div>
            <div class="role-stat-card">
              <h4>Moderators</h4>
              <p class="count">{{ getUsersByRole('moderator').length }}</p>
            </div>
            <div class="role-stat-card">
              <h4>Administrators</h4>
              <p class="count">{{ getUsersByRole('admin').length }}</p>
            </div>
          </div>
        </div>

        <!-- Moderators Tab (Admin only) -->
        <div v-if="activeTab === 'moderators' && isAdmin" class="moderators-section">
          <div class="section-header">
            <h3><i class="bi bi-shield-check"></i> Moderators Management</h3>
          </div>

          <div v-if="loadingModerators" class="text-center my-5">
            <div class="spinner-border text-primary"></div>
          </div>

          <div v-else class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Credentials ID</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mod in moderators" :key="mod.id">
                  <td>{{ mod.id }}</td>
                  <td>{{ mod.name }} {{ mod.surname }}</td>
                  <td>{{ mod.email }}</td>
                  <td>{{ mod.credentials_id }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Role Modal -->
    <div v-if="showEditRoleModal" class="modal-overlay" @click="closeEditRoleModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3><i class="bi bi-pencil"></i> Edit User Role</h3>
          <button class="close-btn" @click="closeEditRoleModal">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p><strong>User:</strong> {{ editingUser?.name }} {{ editingUser?.surname }}</p>
          <p><strong>Email:</strong> {{ editingUser?.email }}</p>
          
          <div class="form-group mt-3">
            <label>New Role</label>
            <select v-model="newRole" class="form-select">
              <option value="developer">Developer</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div v-if="roleError" class="alert alert-danger mt-3">
            {{ roleError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditRoleModal">Cancel</button>
          <button 
            class="btn btn-primary" 
            @click="saveUserRole"
            :disabled="updatingRole"
          >
            <span v-if="updatingRole">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Updating...
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import userApi from '../api/user'
import ticketApi from '../api/ticket'
import roleApi from '../api/role'

const router = useRouter()
const authStore = useAuthStore()

// Auth checks
const isAdmin = computed(() => authStore.getRole?.toUpperCase() === 'ADMIN')
const isModerator = computed(() => authStore.getRole?.toUpperCase() === 'MODERATOR')
const isAuthorized = computed(() => isAdmin.value || isModerator.value)

// State
const activeTab = ref('users')
const userSearch = ref('')
const ticketFilter = ref('all')
const loadingUsers = ref(false)
const loadingTickets = ref(false)
const loadingModerators = ref(false)

const users = ref([])
const tickets = ref([])
const moderators = ref([])

const stats = ref({
  totalUsers: 0,
  totalTickets: 0,
  pendingTickets: 0,
  totalModerators: 0
})

// Edit role modal
const showEditRoleModal = ref(false)
const editingUser = ref(null)
const newRole = ref('')
const roleError = ref('')
const updatingRole = ref(false)

// Computed
const filteredUsers = computed(() => {
  if (!userSearch.value) return users.value
  const search = userSearch.value.toLowerCase()
  return users.value.filter(user => 
    user.name?.toLowerCase().includes(search) ||
    user.surname?.toLowerCase().includes(search) ||
    user.email?.toLowerCase().includes(search)
  )
})

const filteredTickets = computed(() => {
  if (ticketFilter.value === 'all') return tickets.value
  return tickets.value.filter(ticket => 
    ticket.status?.toLowerCase() === ticketFilter.value.toLowerCase()
  )
})

// Methods
const goHome = () => {
  router.push('/')
}

const fetchUsers = async () => {
  loadingUsers.value = true
  try {
    const response = await userApi.get('/')
    users.value = response.data.users || []
    stats.value.totalUsers = users.value.length
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loadingUsers.value = false
  }
}

const fetchTickets = async () => {
  loadingTickets.value = true
  try {
    const response = await ticketApi.get('/')
    tickets.value = response.data.tickets || []
    stats.value.totalTickets = tickets.value.length
    stats.value.pendingTickets = tickets.value.filter(t => t.status !== 'closed').length
  } catch (error) {
    console.error('Error fetching tickets:', error)
  } finally {
    loadingTickets.value = false
  }
}

const fetchModerators = async () => {
  if (!isAdmin.value) return
  
  loadingModerators.value = true
  try {
    // This endpoint might need to be created
    const response = await userApi.get('/moderators')
    moderators.value = response.data.moderators || []
    stats.value.totalModerators = moderators.value.length
  } catch (error) {
    console.error('Error fetching moderators:', error)
    // Fallback: count users with moderator role
    stats.value.totalModerators = getUsersByRole('moderator').length
  } finally {
    loadingModerators.value = false
  }
}

const getUsersByRole = (role) => {
  return users.value.filter(u => u.role?.toLowerCase() === role.toLowerCase())
}

const openEditRole = (user) => {
  editingUser.value = user
  newRole.value = user.role
  showEditRoleModal.value = true
  roleError.value = ''
}

const closeEditRoleModal = () => {
  showEditRoleModal.value = false
  editingUser.value = null
  newRole.value = ''
  roleError.value = ''
}

const saveUserRole = async () => {
  if (!editingUser.value || !newRole.value) return
  
  updatingRole.value = true
  roleError.value = ''
  
  try {
    await roleApi.put(`/users/${editingUser.value.id}/role`, {
      role: newRole.value
    })
    
    // Update local user list
    const userIndex = users.value.findIndex(u => u.id === editingUser.value.id)
    if (userIndex !== -1) {
      users.value[userIndex].role = newRole.value
    }
    
    closeEditRoleModal()
  } catch (error) {
    console.error('Error updating user role:', error)
    roleError.value = error.response?.data?.message || 'Failed to update role'
  } finally {
    updatingRole.value = false
  }
}

const viewTicket = (ticketId) => {
  router.push(`/tickets/${ticketId}`)
}

const closeTicket = async (ticketId) => {
  if (!confirm('Are you sure you want to close this ticket?')) return
  
  try {
    await ticketApi.put(`/${ticketId}/admin`, {
      status: 'closed',
      solved: true
    })
    
    // Refresh tickets
    await fetchTickets()
  } catch (error) {
    console.error('Error closing ticket:', error)
    alert('Failed to close ticket')
  }
}

const getRoleLabel = (role) => {
  const labels = {
    'developer': 'Developer',
    'DEVELOPER': 'Developer',
    'moderator': 'Moderator',
    'MODERATOR': 'Moderator',
    'admin': 'Administrator',
    'ADMIN': 'Administrator'
  }
  return labels[role] || role
}

const getRoleBadgeClass = (role) => {
  const classes = {
    'developer': 'bg-primary',
    'DEVELOPER': 'bg-primary',
    'moderator': 'bg-warning',
    'MODERATOR': 'bg-warning',
    'admin': 'bg-danger',
    'ADMIN': 'bg-danger'
  }
  return classes[role] || 'bg-secondary'
}

const getStatusBadgeClass = (status) => {
  const classes = {
    'open': 'bg-success',
    'pending': 'bg-warning',
    'closed': 'bg-secondary'
  }
  return classes[status?.toLowerCase()] || 'bg-info'
}

const getPriorityBadgeClass = (priority) => {
  const classes = {
    'low': 'bg-info',
    'medium': 'bg-warning',
    'high': 'bg-danger'
  }
  return classes[priority?.toLowerCase()] || 'bg-secondary'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(async () => {
  if (!isAuthorized.value) {
    return
  }
  
  await Promise.all([
    fetchUsers(),
    fetchTickets(),
    fetchModerators()
  ])
})
</script>

<style scoped>
.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.admin-header {
  text-align: center;
  margin-bottom: 3rem;
}

.admin-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.admin-header h1 i {
  color: #e74c3c;
  margin-right: 1rem;
}

.admin-header .lead {
  color: #7f8c8d;
  font-size: 1.2rem;
}

/* Access Denied */
.access-denied {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.access-denied i {
  font-size: 5rem;
  color: #e74c3c;
  margin-bottom: 1rem;
}

.access-denied h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.access-denied p {
  color: #7f8c8d;
  margin-bottom: 2rem;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: white;
}

.stat-icon.users { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.tickets { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.pending { background: linear-gradient(135deg, #ffa726 0%, #fb8c00 100%); }
.stat-icon.moderators { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.stat-details h3 {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.stat-details p {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.95rem;
}

/* Tabs */
.admin-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  background: transparent;
  color: #7f8c8d;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* Tab Content */
.tab-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  color: #2c3e50;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
}

.search-box input {
  padding-left: 2.5rem;
}

.filters select {
  min-width: 200px;
}

/* Table */
.table-responsive {
  overflow-x: auto;
}

.table {
  width: 100%;
  margin: 0;
}

.table thead {
  background: #f8f9fa;
}

.table th {
  padding: 1rem;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  padding: 1rem;
  vertical-align: middle;
  border-bottom: 1px solid #dee2e6;
}

.table tbody tr:hover {
  background: #f8f9fa;
}

.badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
}

/* Info Box */
.info-box {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.info-box i {
  font-size: 1.5rem;
  color: #2196f3;
}

.info-box p {
  margin: 0;
  color: #0d47a1;
}

/* Role Stats */
.role-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.role-stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

.role-stat-card h4 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.role-stat-card .count {
  font-size: 3rem;
  font-weight: 700;
  margin: 0;
}

/* Modal */
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
  border-radius: 16px;
  max-width: 500px;
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
  color: #2c3e50;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #7f8c8d;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-container {
    padding: 1rem;
  }

  .admin-header h1 {
    font-size: 1.8rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .admin-tabs {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters select {
    width: 100%;
  }
}
</style>
